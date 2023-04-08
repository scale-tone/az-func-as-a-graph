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
exports.JavaFunctionProjectParser = void 0;
const traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
const functionProjectCodeParser_1 = require("./functionProjectCodeParser");
class JavaFunctionProjectParser extends functionProjectCodeParser_1.FunctionProjectCodeParser {
    getFunctionsAndTheirCodesAsync(functionNames, hostJsonFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = functionNames.map((name) => __awaiter(this, void 0, void 0, function* () {
                const match = yield this._fileSystemWrapper.findFileRecursivelyAsync(hostJsonFolder, '.+\\.java$', true, this.getFunctionStartRegex(name));
                if (!match) {
                    return undefined;
                }
                const code = traverseFunctionProjectUtils_1.getCodeInBrackets(match.code, match.pos + match.length, '{', '}', '\n').code;
                const pos = !match.pos ? 0 : match.pos;
                const lineNr = traverseFunctionProjectUtils_1.posToLineNr(match.code, pos);
                return { name, code, filePath: match.filePath, pos, lineNr };
            }));
            return (yield Promise.all(promises)).filter(f => !!f);
        });
    }
    traverseProjectCode(projectFolder) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            const result = {};
            try {
                for (var _b = __asyncValues(this._fileSystemWrapper.findFunctionsRecursivelyAsync(projectFolder, new RegExp('.+\\.java$', 'i'), this.getFunctionAttributeRegex())), _c; _c = yield _b.next(), !_c.done;) {
                    const func = _c.value;
                    const bindings = this.tryExtractBindings(func.declarationCode);
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
    getFunctionAttributeRegex() {
        return {
            regex: new RegExp(`@\\s*FunctionName\\s*\\((["\\w\\s\\.\\(\\)-]+)\\)`, 'g'),
            pos: 1
        };
    }
}
exports.JavaFunctionProjectParser = JavaFunctionProjectParser;
//# sourceMappingURL=javaFunctionProjectParser.js.map