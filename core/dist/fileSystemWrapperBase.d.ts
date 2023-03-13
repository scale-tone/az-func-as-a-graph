import { FunctionsMap, ProxiesMap } from './FunctionsMap';
export declare abstract class FileSystemWrapperBase {
    abstract dirName(path1: string): string;
    abstract joinPath(path1: string, path2: string): string;
    protected abstract readFile(path: string): Promise<string>;
    protected abstract isDirectory(path: string): Promise<boolean>;
    protected abstract readDir(path: string): Promise<string[]>;
    protected abstract pathExists(path: string): Promise<boolean>;
    readFunctionsJson(hostJsonFolder: string, log: (s: any) => void): Promise<FunctionsMap>;
    readProxiesJson(projectFolder: string, log: (s: any) => void): Promise<ProxiesMap>;
    isCSharpProjectAsync(projectFolder: string): Promise<boolean>;
    isFSharpProjectAsync(projectFolder: string): Promise<boolean>;
    isJavaProjectAsync(projectFolder: string): Promise<boolean>;
    findFileRecursivelyAsync(folder: string, fileName: string | RegExp, returnFileContents: boolean, pattern?: RegExp): Promise<{
        filePath: string;
        code?: string;
        pos?: number;
        length?: number;
    } | undefined>;
    findFilesRecursivelyAsync(folder: string, fileNameRegex: RegExp): AsyncGenerator<any>;
    findFunctionsRecursivelyAsync(folder: string, fileNameRegex: RegExp, functionAttributeRegex: RegExp, functionNamePosInRegex: number): AsyncGenerator<any>;
}
