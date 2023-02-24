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
exports.traverseProjectCode = void 0;
const fs = require("fs");
const path = require("path");
const traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
function traverseProjectCode(projectKind, projectFolder) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        let result = {};
        let fileNameRegex;
        let funcAttributeRegex;
        let funcNamePosIndex;
        switch (projectKind) {
            case 'cSharp':
                fileNameRegex = new RegExp('.+\\.cs$', 'i');
                funcAttributeRegex = traverseFunctionProjectUtils_1.BindingsParser.functionAttributeRegex;
                funcNamePosIndex = 3;
                break;
            case 'fSharp':
                fileNameRegex = new RegExp('.+\\.fs$', 'i');
                funcAttributeRegex = traverseFunctionProjectUtils_1.BindingsParser.fSharpFunctionAttributeRegex;
                funcNamePosIndex = 2;
                break;
            case 'java':
                fileNameRegex = new RegExp('.+\\.java$', 'i');
                funcAttributeRegex = traverseFunctionProjectUtils_1.BindingsParser.javaFunctionAttributeRegex;
                funcNamePosIndex = 1;
                break;
            default:
                return;
        }
        try {
            for (var _b = __asyncValues(findFunctionsRecursivelyAsync(projectFolder, fileNameRegex, funcAttributeRegex, funcNamePosIndex)), _c; _c = yield _b.next(), !_c.done;) {
                const func = _c.value;
                if (func.functionName === 'GetSpeciesActivity') {
                    debugger;
                }
                const bindings = traverseFunctionProjectUtils_1.BindingsParser.tryExtractBindings(func.declarationCode);
                if (projectKind === 'cSharp' && !(bindings.some(b => b.type === 'orchestrationTrigger') ||
                    bindings.some(b => b.type === 'entityTrigger') ||
                    bindings.some(b => b.type === 'activityTrigger'))) {
                    // Also trying to extract multiple output bindings
                    bindings.push(...yield extractOutputBindings(projectFolder, func.declarationCode, fileNameRegex));
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
exports.traverseProjectCode = traverseProjectCode;
function extractOutputBindings(projectFolder, functionCode, fileNameRegex) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const returnTypeMatch = traverseFunctionProjectUtils_1.BindingsParser.functionReturnTypeRegex.exec(functionCode);
        if (!returnTypeMatch) {
            return [];
        }
        const returnTypeName = removeNamespace(returnTypeMatch[3]);
        if (!returnTypeName) {
            return [];
        }
        const returnTypeDefinition = yield traverseFunctionProjectUtils_1.findFileRecursivelyAsync(projectFolder, fileNameRegex, true, traverseFunctionProjectUtils_1.TraversalRegexes.getClassDefinitionRegex(returnTypeName));
        if (!returnTypeDefinition) {
            return [];
        }
        const classBody = traverseFunctionProjectUtils_1.getCodeInBrackets(returnTypeDefinition.code, ((_a = returnTypeDefinition.pos) !== null && _a !== void 0 ? _a : 0) + ((_b = returnTypeDefinition.length) !== null && _b !== void 0 ? _b : 0), '{', '}');
        if (!classBody.code) {
            return [];
        }
        return traverseFunctionProjectUtils_1.BindingsParser.tryExtractBindings(classBody.code);
    });
}
function findFunctionsRecursivelyAsync(folder, fileNameRegex, functionAttributeRegex, functionNamePosInRegex) {
    return __asyncGenerator(this, arguments, function* findFunctionsRecursivelyAsync_1() {
        var e_2, _a;
        for (const dirEnt of yield __await(fs.promises.readdir(folder, { withFileTypes: true }))) {
            var fullPath = path.join(folder, dirEnt.name);
            if (dirEnt.isDirectory()) {
                if (traverseFunctionProjectUtils_1.ExcludedFolders.includes(dirEnt.name.toLowerCase())) {
                    continue;
                }
                try {
                    for (var _b = (e_2 = void 0, __asyncValues(findFunctionsRecursivelyAsync(fullPath, fileNameRegex, functionAttributeRegex, functionNamePosInRegex))), _c; _c = yield __await(_b.next()), !_c.done;) {
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
            else if (!!fileNameRegex.exec(dirEnt.name)) {
                const code = yield __await(fs.promises.readFile(fullPath, { encoding: 'utf8' }));
                var match;
                while (!!(match = functionAttributeRegex.exec(code))) {
                    let functionName = cleanupFunctionName(match[functionNamePosInRegex]);
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
function removeNamespace(name) {
    if (!name) {
        return name;
    }
    const dotPos = name.lastIndexOf('.');
    if (dotPos >= 0) {
        name = name.substring(dotPos + 1);
    }
    return name.trim();
}
function cleanupFunctionName(name) {
    if (!name) {
        return name;
    }
    const nameofMatch = new RegExp(`nameof\\s*\\(\\s*([\\w\\.]+)\\s*\\)`).exec(name);
    if (!!nameofMatch) {
        return removeNamespace(nameofMatch[1]);
    }
    name = name.trim();
    if (name.startsWith('"')) {
        return name.replace(/^"/, '').replace(/"$/, '');
    }
    return removeNamespace(name);
}
//# sourceMappingURL=traverseDotNetOrJavaProject.js.map