import * as vscode from 'vscode';

import { FileSystemWrapperBase } from './func-project-parser/fileSystemWrapperBase';

export class FileSystemWrapper extends FileSystemWrapperBase {

	public joinPath(path1: string, path2: string): string {

		return vscode.Uri.joinPath(vscode.Uri.parse(path1), path2).toString();
	}

	public dirName(path1: string): string {

		const i = path1.lastIndexOf('/');

		if (i < 0) {
			throw new Error(`Failed to extract parent folder name from path ${path1}. The path does not contain a separator.`);
		}

		return path1.substring(0, i);
	}

	protected async readFile(path: string): Promise<string> {

		const uri = vscode.Uri.parse(path);

		const bytes = await vscode.workspace.fs.readFile(uri);

		return new TextDecoder().decode(bytes);
	}

	protected async isDirectory(path: string): Promise<boolean> {

		const uri = vscode.Uri.parse(path);

		const stat = await vscode.workspace.fs.stat(uri);

		return stat.type === vscode.FileType.Directory;
	}

	protected async readDir(path: string): Promise<string[]> {

		const uri = vscode.Uri.parse(path);

		const files = await vscode.workspace.fs.readDirectory(uri);

		return files.map(f => f[0]);
	}

	public async pathExists(path: string): Promise<boolean> {

		const uri = vscode.Uri.parse(path);

		try {
			
			const stat = await vscode.workspace.fs.stat(uri);

			return stat.type === vscode.FileType.File || stat.type === vscode.FileType.Directory;

		} catch (err) {
		
			return false;
		}		
	}
}
