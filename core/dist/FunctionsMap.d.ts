export declare type FunctionsMap = {
    [name: string]: {
        bindings: any[];
        isCalledBy: string[];
        isSignalledBy: {
            name: string;
            signalName: string;
        }[];
        isCalledByItself?: boolean;
        filePath?: string;
        pos?: number;
        lineNr?: number;
    };
};
export declare type ProxiesMap = {
    [name: string]: {
        matchCondition?: {
            methods?: string[];
            route?: string;
        };
        backendUri?: string;
        requestOverrides?: {};
        responseOverrides?: {};
        filePath?: string;
        pos?: number;
        lineNr?: number;
        warningNotAddedToCsProjFile?: boolean;
    };
};
export declare type TraverseFunctionResult = {
    functions: FunctionsMap;
    proxies: ProxiesMap;
    projectFolder: string;
};
export declare type GraphSettings = {
    doNotRenderFunctions?: boolean;
    doNotRenderProxies?: boolean;
};
