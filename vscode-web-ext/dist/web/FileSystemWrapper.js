"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemWrapper = void 0;
const vscode = require("vscode");
const fileSystemWrapperBase_1 = require("az-func-as-a-graph.core/fileSystemWrapperBase");
class FileSystemWrapper extends fileSystemWrapperBase_1.FileSystemWrapperBase {
    joinPath(path1, path2) {
        return vscode.Uri.joinPath(vscode.Uri.parse(path1), path2).toString();
    }
    dirName(path1) {
        const i = path1.lastIndexOf('/');
        if (i < 0) {
            throw new Error(`Failed to extract parent folder name from path ${path1}. The path does not contain a separator.`);
        }
        return path1.substring(0, i);
    }
    async readFile(path) {
        const uri = vscode.Uri.parse(path);
        const bytes = await vscode.workspace.fs.readFile(uri);
        return new TextDecoder().decode(bytes);
    }
    async isDirectory(path) {
        const uri = vscode.Uri.parse(path);
        const stat = await vscode.workspace.fs.stat(uri);
        return stat.type === vscode.FileType.Directory;
    }
    async readDir(path) {
        const uri = vscode.Uri.parse(path);
        const files = await vscode.workspace.fs.readDirectory(uri);
        return files.map(f => f[0]);
    }
    async pathExists(path) {
        const uri = vscode.Uri.parse(path);
        try {
            const stat = await vscode.workspace.fs.stat(uri);
            return stat.type === vscode.FileType.File || stat.type === vscode.FileType.Directory;
        }
        catch (err) {
            return false;
        }
    }
}
exports.FileSystemWrapper = FileSystemWrapper;
//# sourceMappingURL=FileSystemWrapper.js.map