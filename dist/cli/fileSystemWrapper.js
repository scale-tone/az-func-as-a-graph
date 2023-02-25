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
exports.FileSystemWrapper = void 0;
const fs = require("fs");
const path = require("path");
const util = require("util");
const child_process_1 = require("child_process");
const traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
const execAsync = util.promisify(child_process_1.exec);
const ExcludedFolders = ['node_modules', 'obj', '.vs', '.vscode', '.env', '.python_packages', '.git', '.github'];
class FileSystemWrapper {
    readFunctionsJson(hostJsonFolder, log) {
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
    readProxiesJson(projectFolder, log) {
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
                if (yield this.isCSharpProjectAsync(projectFolder)) {
                    // Also checking that proxies.json is added to .csproj file
                    const csProjFile = yield this.findFileRecursivelyAsync(projectFolder, '.+\\.csproj$', true);
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
    isCSharpProjectAsync(projectFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield fs.promises.readdir(projectFolder)).some(fn => {
                fn = fn.toLowerCase();
                return (fn.endsWith('.csproj') && fn !== 'extensions.csproj');
            });
        });
    }
    isFSharpProjectAsync(projectFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield fs.promises.readdir(projectFolder)).some(fn => {
                fn = fn.toLowerCase();
                return fn.endsWith('.fsproj');
            });
        });
    }
    isJavaProjectAsync(projectFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            const javaFileMatch = yield this.findFileRecursivelyAsync(projectFolder, `.+\\.java$`, false);
            return !!javaFileMatch;
        });
    }
    findFileRecursivelyAsync(folder, fileName, returnFileContents, pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileNameRegex = typeof fileName === 'string' ? new RegExp(fileName, 'i') : fileName;
            const subFolders = [];
            for (const name of yield fs.promises.readdir(folder)) {
                const fullPath = path.join(folder, name);
                const isDirectory = (yield fs.promises.lstat(fullPath)).isDirectory();
                if (!!isDirectory) {
                    if (!ExcludedFolders.includes(name.toLowerCase())) {
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
                const result = yield this.findFileRecursivelyAsync(subFolder, fileNameRegex, returnFileContents, pattern);
                if (!!result) {
                    return result;
                }
            }
            return undefined;
        });
    }
    findFunctionsRecursivelyAsync(folder, fileNameRegex, functionAttributeRegex, functionNamePosInRegex) {
        return __asyncGenerator(this, arguments, function* findFunctionsRecursivelyAsync_1() {
            var e_1, _a;
            for (const dirEnt of yield __await(fs.promises.readdir(folder, { withFileTypes: true }))) {
                var fullPath = path.join(folder, dirEnt.name);
                if (dirEnt.isDirectory()) {
                    if (ExcludedFolders.includes(dirEnt.name.toLowerCase())) {
                        continue;
                    }
                    try {
                        for (var _b = (e_1 = void 0, __asyncValues(this.findFunctionsRecursivelyAsync(fullPath, fileNameRegex, functionAttributeRegex, functionNamePosInRegex))), _c; _c = yield __await(_b.next()), !_c.done;) {
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
}
exports.FileSystemWrapper = FileSystemWrapper;
//# sourceMappingURL=fileSystemWrapper.js.map