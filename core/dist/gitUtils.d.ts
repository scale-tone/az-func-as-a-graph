export declare function cloneFromGitHub(url: string): Promise<{
    gitTempFolder: string;
    projectFolder: string;
}>;
export declare type GitRepositoryInfo = {
    originUrl: string;
    repoName: string;
    branchName?: string;
    tagName?: string;
};
export declare function getGitRepoInfo(projectFolder: string, repoInfoFromSettings?: GitRepositoryInfo): Promise<GitRepositoryInfo>;
declare type FunctionsOrProxiesMap = {
    [name: string]: {
        filePath?: string;
        lineNr?: number;
    };
};
export declare function convertLocalPathsToRemote(map: FunctionsOrProxiesMap, sourcesRootFolder: string, repoInfo: GitRepositoryInfo): void;
export {};
