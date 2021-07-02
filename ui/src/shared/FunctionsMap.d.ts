
export type FunctionsMap = {
    [name: string]: {
        bindings: any[],
        isCalledBy: string[],
        isSignalledBy: { name: string, signalName: string }[],
        isCalledByItself?: boolean,
        filePath?: string,
        pos?: number,
        lineNr?: number
    }
};

export type GitHubInfo = {
    orgUrl: string;
    repoName: string;
    branchName: string;
    relativePath: string;
    gitTempFolder: string;
}

export type TraverseFunctionResult = {
    functions: FunctionsMap;
    tempFolders: string[];
    gitHubInfo: GitHubInfo;
}