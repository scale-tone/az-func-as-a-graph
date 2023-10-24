import { FunctionsMap, ProxiesMap } from './FunctionsMap';
export declare type RegExAndPos = {
    regex: RegExp;
    pos: number;
};
export declare abstract class FileSystemWrapperBase {
    abstract dirName(path1: string): string;
    abstract joinPath(path1: string, path2: string): string;
    abstract readFile(path: string): Promise<string>;
    abstract isDirectory(path: string): Promise<boolean>;
    abstract readDir(path: string): Promise<string[]>;
    abstract pathExists(path: string): Promise<boolean>;
    readFunctionsJson(hostJsonFolder: string, log: (s: any) => void): Promise<FunctionsMap>;
    readProxiesJson(projectFolder: string, log: (s: any) => void): Promise<ProxiesMap>;
    isCSharpProjectAsync(projectFolder: string): Promise<boolean>;
    isFSharpProjectAsync(projectFolder: string): Promise<boolean>;
    isJavaProjectAsync(projectFolder: string): Promise<boolean>;
    isPowershellProjectAsync(projectFolder: string): Promise<boolean>;
    isPythonV2ProjectAsync(projectFolder: string): Promise<boolean>;
    findFileRecursivelyAsync(folder: string, fileName: string | RegExp, returnFileContents: boolean, pattern?: RegExp): Promise<{
        filePath: string;
        code?: string;
        pos?: number;
        length?: number;
    } | undefined>;
    findFilesRecursivelyAsync(folder: string, fileNameRegex: RegExp): AsyncGenerator<any>;
    findFunctionsRecursivelyAsync(folder: string, fileNameRegex: RegExp, functionAttributeRegex: RegExAndPos): AsyncGenerator<any>;
}
