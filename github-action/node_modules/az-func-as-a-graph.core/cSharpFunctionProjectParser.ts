import { FunctionsMap } from "./FunctionsMap";
import { getCodeInBrackets, posToLineNr, removeNamespace } from "./traverseFunctionProjectUtils";

import { FunctionProjectCodeParser } from "./functionProjectCodeParser";

export class CSharpFunctionProjectParser extends FunctionProjectCodeParser {

    protected async getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{ name: string; code: string; filePath: string; pos: number; lineNr: number; }[]> {
        
        const promises = functionNames.map(async name => {

            const match = await this._fileSystemWrapper.findFileRecursivelyAsync(hostJsonFolder, '.+\\.cs$', true, this.getFunctionStartRegex(name));
            
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

        for await (const func of this._fileSystemWrapper.findFunctionsRecursivelyAsync(projectFolder, fileNameRegex, this.getFunctionAttributeRegex())) {
            
            const bindings = this.tryExtractBindings(func.declarationCode);
       
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
    
        const returnTypeMatch = this.functionReturnTypeRegex.exec(functionCode);
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
    
        return this.tryExtractBindings(classBody.code);
    }
}
