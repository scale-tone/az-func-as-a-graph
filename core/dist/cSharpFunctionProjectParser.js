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
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSharpFunctionProjectParser = void 0;
var traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
var functionProjectCodeParser_1 = require("./functionProjectCodeParser");
var CSharpFunctionProjectParser = /** @class */ (function (_super) {
    __extends(CSharpFunctionProjectParser, _super);
    function CSharpFunctionProjectParser() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CSharpFunctionProjectParser.prototype.getFunctionsAndTheirCodesAsync = function (functionNames, hostJsonFolder) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = functionNames.map(function (name) { return __awaiter(_this, void 0, void 0, function () {
                            var match, pos, lineNr, code;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this._fileSystemWrapper.findFileRecursivelyAsync(hostJsonFolder, '.+\\.cs$', true, this.getFunctionStartRegex(name))];
                                    case 1:
                                        match = _a.sent();
                                        if (!match) {
                                            return [2 /*return*/, undefined];
                                        }
                                        pos = !match.pos ? 0 : match.pos;
                                        lineNr = traverseFunctionProjectUtils_1.posToLineNr(match.code, pos);
                                        code = traverseFunctionProjectUtils_1.getCodeInBrackets(match.code, match.pos + match.length, '{', '}', '\n').code;
                                        return [2 /*return*/, { name: name, code: code, filePath: match.filePath, pos: pos, lineNr: lineNr }];
                                }
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1: return [2 /*return*/, (_a.sent()).filter(function (f) { return !!f; })];
                }
            });
        });
    };
    CSharpFunctionProjectParser.prototype.traverseProjectCode = function (projectFolder) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function () {
            var result, fileNameRegex, _b, _c, func, bindings, _d, _e, _f, e_1_1;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        result = {};
                        fileNameRegex = new RegExp('.+\\.cs$', 'i');
                        _g.label = 1;
                    case 1:
                        _g.trys.push([1, 8, 9, 14]);
                        _b = __asyncValues(this._fileSystemWrapper.findFunctionsRecursivelyAsync(projectFolder, fileNameRegex, this.getFunctionAttributeRegex()));
                        _g.label = 2;
                    case 2: return [4 /*yield*/, _b.next()];
                    case 3:
                        if (!(_c = _g.sent(), !_c.done)) return [3 /*break*/, 7];
                        func = _c.value;
                        bindings = this.tryExtractBindings(func.declarationCode);
                        if (!!(bindings.some(function (b) { return b.type === 'orchestrationTrigger'; }) ||
                            bindings.some(function (b) { return b.type === 'entityTrigger'; }) ||
                            bindings.some(function (b) { return b.type === 'activityTrigger'; }))) return [3 /*break*/, 5];
                        _e = 
                        // Also trying to extract multiple output bindings
                        (_d = bindings.push).apply;
                        _f = [
                            // Also trying to extract multiple output bindings
                            bindings];
                        return [4 /*yield*/, this.extractOutputBindings(projectFolder, func.declarationCode, fileNameRegex)];
                    case 4:
                        // Also trying to extract multiple output bindings
                        _e.apply(_d, _f.concat([_g.sent()]));
                        _g.label = 5;
                    case 5:
                        result[func.functionName] = {
                            filePath: func.filePath,
                            pos: func.pos,
                            lineNr: func.lineNr,
                            bindings: __spreadArray([], bindings)
                        };
                        _g.label = 6;
                    case 6: return [3 /*break*/, 2];
                    case 7: return [3 /*break*/, 14];
                    case 8:
                        e_1_1 = _g.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 14];
                    case 9:
                        _g.trys.push([9, , 12, 13]);
                        if (!(_c && !_c.done && (_a = _b.return))) return [3 /*break*/, 11];
                        return [4 /*yield*/, _a.call(_b)];
                    case 10:
                        _g.sent();
                        _g.label = 11;
                    case 11: return [3 /*break*/, 13];
                    case 12:
                        if (e_1) throw e_1.error;
                        return [7 /*endfinally*/];
                    case 13: return [7 /*endfinally*/];
                    case 14: return [2 /*return*/, result];
                }
            });
        });
    };
    CSharpFunctionProjectParser.prototype.extractOutputBindings = function (projectFolder, functionCode, fileNameRegex) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var returnTypeMatch, returnTypeName, returnTypeDefinition, classBody;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        returnTypeMatch = this.functionReturnTypeRegex.exec(functionCode);
                        if (!returnTypeMatch) {
                            return [2 /*return*/, []];
                        }
                        returnTypeName = traverseFunctionProjectUtils_1.removeNamespace(returnTypeMatch[3]);
                        if (!returnTypeName) {
                            return [2 /*return*/, []];
                        }
                        return [4 /*yield*/, this._fileSystemWrapper.findFileRecursivelyAsync(projectFolder, fileNameRegex, true, this.getClassDefinitionRegex(returnTypeName))];
                    case 1:
                        returnTypeDefinition = _c.sent();
                        if (!returnTypeDefinition) {
                            return [2 /*return*/, []];
                        }
                        classBody = traverseFunctionProjectUtils_1.getCodeInBrackets(returnTypeDefinition.code, ((_a = returnTypeDefinition.pos) !== null && _a !== void 0 ? _a : 0) + ((_b = returnTypeDefinition.length) !== null && _b !== void 0 ? _b : 0), '{', '}');
                        if (!classBody.code) {
                            return [2 /*return*/, []];
                        }
                        return [2 /*return*/, this.tryExtractBindings(classBody.code)];
                }
            });
        });
    };
    return CSharpFunctionProjectParser;
}(functionProjectCodeParser_1.FunctionProjectCodeParser));
exports.CSharpFunctionProjectParser = CSharpFunctionProjectParser;
