import { FunctionsMap, TraverseFunctionResult } from "./FunctionsMap";
import { FileSystemWrapperBase } from './fileSystemWrapperBase';
export declare abstract class FunctionProjectParser {
    protected _fileSystemWrapper: FileSystemWrapperBase;
    protected _log: (s: any) => void;
    static parseFunctions(projectFolder: string, fileSystemWrapper: FileSystemWrapperBase, log: (s: any) => void): Promise<TraverseFunctionResult>;
    constructor(_fileSystemWrapper: FileSystemWrapperBase, _log: (s: any) => void);
    protected abstract traverseFunctions(projectFolder: string): Promise<FunctionsMap>;
    protected abstract getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{
        name: string;
        code: string;
        filePath: string;
        pos: number;
        lineNr: number;
    }[]>;
    protected mapOrchestratorsAndActivitiesAsync(functions: FunctionsMap, projectFolder: string): Promise<FunctionsMap>;
}
