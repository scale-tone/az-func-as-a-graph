import { FunctionsMap } from "./FunctionsMap";
import { FileSystemWrapperBase } from './fileSystemWrapperBase';
export declare abstract class FunctionProjectParserBase {
    protected _fileSystemWrapper: FileSystemWrapperBase;
    protected _log: (s: any) => void;
    constructor(_fileSystemWrapper: FileSystemWrapperBase, _log: (s: any) => void);
    abstract traverseFunctions(projectFolder: string): Promise<FunctionsMap>;
    protected abstract getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{
        name: string;
        code: string;
        filePath: string;
        pos: number;
        lineNr: number;
    }[]>;
    protected mapOrchestratorsAndActivitiesAsync(functions: FunctionsMap, projectFolder: string): Promise<FunctionsMap>;
    protected getEventNames(orchestratorCode: string): string[];
    protected mapActivitiesToOrchestrator(functions: FunctionsMap, orch: {
        name: string;
        code: string;
    }, activityNames: string[]): void;
    protected getStartNewOrchestrationRegex(orchName: string): RegExp;
    protected getCallSubOrchestratorRegex(subOrchName: string): RegExp;
    protected getContinueAsNewRegex(): RegExp;
    protected getRaiseEventRegex(eventName: string): RegExp;
    protected getSignalEntityRegex(entityName: string): RegExp;
    protected getWaitForExternalEventRegex(): {
        regex: RegExp;
        pos: number;
    };
    protected getDotNetFunctionNameRegex(funcName: string): RegExp;
    protected getJavaFunctionNameRegex(funcName: string): RegExp;
    protected getCallActivityRegex(activityName: string): RegExp;
    protected getClassDefinitionRegex(className: string): RegExp;
}
