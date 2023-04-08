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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSharpFunctionProjectParser = void 0;
const traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
const functionProjectCodeParser_1 = require("./functionProjectCodeParser");
class CSharpFunctionProjectParser extends functionProjectCodeParser_1.FunctionProjectCodeParser {
    getFunctionsAndTheirCodesAsync(functionNames, hostJsonFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = functionNames.map((name) => __awaiter(this, void 0, void 0, function* () {
                const match = yield this._fileSystemWrapper.findFileRecursivelyAsync(hostJsonFolder, '.+\\.cs$', true, this.getFunctionStartRegex(name));
                if (!match) {
                    return undefined;
                }
                const pos = !match.pos ? 0 : match.pos;
                const lineNr = traverseFunctionProjectUtils_1.posToLineNr(match.code, pos);
                const code = traverseFunctionProjectUtils_1.getCodeInBrackets(match.code, match.pos + match.length, '{', '}', '\n').code;
                return { name, code, filePath: match.filePath, pos, lineNr };
            }));
            return (yield Promise.all(promises)).filter(f => !!f);
        });
    }
    traverseProjectCode(projectFolder) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            const result = {};
            const fileNameRegex = new RegExp('.+\\.cs$', 'i');
            try {
                for (var _b = __asyncValues(this._fileSystemWrapper.findFunctionsRecursivelyAsync(projectFolder, fileNameRegex, this.getFunctionAttributeRegex())), _c; _c = yield _b.next(), !_c.done;) {
                    const func = _c.value;
                    const bindings = this.tryExtractBindings(func.declarationCode);
                    if (!(bindings.some(b => b.type === 'orchestrationTrigger') ||
                        bindings.some(b => b.type === 'entityTrigger') ||
                        bindings.some(b => b.type === 'activityTrigger'))) {
                        // Also trying to extract multiple output bindings
                        bindings.push(...yield this.extractOutputBindings(projectFolder, func.declarationCode, fileNameRegex));
                    }
                    result[func.functionName] = {
                        filePath: func.filePath,
                        pos: func.pos,
                        lineNr: func.lineNr,
                        bindings: [...bindings]
                    };
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return result;
        });
    }
    extractOutputBindings(projectFolder, functionCode, fileNameRegex) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const returnTypeMatch = this.functionReturnTypeRegex.exec(functionCode);
            if (!returnTypeMatch) {
                return [];
            }
            const returnTypeName = traverseFunctionProjectUtils_1.removeNamespace(returnTypeMatch[3]);
            if (!returnTypeName) {
                return [];
            }
            const returnTypeDefinition = yield this._fileSystemWrapper.findFileRecursivelyAsync(projectFolder, fileNameRegex, true, this.getClassDefinitionRegex(returnTypeName));
            if (!returnTypeDefinition) {
                return [];
            }
            const classBody = traverseFunctionProjectUtils_1.getCodeInBrackets(returnTypeDefinition.code, ((_a = returnTypeDefinition.pos) !== null && _a !== void 0 ? _a : 0) + ((_b = returnTypeDefinition.length) !== null && _b !== void 0 ? _b : 0), '{', '}');
            if (!classBody.code) {
                return [];
            }
            return this.tryExtractBindings(classBody.code);
        });
    }
}
exports.CSharpFunctionProjectParser = CSharpFunctionProjectParser;
//# sourceMappingURL=cSharpFunctionProjectParser.js.map