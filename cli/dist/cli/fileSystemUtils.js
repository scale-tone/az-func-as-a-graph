"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
var os = __importStar(require("os"));
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var util = __importStar(require("util"));
var child_process_1 = require("child_process");
var traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
var execAsync = util.promisify(child_process_1.exec);
var gitCloneTimeoutInSeconds = 60;
exports.ExcludedFolders = ['node_modules', 'obj', '.vs', '.vscode', '.env', '.python_packages', '.git', '.github'];
function readFunctionsJson(hostJsonFolder, log) {
    return __awaiter(this, void 0, void 0, function () {
        var functions, promises;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    functions = {};
                    return [4 /*yield*/, fs.promises.readdir(hostJsonFolder)];
                case 1:
                    promises = (_a.sent()).map(function (functionName) { return __awaiter(_this, void 0, void 0, function () {
                        var fullPath, functionJsonFilePath, isDirectory, functionJsonExists, functionJsonString, functionJson, err_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    fullPath = path.join(hostJsonFolder, functionName);
                                    functionJsonFilePath = path.join(fullPath, 'function.json');
                                    return [4 /*yield*/, fs.promises.lstat(fullPath)];
                                case 1:
                                    isDirectory = (_a.sent()).isDirectory();
                                    functionJsonExists = fs.existsSync(functionJsonFilePath);
                                    if (!(isDirectory && functionJsonExists)) return [3 /*break*/, 5];
                                    _a.label = 2;
                                case 2:
                                    _a.trys.push([2, 4, , 5]);
                                    return [4 /*yield*/, fs.promises.readFile(functionJsonFilePath, { encoding: 'utf8' })];
                                case 3:
                                    functionJsonString = _a.sent();
                                    functionJson = JSON.parse(functionJsonString);
                                    functions[functionName] = { bindings: functionJson.bindings, isCalledBy: [], isSignalledBy: [] };
                                    return [3 /*break*/, 5];
                                case 4:
                                    err_1 = _a.sent();
                                    log(">>> Failed to parse " + functionJsonFilePath + ": " + err_1);
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(promises)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, functions];
            }
        });
    });
}
exports.readFunctionsJson = readFunctionsJson;
// Tries to read proxies.json file from project folder
function readProxiesJson(projectFolder, log) {
    return __awaiter(this, void 0, void 0, function () {
        var proxiesJsonPath, proxiesJsonString, proxies, notAddedToCsProjFile, csProjFile, proxiesJsonEntryRegex, proxyName, proxy, proxyNameRegex, match, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    proxiesJsonPath = path.join(projectFolder, 'proxies.json');
                    if (!fs.existsSync(proxiesJsonPath)) {
                        return [2 /*return*/, {}];
                    }
                    return [4 /*yield*/, fs.promises.readFile(proxiesJsonPath, { encoding: 'utf8' })];
                case 1:
                    proxiesJsonString = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 6, , 7]);
                    proxies = JSON.parse(proxiesJsonString).proxies;
                    if (!proxies) {
                        return [2 /*return*/, {}];
                    }
                    notAddedToCsProjFile = false;
                    return [4 /*yield*/, isCSharpProjectAsync(projectFolder)];
                case 3:
                    if (!_a.sent()) return [3 /*break*/, 5];
                    return [4 /*yield*/, findFileRecursivelyAsync(projectFolder, '.+\\.csproj$', true)];
                case 4:
                    csProjFile = _a.sent();
                    proxiesJsonEntryRegex = new RegExp("\\s*=\\s*\"proxies.json\"\\s*>");
                    if (!!csProjFile && csProjFile.code && (!proxiesJsonEntryRegex.exec(csProjFile.code))) {
                        notAddedToCsProjFile = true;
                    }
                    _a.label = 5;
                case 5:
                    // Also adding filePath and lineNr
                    for (proxyName in proxies) {
                        proxy = proxies[proxyName];
                        proxy.filePath = proxiesJsonPath;
                        if (notAddedToCsProjFile) {
                            proxy.warningNotAddedToCsProjFile = true;
                        }
                        proxyNameRegex = new RegExp("\"" + proxyName + "\"\\s*:");
                        match = proxyNameRegex.exec(proxiesJsonString);
                        if (!!match) {
                            proxy.pos = match.index;
                            proxy.lineNr = traverseFunctionProjectUtils_1.posToLineNr(proxiesJsonString, proxy.pos);
                        }
                    }
                    return [2 /*return*/, proxies];
                case 6:
                    err_2 = _a.sent();
                    log(">>> Failed to parse " + proxiesJsonPath + ": " + err_2);
                    return [2 /*return*/, {}];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.readProxiesJson = readProxiesJson;
// Does a git clone into a temp folder and returns info about that cloned code
function cloneFromGitHub(url) {
    return __awaiter(this, void 0, void 0, function () {
        var repoName, branchName, relativePath, gitTempFolder, restOfUrl, match, orgUrl, getGitTimeoutPromise, i, assumedBranchName, clonePromise, _a, clonePromise;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    repoName = '', branchName = '', relativePath = '', gitTempFolder = '';
                    restOfUrl = [];
                    match = /(https:\/\/github.com\/.*?)\/([^\/]+)(\/tree\/)?(.*)/i.exec(url);
                    if (!match || match.length < 5) {
                        // expecting repo name to be the last segment of remote origin URL
                        repoName = url.substr(url.lastIndexOf('/') + 1);
                    }
                    else {
                        orgUrl = match[1];
                        repoName = match[2];
                        if (repoName.toLowerCase().endsWith('.git')) {
                            repoName = repoName.substr(0, repoName.length - 4);
                        }
                        url = orgUrl + "/" + repoName + ".git";
                        if (!!match[4]) {
                            restOfUrl = match[4].split('/').filter(function (s) { return !!s; });
                        }
                    }
                    return [4 /*yield*/, fs.promises.mkdtemp(path.join(os.tmpdir(), 'git-clone-'))];
                case 1:
                    gitTempFolder = _b.sent();
                    getGitTimeoutPromise = function () {
                        return new Promise(function (resolve, reject) { return setTimeout(function () { return reject(new Error("git clone timed out after " + gitCloneTimeoutInSeconds + " sec.")); }, gitCloneTimeoutInSeconds * 1000); });
                    };
                    i = restOfUrl.length;
                    _b.label = 2;
                case 2:
                    if (!(i > 0)) return [3 /*break*/, 7];
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 5, , 6]);
                    assumedBranchName = restOfUrl.slice(0, i).join('/');
                    clonePromise = execAsync("git clone " + url + " --branch " + assumedBranchName, { cwd: gitTempFolder });
                    // It turned out that the above command can hang forever for unknown reason. So need to put a timeout.
                    return [4 /*yield*/, Promise.race([clonePromise, getGitTimeoutPromise()])];
                case 4:
                    // It turned out that the above command can hang forever for unknown reason. So need to put a timeout.
                    _b.sent();
                    branchName = assumedBranchName;
                    relativePath = path.join.apply(path, restOfUrl.slice(i, restOfUrl.length));
                    return [3 /*break*/, 7];
                case 5:
                    _a = _b.sent();
                    return [3 /*break*/, 6];
                case 6:
                    i--;
                    return [3 /*break*/, 2];
                case 7:
                    if (!!branchName) return [3 /*break*/, 9];
                    clonePromise = execAsync("git clone " + url, { cwd: gitTempFolder });
                    // It turned out that the above command can hang forever for unknown reason. So need to put a timeout.
                    return [4 /*yield*/, Promise.race([clonePromise, getGitTimeoutPromise()])];
                case 8:
                    // It turned out that the above command can hang forever for unknown reason. So need to put a timeout.
                    _b.sent();
                    _b.label = 9;
                case 9: return [2 /*return*/, { gitTempFolder: gitTempFolder, projectFolder: path.join(gitTempFolder, repoName, relativePath) }];
            }
        });
    });
}
exports.cloneFromGitHub = cloneFromGitHub;
// Checks if the given folder looks like a C# function project
function isCSharpProjectAsync(projectFolder) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs.promises.readdir(projectFolder)];
                case 1: return [2 /*return*/, (_a.sent()).some(function (fn) {
                        fn = fn.toLowerCase();
                        return (fn.endsWith('.csproj') && fn !== 'extensions.csproj');
                    })];
            }
        });
    });
}
exports.isCSharpProjectAsync = isCSharpProjectAsync;
// Checks if the given folder looks like a F# function project
function isFSharpProjectAsync(projectFolder) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs.promises.readdir(projectFolder)];
                case 1: return [2 /*return*/, (_a.sent()).some(function (fn) {
                        fn = fn.toLowerCase();
                        return fn.endsWith('.fsproj');
                    })];
            }
        });
    });
}
exports.isFSharpProjectAsync = isFSharpProjectAsync;
// Checks if the given folder looks like a Java Functions project
function isJavaProjectAsync(projectFolder) {
    return __awaiter(this, void 0, void 0, function () {
        var javaFileMatch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, findFileRecursivelyAsync(projectFolder, ".+\\.java$", false)];
                case 1:
                    javaFileMatch = _a.sent();
                    return [2 /*return*/, !!javaFileMatch];
            }
        });
    });
}
exports.isJavaProjectAsync = isJavaProjectAsync;
// fileName can be a regex, pattern should be a regex (which will be searched for in the matching files).
// If returnFileContents == true, returns file content. Otherwise returns full path to the file.
function findFileRecursivelyAsync(folder, fileName, returnFileContents, pattern) {
    return __awaiter(this, void 0, void 0, function () {
        var fileNameRegex, subFolders, _i, _a, name_1, fullPath, isDirectory, _b, _c, code, match, _d, subFolders_1, subFolder, result;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    fileNameRegex = typeof fileName === 'string' ? new RegExp(fileName, 'i') : fileName;
                    subFolders = [];
                    _i = 0;
                    return [4 /*yield*/, fs.promises.readdir(folder)];
                case 1:
                    _a = _e.sent();
                    _e.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 11];
                    name_1 = _a[_i];
                    fullPath = path.join(folder, name_1);
                    return [4 /*yield*/, fs.promises.lstat(fullPath)];
                case 3:
                    isDirectory = (_e.sent()).isDirectory();
                    if (!!!isDirectory) return [3 /*break*/, 4];
                    if (!exports.ExcludedFolders.includes(name_1.toLowerCase())) {
                        subFolders.push(fullPath);
                    }
                    return [3 /*break*/, 10];
                case 4:
                    if (!!!fileNameRegex.exec(name_1)) return [3 /*break*/, 10];
                    if (!!pattern) return [3 /*break*/, 8];
                    _b = {
                        filePath: fullPath
                    };
                    if (!returnFileContents) return [3 /*break*/, 6];
                    return [4 /*yield*/, fs.promises.readFile(fullPath, { encoding: 'utf8' })];
                case 5:
                    _c = (_e.sent());
                    return [3 /*break*/, 7];
                case 6:
                    _c = undefined;
                    _e.label = 7;
                case 7: return [2 /*return*/, (_b.code = _c,
                        _b)];
                case 8: return [4 /*yield*/, fs.promises.readFile(fullPath, { encoding: 'utf8' })];
                case 9:
                    code = _e.sent();
                    match = pattern.exec(code);
                    if (!!match) {
                        return [2 /*return*/, {
                                filePath: fullPath,
                                code: returnFileContents ? code : undefined,
                                pos: match.index,
                                length: match[0].length
                            }];
                    }
                    _e.label = 10;
                case 10:
                    _i++;
                    return [3 /*break*/, 2];
                case 11:
                    _d = 0, subFolders_1 = subFolders;
                    _e.label = 12;
                case 12:
                    if (!(_d < subFolders_1.length)) return [3 /*break*/, 15];
                    subFolder = subFolders_1[_d];
                    return [4 /*yield*/, findFileRecursivelyAsync(subFolder, fileNameRegex, returnFileContents, pattern)];
                case 13:
                    result = _e.sent();
                    if (!!result) {
                        return [2 /*return*/, result];
                    }
                    _e.label = 14;
                case 14:
                    _d++;
                    return [3 /*break*/, 12];
                case 15: return [2 /*return*/, undefined];
            }
        });
    });
}
exports.findFileRecursivelyAsync = findFileRecursivelyAsync;
function findFunctionsRecursivelyAsync(folder, fileNameRegex, functionAttributeRegex, functionNamePosInRegex) {
    return __asyncGenerator(this, arguments, function findFunctionsRecursivelyAsync_1() {
        var _i, _a, dirEnt, fullPath, _b, _c, file, e_1_1, code, match, functionName, functionAttributeEndPos, body;
        var e_1, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _i = 0;
                    return [4 /*yield*/, __await(fs.promises.readdir(folder, { withFileTypes: true }))];
                case 1:
                    _a = _e.sent();
                    _e.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 27];
                    dirEnt = _a[_i];
                    fullPath = path.join(folder, dirEnt.name);
                    if (!dirEnt.isDirectory()) return [3 /*break*/, 17];
                    if (exports.ExcludedFolders.includes(dirEnt.name.toLowerCase())) {
                        return [3 /*break*/, 26];
                    }
                    _e.label = 3;
                case 3:
                    _e.trys.push([3, 10, 11, 16]);
                    _b = (e_1 = void 0, __asyncValues(findFunctionsRecursivelyAsync(fullPath, fileNameRegex, functionAttributeRegex, functionNamePosInRegex)));
                    _e.label = 4;
                case 4: return [4 /*yield*/, __await(_b.next())];
                case 5:
                    if (!(_c = _e.sent(), !_c.done)) return [3 /*break*/, 9];
                    file = _c.value;
                    return [4 /*yield*/, __await(file)];
                case 6: return [4 /*yield*/, _e.sent()];
                case 7:
                    _e.sent();
                    _e.label = 8;
                case 8: return [3 /*break*/, 4];
                case 9: return [3 /*break*/, 16];
                case 10:
                    e_1_1 = _e.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 16];
                case 11:
                    _e.trys.push([11, , 14, 15]);
                    if (!(_c && !_c.done && (_d = _b.return))) return [3 /*break*/, 13];
                    return [4 /*yield*/, __await(_d.call(_b))];
                case 12:
                    _e.sent();
                    _e.label = 13;
                case 13: return [3 /*break*/, 15];
                case 14:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 15: return [7 /*endfinally*/];
                case 16: return [3 /*break*/, 26];
                case 17:
                    if (!!!fileNameRegex.exec(dirEnt.name)) return [3 /*break*/, 26];
                    return [4 /*yield*/, __await(fs.promises.readFile(fullPath, { encoding: 'utf8' }))];
                case 18:
                    code = _e.sent();
                    _e.label = 19;
                case 19:
                    if (!!!(match = functionAttributeRegex.exec(code))) return [3 /*break*/, 26];
                    functionName = traverseFunctionProjectUtils_1.cleanupFunctionName(match[functionNamePosInRegex]);
                    functionAttributeEndPos = match.index + match[0].length;
                    body = traverseFunctionProjectUtils_1.getCodeInBrackets(code, functionAttributeEndPos, '{', '}', '\n');
                    if (!(body.openBracketPos >= 0 && !!body.code)) return [3 /*break*/, 22];
                    return [4 /*yield*/, __await({
                            functionName: functionName,
                            filePath: fullPath,
                            pos: match.index,
                            lineNr: traverseFunctionProjectUtils_1.posToLineNr(code, match.index),
                            declarationCode: body.code.substring(0, body.openBracketPos),
                            bodyCode: body.code.substring(body.openBracketPos)
                        })];
                case 20: return [4 /*yield*/, _e.sent()];
                case 21:
                    _e.sent();
                    return [3 /*break*/, 25];
                case 22: return [4 /*yield*/, __await({
                        functionName: functionName,
                        filePath: fullPath,
                        pos: match.index,
                        lineNr: traverseFunctionProjectUtils_1.posToLineNr(code, match.index),
                        declarationCode: code.substring(functionAttributeEndPos),
                        bodyCode: code.substring(functionAttributeEndPos)
                    })];
                case 23: 
                // Returning the rest of the file
                return [4 /*yield*/, _e.sent()];
                case 24:
                    // Returning the rest of the file
                    _e.sent();
                    return [3 /*break*/, 26];
                case 25: return [3 /*break*/, 19];
                case 26:
                    _i++;
                    return [3 /*break*/, 2];
                case 27: return [2 /*return*/];
            }
        });
    });
}
exports.findFunctionsRecursivelyAsync = findFunctionsRecursivelyAsync;
