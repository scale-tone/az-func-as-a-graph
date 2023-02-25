import * as path from 'path';

import { FunctionsMap, TraverseFunctionResult } from "../ui/src/shared/FunctionsMap";
import { FileSystemWrapper } from './fileSystemWrapper';
import { BindingsParser, getCodeInBrackets, getEventNames, mapActivitiesToOrchestrator, posToLineNr, removeNamespace, TraversalRegexes } from "./traverseFunctionProjectUtils";

export abstract class FunctionProjectParser {

    // Collects all function.json files in a Functions project. Also tries to supplement them with bindings
    // extracted from code (if the project is .Net or Java). Also parses and organizes orchestrators/activities 
    // (if the project uses Durable Functions)
    public static async parseFunctions(projectFolder: string, fileSystemWrapper: FileSystemWrapper, log: (s: any) => void)
        : Promise<TraverseFunctionResult> {
                
        const hostJsonMatch = await fileSystemWrapper.findFileRecursivelyAsync(projectFolder, 'host.json', false);
        if (!hostJsonMatch) {
            throw new Error('host.json file not found under the provided project path');
        }

        log(`>>> Found host.json at ${hostJsonMatch.filePath}`);

        const hostJsonFolder = path.dirname(hostJsonMatch.filePath);
        
        let parser: FunctionProjectParser;

        if (await fileSystemWrapper.isCSharpProjectAsync(hostJsonFolder)) {
            parser = new CSharpFunctionProjectParser();
        } else if (await fileSystemWrapper.isFSharpProjectAsync(hostJsonFolder)) {
            parser = new FSharpFunctionProjectParser();
        } else if (await fileSystemWrapper.isJavaProjectAsync(hostJsonFolder)) {
            parser = new JavaFunctionProjectParser();
        } else {
            parser = new FunctionProjectScriptParser();

            // For script-based functions use host.json's folder as the root
            projectFolder = hostJsonFolder;
        }

        parser._fileSystemWrapper = fileSystemWrapper;
        parser._log = log;

        const functions = await parser.traverseFunctions(projectFolder);
        
        // Also reading proxies
        const proxies = await fileSystemWrapper.readProxiesJson(projectFolder, log);

        return { functions, proxies, projectFolder };
    }

    protected abstract traverseFunctions(projectFolder: string) : Promise<FunctionsMap>;

    protected abstract getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string)
        : Promise<{ name: string, code: string, filePath: string, pos: number, lineNr: number }[]>    

    // Tries to match orchestrations and their activities by parsing source code
    protected async mapOrchestratorsAndActivitiesAsync(functions: FunctionsMap, projectFolder: string): Promise<FunctionsMap> {

        const functionNames = Object.keys(functions);
        
        const orchestratorNames = functionNames.filter(name => functions[name].bindings.some((b: any) => b.type === 'orchestrationTrigger'));
        const orchestrators = await this.getFunctionsAndTheirCodesAsync(orchestratorNames, projectFolder);

        const activityNames = Object.keys(functions).filter(name => functions[name].bindings.some((b: any) => b.type === 'activityTrigger'));
        const activities = await this.getFunctionsAndTheirCodesAsync(activityNames, projectFolder);

        const entityNames = functionNames.filter(name => functions[name].bindings.some((b: any) => b.type === 'entityTrigger'));
        const entities = await this.getFunctionsAndTheirCodesAsync(entityNames, projectFolder);

        const otherFunctionNames = functionNames.filter(name => !functions[name].bindings.some((b: any) => ['orchestrationTrigger', 'activityTrigger', 'entityTrigger'].includes(b.type)));
        const otherFunctions = await this.getFunctionsAndTheirCodesAsync(otherFunctionNames, projectFolder);

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

    protected _fileSystemWrapper: FileSystemWrapper;

    protected _log: (s: any) => void;
}

class FunctionProjectScriptParser extends FunctionProjectParser {

    protected async traverseFunctions(projectFolder: string): Promise<FunctionsMap>{
        
        let functions: FunctionsMap;

        functions = await this._fileSystemWrapper.readFunctionsJson(projectFolder, this._log);

        // Now enriching it with more info extracted from code
        functions = await this.mapOrchestratorsAndActivitiesAsync(functions, projectFolder);

        return functions;
    }

    protected async getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{ name: string; code: string; filePath: string; pos: number; lineNr: number; }[]> {

        const promises = functionNames.map(async name => {

            let match = await this._fileSystemWrapper.findFileRecursivelyAsync(path.join(hostJsonFolder, name), '(index\\.ts|index\\.js|__init__\\.py)$', true);
            
            if (!match) {
                return undefined;
            }
    
            const pos = !match.pos ? 0 : match.pos;
            const lineNr = posToLineNr(match.code, pos);
    
            return { name, code: match.code, filePath: match.filePath, pos, lineNr };
        });
    
        return (await Promise.all(promises)).filter(f => !!f) as any;
    }
}

abstract class FunctionProjectCodeParser extends FunctionProjectParser {

    protected async traverseFunctions(projectFolder: string): Promise<FunctionsMap>{
        
        let functions: FunctionsMap;

        functions = await this.traverseProjectCode(projectFolder);

        // Now enriching it with more info extracted from code
        functions = await this.mapOrchestratorsAndActivitiesAsync(functions, projectFolder);

        return functions;
    }

    protected abstract traverseProjectCode(projectFolder: string): Promise<FunctionsMap>;  
}

class CSharpFunctionProjectParser extends FunctionProjectCodeParser {

    protected async getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{ name: string; code: string; filePath: string; pos: number; lineNr: number; }[]> {
        
        const promises = functionNames.map(async name => {

            const match = await this._fileSystemWrapper.findFileRecursivelyAsync(hostJsonFolder, '.+\\.cs$', true, TraversalRegexes.getDotNetFunctionNameRegex(name));
            
            if (!match) {
                return undefined;
            }
    
            const pos = !match.pos ? 0 : match.pos;
            const lineNr = posToLineNr(match.code, pos);
            const code = getCodeInBrackets(match.code!, match.pos! + match.length!, '{', '}', '\n').code;
    
            return { name, code, filePath: match.filePath, pos, lineNr };
        });
    
        return (await Promise.all(promises)).filter(f => !!f) as any;
    }

    protected async traverseProjectCode(projectFolder: string): Promise<FunctionsMap> {

        const result: any = {};

        const fileNameRegex = new RegExp('.+\\.cs$', 'i');

        for await (const func of this._fileSystemWrapper.findFunctionsRecursivelyAsync(projectFolder, fileNameRegex, BindingsParser.functionAttributeRegex, 3)) {
            
            const bindings = BindingsParser.tryExtractBindings(func.declarationCode);
       
            if ( !(
                bindings.some(b => b.type === 'orchestrationTrigger') ||
                bindings.some(b => b.type === 'entityTrigger') ||
                bindings.some(b => b.type === 'activityTrigger')
            )) {
                
                // Also trying to extract multiple output bindings
                bindings.push(...await this.extractOutputBindings(projectFolder, func.declarationCode, fileNameRegex));
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

    private async extractOutputBindings(projectFolder: string, functionCode: string, fileNameRegex: RegExp): Promise<{ type: string, direction: string }[]> {
    
        const returnTypeMatch = BindingsParser.functionReturnTypeRegex.exec(functionCode);
        if (!returnTypeMatch) {
            return [];
        }
    
        const returnTypeName = removeNamespace(returnTypeMatch[3]);
        if (!returnTypeName) {
            return [];
        }
    
        const returnTypeDefinition = await this._fileSystemWrapper.findFileRecursivelyAsync(projectFolder, fileNameRegex, true, TraversalRegexes.getClassDefinitionRegex(returnTypeName));
        if (!returnTypeDefinition) {
            return [];
        }
    
        const classBody = getCodeInBrackets(returnTypeDefinition.code!, (returnTypeDefinition.pos ?? 0) + (returnTypeDefinition.length ?? 0), '{', '}');
        if (!classBody.code) {
            return [];
        }
    
        return BindingsParser.tryExtractBindings(classBody.code);
    }
}

class FSharpFunctionProjectParser extends FunctionProjectCodeParser {

    protected async getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{ name: string; code: string; filePath: string; pos: number; lineNr: number; }[]> {

        const promises = functionNames.map(async name => {

            const match = await this._fileSystemWrapper.findFileRecursivelyAsync(hostJsonFolder, '.+\\.fs$', true, TraversalRegexes.getDotNetFunctionNameRegex(name));
            
            if (!match) {
                return undefined;
            }

            const code = getCodeInBrackets(match.code!, match.pos! + match.length!, '{', '}', '\n').code;
            const pos = !match.pos ? 0 : match.pos;
            const lineNr = posToLineNr(match.code, pos);

            return { name, code, filePath: match.filePath, pos, lineNr };
        });

        return (await Promise.all(promises)).filter(f => !!f) as any;
    }

    protected async traverseProjectCode(projectFolder: string): Promise<FunctionsMap> {

        const result: any = {};

        for await (const func of this._fileSystemWrapper.findFunctionsRecursivelyAsync(projectFolder, new RegExp('.+\\.fs$', 'i'), BindingsParser.fSharpFunctionAttributeRegex, 2)) {
            
            const bindings = BindingsParser.tryExtractBindings(func.declarationCode);
    
            result[func.functionName] = {

                filePath: func.filePath,
                pos: func.pos,
                lineNr: func.lineNr,

                bindings: [...bindings]
            };
        }

        return result;
    }
}

class JavaFunctionProjectParser extends FunctionProjectCodeParser {

    protected async getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{ name: string; code: string; filePath: string; pos: number; lineNr: number; }[]> {

        const promises = functionNames.map(async name => {

            const match = await this._fileSystemWrapper.findFileRecursivelyAsync(hostJsonFolder, '.+\\.java$', true, TraversalRegexes.getDotNetFunctionNameRegex(name));
            
            if (!match) {
                return undefined;
            }

            const code = getCodeInBrackets(match.code!, match.pos! + match.length!, '{', '}', '\n').code;
            const pos = !match.pos ? 0 : match.pos;
            const lineNr = posToLineNr(match.code, pos);

            return { name, code, filePath: match.filePath, pos, lineNr };
        });

        return (await Promise.all(promises)).filter(f => !!f) as any;
    }

    protected async traverseProjectCode(projectFolder: string): Promise<FunctionsMap> {

        const result: any = {};

        for await (const func of this._fileSystemWrapper.findFunctionsRecursivelyAsync(projectFolder, new RegExp('.+\\.java$', 'i'), BindingsParser.javaFunctionAttributeRegex, 1)) {
            
            const bindings = BindingsParser.tryExtractBindings(func.declarationCode);
    
            result[func.functionName] = {

                filePath: func.filePath,
                pos: func.pos,
                lineNr: func.lineNr,

                bindings: [...bindings]
            };
        }

        return result;
    }
}
