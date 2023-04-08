import { FileSystemWrapperBase } from './fileSystemWrapperBase';
export declare class FileSystemWrapper extends FileSystemWrapperBase {
    joinPath(path1: string, path2: string): string;
    dirName(path1: string): string;
    readFile(path: string): Promise<string>;
    isDirectory(path: string): Promise<boolean>;
    readDir(path: string): Promise<string[]>;
    pathExists(path: string): Promise<boolean>;
}
