import { FunctionsMap } from "./FunctionsMap";
import { FunctionProjectParserBase } from './functionProjectParserBase';
export declare class FunctionProjectScriptParser extends FunctionProjectParserBase {
    traverseFunctions(projectFolder: string): Promise<FunctionsMap>;
    protected getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{
        name: string;
        code: string;
        filePath: string;
        pos: number;
        lineNr: number;
    }[]>;
}
