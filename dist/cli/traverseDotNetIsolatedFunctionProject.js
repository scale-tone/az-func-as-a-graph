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
exports.traverseDotNetIsolatedProject = void 0;
const fs = require("fs");
const path = require("path");
const traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
// Tries to parse code of a .NET Isolated function and extract bindings from there
function traverseDotNetIsolatedProject(projectFolder) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        let result = {};
        try {
            for (var _b = __asyncValues(findFunctionsRecursivelyAsync(projectFolder)), _c; _c = yield _b.next(), !_c.done;) {
                const func = _c.value;
                const bindings = traverseFunctionProjectUtils_1.DotNetBindingsParser.tryExtractBindings(func.declarationCode);
                // Also trying to extract multiple output bindings
                const outputBindings = yield extractOutputBindings(projectFolder, func.declarationCode);
                result[func.functionName] = {
                    filePath: func.filePath,
                    pos: func.pos,
                    lineNr: func.lineNr,
                    bindings: [...bindings, ...outputBindings]
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
exports.traverseDotNetIsolatedProject = traverseDotNetIsolatedProject;
function extractOutputBindings(projectFolder, functionCode) {
    return __awaiter(this, void 0, void 0, function* () {
        const returnTypeMatch = traverseFunctionProjectUtils_1.DotNetBindingsParser.functionReturnTypeRegex.exec(functionCode);
        if (!returnTypeMatch) {
            return [];
        }
        const returnTypeName = removeNamespace(returnTypeMatch[3]);
        if (!returnTypeName) {
            return [];
        }
        const returnTypeDefinition = yield traverseFunctionProjectUtils_1.findFileRecursivelyAsync(projectFolder, '.+\\.cs$', true, traverseFunctionProjectUtils_1.TraversalRegexes.getClassDefinitionRegex(returnTypeName));
        if (!returnTypeDefinition) {
            return [];
        }
        const classBody = traverseFunctionProjectUtils_1.getCodeInBrackets(returnTypeDefinition.code, returnTypeDefinition.pos + returnTypeDefinition.length, '{', '}');
        if (!classBody.code) {
            return [];
        }
        return traverseFunctionProjectUtils_1.DotNetBindingsParser.tryExtractBindings(classBody.code);
    });
}
function findFunctionsRecursivelyAsync(folder) {
    return __asyncGenerator(this, arguments, function* findFunctionsRecursivelyAsync_1() {
        var e_2, _a;
        for (const dirEnt of yield __await(fs.promises.readdir(folder, { withFileTypes: true }))) {
            var fullPath = path.join(folder, dirEnt.name);
            if (dirEnt.isDirectory()) {
                if (traverseFunctionProjectUtils_1.ExcludedFolders.includes(dirEnt.name.toLowerCase())) {
                    continue;
                }
                try {
                    for (var _b = (e_2 = void 0, __asyncValues(findFunctionsRecursivelyAsync(fullPath))), _c; _c = yield __await(_b.next()), !_c.done;) {
                        const file = _c.value;
                        yield yield __await(file);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) yield __await(_a.call(_b));
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
            else if (!!traverseFunctionProjectUtils_1.TraversalRegexes.cSharpFileNameRegex.exec(dirEnt.name)) {
                const code = yield __await(fs.promises.readFile(fullPath, { encoding: 'utf8' }));
                var match;
                while (!!(match = traverseFunctionProjectUtils_1.DotNetBindingsParser.functionAttributeRegex.exec(code))) {
                    let functionName = removeNamespace(match[3]);
                    const body = traverseFunctionProjectUtils_1.getCodeInBrackets(code, match.index + match[0].length, '{', '}', ' \n');
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
                }
            }
        }
    });
}
function removeNamespace(name) {
    if (!name) {
        return name;
    }
    const dotPos = name.lastIndexOf('.');
    return dotPos >= 0 ? name.substring(dotPos + 1) : name;
}
//# sourceMappingURL=traverseDotNetIsolatedFunctionProject.js.map