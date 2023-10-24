import { FunctionsMap } from "./FunctionsMap";
import { FunctionProjectParserBase } from './functionProjectParserBase';
import { RegExAndPos } from "./fileSystemWrapperBase";
export declare abstract class FunctionProjectCodeParser extends FunctionProjectParserBase {
    traverseFunctions(projectFolder: string): Promise<FunctionsMap>;
    protected abstract traverseProjectCode(projectFolder: string): Promise<FunctionsMap>;
    protected getFunctionStartRegex(funcName: string): RegExp;
    protected getFunctionAttributeRegex(): RegExAndPos;
}
