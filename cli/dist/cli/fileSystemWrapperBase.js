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
exports.FileSystemWrapperBase = void 0;
var fileSystem = __importStar(require("fs"));
var path = __importStar(require("path"));
var traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
var ExcludedFolders = ['node_modules', 'obj', '.vs', '.vscode', '.env', '.python_packages', '.git', '.github'];
var FileSystemWrapperBase = /** @class */ (function () {
    function FileSystemWrapperBase() {
    }
    FileSystemWrapperBase.prototype.readFunctionsJson = function (hostJsonFolder, log) {
        return __awaiter(this, void 0, void 0, function () {
            var functions, promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        functions = {};
                        return [4 /*yield*/, this.readDir(hostJsonFolder)];
                    case 1:
                        promises = (_a.sent()).map(function (functionName) { return __awaiter(_this, void 0, void 0, function () {
                            var fullPath, functionJsonFilePath, isDirectory, functionJsonExists, functionJsonString, functionJson, err_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        fullPath = path.join(hostJsonFolder, functionName);
                                        functionJsonFilePath = path.join(fullPath, 'function.json');
                                        return [4 /*yield*/, this.isDirectory(fullPath)];
                                    case 1:
                                        isDirectory = _a.sent();
                                        functionJsonExists = this.pathExists(functionJsonFilePath);
                                        if (!(isDirectory && functionJsonExists)) return [3 /*break*/, 5];
                                        _a.label = 2;
                                    case 2:
                                        _a.trys.push([2, 4, , 5]);
                                        return [4 /*yield*/, this.readFile(functionJsonFilePath)];
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
    };
    FileSystemWrapperBase.prototype.readProxiesJson = function (projectFolder, log) {
        return __awaiter(this, void 0, void 0, function () {
            var proxiesJsonPath, proxiesJsonString, proxies, notAddedToCsProjFile, csProjFile, proxiesJsonEntryRegex, proxyName, proxy, proxyNameRegex, match, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        proxiesJsonPath = path.join(projectFolder, 'proxies.json');
                        if (!this.pathExists(proxiesJsonPath)) {
                            return [2 /*return*/, {}];
                        }
                        return [4 /*yield*/, this.readFile(proxiesJsonPath)];
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
                        return [4 /*yield*/, this.isCSharpProjectAsync(projectFolder)];
                    case 3:
                        if (!_a.sent()) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.findFileRecursivelyAsync(projectFolder, '.+\\.csproj$', true)];
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
    };
    FileSystemWrapperBase.prototype.isCSharpProjectAsync = function (projectFolder) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.readDir(projectFolder)];
                    case 1: return [2 /*return*/, (_a.sent()).some(function (fn) {
                            fn = fn.toLowerCase();
                            return (fn.endsWith('.csproj') && fn !== 'extensions.csproj');
                        })];
                }
            });
        });
    };
    FileSystemWrapperBase.prototype.isFSharpProjectAsync = function (projectFolder) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.readDir(projectFolder)];
                    case 1: return [2 /*return*/, (_a.sent()).some(function (fn) {
                            fn = fn.toLowerCase();
                            return fn.endsWith('.fsproj');
                        })];
                }
            });
        });
    };
    FileSystemWrapperBase.prototype.isJavaProjectAsync = function (projectFolder) {
        return __awaiter(this, void 0, void 0, function () {
            var javaFileMatch;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findFileRecursivelyAsync(projectFolder, ".+\\.java$", false)];
                    case 1:
                        javaFileMatch = _a.sent();
                        return [2 /*return*/, !!javaFileMatch];
                }
            });
        });
    };
    FileSystemWrapperBase.prototype.findFileRecursivelyAsync = function (folder, fileName, returnFileContents, pattern) {
        return __awaiter(this, void 0, void 0, function () {
            var fileNameRegex, subFolders, _i, _a, name_1, fullPath, isDirectory, _b, _c, code, match, _d, subFolders_1, subFolder, result;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        fileNameRegex = typeof fileName === 'string' ? new RegExp(fileName, 'i') : fileName;
                        subFolders = [];
                        _i = 0;
                        return [4 /*yield*/, this.readDir(folder)];
                    case 1:
                        _a = _e.sent();
                        _e.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 11];
                        name_1 = _a[_i];
                        fullPath = path.join(folder, name_1);
                        return [4 /*yield*/, this.isDirectory(fullPath)];
                    case 3:
                        isDirectory = _e.sent();
                        if (!!!isDirectory) return [3 /*break*/, 4];
                        if (!ExcludedFolders.includes(name_1.toLowerCase())) {
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
                        return [4 /*yield*/, this.readFile(fullPath)];
                    case 5:
                        _c = (_e.sent());
                        return [3 /*break*/, 7];
                    case 6:
                        _c = undefined;
                        _e.label = 7;
                    case 7: return [2 /*return*/, (_b.code = _c,
                            _b)];
                    case 8: return [4 /*yield*/, this.readFile(fullPath)];
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
                        return [4 /*yield*/, this.findFileRecursivelyAsync(subFolder, fileNameRegex, returnFileContents, pattern)];
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
    };
    FileSystemWrapperBase.prototype.findFunctionsRecursivelyAsync = function (folder, fileNameRegex, functionAttributeRegex, functionNamePosInRegex) {
        return __asyncGenerator(this, arguments, function findFunctionsRecursivelyAsync_1() {
            var _i, _a, name_2, fullPath, isDirectory, _b, _c, file, e_1_1, code, match, functionName, functionAttributeEndPos, body;
            var e_1, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _i = 0;
                        return [4 /*yield*/, __await(fileSystem.promises.readdir(folder))];
                    case 1:
                        _a = _e.sent();
                        _e.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 28];
                        name_2 = _a[_i];
                        fullPath = path.join(folder, name_2);
                        return [4 /*yield*/, __await(this.isDirectory(fullPath))];
                    case 3:
                        isDirectory = _e.sent();
                        if (!!!isDirectory) return [3 /*break*/, 18];
                        if (ExcludedFolders.includes(name_2.toLowerCase())) {
                            return [3 /*break*/, 27];
                        }
                        _e.label = 4;
                    case 4:
                        _e.trys.push([4, 11, 12, 17]);
                        _b = (e_1 = void 0, __asyncValues(this.findFunctionsRecursivelyAsync(fullPath, fileNameRegex, functionAttributeRegex, functionNamePosInRegex)));
                        _e.label = 5;
                    case 5: return [4 /*yield*/, __await(_b.next())];
                    case 6:
                        if (!(_c = _e.sent(), !_c.done)) return [3 /*break*/, 10];
                        file = _c.value;
                        return [4 /*yield*/, __await(file)];
                    case 7: return [4 /*yield*/, _e.sent()];
                    case 8:
                        _e.sent();
                        _e.label = 9;
                    case 9: return [3 /*break*/, 5];
                    case 10: return [3 /*break*/, 17];
                    case 11:
                        e_1_1 = _e.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 17];
                    case 12:
                        _e.trys.push([12, , 15, 16]);
                        if (!(_c && !_c.done && (_d = _b.return))) return [3 /*break*/, 14];
                        return [4 /*yield*/, __await(_d.call(_b))];
                    case 13:
                        _e.sent();
                        _e.label = 14;
                    case 14: return [3 /*break*/, 16];
                    case 15:
                        if (e_1) throw e_1.error;
                        return [7 /*endfinally*/];
                    case 16: return [7 /*endfinally*/];
                    case 17: return [3 /*break*/, 27];
                    case 18:
                        if (!!!fileNameRegex.exec(name_2)) return [3 /*break*/, 27];
                        return [4 /*yield*/, __await(fileSystem.promises.readFile(fullPath, { encoding: 'utf8' }))];
                    case 19:
                        code = _e.sent();
                        _e.label = 20;
                    case 20:
                        if (!!!(match = functionAttributeRegex.exec(code))) return [3 /*break*/, 27];
                        functionName = traverseFunctionProjectUtils_1.cleanupFunctionName(match[functionNamePosInRegex]);
                        functionAttributeEndPos = match.index + match[0].length;
                        body = traverseFunctionProjectUtils_1.getCodeInBrackets(code, functionAttributeEndPos, '{', '}', '\n');
                        if (!(body.openBracketPos >= 0 && !!body.code)) return [3 /*break*/, 23];
                        return [4 /*yield*/, __await({
                                functionName: functionName,
                                filePath: fullPath,
                                pos: match.index,
                                lineNr: traverseFunctionProjectUtils_1.posToLineNr(code, match.index),
                                declarationCode: body.code.substring(0, body.openBracketPos),
                                bodyCode: body.code.substring(body.openBracketPos)
                            })];
                    case 21: return [4 /*yield*/, _e.sent()];
                    case 22:
                        _e.sent();
                        return [3 /*break*/, 26];
                    case 23: return [4 /*yield*/, __await({
                            functionName: functionName,
                            filePath: fullPath,
                            pos: match.index,
                            lineNr: traverseFunctionProjectUtils_1.posToLineNr(code, match.index),
                            declarationCode: code.substring(functionAttributeEndPos),
                            bodyCode: code.substring(functionAttributeEndPos)
                        })];
                    case 24: 
                    // Returning the rest of the file
                    return [4 /*yield*/, _e.sent()];
                    case 25:
                        // Returning the rest of the file
                        _e.sent();
                        return [3 /*break*/, 27];
                    case 26: return [3 /*break*/, 20];
                    case 27:
                        _i++;
                        return [3 /*break*/, 2];
                    case 28: return [2 /*return*/];
                }
            });
        });
    };
    return FileSystemWrapperBase;
}());
exports.FileSystemWrapperBase = FileSystemWrapperBase;
