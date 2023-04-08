import { FunctionsMap } from "./FunctionsMap";
import { FileSystemWrapperBase, RegExAndPos } from './fileSystemWrapperBase';
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
    protected tryExtractBindings(funcCode: string): {
        type: string;
        direction: string;
    }[];
    protected readonly singleParamRegex: RegExp;
    protected readonly eventHubParamsRegex: RegExp;
    protected readonly signalRParamsRegex: RegExp;
    protected readonly rabbitMqParamsRegex: RegExp;
    protected readonly blobParamsRegex: RegExp;
    protected readonly cosmosDbParamsRegex: RegExp;
    protected readonly signalRConnInfoParamsRegex: RegExp;
    protected readonly eventGridParamsRegex: RegExp;
    protected readonly isOutRegex: RegExp;
    protected readonly httpMethods: string[];
    protected readonly httpTriggerRouteRegex: RegExp;
    protected readonly functionReturnTypeRegex: RegExp;
    protected getBindingAttributeRegex(): RegExAndPos;
    protected getStartNewOrchestrationRegex(orchName: string): RegExp;
    protected getCallSubOrchestratorRegex(subOrchName: string): RegExp;
    protected getContinueAsNewRegex(): RegExp;
    protected getRaiseEventRegex(eventName: string): RegExp;
    protected getSignalEntityRegex(entityName: string): RegExp;
    protected getWaitForExternalEventRegex(): RegExAndPos;
    protected getCallActivityRegex(activityName: string): RegExp;
    protected getClassDefinitionRegex(className: string): RegExp;
}
