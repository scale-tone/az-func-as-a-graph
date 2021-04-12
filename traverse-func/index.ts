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

            if (ExcludedFolders.includes(name.toLowerCase())) {
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
function remapOrchestratorsAndActivities(functions: {}, projectFolder: string, hostJsonFolder: string) {

    const isDotNet = isDotNetProject(projectFolder);
    
    const activityNames = Object.keys(functions).filter(name => functions[name].bindings.some(b => b.type === 'activityTrigger'));

    const orchestrators = Object.keys(functions)
        .filter(name => functions[name].bindings.some(b => b.type === 'orchestrationTrigger'))
        .map(name => {

            var orchFileName = ''
            if (isDotNet) {
                orchFileName = findFileRecursively(projectFolder, '.+\.cs$', `FunctionName\\((nameof)?["'\`\\(]?${name}["'\`\\)]{1}`);
            } else {
                orchFileName = findFileRecursively(path.join(hostJsonFolder, name), '(index\.ts|index\.js|__init__\.py)$');
            }

            if (!orchFileName) {
                return;
            }

            return { name, code: fs.readFileSync(orchFileName, { encoding: 'utf8' }) }
        })
        .filter(orch => !!orch);
    
    for (const orch of orchestrators) {
        for (const subOrch of orchestrators) {
            if (orch.name === subOrch.name) {
                continue;
            }

            // If this orchestrator seems to be calling that suporchestrator
            const regex = new RegExp(`(CallSubOrchestrator|CallSubOrchestratorWithRetry)(Async)?(<[\\w\.-]+>)?\\s*\\(\\s*(["'\`]|nameof\\s*\\()${subOrch.name}["'\\)]{1}`, 'i');
            if (!!regex.exec(orch.code)) {

                // Mapping activities to that suborchestrator
                mapActivitiesToOrchestrator(functions, subOrch, activityNames);

                // Now mapping that suborchestrator to this orchestrator
                if (!functions[orch.name].subOrchestrators) {
                    functions[orch.name].subOrchestrators = {};
                }
                functions[orch.name].subOrchestrators[subOrch.name] = functions[subOrch.name];
                delete functions[subOrch.name];
            }
        }
    }

    // Now mapping activities to the remaining orchestrators
    for (const orch of orchestrators) {

        if (!functions[orch.name]) {
            continue;
        }

        mapActivitiesToOrchestrator(functions, orch, activityNames);
    }

    return functions;
}

function mapActivitiesToOrchestrator(functions: any, orch: any, activityNames: any): void {

    for (const activityName of activityNames) {

        // If this orchestrator seems to be calling this activity
        const regex = new RegExp(`\\([\\s\\w\.-]*["'\`]?${activityName}["'\`\\)]{1}`);
        if (!!regex.exec(orch.code)) {

            // Then mapping this activity to this orchestrator
            if (!functions[orch.name].activities) {
                functions[orch.name].activities = {};
            }
            functions[orch.name].activities[activityName] = functions[activityName];
            delete functions[activityName];
        }
    }
}

function isDotNetProject(projectFolder): boolean {
    return fs.readdirSync(projectFolder).some(fn => {
        fn = fn.toLowerCase();
        return (fn.endsWith('.sln')) || (fn.endsWith('.csproj') && fn !== 'extensions.csproj')
    });
}

// Main function
export default async function (context: Context, req: HttpRequest): Promise<void> {

    var publishTempFolder, gitTempFolder;
    try {

        var projectFolder = req.body as string;

        // If it is a git repo, cloning it
        if (projectFolder.toLowerCase().startsWith('http')) {

            var projectPath = [];

            // Trying to infer project path
            if (!projectFolder.toLowerCase().endsWith('.git')) {
                
                const match = /(https:\/\/github.com\/.*?)\/([^\/]+)\/tree\/[^\/]+\/(.*)/i.exec(projectFolder);
                if (!match || match.length < 4) {

                    projectFolder += '.git';

                } else {

                    projectFolder = `${match[1]}/${match[2]}.git`;
                    projectPath.push(match[2]);
                    projectPath.push(...match[3].split('/'));
                }
            }

            gitTempFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'git-clone-'));
            
            context.log(`>>> Cloning ${projectFolder} to ${gitTempFolder}...`);
            execSync(`git clone ${projectFolder}`, { cwd: gitTempFolder });
            projectFolder = path.join(gitTempFolder, ...projectPath);
        }

        const hostJsonPath = findFileRecursively(projectFolder, 'host.json');
        if (!hostJsonPath) {
            throw new Error('host.json file not found under the provided project path');
        }

        context.log(`>>> Found host.json at ${hostJsonPath}`);

        var hostJsonFolder = path.dirname(hostJsonPath);

        // If it is a C# function, we'll need to dotnet publish first
        if (isDotNetProject(hostJsonFolder)) {

            publishTempFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'dotnet-publish-'));

            context.log(`>>> Publishing ${hostJsonFolder} to ${publishTempFolder}...`);
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
            body: remapOrchestratorsAndActivities(result, projectFolder, hostJsonFolder)
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