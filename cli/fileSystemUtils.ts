import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { exec } from 'child_process';
import { cleanupFunctionName, getCodeInBrackets, posToLineNr } from './traverseFunctionProjectUtils';
import { FunctionsMap, ProxiesMap } from '../ui/src/shared/FunctionsMap';
const execAsync = util.promisify(exec);

const gitCloneTimeoutInSeconds = 60;

export const ExcludedFolders = ['node_modules', 'obj', '.vs', '.vscode', '.env', '.python_packages', '.git', '.github'];

export async function readFunctionsJson(hostJsonFolder: string, log: (s: any) => void): Promise<FunctionsMap> {

    let functions: FunctionsMap = {};

        // Reading function.json files, in parallel
        const promises = (await fs.promises.readdir(hostJsonFolder)).map(async functionName => {

            const fullPath = path.join(hostJsonFolder, functionName);
            const functionJsonFilePath = path.join(fullPath, 'function.json');

            const isDirectory = (await fs.promises.lstat(fullPath)).isDirectory();
            const functionJsonExists = fs.existsSync(functionJsonFilePath);

            if (isDirectory && functionJsonExists) {

                try {
                    const functionJsonString = await fs.promises.readFile(functionJsonFilePath, { encoding: 'utf8' });
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

// Tries to read proxies.json file from project folder
export async function readProxiesJson(projectFolder: string, log: (s: any) => void): Promise<ProxiesMap> {

    const proxiesJsonPath = path.join(projectFolder, 'proxies.json');
    if (!fs.existsSync(proxiesJsonPath)) {
        return {};
    }
    
    const proxiesJsonString = await fs.promises.readFile(proxiesJsonPath, { encoding: 'utf8' });
    try {

        const proxies = JSON.parse(proxiesJsonString).proxies as ProxiesMap;
        if (!proxies) {
            return {};
        }

        var notAddedToCsProjFile = false;
        if (await isCSharpProjectAsync(projectFolder)) {

            // Also checking that proxies.json is added to .csproj file

            const csProjFile = await findFileRecursivelyAsync(projectFolder, '.+\\.csproj$', true);
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

// Does a git clone into a temp folder and returns info about that cloned code
export async function cloneFromGitHub(url: string): Promise<{gitTempFolder: string, projectFolder: string}> {

    let repoName = '', branchName = '', relativePath = '', gitTempFolder = '';

    let restOfUrl: string[] = [];
    const match = /(https:\/\/github.com\/.*?)\/([^\/]+)(\/tree\/)?(.*)/i.exec(url);

    if (!match || match.length < 5) {

        // expecting repo name to be the last segment of remote origin URL
        repoName = url.substr(url.lastIndexOf('/') + 1);

    } else {

        const orgUrl = match[1];

        repoName = match[2];
        if (repoName.toLowerCase().endsWith('.git')) {
            repoName = repoName.substr(0, repoName.length - 4);
        }

        url = `${orgUrl}/${repoName}.git`;

        if (!!match[4]) {
            restOfUrl = match[4].split('/').filter(s => !!s);
        }
    }

    gitTempFolder = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'git-clone-'));

    let getGitTimeoutPromise = () => {

        return new Promise<void>((resolve, reject) => setTimeout(() => reject(new Error(`git clone timed out after ${gitCloneTimeoutInSeconds} sec.`)), gitCloneTimeoutInSeconds * 1000));
    };

    // The provided URL might contain both branch name and relative path. The only way to separate one from another
    // is to repeatedly try cloning assumed branch names, until we finally succeed.
    for (let i = restOfUrl.length; i > 0; i--) {

        try {

            const assumedBranchName = restOfUrl.slice(0, i).join('/');

            const clonePromise = execAsync(`git clone ${url} --branch ${assumedBranchName}`, { cwd: gitTempFolder });
    
            // It turned out that the above command can hang forever for unknown reason. So need to put a timeout.
            await Promise.race([clonePromise, getGitTimeoutPromise()]);

            branchName = assumedBranchName;
            relativePath = path.join(...restOfUrl.slice(i, restOfUrl.length));

            break;
        } catch {
            continue;
        }
    }

    if (!branchName) {

        // Just doing a normal git clone
        const clonePromise = execAsync(`git clone ${url}`, { cwd: gitTempFolder });

        // It turned out that the above command can hang forever for unknown reason. So need to put a timeout.
        await Promise.race([clonePromise, getGitTimeoutPromise()]);
    }

    return { gitTempFolder, projectFolder: path.join(gitTempFolder, repoName, relativePath) };
}

// Checks if the given folder looks like a C# function project
export async function isCSharpProjectAsync(projectFolder: string): Promise<boolean> {
    return (await fs.promises.readdir(projectFolder)).some(fn => {
        fn = fn.toLowerCase();
        return (fn.endsWith('.csproj') && fn !== 'extensions.csproj');
    });
}

// Checks if the given folder looks like a F# function project
export async function isFSharpProjectAsync(projectFolder: string): Promise<boolean> {
    return (await fs.promises.readdir(projectFolder)).some(fn => {
        fn = fn.toLowerCase();
        return fn.endsWith('.fsproj');
    });
}

// Checks if the given folder looks like a Java Functions project
export async function isJavaProjectAsync(projectFolder: string): Promise<boolean> {

    const javaFileMatch = await findFileRecursivelyAsync(projectFolder, `.+\\.java$`, false);
    return !!javaFileMatch;
}

// fileName can be a regex, pattern should be a regex (which will be searched for in the matching files).
// If returnFileContents == true, returns file content. Otherwise returns full path to the file.
export async function findFileRecursivelyAsync(folder: string, fileName: string | RegExp, returnFileContents: boolean, pattern?: RegExp)
    : Promise<{ filePath: string, code?: string, pos?: number, length?: number } | undefined> {

    const fileNameRegex = typeof fileName === 'string' ? new RegExp(fileName, 'i') : fileName;

    const subFolders: string[] = [];

    for (const name of await fs.promises.readdir(folder)) {

        const fullPath = path.join(folder, name);
        const isDirectory = (await fs.promises.lstat(fullPath)).isDirectory();

        if (!!isDirectory) {

            if (!ExcludedFolders.includes(name.toLowerCase())) {

                subFolders.push(fullPath);
            }

        } else if (!!fileNameRegex.exec(name)) {

            if (!pattern) {
                return {
                    filePath: fullPath,
                    code: returnFileContents ? (await fs.promises.readFile(fullPath, { encoding: 'utf8' })) : undefined
                };
            }

            const code = await fs.promises.readFile(fullPath, { encoding: 'utf8' });
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
        
        const result = await findFileRecursivelyAsync(subFolder, fileNameRegex, returnFileContents, pattern);
        if (!!result) {
            return result;
        }
    }

    return undefined;
}

export async function* findFunctionsRecursivelyAsync(folder: string, fileNameRegex: RegExp, functionAttributeRegex: RegExp, functionNamePosInRegex: number): AsyncGenerator<any> {

    for (const dirEnt of await fs.promises.readdir(folder, { withFileTypes: true })) {

        var fullPath = path.join(folder, dirEnt.name);

        if (dirEnt.isDirectory()) {

            if (ExcludedFolders.includes(dirEnt.name.toLowerCase())) {
                continue;
            }

            for await (const file of findFunctionsRecursivelyAsync(fullPath, fileNameRegex, functionAttributeRegex, functionNamePosInRegex)) {

                yield file;
            }

        } else if (!!fileNameRegex.exec(dirEnt.name)) {

            const code = await fs.promises.readFile(fullPath, { encoding: 'utf8' });

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
