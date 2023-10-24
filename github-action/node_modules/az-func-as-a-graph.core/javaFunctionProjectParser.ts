import { FunctionsMap } from "./FunctionsMap";
import { getCodeInBrackets, posToLineNr } from "./traverseFunctionProjectUtils";

import { RegExAndPos } from "./fileSystemWrapperBase";
import { FunctionProjectCodeParser } from "./functionProjectCodeParser";

export class JavaFunctionProjectParser extends FunctionProjectCodeParser {

    protected async getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{ name: string; code: string; filePath: string; pos: number; lineNr: number; }[]> {

        const promises = functionNames.map(async name => {

            const match = await this._fileSystemWrapper.findFileRecursivelyAsync(hostJsonFolder, '.+\\.java$', true, this.getFunctionStartRegex(name));
            
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

        for await (const func of this._fileSystemWrapper.findFunctionsRecursivelyAsync(projectFolder, new RegExp('.+\\.java$', 'i'), this.getFunctionAttributeRegex())) {
            
            const bindings = this.tryExtractBindings(func.declarationCode);
    
            result[func.functionName] = {

                filePath: func.filePath,
                pos: func.pos,
                lineNr: func.lineNr,

                bindings: [...bindings]
            };
        }

        return result;
    }

    protected getFunctionAttributeRegex(): RegExAndPos {
        return {
            regex: new RegExp(`@\\s*FunctionName\\s*\\((["\\w\\s\\.\\(\\)-]+)\\)`, 'g'),
            pos: 1
        };
    }
}