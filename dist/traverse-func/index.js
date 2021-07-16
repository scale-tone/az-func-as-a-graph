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
const rimraf = require("rimraf");
const traverseFunctionProject_1 = require("./traverseFunctionProject");
const traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
// Main function
function default_1(context, req) {
    return __awaiter(this, void 0, void 0, function* () {
        var tempFolders = [];
        try {
            var projectFolder = req.body;
            // If it is a git repo, cloning it
            if (projectFolder.toLowerCase().startsWith('http')) {
                const gitInfo = yield traverseFunctionProjectUtils_1.cloneFromGitHub(projectFolder);
                tempFolders.push(gitInfo.gitTempFolder);
                projectFolder = gitInfo.projectFolder;
            }
            const result = yield traverseFunctionProject_1.traverseFunctionProject(projectFolder, context.log);
            tempFolders.push(...result.tempFolders);
            context.res = { body: { functions: result.functions, proxies: result.proxies } };
        }
        catch (err) {
            context.log(`>>> Failed: ${err}`);
            context.res = {
                status: 500,
                body: err.message
            };
        }
        finally {
            for (const tempFolder of tempFolders) {
                context.log(`>>> Asynchronously removing ${tempFolder}`);
                setTimeout(() => { rimraf.sync(tempFolder); }, 0);
            }
        }
    });
}
exports.default = default_1;
;
//# sourceMappingURL=index.js.map