import { FunctionsMap } from "./FunctionsMap";
import { FunctionProjectParserBase } from './functionProjectParserBase';
export declare class PowershellFunctionProjectParser extends FunctionProjectParserBase {
    traverseFunctions(projectFolder: string): Promise<FunctionsMap>;
    protected getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{
        name: string;
        code: string;
        filePath: string;
        pos: number;
        lineNr: number;
    }[]>;
    protected getStartNewOrchestrationRegex(orchName: string): RegExp;
    protected getCallActivityRegex(activityName: string): RegExp;
    protected getRaiseEventRegex(eventName: string): RegExp;
    protected getWaitForExternalEventRegex(): {
        regex: RegExp;
        pos: number;
    };
}
