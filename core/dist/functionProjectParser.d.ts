import { TraverseFunctionResult } from "./FunctionsMap";
import { FileSystemWrapperBase } from './fileSystemWrapperBase';
export declare abstract class FunctionProjectParser {
    static parseFunctions(projectFolder: string, fileSystemWrapper: FileSystemWrapperBase, log: (s: any) => void): Promise<TraverseFunctionResult>;
}
