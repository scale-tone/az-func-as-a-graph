import { FileSystemWrapperBase } from './fileSystemWrapperBase';
export declare class FileSystemWrapper extends FileSystemWrapperBase {
    joinPath(path1: string, path2: string): string;
    dirName(path1: string): string;
    protected readFile(path: string): Promise<string>;
    protected isDirectory(path: string): Promise<boolean>;
    protected readDir(path: string): Promise<string[]>;
    protected pathExists(path: string): Promise<boolean>;
}
