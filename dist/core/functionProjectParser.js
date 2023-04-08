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
exports.FunctionProjectParser = void 0;
const functionProjectScriptParser_1 = require("./functionProjectScriptParser");
const functionProjectCodeParser_1 = require("./functionProjectCodeParser");
const powershellFunctionProjectParser_1 = require("./powershellFunctionProjectParser");
// Parses Azure Functions projects to produce Functions map (list of all Functions, their bindings and connections to other Functions)
class FunctionProjectParser {
    // Collects all function.json files in a Functions project. Also tries to supplement them with bindings
    // extracted from code (if the project is .Net or Java). Also parses and organizes orchestrators/activities 
    // (if the project uses Durable Functions)
    static parseFunctions(projectFolder, fileSystemWrapper, log) {
        return __awaiter(this, void 0, void 0, function* () {
            const hostJsonMatch = yield fileSystemWrapper.findFileRecursivelyAsync(projectFolder, 'host.json', false);
            if (!hostJsonMatch) {
                throw new Error('host.json file not found under the provided project path');
            }
            log(`>>> Found host.json at ${hostJsonMatch.filePath}`);
            const hostJsonFolder = fileSystemWrapper.dirName(hostJsonMatch.filePath);
            let parser;
            if (yield fileSystemWrapper.isCSharpProjectAsync(hostJsonFolder)) {
                parser = new functionProjectCodeParser_1.CSharpFunctionProjectParser(fileSystemWrapper, log);
            }
            else if (yield fileSystemWrapper.isFSharpProjectAsync(hostJsonFolder)) {
                parser = new functionProjectCodeParser_1.FSharpFunctionProjectParser(fileSystemWrapper, log);
            }
            else if (yield fileSystemWrapper.isJavaProjectAsync(hostJsonFolder)) {
                parser = new functionProjectCodeParser_1.JavaFunctionProjectParser(fileSystemWrapper, log);
            }
            else if (yield fileSystemWrapper.isPowershellProjectAsync(hostJsonFolder)) {
                parser = new powershellFunctionProjectParser_1.PowershellFunctionProjectParser(fileSystemWrapper, log);
            }
            else {
                parser = new functionProjectScriptParser_1.FunctionProjectScriptParser(fileSystemWrapper, log);
                // For script-based functions use host.json's folder as the root
                projectFolder = hostJsonFolder;
            }
            const functions = yield parser.traverseFunctions(projectFolder);
            // Also reading proxies
            const proxies = yield fileSystemWrapper.readProxiesJson(projectFolder, log);
            return { functions, proxies, projectFolder };
        });
    }
}
exports.FunctionProjectParser = FunctionProjectParser;
//# sourceMappingURL=functionProjectParser.js.map