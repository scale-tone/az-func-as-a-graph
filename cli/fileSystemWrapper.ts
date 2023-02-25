import * as fileSystem from 'fs';
import { FileSystemWrapperBase } from './fileSystemWrapperBase';

export class FileSystemWrapper extends FileSystemWrapperBase {

    protected async readFile(path: string): Promise<string> {

        return await fileSystem.promises.readFile(path, { encoding: 'utf8' });
    }

    protected async isDirectory(path: string): Promise<boolean> {

        return (await fileSystem.promises.lstat(path)).isDirectory();
    }

    protected async readDir(path: string): Promise<string[]> {

        return await fileSystem.promises.readdir(path);
    }

    protected pathExists(path: string): boolean {

        return fileSystem.existsSync(path);
    }
}