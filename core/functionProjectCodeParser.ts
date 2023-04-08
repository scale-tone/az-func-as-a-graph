import { FunctionsMap } from "./FunctionsMap";
import { BindingsParser, getCodeInBrackets, posToLineNr, removeNamespace } from "./traverseFunctionProjectUtils";

import { FunctionProjectParserBase } from './functionProjectParserBase';

abstract class FunctionProjectCodeParser extends FunctionProjectParserBase {

    public async traverseFunctions(projectFolder: string): Promise<FunctionsMap>{
        
        let functions: FunctionsMap;

        functions = await this.traverseProjectCode(projectFolder);

        // Now enriching it with more info extracted from code
        functions = await this.mapOrchestratorsAndActivitiesAsync(functions, projectFolder);

        return functions;
    }

    protected abstract traverseProjectCode(projectFolder: string): Promise<FunctionsMap>;  
}

export class CSharpFunctionProjectParser extends FunctionProjectCodeParser {

    protected async getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{ name: string; code: string; filePath: string; pos: number; lineNr: number; }[]> {
        
        const promises = functionNames.map(async name => {

            const match = await this._fileSystemWrapper.findFileRecursivelyAsync(hostJsonFolder, '.+\\.cs$', true, this.getDotNetFunctionNameRegex(name));
            
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

        for await (const func of this._fileSystemWrapper.findFunctionsRecursivelyAsync(projectFolder, fileNameRegex, BindingsParser.getFunctionAttributeRegex(), 3)) {
            
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
    
        const returnTypeDefinition = await this._fileSystemWrapper.findFileRecursivelyAsync(projectFolder, fileNameRegex, true, this.getClassDefinitionRegex(returnTypeName));
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

export class FSharpFunctionProjectParser extends FunctionProjectCodeParser {

    protected async getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{ name: string; code: string; filePath: string; pos: number; lineNr: number; }[]> {

        const promises = functionNames.map(async name => {

            const match = await this._fileSystemWrapper.findFileRecursivelyAsync(hostJsonFolder, '.+\\.fs$', true, this.getDotNetFunctionNameRegex(name));
            
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

        for await (const func of this._fileSystemWrapper.findFunctionsRecursivelyAsync(projectFolder, new RegExp('.+\\.fs$', 'i'), BindingsParser.getFSharpFunctionAttributeRegex(), 2)) {
            
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

export class JavaFunctionProjectParser extends FunctionProjectCodeParser {

    protected async getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{ name: string; code: string; filePath: string; pos: number; lineNr: number; }[]> {

        const promises = functionNames.map(async name => {

            const match = await this._fileSystemWrapper.findFileRecursivelyAsync(hostJsonFolder, '.+\\.java$', true, this.getDotNetFunctionNameRegex(name));
            
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

        for await (const func of this._fileSystemWrapper.findFunctionsRecursivelyAsync(projectFolder, new RegExp('.+\\.java$', 'i'), BindingsParser.getJavaFunctionAttributeRegex(), 1)) {
            
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