import { Context, HttpRequest } from "@azure/functions"
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { execSync } from 'child_process';

const ExcludedFolders = ['node_modules', 'obj', '.vs', '.vscode', '.env', '.python_packages', '.git', '.github'];

// fileName can be a regex, pattern should be a regex (which will be searched for in the matching files).
// If returnFileContents == true, returns file content. Otherwise returns full path to the file.
function findFileRecursively(folder: string, fileName: string, returnFileContents: boolean, pattern?: RegExp): {str: string, pos?: number, length?: number} {

    const fileNameRegex = new RegExp(fileName, 'i');

    for (const name of fs.readdirSync(folder)) {
        var fullPath = path.join(folder, name);

        if (fs.lstatSync(fullPath).isDirectory()) {

            if (ExcludedFolders.includes(name.toLowerCase())) {
                continue;
            }

            const result = findFileRecursively(fullPath, fileName, returnFileContents, pattern);
            if (!!result) {
                return result;
            }

        } else if (!!fileNameRegex.exec(name)) {

            if (!pattern) {
                return { str: returnFileContents ? fs.readFileSync(fullPath, { encoding: 'utf8' }) : fullPath };
            }

            const code = fs.readFileSync(fullPath, { encoding: 'utf8' });
            const match = pattern.exec(code);

            if (!!match) {
                return { str: returnFileContents ? code : fullPath, pos: match.index, length: match[0].length };
            }
        }
    }

    return undefined;
}

function getCodeInBrackets(str: string, startFrom: number, openingBracket: string, closingBracket: string, mustHaveSymbols: string): string {

    var bracketCount = 0, openBracketPos = 0, mustHaveSymbolFound = false;
    for (var i = startFrom; i < str.length; i++) {
        switch (str[i]) {
            case openingBracket:
                if (bracketCount <= 0) {
                    openBracketPos = i + 1;
                }
                bracketCount++;
                break;
            case closingBracket:
                bracketCount--;
                if (bracketCount <= 0 && mustHaveSymbolFound) {
                    return str.substring(openBracketPos, i);
                }
                break;
        }

        if (bracketCount > 0 && mustHaveSymbols.includes(str[i])) {
            mustHaveSymbolFound = true;
        }
    }
    return '';
}

// Tries to match orchestrations and their activities by parsing source code
function mapOrchestratorsAndActivities(functions: {}, projectFolder: string, hostJsonFolder: string) {

    const isDotNet = isDotNetProject(projectFolder);
    const functionNames = Object.keys(functions);
    
    const orchestratorNames = functionNames.filter(name => functions[name].bindings.some(b => b.type === 'orchestrationTrigger'));
    const orchestrators = getFunctionsAndTheirCodes(orchestratorNames, isDotNet, projectFolder, hostJsonFolder);

    const entityNames = functionNames.filter(name => functions[name].bindings.some(b => b.type === 'entityTrigger'));
    const entities = getFunctionsAndTheirCodes(entityNames, isDotNet, projectFolder, hostJsonFolder);

    if (!orchestrators.length && !entities.length) {
        return functions;
    }

    const otherFunctionNames = functionNames.filter(name => !functions[name].bindings.some(b => ['orchestrationTrigger', 'activityTrigger', 'entityTrigger'].includes(b.type)));
    const otherFunctions = getFunctionsAndTheirCodes(otherFunctionNames, isDotNet, projectFolder, hostJsonFolder);

    for (const orch of orchestrators) {

        // Trying to match this orchestrator with its calling function
        for (const func of otherFunctions) {

            // If this function seems to be calling that orchestrator
            const regex = new RegExp(`(StartNew|StartNewAsync|start_new)(<[\\w\.-]+>)?\\s*\\(\\s*(["'\`]|nameof\\s*\\(\\s*[\\w\.-]*)${orch.name}\\s*["'\\)]{1}`, 'i');
            if (!!regex.exec(func.code)) {
                functions[orch.name].isCalledBy.push(func.name);
            }
        }

        // Matching suborchestrators
        for (const subOrch of orchestrators) {
            if (orch.name === subOrch.name) {
                continue;
            }

            // If this orchestrator seems to be calling that suborchestrator
            const regex = new RegExp(`(CallSubOrchestrator|CallSubOrchestratorWithRetry|call_sub_orchestrator)(Async)?(<[\\w\.-]+>)?\\s*\\(\\s*(["'\`]|nameof\\s*\\(\\s*[\\w\.-]*)${subOrch.name}\\s*["'\\)]{1}`, 'i');
            if (!!regex.exec(orch.code)) {

                // Mapping that suborchestrator to this orchestrator
                functions[subOrch.name].isCalledBy.push(orch.name);
            }
        }

        // Mapping activities to orchestrators
        mapActivitiesToOrchestrator(functions, orch);

        // Checking whether orchestrator calls itself
        if (!!new RegExp(`\\.\s*ContinueAsNew\s*\\(`, 'i').exec(orch.code)) {
            functions[orch.name].isCalledByItself = true;
        }
    }

    for (const entity of entities) {

        // Trying to match this entity with its calling function
        for (const func of otherFunctions) {

            // If this function seems to be calling that entity
            const regex = new RegExp(`${entity.name}\\s*["'>]{1}`);
            if (!!regex.exec(func.code)) {
                functions[entity.name].isCalledBy.push(func.name);
            }
        }
    }

    return functions;
}

// Tries to load code for functions of certain type
function getFunctionsAndTheirCodes(functionNames: string[], isDotNet: boolean, projectFolder: string, hostJsonFolder: string): { name: string, code: string }[] {

    return functionNames.map(name => {

            const match = isDotNet ?
                findFileRecursively(projectFolder, '.+\.cs$', true, new RegExp(`FunctionName\\((nameof)?["'\`\\(]?${name}\\s*["'\`\\)]{1}`)) :
                findFileRecursively(path.join(hostJsonFolder, name), '(index\.ts|index\.js|__init__\.py)$', true);

            return !match ? undefined : {
                name,
                code: !isDotNet ? match.str : getCodeInBrackets(match.str, match.pos + match.length, '{', '}', ' \n')
            };
        })
        .filter(f => !!f);
}

function mapActivitiesToOrchestrator(functions: any, orch: {name: string, code: string}): void {

    const activityNames = Object.keys(functions)
        .filter(name => functions[name].bindings.some(b => b.type === 'activityTrigger'));

    for (const activityName of activityNames) {

        // If this orchestrator seems to be calling this activity
        const regex = new RegExp(`(CallActivity|call_activity)[\\s\\w\.-<>\\(]*\\([\\s\\w\.-]*["'\`]?${activityName}\\s*["'\`\\)]{1}`, 'i');
        if (!!regex.exec(orch.code)) {

            // Then mapping this activity to this orchestrator
            if (!functions[activityName].isCalledBy) {
                functions[activityName].isCalledBy = [];
            }
            functions[activityName].isCalledBy.push(orch.name);
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

        const hostJsonMatch = findFileRecursively(projectFolder, 'host.json', false);
        if (!hostJsonMatch) {
            throw new Error('host.json file not found under the provided project path');
        }

        context.log(`>>> Found host.json at ${hostJsonMatch.str}`);

        var hostJsonFolder = path.dirname(hostJsonMatch.str);

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

                result[functionName] = { bindings: functionJson.bindings, isCalledBy: [] };

            } catch (err) {
                context.log(`>>> Failed to parse ${functionJsonFilePath}: ${err}`);
            }
        }

        context.res = {
            body: mapOrchestratorsAndActivities(result, projectFolder, hostJsonFolder)
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