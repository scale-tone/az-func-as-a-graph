import { FunctionsMap } from "./FunctionsMap";
import { FunctionProjectParserBase } from './functionProjectParserBase';
declare abstract class FunctionProjectCodeParser extends FunctionProjectParserBase {
    traverseFunctions(projectFolder: string): Promise<FunctionsMap>;
    protected abstract traverseProjectCode(projectFolder: string): Promise<FunctionsMap>;
}
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
export declare class FSharpFunctionProjectParser extends FunctionProjectCodeParser {
    protected getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{
        name: string;
        code: string;
        filePath: string;
        pos: number;
        lineNr: number;
    }[]>;
    protected traverseProjectCode(projectFolder: string): Promise<FunctionsMap>;
}
export declare class JavaFunctionProjectParser extends FunctionProjectCodeParser {
    protected getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{
        name: string;
        code: string;
        filePath: string;
        pos: number;
        lineNr: number;
    }[]>;
    protected traverseProjectCode(projectFolder: string): Promise<FunctionsMap>;
}
export {};
