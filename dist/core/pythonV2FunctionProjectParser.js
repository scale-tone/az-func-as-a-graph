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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PythonV2FunctionProjectParser = void 0;
const traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
const functionProjectCodeParser_1 = require("./functionProjectCodeParser");
class PythonV2FunctionProjectParser extends functionProjectCodeParser_1.FunctionProjectCodeParser {
    getFunctionsAndTheirCodesAsync(functionNames, hostJsonFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = functionNames.map((name) => __awaiter(this, void 0, void 0, function* () {
                const match = yield this._fileSystemWrapper.findFileRecursivelyAsync(hostJsonFolder, '.+\\.py$', true, this.getFunctionStartRegex(name));
                if (!match) {
                    return undefined;
                }
                const { declarationCode, bodyCode } = this.getFunctionCode(match.code, match.pos);
                const pos = !match.pos ? 0 : match.pos;
                const lineNr = traverseFunctionProjectUtils_1.posToLineNr(match.code, pos);
                return { name, code: bodyCode, filePath: match.filePath, pos, lineNr };
            }));
            return (yield Promise.all(promises)).filter(f => !!f);
        });
    }
    traverseProjectCode(projectFolder) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            const result = {};
            try {
                for (var _b = __asyncValues(this.findFunctionsRecursivelyAsync(projectFolder)), _c; _c = yield _b.next(), !_c.done;) {
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
    findFunctionsRecursivelyAsync(folder) {
        return __asyncGenerator(this, arguments, function* findFunctionsRecursivelyAsync_1() {
            var e_2, _a;
            const fileNameRegex = new RegExp('.+\\.py$', 'i');
            const functionAttributeRegex = this.getFunctionAttributeRegex();
            const functionNameRegex = new RegExp(`\\.\\s*function_name\\s*\\(\\s*name\\s*=\\s*["']([\\w-]+)["']`);
            try {
                for (var _b = __asyncValues(this._fileSystemWrapper.findFilesRecursivelyAsync(folder, fileNameRegex)), _c; _c = yield __await(_b.next()), !_c.done;) {
                    const fullPath = _c.value;
                    const code = yield __await(this._fileSystemWrapper.readFile(fullPath));
                    let match;
                    while (!!(match = functionAttributeRegex.regex.exec(code))) {
                        let functionName = match[functionAttributeRegex.pos];
                        let { declarationCode, bodyCode } = this.getFunctionCode(code, match.index);
                        const functionNameMatch = functionNameRegex.exec(declarationCode);
                        if (!!functionNameMatch) {
                            functionName = functionNameMatch[1];
                            // Need to remove this line so that it does not appear as binding
                            declarationCode = declarationCode.replace('function_name', '');
                        }
                        yield yield __await({
                            functionName,
                            filePath: fullPath,
                            pos: match.index,
                            lineNr: traverseFunctionProjectUtils_1.posToLineNr(code, match.index),
                            declarationCode,
                            bodyCode
                        });
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield __await(_a.call(_b));
                }
                finally { if (e_2) throw e_2.error; }
            }
        });
    }
    getFunctionCode(code, endPos) {
        let declarationCode = '';
        let bodyCode = '';
        const defRegex = new RegExp('^(async)?\\s*def ', 'gm');
        const nextMethodRegex = new RegExp('^[^\\s]', 'gm');
        defRegex.lastIndex = endPos;
        const defMatch = defRegex.exec(code);
        if (!!defMatch) {
            declarationCode = code.substring(endPos, defMatch.index);
            endPos = defMatch.index + defMatch[0].length;
            nextMethodRegex.lastIndex = endPos;
            const nextMethodMatch = nextMethodRegex.exec(code);
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
        return { declarationCode, bodyCode };
    }
    getFunctionAttributeRegex() {
        return {
            regex: new RegExp(`@[\\w\\s]+\\.\\s*(function_name|route|blob_trigger|cosmos_db_trigger|event_hub_message_trigger|queue_trigger|service_bus_queue_trigger|service_bus_topic_trigger|orchestration_trigger|activity_trigger|schedule)(.|\r|\n)+?def\\s+([\\w-]+)`, 'g'),
            pos: 3
        };
    }
    getFunctionStartRegex(funcName) {
        return new RegExp(`(@[\\w\\s]+\\.\\s*function_name\\s*\\(\\s*name\\s*=\\s*["']${funcName}["']|^(async)?\\s*def\\s+${funcName})`, 'm');
    }
    getBindingAttributeRegex() {
        return {
            regex: new RegExp(`@[\\w\\s]+\\.\\s*(\\w+)\\s*\\(`, 'g'),
            pos: 1
        };
    }
    getStartNewOrchestrationRegex(orchName) {
        return new RegExp(`\\.\\s*start_new\\s*\\(\\s*["']${orchName}["']`);
    }
}
exports.PythonV2FunctionProjectParser = PythonV2FunctionProjectParser;
//# sourceMappingURL=pythonV2FunctionProjectParser.js.map