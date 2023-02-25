"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findFunctionsRecursivelyAsync = exports.findFileRecursivelyAsync = exports.isJavaProjectAsync = exports.isFSharpProjectAsync = exports.isCSharpProjectAsync = exports.cloneFromGitHub = exports.readProxiesJson = exports.readFunctionsJson = exports.ExcludedFolders = void 0;
const os = require("os");
const fs = require("fs");
const path = require("path");
const util = require("util");
const child_process_1 = require("child_process");
const traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
const execAsync = util.promisify(child_process_1.exec);
const gitCloneTimeoutInSeconds = 60;
exports.ExcludedFolders = ['node_modules', 'obj', '.vs', '.vscode', '.env', '.python_packages', '.git', '.github'];
function readFunctionsJson(hostJsonFolder, log) {
    return __awaiter(this, void 0, void 0, function* () {
        let functions = {};
        // Reading function.json files, in parallel
        const promises = (yield fs.promises.readdir(hostJsonFolder)).map((functionName) => __awaiter(this, void 0, void 0, function* () {
            const fullPath = path.join(hostJsonFolder, functionName);
            const functionJsonFilePath = path.join(fullPath, 'function.json');
            const isDirectory = (yield fs.promises.lstat(fullPath)).isDirectory();
            const functionJsonExists = fs.existsSync(functionJsonFilePath);
            if (isDirectory && functionJsonExists) {
                try {
                    const functionJsonString = yield fs.promises.readFile(functionJsonFilePath, { encoding: 'utf8' });
                    const functionJson = JSON.parse(functionJsonString);
                    functions[functionName] = { bindings: functionJson.bindings, isCalledBy: [], isSignalledBy: [] };
                }
                catch (err) {
                    log(`>>> Failed to parse ${functionJsonFilePath}: ${err}`);
                }
            }
        }));
        yield Promise.all(promises);
        return functions;
    });
}
exports.readFunctionsJson = readFunctionsJson;
// Tries to read proxies.json file from project folder
function readProxiesJson(projectFolder, log) {
    return __awaiter(this, void 0, void 0, function* () {
        const proxiesJsonPath = path.join(projectFolder, 'proxies.json');
        if (!fs.existsSync(proxiesJsonPath)) {
            return {};
        }
        const proxiesJsonString = yield fs.promises.readFile(proxiesJsonPath, { encoding: 'utf8' });
        try {
            const proxies = JSON.parse(proxiesJsonString).proxies;
            if (!proxies) {
                return {};
            }
            var notAddedToCsProjFile = false;
            if (yield isCSharpProjectAsync(projectFolder)) {
                // Also checking that proxies.json is added to .csproj file
                const csProjFile = yield findFileRecursivelyAsync(projectFolder, '.+\\.csproj$', true);
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
                    proxy.lineNr = traverseFunctionProjectUtils_1.posToLineNr(proxiesJsonString, proxy.pos);
                }
            }
            return proxies;
        }
        catch (err) {
            log(`>>> Failed to parse ${proxiesJsonPath}: ${err}`);
            return {};
        }
    });
}
exports.readProxiesJson = readProxiesJson;
// Does a git clone into a temp folder and returns info about that cloned code
function cloneFromGitHub(url) {
    return __awaiter(this, void 0, void 0, function* () {
        let repoName = '', branchName = '', relativePath = '', gitTempFolder = '';
        let restOfUrl = [];
        const match = /(https:\/\/github.com\/.*?)\/([^\/]+)(\/tree\/)?(.*)/i.exec(url);
        if (!match || match.length < 5) {
            // expecting repo name to be the last segment of remote origin URL
            repoName = url.substr(url.lastIndexOf('/') + 1);
        }
        else {
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
        gitTempFolder = yield fs.promises.mkdtemp(path.join(os.tmpdir(), 'git-clone-'));
        let getGitTimeoutPromise = () => {
            return new Promise((resolve, reject) => setTimeout(() => reject(new Error(`git clone timed out after ${gitCloneTimeoutInSeconds} sec.`)), gitCloneTimeoutInSeconds * 1000));
        };
        // The provided URL might contain both branch name and relative path. The only way to separate one from another
        // is to repeatedly try cloning assumed branch names, until we finally succeed.
        for (let i = restOfUrl.length; i > 0; i--) {
            try {
                const assumedBranchName = restOfUrl.slice(0, i).join('/');
                const clonePromise = execAsync(`git clone ${url} --branch ${assumedBranchName}`, { cwd: gitTempFolder });
                // It turned out that the above command can hang forever for unknown reason. So need to put a timeout.
                yield Promise.race([clonePromise, getGitTimeoutPromise()]);
                branchName = assumedBranchName;
                relativePath = path.join(...restOfUrl.slice(i, restOfUrl.length));
                break;
            }
            catch (_a) {
                continue;
            }
        }
        if (!branchName) {
            // Just doing a normal git clone
            const clonePromise = execAsync(`git clone ${url}`, { cwd: gitTempFolder });
            // It turned out that the above command can hang forever for unknown reason. So need to put a timeout.
            yield Promise.race([clonePromise, getGitTimeoutPromise()]);
        }
        return { gitTempFolder, projectFolder: path.join(gitTempFolder, repoName, relativePath) };
    });
}
exports.cloneFromGitHub = cloneFromGitHub;
// Checks if the given folder looks like a C# function project
function isCSharpProjectAsync(projectFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield fs.promises.readdir(projectFolder)).some(fn => {
            fn = fn.toLowerCase();
            return (fn.endsWith('.csproj') && fn !== 'extensions.csproj');
        });
    });
}
exports.isCSharpProjectAsync = isCSharpProjectAsync;
// Checks if the given folder looks like a F# function project
function isFSharpProjectAsync(projectFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield fs.promises.readdir(projectFolder)).some(fn => {
            fn = fn.toLowerCase();
            return fn.endsWith('.fsproj');
        });
    });
}
exports.isFSharpProjectAsync = isFSharpProjectAsync;
// Checks if the given folder looks like a Java Functions project
function isJavaProjectAsync(projectFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        const javaFileMatch = yield findFileRecursivelyAsync(projectFolder, `.+\\.java$`, false);
        return !!javaFileMatch;
    });
}
exports.isJavaProjectAsync = isJavaProjectAsync;
// fileName can be a regex, pattern should be a regex (which will be searched for in the matching files).
// If returnFileContents == true, returns file content. Otherwise returns full path to the file.
function findFileRecursivelyAsync(folder, fileName, returnFileContents, pattern) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileNameRegex = typeof fileName === 'string' ? new RegExp(fileName, 'i') : fileName;
        const subFolders = [];
        for (const name of yield fs.promises.readdir(folder)) {
            const fullPath = path.join(folder, name);
            const isDirectory = (yield fs.promises.lstat(fullPath)).isDirectory();
            if (!!isDirectory) {
                if (!exports.ExcludedFolders.includes(name.toLowerCase())) {
                    subFolders.push(fullPath);
                }
            }
            else if (!!fileNameRegex.exec(name)) {
                if (!pattern) {
                    return {
                        filePath: fullPath,
                        code: returnFileContents ? (yield fs.promises.readFile(fullPath, { encoding: 'utf8' })) : undefined
                    };
                }
                const code = yield fs.promises.readFile(fullPath, { encoding: 'utf8' });
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
            const result = yield findFileRecursivelyAsync(subFolder, fileNameRegex, returnFileContents, pattern);
            if (!!result) {
                return result;
            }
        }
        return undefined;
    });
}
exports.findFileRecursivelyAsync = findFileRecursivelyAsync;
function findFunctionsRecursivelyAsync(folder, fileNameRegex, functionAttributeRegex, functionNamePosInRegex) {
    return __asyncGenerator(this, arguments, function* findFunctionsRecursivelyAsync_1() {
        var e_1, _a;
        for (const dirEnt of yield __await(fs.promises.readdir(folder, { withFileTypes: true }))) {
            var fullPath = path.join(folder, dirEnt.name);
            if (dirEnt.isDirectory()) {
                if (exports.ExcludedFolders.includes(dirEnt.name.toLowerCase())) {
                    continue;
                }
                try {
                    for (var _b = (e_1 = void 0, __asyncValues(findFunctionsRecursivelyAsync(fullPath, fileNameRegex, functionAttributeRegex, functionNamePosInRegex))), _c; _c = yield __await(_b.next()), !_c.done;) {
                        const file = _c.value;
                        yield yield __await(file);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) yield __await(_a.call(_b));
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            else if (!!fileNameRegex.exec(dirEnt.name)) {
                const code = yield __await(fs.promises.readFile(fullPath, { encoding: 'utf8' }));
                var match;
                while (!!(match = functionAttributeRegex.exec(code))) {
                    let functionName = traverseFunctionProjectUtils_1.cleanupFunctionName(match[functionNamePosInRegex]);
                    const functionAttributeEndPos = match.index + match[0].length;
                    const body = traverseFunctionProjectUtils_1.getCodeInBrackets(code, functionAttributeEndPos, '{', '}', '\n');
                    if (body.openBracketPos >= 0 && !!body.code) {
                        yield yield __await({
                            functionName,
                            filePath: fullPath,
                            pos: match.index,
                            lineNr: traverseFunctionProjectUtils_1.posToLineNr(code, match.index),
                            declarationCode: body.code.substring(0, body.openBracketPos),
                            bodyCode: body.code.substring(body.openBracketPos)
                        });
                    }
                    else {
                        // Returning the rest of the file
                        yield yield __await({
                            functionName,
                            filePath: fullPath,
                            pos: match.index,
                            lineNr: traverseFunctionProjectUtils_1.posToLineNr(code, match.index),
                            declarationCode: code.substring(functionAttributeEndPos),
                            bodyCode: code.substring(functionAttributeEndPos)
                        });
                        break;
                    }
                }
            }
        }
    });
}
exports.findFunctionsRecursivelyAsync = findFunctionsRecursivelyAsync;
//# sourceMappingURL=fileSystemUtils.js.map