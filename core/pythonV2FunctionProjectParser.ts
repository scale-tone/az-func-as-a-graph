import { FunctionsMap } from "./FunctionsMap";
import { getCodeInBrackets, posToLineNr } from "./traverseFunctionProjectUtils";

import { RegExAndPos } from "./fileSystemWrapperBase";
import { FunctionProjectCodeParser } from "./functionProjectCodeParser";

export class PythonV2FunctionProjectParser extends FunctionProjectCodeParser {

    protected async getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{ name: string; code: string; filePath: string; pos: number; lineNr: number; }[]> {

        const promises = functionNames.map(async name => {

            const match = await this._fileSystemWrapper.findFileRecursivelyAsync(hostJsonFolder, '.+\\.py$', true, this.getFunctionStartRegex(name));
            
            if (!match) {
                return undefined;
            }

            const { declarationCode, bodyCode } = this.getFunctionCode(match.code, match.pos!);

            const pos = !match.pos ? 0 : match.pos;
            const lineNr = posToLineNr(match.code, pos);

            return { name, code: bodyCode, filePath: match.filePath, pos, lineNr };
        });

        return (await Promise.all(promises)).filter(f => !!f) as any;
    }

    protected async traverseProjectCode(projectFolder: string): Promise<FunctionsMap> {

        const result: any = {};

        for await (const func of this.findFunctionsRecursivelyAsync(projectFolder)) {
            
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

    async * findFunctionsRecursivelyAsync(folder: string): AsyncGenerator<any> {

        const fileNameRegex = new RegExp('.+\\.py$', 'i');
        const functionAttributeRegex = this.getFunctionAttributeRegex();

        const functionNameRegex = new RegExp(`\\.\\s*function_name\\s*\\(\\s*name\\s*=\\s*["']([\\w-]+)["']`);
        
        for await (const fullPath of this._fileSystemWrapper.findFilesRecursivelyAsync(folder, fileNameRegex)) {

            const code = await this._fileSystemWrapper.readFile(fullPath);

            let match: RegExpExecArray | null;
            while (!!(match = functionAttributeRegex.regex.exec(code))) {

                let functionName = match[functionAttributeRegex.pos];

                let { declarationCode, bodyCode } = this.getFunctionCode(code, match.index);

                const functionNameMatch = functionNameRegex.exec(declarationCode);
                if (!!functionNameMatch) {
                 
                    functionName = functionNameMatch[1];

                    // Need to remove this line so that it does not appear as binding
                    declarationCode = declarationCode.replace('function_name', '');
                }

                yield {
                    functionName,
                    filePath: fullPath,
                    pos: match.index,
                    lineNr: posToLineNr(code, match.index),

                    declarationCode,
                    bodyCode
                };
            }
        }
    }

    private getFunctionCode(code: string, endPos: number): { declarationCode: string, bodyCode: string } {

        let declarationCode = '';
        let bodyCode = '';

        const defRegex = new RegExp('^(async)?\\s*def ', 'gm');
        const nextMethodRegex = new RegExp('^[^\\s]', 'gm');

        defRegex.lastIndex = endPos;
        const defMatch = defRegex.exec(code);
        if (!!defMatch) {
            
            declarationCode = code.substring(endPos, defMatch.index);

            endPos = defMatch.index + defMatch[0].length;

            nextMethodRegex.lastIndex = endPos;
            const nextMethodMatch = nextMethodRegex.exec(code);
            if (!!nextMethodMatch) {

                bodyCode = code.substring(endPos, nextMethodMatch.index);
                
            } else {

                bodyCode = code.substring(endPos);
            }

        } else {

            declarationCode = code.substring(endPos);
            bodyCode = code.substring(endPos);
        }

        return { declarationCode, bodyCode };
    }

    protected getFunctionAttributeRegex(): RegExAndPos {
        return {
            regex: new RegExp(`@[\\w\\s]+\\.\\s*(function_name|route|blob_trigger|cosmos_db_trigger|event_hub_message_trigger|queue_trigger|service_bus_queue_trigger|service_bus_topic_trigger|orchestration_trigger|activity_trigger|schedule)(.|\r|\n)+?def\\s+([\\w-]+)`, 'g'),
            pos: 3
        };
    }

    protected getFunctionStartRegex(funcName: string): RegExp {
        return new RegExp(`(@[\\w\\s]+\\.\\s*function_name\\s*\\(\\s*name\\s*=\\s*["']${funcName}["']|^(async)?\\s*def\\s+${funcName})`, 'm')
    }

    protected getBindingAttributeRegex(): RegExAndPos {
        
        return {
            regex: new RegExp(`@[\\w\\s]+\\.\\s*(\\w+)\\s*\\(`, 'g'),
            pos: 1
        };
    }

    protected getStartNewOrchestrationRegex(orchName: string): RegExp {
        
        return new RegExp(`\\.\\s*start_new\\s*\\(\\s*["']${orchName}["']`);
    }
}