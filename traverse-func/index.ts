import { Context, HttpRequest } from "@azure/functions"
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { execSync } from 'child_process';

const ExcludedFolders = ['node_modules', 'obj', '.vs', '.vscode', '.env', '.python_packages', '.git', '.github'];

// fileName can be a regex, pattern should be a regex (which will be searched for in the matching files)
function findFileRecursively(folder: string, fileName: string, pattern?: string): string {

    const nameRegex = new RegExp(fileName, 'i');

    for (const name of fs.readdirSync(folder)) {
        var fullPath = path.join(folder, name);

        if (fs.lstatSync(fullPath).isDirectory()) {

            if (ExcludedFolders.includes(name)) {
                continue;
            }

            fullPath = findFileRecursively(fullPath, fileName, pattern);
            if (!!fullPath) {
                return fullPath;
            }

        } else if (!!nameRegex.exec(name)) {

            if (!pattern) {
                return fullPath;
            }

            const code = fs.readFileSync(fullPath, { encoding: 'utf8' });
            if (!!new RegExp(pattern).exec(code)) {
                return fullPath;
            }
        }
    }

    return undefined;
}

// Tries to match orchestrations and their activities by parsing source code
function mapActivitiesToOrchestrators(functions: {}, projectFolder: string, hostJsonFolder: string) {

    const isDotNet = isDotNetProject(projectFolder);
    
    const activityNames = Object.keys(functions).filter(name => functions[name].bindings.some(b => b.type === 'activityTrigger'));
    const orchNames = Object.keys(functions).filter(name => functions[name].bindings.some(b => b.type === 'orchestrationTrigger'));

    for (const orchName of orchNames) {
        
        var orchFileName = ''
        if (isDotNet) {
            orchFileName = findFileRecursively(projectFolder, '.+\.cs$', `FunctionName\\((nameof)?["'\`\\(]?${orchName}["'\`\\)]{1}`);
        } else {
            orchFileName = findFileRecursively(path.join(hostJsonFolder, orchName), 'index\.ts|index\.js|__init__\.py');
        }
        if (!orchFileName) {
            continue;
        }
        
        const orchCode = fs.readFileSync(orchFileName, { encoding: 'utf8' });

        for (const activityName of activityNames) {

            // If this orchestrator seems to be calling this activity
            const regex = new RegExp(`\\(\s*["'\`]?${activityName}["'\`\\)]{1}`);
            if (!!regex.exec(orchCode)) {
                
                if (!functions[orchName].activities) {
                    functions[orchName].activities = {};
                }
                functions[orchName].activities[activityName] = functions[activityName];
                delete functions[activityName];
            }            
        }
    }

    return functions;
}

function isDotNetProject(projectFolder): boolean {
    return fs.readdirSync(projectFolder).some(fn =>
        (fn.endsWith('.sln')) ||
        (fn.endsWith('.csproj') && fn !== 'extensions.csproj')
    );
}

// Main function
export default async function (context: Context, req: HttpRequest): Promise<void> {

    var publishTempFolder, gitTempFolder;
    try {

        var projectFolder = req.body as string;

        // If it is a git repo, cloning it
        if (projectFolder.startsWith('http')) {

            var projectPath = [];

            // Trying to infer project path
            if (!projectFolder.endsWith('.git')) {
                
                const match = /(https:\/\/github.com\/.*?)\/([^\/]+)\/tree\/[^\/]+\/(.*)/.exec(projectFolder);
                if (!match || match.length < 4) {

                    projectFolder += '.git';

                } else {

                    projectFolder = `${match[1]}/${match[2]}.git`;
                    projectPath.push(match[2]);
                    projectPath.push(...match[3].split('/'));
                }
            }

            gitTempFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'git-clone-'));
            
            console.log(`>>> Cloning ${projectFolder} to ${gitTempFolder}...`);
            execSync(`git clone ${projectFolder}`, { cwd: gitTempFolder });
            projectFolder = path.join(gitTempFolder, ...projectPath);
        }

        const hostJsonPath = findFileRecursively(projectFolder, 'host.json');
        if (!hostJsonPath) {
            throw new Error('host.json file not found under the provided project path');
        }

        console.log(`>>> Found host.json at ${hostJsonPath}`);

        var hostJsonFolder = path.dirname(hostJsonPath);

        // If it is a C# function, we'll need to dotnet publish first
        if (isDotNetProject(hostJsonFolder)) {

            publishTempFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'dotnet-publish-'));

            console.log(`>>> Publishing ${hostJsonFolder} to ${publishTempFolder}...`);
            execSync(`dotnet publish -o ${publishTempFolder}`, { cwd: hostJsonFolder });
            hostJsonFolder = publishTempFolder;
        }

        const result = {};

        for (const functionName of fs.readdirSync(hostJsonFolder)) {
            const fullPath = path.join(hostJsonFolder, functionName);
            const functionJsonFilePath = path.join(fullPath, 'function.json');

            if (!fs.lstatSync(fullPath).isDirectory() || !fs.existsSync(functionJsonFilePath)) {
                continue;
            }

            try {
                const functionJson = JSON.parse(fs.readFileSync(functionJsonFilePath, { encoding: 'utf8' }));

                result[functionName] = { bindings: functionJson.bindings };

            } catch (err) {
                context.log(`>>> Failed to parse ${functionJsonFilePath}: ${err}`);
            }
        }

        context.res = {
            body: mapActivitiesToOrchestrators(result, projectFolder, hostJsonFolder)
        };

    } catch (err) {

        context.log(`>>> Failed: ${err}`);

        context.res = {
            status: 500,
            body: err.message
        };

    } finally {

        if (!!publishTempFolder) {
            rimraf.sync(publishTempFolder);
        }
        if (!!gitTempFolder) {
            rimraf.sync(gitTempFolder);
        }
    }
};