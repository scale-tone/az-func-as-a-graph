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
const tl = require("azure-pipelines-task-lib/task");
const renderDiagramWithCli_1 = require("./renderDiagramWithCli");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const projectFolder = tl.getInput('projectFolder');
            if (!projectFolder) {
                tl.setResult(tl.TaskResult.Failed, 'projectFolder parameter is required');
                return;
            }
            const outputFile = tl.getInput('outputFile');
            if (!outputFile) {
                tl.setResult(tl.TaskResult.Failed, 'outputFile parameter is required');
                return;
            }
            const repoInfo = {
                originUrl: tl.getInput('repoUri'),
                repoName: tl.getInput('repoName'),
                branchName: tl.getInput('branchName')
            };
            yield renderDiagramWithCli_1.renderDiagramWithCli(projectFolder, outputFile, {
                repoInfo,
                sourcesRootFolder: tl.getVariable('System.DefaultWorkingDirectory'),
                templateFile: tl.getInput("templateFile"),
                doNotRenderFunctions: tl.getBoolInput("doNotRenderFunctions"),
                doNotRenderProxies: tl.getBoolInput("doNotRenderProxies")
            });
        }
        catch (err) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    });
}
run();
//# sourceMappingURL=index.js.map