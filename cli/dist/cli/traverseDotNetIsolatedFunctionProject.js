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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.traverseDotNetIsolatedProject = void 0;
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
// Tries to parse code of a .NET Isolated function and extract bindings from there
function traverseDotNetIsolatedProject(projectFolder) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function () {
        var result, _b, _c, func, bindings, outputBindings, e_1_1;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    result = {};
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 7, 8, 13]);
                    _b = __asyncValues(findFunctionsRecursivelyAsync(projectFolder));
                    _d.label = 2;
                case 2: return [4 /*yield*/, _b.next()];
                case 3:
                    if (!(_c = _d.sent(), !_c.done)) return [3 /*break*/, 6];
                    func = _c.value;
                    bindings = traverseFunctionProjectUtils_1.DotNetBindingsParser.tryExtractBindings(func.declarationCode);
                    return [4 /*yield*/, extractOutputBindings(projectFolder, func.declarationCode)];
                case 4:
                    outputBindings = _d.sent();
                    result[func.functionName] = {
                        filePath: func.filePath,
                        pos: func.pos,
                        lineNr: func.lineNr,
                        bindings: __spreadArrays(bindings, outputBindings)
                    };
                    _d.label = 5;
                case 5: return [3 /*break*/, 2];
                case 6: return [3 /*break*/, 13];
                case 7:
                    e_1_1 = _d.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 13];
                case 8:
                    _d.trys.push([8, , 11, 12]);
                    if (!(_c && !_c.done && (_a = _b.return))) return [3 /*break*/, 10];
                    return [4 /*yield*/, _a.call(_b)];
                case 9:
                    _d.sent();
                    _d.label = 10;
                case 10: return [3 /*break*/, 12];
                case 11:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 12: return [7 /*endfinally*/];
                case 13: return [2 /*return*/, result];
            }
        });
    });
}
exports.traverseDotNetIsolatedProject = traverseDotNetIsolatedProject;
function extractOutputBindings(projectFolder, functionCode) {
    return __awaiter(this, void 0, void 0, function () {
        var returnTypeMatch, returnTypeName, returnTypeDefinition, classBody;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    returnTypeMatch = traverseFunctionProjectUtils_1.DotNetBindingsParser.functionReturnTypeRegex.exec(functionCode);
                    if (!returnTypeMatch) {
                        return [2 /*return*/, []];
                    }
                    returnTypeName = removeNamespace(returnTypeMatch[3]);
                    if (!returnTypeName) {
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, traverseFunctionProjectUtils_1.findFileRecursivelyAsync(projectFolder, '.+\\.cs$', true, traverseFunctionProjectUtils_1.TraversalRegexes.getClassDefinitionRegex(returnTypeName))];
                case 1:
                    returnTypeDefinition = _a.sent();
                    if (!returnTypeDefinition) {
                        return [2 /*return*/, []];
                    }
                    classBody = traverseFunctionProjectUtils_1.getCodeInBrackets(returnTypeDefinition.code, returnTypeDefinition.pos + returnTypeDefinition.length, '{', '}');
                    if (!classBody.code) {
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/, traverseFunctionProjectUtils_1.DotNetBindingsParser.tryExtractBindings(classBody.code)];
            }
        });
    });
}
function findFunctionsRecursivelyAsync(folder) {
    return __asyncGenerator(this, arguments, function findFunctionsRecursivelyAsync_1() {
        var _i, _a, dirEnt, fullPath, _b, _c, file, e_2_1, code, match, functionName, body;
        var e_2, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _i = 0;
                    return [4 /*yield*/, __await(fs.promises.readdir(folder, { withFileTypes: true }))];
                case 1:
                    _a = _e.sent();
                    _e.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 24];
                    dirEnt = _a[_i];
                    fullPath = path.join(folder, dirEnt.name);
                    if (!dirEnt.isDirectory()) return [3 /*break*/, 17];
                    if (traverseFunctionProjectUtils_1.ExcludedFolders.includes(dirEnt.name.toLowerCase())) {
                        return [3 /*break*/, 23];
                    }
                    _e.label = 3;
                case 3:
                    _e.trys.push([3, 10, 11, 16]);
                    _b = (e_2 = void 0, __asyncValues(findFunctionsRecursivelyAsync(fullPath)));
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
                    e_2_1 = _e.sent();
                    e_2 = { error: e_2_1 };
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
                    if (e_2) throw e_2.error;
                    return [7 /*endfinally*/];
                case 15: return [7 /*endfinally*/];
                case 16: return [3 /*break*/, 23];
                case 17:
                    if (!!!traverseFunctionProjectUtils_1.TraversalRegexes.cSharpFileNameRegex.exec(dirEnt.name)) return [3 /*break*/, 23];
                    return [4 /*yield*/, __await(fs.promises.readFile(fullPath, { encoding: 'utf8' }))];
                case 18:
                    code = _e.sent();
                    _e.label = 19;
                case 19:
                    if (!!!(match = traverseFunctionProjectUtils_1.DotNetBindingsParser.functionAttributeRegex.exec(code))) return [3 /*break*/, 23];
                    functionName = removeNamespace(match[3]);
                    body = traverseFunctionProjectUtils_1.getCodeInBrackets(code, match.index + match[0].length, '{', '}', ' \n');
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
                    _e.label = 22;
                case 22: return [3 /*break*/, 19];
                case 23:
                    _i++;
                    return [3 /*break*/, 2];
                case 24: return [2 /*return*/];
            }
        });
    });
}
function removeNamespace(name) {
    if (!name) {
        return name;
    }
    var dotPos = name.lastIndexOf('.');
    return dotPos >= 0 ? name.substring(dotPos + 1) : name;
}
