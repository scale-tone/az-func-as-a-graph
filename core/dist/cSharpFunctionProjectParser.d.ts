import { FunctionsMap } from "./FunctionsMap";
import { FunctionProjectCodeParser } from "./functionProjectCodeParser";
export declare class CSharpFunctionProjectParser extends FunctionProjectCodeParser {
    protected getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{
        name: string;
        code: string;
        filePath: string;
        pos: number;
        lineNr: number;
    }[]>;
    protected traverseProjectCode(projectFolder: string): Promise<FunctionsMap>;
    private extractOutputBindings;
}
