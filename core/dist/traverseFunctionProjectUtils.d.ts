export declare function cleanupFunctionName(name: string): string;
export declare function removeNamespace(name: string): string;
export declare function posToLineNr(code: string | undefined, pos: number): number;
export declare function getCodeInBrackets(str: string, startFrom: number, openingBracket: string, closingBracket: string, mustHaveSymbols?: string): {
    code: string;
    openBracketPos: number;
};
export declare function getCodeInBracketsReverse(str: string, openingBracket: string, closingBracket: string): {
    code: string;
    openBracketPos: number;
};
export declare class BindingsParser {
    static tryExtractBindings(funcCode: string): {
        type: string;
        direction: string;
    }[];
    static readonly bindingAttributeRegex: RegExp;
    static readonly singleParamRegex: RegExp;
    static readonly eventHubParamsRegex: RegExp;
    static readonly signalRParamsRegex: RegExp;
    static readonly rabbitMqParamsRegex: RegExp;
    static readonly blobParamsRegex: RegExp;
    static readonly cosmosDbParamsRegex: RegExp;
    static readonly signalRConnInfoParamsRegex: RegExp;
    static readonly eventGridParamsRegex: RegExp;
    static readonly isOutRegex: RegExp;
    static readonly httpMethods: string[];
    static readonly httpTriggerRouteRegex: RegExp;
    static readonly functionReturnTypeRegex: RegExp;
    static getFunctionAttributeRegex(): RegExp;
    static getJavaFunctionAttributeRegex(): RegExp;
    static getFSharpFunctionAttributeRegex(): RegExp;
}
