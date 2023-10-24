import { FunctionsMap } from "./FunctionsMap";
import { RegExAndPos } from "./fileSystemWrapperBase";
import { FunctionProjectCodeParser } from "./functionProjectCodeParser";
export declare class PythonV2FunctionProjectParser extends FunctionProjectCodeParser {
    protected getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{
        name: string;
        code: string;
        filePath: string;
        pos: number;
        lineNr: number;
    }[]>;
    protected traverseProjectCode(projectFolder: string): Promise<FunctionsMap>;
    findFunctionsRecursivelyAsync(folder: string): AsyncGenerator<any>;
    private getFunctionCode;
    protected getFunctionAttributeRegex(): RegExAndPos;
    protected getFunctionStartRegex(funcName: string): RegExp;
    protected getBindingAttributeRegex(): RegExAndPos;
    protected getStartNewOrchestrationRegex(orchName: string): RegExp;
}
