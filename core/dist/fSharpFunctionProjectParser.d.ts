import { FunctionsMap } from "./FunctionsMap";
import { RegExAndPos } from "./fileSystemWrapperBase";
import { FunctionProjectCodeParser } from "./functionProjectCodeParser";
export declare class FSharpFunctionProjectParser extends FunctionProjectCodeParser {
    protected getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{
        name: string;
        code: string;
        filePath: string;
        pos: number;
        lineNr: number;
    }[]>;
    protected traverseProjectCode(projectFolder: string): Promise<FunctionsMap>;
    protected getFunctionAttributeRegex(): RegExAndPos;
}
