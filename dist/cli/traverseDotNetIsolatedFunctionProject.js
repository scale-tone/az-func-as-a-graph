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
const util = require("util");
const child_process_1 = require("child_process");
const execAsync = util.promisify(child_process_1.exec);
const traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
// Tries to parse code of a .NET Isolated function and extract bindings from there
function traverseDotNetIsolatedProject(projectFolder) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            for (var _b = __asyncValues(findFilesRecursivelyAsync(projectFolder, new RegExp('.+\\.cs$', 'i'), traverseFunctionProjectUtils_1.DotNetBindingsParser.functionAttributeRegex)), _c; _c = yield _b.next(), !_c.done;) {
                const csFile = _c.value;
                console.log(csFile.code);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return {};
    });
}
exports.traverseDotNetIsolatedProject = traverseDotNetIsolatedProject;
function findFilesRecursivelyAsync(folder, fileNameRegex, pattern) {
    return __asyncGenerator(this, arguments, function* findFilesRecursivelyAsync_1() {
        var e_2, _a;
        for (const dirEnt of yield __await(fs.promises.readdir(folder, { withFileTypes: true }))) {
            var fullPath = path.join(folder, dirEnt.name);
            if (dirEnt.isDirectory()) {
                if (traverseFunctionProjectUtils_1.ExcludedFolders.includes(dirEnt.name.toLowerCase())) {
                    continue;
                }
                try {
                    for (var _b = (e_2 = void 0, __asyncValues(findFilesRecursivelyAsync(fullPath, fileNameRegex, pattern))), _c; _c = yield __await(_b.next()), !_c.done;) {
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
                const match = pattern.exec(code);
                if (!!match) {
                    yield yield __await({
                        filePath: fullPath,
                        code,
                        pos: match.index,
                        length: match[0].length
                    });
                }
            }
        }
    });
}
//# sourceMappingURL=traverseDotNetIsolatedFunctionProject.js.map