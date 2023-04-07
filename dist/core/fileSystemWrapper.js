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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemWrapper = void 0;
const fileSystem = require("fs");
const path = require("path");
const fileSystemWrapperBase_1 = require("./fileSystemWrapperBase");
// Implements common filesystem routines via 'fs' module 
class FileSystemWrapper extends fileSystemWrapperBase_1.FileSystemWrapperBase {
    joinPath(path1, path2) {
        return path.join(path1, path2);
    }
    dirName(path1) {
        return path.dirname(path1);
    }
    readFile(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield fileSystem.promises.readFile(path, { encoding: 'utf8' });
        });
    }
    isDirectory(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield fileSystem.promises.lstat(path)).isDirectory();
        });
    }
    readDir(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield fileSystem.promises.readdir(path);
        });
    }
    pathExists(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return fileSystem.existsSync(path);
        });
    }
}
exports.FileSystemWrapper = FileSystemWrapper;
//# sourceMappingURL=fileSystemWrapper.js.map