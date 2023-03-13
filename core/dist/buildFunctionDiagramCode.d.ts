import { FunctionsMap, ProxiesMap } from './FunctionsMap';
export declare type GraphSettings = {
    doNotRenderFunctions?: boolean;
    doNotRenderProxies?: boolean;
};
export declare function buildFunctionDiagramCode(functionsMap: FunctionsMap, proxiesMap: ProxiesMap, settings?: GraphSettings): string;
