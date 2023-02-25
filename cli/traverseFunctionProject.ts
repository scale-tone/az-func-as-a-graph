import * as path from 'path';

import { FunctionsMap, TraverseFunctionResult } from '../ui/src/shared/FunctionsMap';
import { getCodeInBrackets, TraversalRegexes, posToLineNr, mapActivitiesToOrchestrator, getEventNames, BindingsParser, removeNamespace } from './traverseFunctionProjectUtils';
import { isCSharpProjectAsync, isFSharpProjectAsync, findFileRecursivelyAsync, isJavaProjectAsync, findFunctionsRecursivelyAsync, readFunctionsJson, readProxiesJson } from './fileSystemUtils';

type FunctionProjectKind = 'cSharp' | 'fSharp' | 'java' | 'other';

// Collects all function.json files in a Functions project. Also tries to supplement them with bindings
// extracted from code (if the project is .Net or Java). Also parses and organizes orchestrators/activities 
// (if the project uses Durable Functions)
export async function traverseFunctions(projectFolder: string, log: (s: any) => void)
    : Promise<TraverseFunctionResult> {
    
    const hostJsonMatch = await findFileRecursivelyAsync(projectFolder, 'host.json', false);
    if (!hostJsonMatch) {
        throw new Error('host.json file not found under the provided project path');
    }

    log(`>>> Found host.json at ${hostJsonMatch.filePath}`);

    let hostJsonFolder = path.dirname(hostJsonMatch.filePath);

    let projectKind: FunctionProjectKind = 'other';

    if (await isCSharpProjectAsync(hostJsonFolder)) {
        projectKind = 'cSharp';
    } else if (await isFSharpProjectAsync(hostJsonFolder)) {
        projectKind = 'fSharp';
    } else if (await isJavaProjectAsync(hostJsonFolder)) {
        projectKind = 'java';
    }

    let functions: FunctionsMap;

    switch (projectKind) {
        case 'cSharp':
        case 'fSharp':
        case 'java':

            functions = await traverseProjectCode(projectKind, projectFolder);

            // Now enriching it with more info extracted from code
            functions = await mapOrchestratorsAndActivitiesAsync(projectKind, functions, projectFolder);

            break;
        default:

            functions = await readFunctionsJson(hostJsonFolder, log);

            // Now enriching it with more info extracted from code
            functions = await mapOrchestratorsAndActivitiesAsync(projectKind, functions, hostJsonFolder);

            break;
    }

    // Also reading proxies
    const proxies = await readProxiesJson(projectFolder, log);

    return { functions, proxies, projectFolder };
}

// Tries to match orchestrations and their activities by parsing source code
async function mapOrchestratorsAndActivitiesAsync(projectKind: FunctionProjectKind, functions: FunctionsMap, projectFolder: string): Promise<FunctionsMap> {

    const functionNames = Object.keys(functions);
    
    const orchestratorNames = functionNames.filter(name => functions[name].bindings.some((b: any) => b.type === 'orchestrationTrigger'));
    const orchestrators = await getFunctionsAndTheirCodesAsync(orchestratorNames, projectKind, projectFolder);

    const activityNames = Object.keys(functions).filter(name => functions[name].bindings.some((b: any) => b.type === 'activityTrigger'));
    const activities = await getFunctionsAndTheirCodesAsync(activityNames, projectKind, projectFolder);

    const entityNames = functionNames.filter(name => functions[name].bindings.some((b: any) => b.type === 'entityTrigger'));
    const entities = await getFunctionsAndTheirCodesAsync(entityNames, projectKind, projectFolder);

    const otherFunctionNames = functionNames.filter(name => !functions[name].bindings.some((b: any) => ['orchestrationTrigger', 'activityTrigger', 'entityTrigger'].includes(b.type)));
    const otherFunctions = await getFunctionsAndTheirCodesAsync(otherFunctionNames, projectKind, projectFolder);

    for (const orch of orchestrators) {

        // Trying to match this orchestrator with its calling function
        const regex = TraversalRegexes.getStartNewOrchestrationRegex(orch.name);
        for (const func of otherFunctions) {

            // If this function seems to be calling that orchestrator
            if (!!regex.exec(func.code)) {

                functions[orch.name].isCalledBy = functions[orch.name].isCalledBy ?? [];
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
                functions[subOrch.name].isCalledBy = functions[subOrch.name].isCalledBy ?? [];
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
                    functions[orch.name].isSignalledBy = functions[orch.name].isSignalledBy ?? [];
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
                functions[entity.name].isCalledBy = functions[entity.name].isCalledBy ?? [];
                functions[entity.name].isCalledBy.push(func.name);
            }
        }
    }

    // Also adding file paths and code positions
    for (const func of otherFunctions.concat(orchestrators).concat(activities).concat(entities)) {
        functions[func.name].filePath = func.filePath;
        functions[func.name].pos = func.pos;
        functions[func.name].lineNr = func.lineNr;
    }

    return functions;
}

// Tries to load code for functions of certain type
async function getFunctionsAndTheirCodesAsync(functionNames: string[], projectKind: FunctionProjectKind, hostJsonFolder: string)
    : Promise<{ name: string, code: string, filePath: string, pos: number, lineNr: number }[]> {
    
    const promises = functionNames.map(async name => {

        let match;

        switch (projectKind) {
            case 'cSharp':
                match = await findFileRecursivelyAsync(hostJsonFolder, '.+\\.cs$', true, TraversalRegexes.getDotNetFunctionNameRegex(name));
                break;
            case 'fSharp':
                match = await findFileRecursivelyAsync(hostJsonFolder, '.+\\.fs$', true, TraversalRegexes.getDotNetFunctionNameRegex(name));
                break;
            case 'java':
                match = await findFileRecursivelyAsync(hostJsonFolder, '.+\\.java$', true, TraversalRegexes.getDotNetFunctionNameRegex(name));
                break;
            default:
                match = await findFileRecursivelyAsync(path.join(hostJsonFolder, name), '(index\\.ts|index\\.js|__init__\\.py)$', true);
        }
        
        if (!match) {
            return undefined;
        }

        const code = projectKind === 'other' ? match.code : getCodeInBrackets(match.code!, match.pos! + match.length!, '{', '}', '\n').code;
        const pos = !match.pos ? 0 : match.pos;
        const lineNr = posToLineNr(match.code, pos);

        return { name, code, filePath: match.filePath, pos, lineNr };
    });

    return (await Promise.all(promises)).filter(f => !!f) as any;
}

export async function traverseProjectCode(projectKind: FunctionProjectKind, projectFolder: string): Promise<FunctionsMap> {

    let result: any = {};

    let fileNameRegex: RegExp;
    let funcAttributeRegex: RegExp;
    let funcNamePosIndex: number;

    switch (projectKind) {
        case 'cSharp':
            fileNameRegex = new RegExp('.+\\.cs$', 'i');
            funcAttributeRegex = BindingsParser.functionAttributeRegex;
            funcNamePosIndex = 3;
            break;
        case 'fSharp':
            fileNameRegex = new RegExp('.+\\.fs$', 'i');
            funcAttributeRegex = BindingsParser.fSharpFunctionAttributeRegex;
            funcNamePosIndex = 2;
            break;
        case 'java':
            fileNameRegex = new RegExp('.+\\.java$', 'i');
            funcAttributeRegex = BindingsParser.javaFunctionAttributeRegex;
            funcNamePosIndex = 1;
            break;
        default:
            return;
    }
    
    for await (const func of findFunctionsRecursivelyAsync(projectFolder, fileNameRegex, funcAttributeRegex, funcNamePosIndex)) {
        
        const bindings = BindingsParser.tryExtractBindings(func.declarationCode);
   
        if (projectKind === 'cSharp' && !(
            bindings.some(b => b.type === 'orchestrationTrigger') ||
            bindings.some(b => b.type === 'entityTrigger') ||
            bindings.some(b => b.type === 'activityTrigger')
        )) {
            
            // Also trying to extract multiple output bindings
            bindings.push(...await extractOutputBindings(projectFolder, func.declarationCode, fileNameRegex));
        }

        result[func.functionName] = {

            filePath: func.filePath,
            pos: func.pos,
            lineNr: func.lineNr,

            bindings: [...bindings]
        };
    }

    return result;
}

async function extractOutputBindings(projectFolder: string, functionCode: string, fileNameRegex: RegExp): Promise<{ type: string, direction: string }[]> {
    
    const returnTypeMatch = BindingsParser.functionReturnTypeRegex.exec(functionCode);
    if (!returnTypeMatch) {
        return [];
    }

    const returnTypeName = removeNamespace(returnTypeMatch[3]);
    if (!returnTypeName) {
        return [];
    }

    const returnTypeDefinition = await findFileRecursivelyAsync(projectFolder, fileNameRegex, true, TraversalRegexes.getClassDefinitionRegex(returnTypeName));
    if (!returnTypeDefinition) {
        return [];
    }

    const classBody = getCodeInBrackets(returnTypeDefinition.code!, (returnTypeDefinition.pos ?? 0) + (returnTypeDefinition.length ?? 0), '{', '}');
    if (!classBody.code) {
        return [];
    }

    return BindingsParser.tryExtractBindings(classBody.code);
}
