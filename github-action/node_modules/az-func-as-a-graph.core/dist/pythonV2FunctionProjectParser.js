"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PythonV2FunctionProjectParser = void 0;
var traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
var functionProjectCodeParser_1 = require("./functionProjectCodeParser");
var PythonV2FunctionProjectParser = /** @class */ (function (_super) {
    __extends(PythonV2FunctionProjectParser, _super);
    function PythonV2FunctionProjectParser() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PythonV2FunctionProjectParser.prototype.getFunctionsAndTheirCodesAsync = function (functionNames, hostJsonFolder) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = functionNames.map(function (name) { return __awaiter(_this, void 0, void 0, function () {
                            var match, _a, declarationCode, bodyCode, pos, lineNr;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, this._fileSystemWrapper.findFileRecursivelyAsync(hostJsonFolder, '.+\\.py$', true, this.getFunctionStartRegex(name))];
                                    case 1:
                                        match = _b.sent();
                                        if (!match) {
                                            return [2 /*return*/, undefined];
                                        }
                                        _a = this.getFunctionCode(match.code, match.pos), declarationCode = _a.declarationCode, bodyCode = _a.bodyCode;
                                        pos = !match.pos ? 0 : match.pos;
                                        lineNr = traverseFunctionProjectUtils_1.posToLineNr(match.code, pos);
                                        return [2 /*return*/, { name: name, code: bodyCode, filePath: match.filePath, pos: pos, lineNr: lineNr }];
                                }
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1: return [2 /*return*/, (_a.sent()).filter(function (f) { return !!f; })];
                }
            });
        });
    };
    PythonV2FunctionProjectParser.prototype.traverseProjectCode = function (projectFolder) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function () {
            var result, _b, _c, func, bindings, e_1_1;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        result = {};
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 12]);
                        _b = __asyncValues(this.findFunctionsRecursivelyAsync(projectFolder));
                        _d.label = 2;
                    case 2: return [4 /*yield*/, _b.next()];
                    case 3:
                        if (!(_c = _d.sent(), !_c.done)) return [3 /*break*/, 5];
                        func = _c.value;
                        bindings = this.tryExtractBindings(func.declarationCode);
                        result[func.functionName] = {
                            filePath: func.filePath,
                            pos: func.pos,
                            lineNr: func.lineNr,
                            bindings: __spreadArray([], bindings)
                        };
                        _d.label = 4;
                    case 4: return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 12];
                    case 6:
                        e_1_1 = _d.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 12];
                    case 7:
                        _d.trys.push([7, , 10, 11]);
                        if (!(_c && !_c.done && (_a = _b.return))) return [3 /*break*/, 9];
                        return [4 /*yield*/, _a.call(_b)];
                    case 8:
                        _d.sent();
                        _d.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        if (e_1) throw e_1.error;
                        return [7 /*endfinally*/];
                    case 11: return [7 /*endfinally*/];
                    case 12: return [2 /*return*/, result];
                }
            });
        });
    };
    PythonV2FunctionProjectParser.prototype.findFunctionsRecursivelyAsync = function (folder) {
        return __asyncGenerator(this, arguments, function findFunctionsRecursivelyAsync_1() {
            var fileNameRegex, functionAttributeRegex, functionNameRegex, _a, _b, fullPath, code, match, functionName, _c, declarationCode, bodyCode, functionNameMatch, e_2_1;
            var e_2, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        fileNameRegex = new RegExp('.+\\.py$', 'i');
                        functionAttributeRegex = this.getFunctionAttributeRegex();
                        functionNameRegex = new RegExp("\\.\\s*function_name\\s*\\(\\s*name\\s*=\\s*[\"']([\\w-]+)[\"']");
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 10, 11, 16]);
                        _a = __asyncValues(this._fileSystemWrapper.findFilesRecursivelyAsync(folder, fileNameRegex));
                        _e.label = 2;
                    case 2: return [4 /*yield*/, __await(_a.next())];
                    case 3:
                        if (!(_b = _e.sent(), !_b.done)) return [3 /*break*/, 9];
                        fullPath = _b.value;
                        return [4 /*yield*/, __await(this._fileSystemWrapper.readFile(fullPath))];
                    case 4:
                        code = _e.sent();
                        match = void 0;
                        _e.label = 5;
                    case 5:
                        if (!!!(match = functionAttributeRegex.regex.exec(code))) return [3 /*break*/, 8];
                        functionName = match[functionAttributeRegex.pos];
                        _c = this.getFunctionCode(code, match.index), declarationCode = _c.declarationCode, bodyCode = _c.bodyCode;
                        functionNameMatch = functionNameRegex.exec(declarationCode);
                        if (!!functionNameMatch) {
                            functionName = functionNameMatch[1];
                            // Need to remove this line so that it does not appear as binding
                            declarationCode = declarationCode.replace('function_name', '');
                        }
                        return [4 /*yield*/, __await({
                                functionName: functionName,
                                filePath: fullPath,
                                pos: match.index,
                                lineNr: traverseFunctionProjectUtils_1.posToLineNr(code, match.index),
                                declarationCode: declarationCode,
                                bodyCode: bodyCode
                            })];
                    case 6: return [4 /*yield*/, _e.sent()];
                    case 7:
                        _e.sent();
                        return [3 /*break*/, 5];
                    case 8: return [3 /*break*/, 2];
                    case 9: return [3 /*break*/, 16];
                    case 10:
                        e_2_1 = _e.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 16];
                    case 11:
                        _e.trys.push([11, , 14, 15]);
                        if (!(_b && !_b.done && (_d = _a.return))) return [3 /*break*/, 13];
                        return [4 /*yield*/, __await(_d.call(_a))];
                    case 12:
                        _e.sent();
                        _e.label = 13;
                    case 13: return [3 /*break*/, 15];
                    case 14:
                        if (e_2) throw e_2.error;
                        return [7 /*endfinally*/];
                    case 15: return [7 /*endfinally*/];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    PythonV2FunctionProjectParser.prototype.getFunctionCode = function (code, endPos) {
        var declarationCode = '';
        var bodyCode = '';
        var defRegex = new RegExp('^(async)?\\s*def ', 'gm');
        var nextMethodRegex = new RegExp('^[^\\s]', 'gm');
        defRegex.lastIndex = endPos;
        var defMatch = defRegex.exec(code);
        if (!!defMatch) {
            declarationCode = code.substring(endPos, defMatch.index);
            endPos = defMatch.index + defMatch[0].length;
            nextMethodRegex.lastIndex = endPos;
            var nextMethodMatch = nextMethodRegex.exec(code);
            if (!!nextMethodMatch) {
                bodyCode = code.substring(endPos, nextMethodMatch.index);
            }
            else {
                bodyCode = code.substring(endPos);
            }
        }
        else {
            declarationCode = code.substring(endPos);
            bodyCode = code.substring(endPos);
        }
        return { declarationCode: declarationCode, bodyCode: bodyCode };
    };
    PythonV2FunctionProjectParser.prototype.getFunctionAttributeRegex = function () {
        return {
            regex: new RegExp("@[\\w\\s]+\\.\\s*(function_name|route|blob_trigger|cosmos_db_trigger|event_hub_message_trigger|queue_trigger|service_bus_queue_trigger|service_bus_topic_trigger|orchestration_trigger|activity_trigger|schedule)(.|\r|\n)+?def\\s+([\\w-]+)", 'g'),
            pos: 3
        };
    };
    PythonV2FunctionProjectParser.prototype.getFunctionStartRegex = function (funcName) {
        return new RegExp("(@[\\w\\s]+\\.\\s*function_name\\s*\\(\\s*name\\s*=\\s*[\"']" + funcName + "[\"']|^(async)?\\s*def\\s+" + funcName + ")", 'm');
    };
    PythonV2FunctionProjectParser.prototype.getBindingAttributeRegex = function () {
        return {
            regex: new RegExp("@[\\w\\s]+\\.\\s*(\\w+)\\s*\\(", 'g'),
            pos: 1
        };
    };
    PythonV2FunctionProjectParser.prototype.getStartNewOrchestrationRegex = function (orchName) {
        return new RegExp("\\.\\s*start_new\\s*\\(\\s*[\"']" + orchName + "[\"']");
    };
    return PythonV2FunctionProjectParser;
}(functionProjectCodeParser_1.FunctionProjectCodeParser));
exports.PythonV2FunctionProjectParser = PythonV2FunctionProjectParser;
