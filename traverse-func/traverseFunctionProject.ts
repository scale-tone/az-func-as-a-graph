import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

import { FunctionsMap } from '../ui/src/shared/FunctionsMap';
import { getCodeInBrackets, TraversalRegexes, DotNetBindingsParser } from './traverseFunctionProjectUtils';

const ExcludedFolders = ['node_modules', 'obj', '.vs', '.vscode', '.env', '.python_packages', '.git', '.github'];

// fileName can be a regex, pattern should be a regex (which will be searched for in the matching files).
// If returnFileContents == true, returns file content. Otherwise returns full path to the file.
async function findFileRecursivelyAsync(folder: string, fileName: string, returnFileContents: boolean, pattern?: RegExp)
    : Promise<{ filePath: string, code?: string, pos?: number, length?: number } | undefined> {

    const fileNameRegex = new RegExp(fileName, 'i');

    for (const name of await fs.promises.readdir(folder)) {
        var fullPath = path.join(folder, name);

        if ((await fs.promises.lstat(fullPath)).isDirectory()) {

            if (ExcludedFolders.includes(name.toLowerCase())) {
                continue;
            }

            const result = await findFileRecursivelyAsync(fullPath, fileName, returnFileContents, pattern);
            if (!!result) {
                return result;
            }

        } else if (!!fileNameRegex.exec(name)) {

            if (!pattern) {
                return {
                    filePath: fullPath,
                    code: returnFileContents ? (await fs.promises.readFile(fullPath, { encoding: 'utf8' })) : undefined
                };
            }

            const code = await fs.promises.readFile(fullPath, { encoding: 'utf8' });
            const match = pattern.exec(code);

            if (!!match) {
                return {
                    filePath: fullPath,
                    code: returnFileContents ? code : undefined,
                    pos: match.index,
                    length: match[0].length
                };
            }
        }
    }

    return undefined;
}

// Tries to match orchestrations and their activities by parsing source code
async function mapOrchestratorsAndActivitiesAsync(functions: FunctionsMap, projectFolder: string, hostJsonFolder: string): Promise<{}> {

    const isDotNet = await isDotNetProjectAsync(projectFolder);
    const functionNames = Object.keys(functions);
    
    const orchestratorNames = functionNames.filter(name => functions[name].bindings.some((b: any) => b.type === 'orchestrationTrigger'));
    const orchestrators = await getFunctionsAndTheirCodesAsync(orchestratorNames, isDotNet, projectFolder, hostJsonFolder);

    const activityNames = Object.keys(functions).filter(name => functions[name].bindings.some((b: any) => b.type === 'activityTrigger'));
    const activities = await getFunctionsAndTheirCodesAsync(activityNames, isDotNet, projectFolder, hostJsonFolder);

    const entityNames = functionNames.filter(name => functions[name].bindings.some((b: any) => b.type === 'entityTrigger'));
    const entities = await getFunctionsAndTheirCodesAsync(entityNames, isDotNet, projectFolder, hostJsonFolder);

    const otherFunctionNames = functionNames.filter(name => !functions[name].bindings.some((b: any) => ['orchestrationTrigger', 'activityTrigger', 'entityTrigger'].includes(b.type)));
    const otherFunctions = await getFunctionsAndTheirCodesAsync(otherFunctionNames, isDotNet, projectFolder, hostJsonFolder);

    for (const orch of orchestrators) {

        // Trying to match this orchestrator with its calling function
        const regex = TraversalRegexes.getStartNewOrchestrationRegex(orch.name);
        for (const func of otherFunctions) {

            // If this function seems to be calling that orchestrator
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
            const regex = TraversalRegexes.getCallSubOrchestratorRegex(subOrch.name);
            if (!!regex.exec(orch.code)) {

                // Mapping that suborchestrator to this orchestrator
                functions[subOrch.name].isCalledBy.push(orch.name);
            }
        }

        // Mapping activities to orchestrators
        mapActivitiesToOrchestrator(functions, orch, activityNames);

        // Checking whether orchestrator calls itself
        if (!!TraversalRegexes.continueAsNewRegex.exec(orch.code)) {
            functions[orch.name].isCalledByItself = true;
        }

        // Trying to map event producers with their consumers
        const eventNames = getEventNames(orch.code);
        for (const eventName of eventNames) {
            
            const regex = TraversalRegexes.getRaiseEventRegex(eventName);
            for (const func of otherFunctions) {

                // If this function seems to be sending that event
                if (!!regex.exec(func.code)) {
                    functions[orch.name].isSignalledBy.push({ name: func.name, signalName: eventName });
                }
            }
        }
    }

    for (const entity of entities) {

        // Trying to match this entity with its calling function
        for (const func of otherFunctions) {

            // If this function seems to be calling that entity
            const regex = TraversalRegexes.getSignalEntityRegex(entity.name);
            if (!!regex.exec(func.code)) {
                functions[entity.name].isCalledBy.push(func.name);
            }
        }
    }

    if (isDotNet) {
        
        for (const func of otherFunctions) {

            const moreBindings = DotNetBindingsParser.tryExtractBindings(func);
            functions[func.name].bindings.push(...moreBindings);
        }
    }

    // Also adding file paths and code positions
    for (const func of otherFunctions.concat(orchestrators).concat(activities).concat(entities)) {
        functions[func.name].filePath = func.filePath;
        functions[func.name].pos = func.pos;
    }

    return functions;
}

// Tries to extract event names that this orchestrator is awaiting
function getEventNames(orchestratorCode: string): string[] {

    const result = [];

    const regex = TraversalRegexes.waitForExternalEventRegex;
    var match: RegExpExecArray | null;
    while (!!(match = regex.exec(orchestratorCode))) {
        result.push(match[4]);
    }

    return result;
}

// Tries to load code for functions of certain type
async function getFunctionsAndTheirCodesAsync(functionNames: string[], isDotNet: boolean, projectFolder: string, hostJsonFolder: string)
    : Promise<{ name: string, code: string, filePath: string, pos: number }[]> {
    
    const promises = functionNames.map(async name => {

        const match = await (isDotNet ?
            findFileRecursivelyAsync(projectFolder, '.+\.cs$', true, TraversalRegexes.getDotNetFunctionNameRegex(name)) :
            findFileRecursivelyAsync(path.join(hostJsonFolder, name), '(index\.ts|index\.js|__init__\.py)$', true));

        return !match ? undefined : {
            name,
            code: !isDotNet ? match.code : getCodeInBrackets(match.code!, match.pos! + match.length!, '{', '}', ' \n'),
            filePath: match.filePath,
            pos: !match.pos ? 0 : match.pos
        };
    });

    return (await Promise.all(promises)).filter(f => !!f) as any;
}

// Tries to match orchestrator with its activities
function mapActivitiesToOrchestrator(functions: FunctionsMap, orch: {name: string, code: string}, activityNames: string[]): void {

    for (const activityName of activityNames) {

        // If this orchestrator seems to be calling this activity
        const regex = TraversalRegexes.getCallActivityRegex(activityName);
        if (!!regex.exec(orch.code)) {

            // Then mapping this activity to this orchestrator
            if (!functions[activityName].isCalledBy) {
                functions[activityName].isCalledBy = [];
            }
            functions[activityName].isCalledBy.push(orch.name);
        }
    }
}

async function isDotNetProjectAsync(projectFolder: string): Promise<boolean> {
    return (await fs.promises.readdir(projectFolder)).some(fn => {
        fn = fn.toLowerCase();
        return (fn.endsWith('.sln')) || (fn.endsWith('.csproj') && fn !== 'extensions.csproj')
    });
}

// Collects all function.json files in a Functions project. Also tries to supplement them with bindings
// extracted from .Net code (if the project is .Net). Also parses and organizes orchestrators/activities 
// (if the project uses Durable Functions)
export async function traverseFunctionProject(projectFolder: string, log: (s: any) => void)
    : Promise<{ functions: FunctionsMap, tempFolders: string[] }> {

    var functions: FunctionsMap = {}, tempFolders = [];

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

        const gitTempFolder = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'git-clone-'));
        tempFolders.push(gitTempFolder);

        log(`>>> Cloning ${projectFolder} to ${gitTempFolder}...`);
        execSync(`git clone ${projectFolder}`, { cwd: gitTempFolder });
        projectFolder = path.join(gitTempFolder, ...projectPath);
    }

    const hostJsonMatch = await findFileRecursivelyAsync(projectFolder, 'host.json', false);
    if (!hostJsonMatch) {
        throw new Error('host.json file not found under the provided project path');
    }

    log(`>>> Found host.json at ${hostJsonMatch.filePath}`);

    var hostJsonFolder = path.dirname(hostJsonMatch.filePath);

    // If it is a C# function, we'll need to dotnet publish first
    if (await isDotNetProjectAsync(hostJsonFolder)) {

        const publishTempFolder = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'dotnet-publish-'));
        tempFolders.push(publishTempFolder);

        log(`>>> Publishing ${hostJsonFolder} to ${publishTempFolder}...`);
        execSync(`dotnet publish -o ${publishTempFolder}`, { cwd: hostJsonFolder });
        hostJsonFolder = publishTempFolder;
    }

    const promises = (await fs.promises.readdir(hostJsonFolder)).map(async functionName => {

        const fullPath = path.join(hostJsonFolder, functionName);
        const functionJsonFilePath = path.join(fullPath, 'function.json');

        if (!!(await fs.promises.lstat(fullPath)).isDirectory() && !!fs.existsSync(functionJsonFilePath)) {

            try {
                const functionJson = JSON.parse(await fs.promises.readFile(functionJsonFilePath, { encoding: 'utf8' }));

                functions[functionName] = { bindings: functionJson.bindings, isCalledBy: [], isSignalledBy: [] };

            } catch (err) {
                log(`>>> Failed to parse ${functionJsonFilePath}: ${err}`);
            }
        }
    });
    await Promise.all(promises);

    functions = await mapOrchestratorsAndActivitiesAsync(functions, projectFolder, hostJsonFolder);

    return { functions, tempFolders };
}
