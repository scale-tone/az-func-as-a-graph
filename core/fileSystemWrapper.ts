import * as fileSystem from 'fs';
import * as path from 'path';
import { FileSystemWrapperBase } from './fileSystemWrapperBase';

// Implements common filesystem routines via 'fs' module 
export class FileSystemWrapper extends FileSystemWrapperBase {

    public joinPath(path1: string, path2: string): string {

        return path.join(path1, path2);
    }

	public dirName(path1: string): string {

        return path.dirname(path1);
	}

    public async readFile(path: string): Promise<string> {

        return await fileSystem.promises.readFile(path, { encoding: 'utf8' });
    }

    public async isDirectory(path: string): Promise<boolean> {

        return (await fileSystem.promises.lstat(path)).isDirectory();
    }

    public async readDir(path: string): Promise<string[]> {

        return await fileSystem.promises.readdir(path);
    }

    public async pathExists(path: string): Promise<boolean> {

        return fileSystem.existsSync(path);
    }
}