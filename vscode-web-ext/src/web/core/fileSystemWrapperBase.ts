import { cleanupFunctionName, getCodeInBrackets, posToLineNr } from './traverseFunctionProjectUtils';
import { FunctionsMap, ProxiesMap } from './FunctionsMap';

const ExcludedFolders = ['node_modules', 'target', 'bin', 'obj', '.vs', '.vscode', '.env', '.python_packages', '.git', '.github'];

// Base class for implementing filesystem wrappers
export abstract class FileSystemWrapperBase {

    public abstract dirName(path1: string): string;

    public abstract joinPath(path1: string, path2: string): string;

    protected abstract readFile(path: string): Promise<string>;

    protected abstract isDirectory(path: string): Promise<boolean>;

    protected abstract readDir(path: string): Promise<string[]>;

    protected abstract pathExists(path: string): Promise<boolean>;

    async readFunctionsJson(hostJsonFolder: string, log: (s: any) => void): Promise<FunctionsMap> {

        let functions: FunctionsMap = {};
    
            // Reading function.json files, in parallel
            const promises = (await this.readDir(hostJsonFolder)).map(async functionName => {
    
                const fullPath = this.joinPath(hostJsonFolder, functionName);
                const functionJsonFilePath = this.joinPath(fullPath, 'function.json');
    
                const isDirectory = await this.isDirectory(fullPath);
                const functionJsonExists = await this.pathExists(functionJsonFilePath);
    
                if (isDirectory && functionJsonExists) {
    
                    try {
                        const functionJsonString = await this.readFile(functionJsonFilePath);
                        const functionJson = JSON.parse(functionJsonString);
    
                        functions[functionName] = { bindings: functionJson.bindings, isCalledBy: [], isSignalledBy: [] };
    
                    } catch (err) {
                        log(`>>> Failed to parse ${functionJsonFilePath}: ${err}`);
                    }
                }
            });
            await Promise.all(promises);
        
        return functions;
    }

    async readProxiesJson(projectFolder: string, log: (s: any) => void): Promise<ProxiesMap> {

        const proxiesJsonPath = this.joinPath(projectFolder, 'proxies.json');
        if (!(await this.pathExists(proxiesJsonPath))) {
            return {};
        }
        
        const proxiesJsonString = await this.readFile(proxiesJsonPath);
        try {
    
            const proxies = JSON.parse(proxiesJsonString).proxies as ProxiesMap;
            if (!proxies) {
                return {};
            }
    
            var notAddedToCsProjFile = false;
            if (await this.isCSharpProjectAsync(projectFolder)) {
    
                // Also checking that proxies.json is added to .csproj file
    
                const csProjFile = await this.findFileRecursivelyAsync(projectFolder, '.+\\.csproj$', true);
                const proxiesJsonEntryRegex = new RegExp(`\\s*=\\s*"proxies.json"\\s*>`);
    
                if (!!csProjFile && csProjFile.code && (!proxiesJsonEntryRegex.exec(csProjFile.code))) {
                    
                    notAddedToCsProjFile = true;
                }            
            }
    
            // Also adding filePath and lineNr
            for (var proxyName in proxies) {
    
                const proxy = proxies[proxyName];
                proxy.filePath = proxiesJsonPath;
                if (notAddedToCsProjFile) {
                    proxy.warningNotAddedToCsProjFile = true;
                }
    
                const proxyNameRegex = new RegExp(`"${proxyName}"\\s*:`);
                const match = proxyNameRegex.exec(proxiesJsonString);
                if (!!match) {
                    
                    proxy.pos = match.index;
                    proxy.lineNr = posToLineNr(proxiesJsonString, proxy.pos);
                }
            }
    
            return proxies;
    
        } catch(err) {
    
            log(`>>> Failed to parse ${proxiesJsonPath}: ${err}`);
            return {};
        }
    }

    async isCSharpProjectAsync(projectFolder: string): Promise<boolean> {
        return (await this.readDir(projectFolder)).some(fn => {
            fn = fn.toLowerCase();
            return (fn.endsWith('.csproj') && fn !== 'extensions.csproj');
        });
    }

    async isFSharpProjectAsync(projectFolder: string): Promise<boolean> {
        return (await this.readDir(projectFolder)).some(fn => {
            fn = fn.toLowerCase();
            return fn.endsWith('.fsproj');
        });
    }

    async isJavaProjectAsync(projectFolder: string): Promise<boolean> {

        const javaFileMatch = await this.findFileRecursivelyAsync(projectFolder, `.+\\.java$`, false);
        return !!javaFileMatch;
    }

    async findFileRecursivelyAsync(folder: string, fileName: string | RegExp, returnFileContents: boolean, pattern?: RegExp)
        : Promise<{ filePath: string, code?: string, pos?: number, length?: number } | undefined> {

        const fileNameRegex = typeof fileName === 'string' ? new RegExp(fileName, 'i') : fileName;

        const subFolders: string[] = [];

        for (const name of await this.readDir(folder)) {

            const fullPath = this.joinPath(folder, name);
            const isDirectory = await this.isDirectory(fullPath);

            if (!!isDirectory) {

                if (!ExcludedFolders.includes(name.toLowerCase())) {

                    subFolders.push(fullPath);
                }

            } else if (!!fileNameRegex.exec(name)) {

                if (!pattern) {
                    return {
                        filePath: fullPath,
                        code: returnFileContents ? (await this.readFile(fullPath)) : undefined
                    };
                }

                const code = await this.readFile(fullPath);
                const match = pattern.exec(code);

                if (!!match) {
                    return {
                        filePath: fullPath,
                        code: returnFileContents ? code : undefined,
                        pos: match.index,
                        length: match[0].length
                    };
                }
            }
        }

        // Now recursively trying subfolders. Doing this _after_ checking the current folder.
        for (const subFolder of subFolders) {
            
            const result = await this.findFileRecursivelyAsync(subFolder, fileNameRegex, returnFileContents, pattern);
            if (!!result) {
                return result;
            }
        }

        return undefined;
    }

    async * findFilesRecursivelyAsync(folder: string, fileNameRegex: RegExp): AsyncGenerator<any> {

        for (const name of await this.readDir(folder)) {
    
            var fullPath = this.joinPath(folder, name);
            const isDirectory = await this.isDirectory(fullPath);
    
            if (!!isDirectory) {
    
                if (ExcludedFolders.includes(name.toLowerCase())) {
                    continue;
                }
    
                for await (const path of this.findFilesRecursivelyAsync(fullPath, fileNameRegex)) {
    
                    yield path;
                }
    
            } else if (!!fileNameRegex.exec(name)) {
    
                yield fullPath;
            }
        }
    }

    async * findFunctionsRecursivelyAsync(folder: string, fileNameRegex: RegExp, functionAttributeRegex: RegExp, functionNamePosInRegex: number): AsyncGenerator<any> {

        for await (const fullPath of this.findFilesRecursivelyAsync(folder, fileNameRegex)) {

            const code = await this.readFile(fullPath);

            var match: RegExpExecArray | null;
            while (!!(match = functionAttributeRegex.exec(code))) {

                let functionName = cleanupFunctionName(match[functionNamePosInRegex]);

                const functionAttributeEndPos = match.index + match[0].length;

                const body = getCodeInBrackets(code, functionAttributeEndPos, '{', '}', '\n');

                if (body.openBracketPos >= 0 && !!body.code) {

                    yield {
                        functionName,
                        filePath: fullPath,
                        pos: match.index,
                        lineNr: posToLineNr(code, match.index),
                        declarationCode: body.code.substring(0, body.openBracketPos),
                        bodyCode: body.code.substring(body.openBracketPos)
                    };

                } else {

                    // Returning the rest of the file

                    yield {
                        functionName,
                        filePath: fullPath,
                        pos: match.index,
                        lineNr: posToLineNr(code, match.index),

                        declarationCode: code.substring(functionAttributeEndPos),
                        bodyCode: code.substring(functionAttributeEndPos)
                    };

                    break;
                }
            }        
        }
    }
}