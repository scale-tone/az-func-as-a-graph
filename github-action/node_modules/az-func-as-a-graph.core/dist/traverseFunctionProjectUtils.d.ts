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
