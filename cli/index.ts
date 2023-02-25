import * as tl from 'azure-pipelines-task-lib/task';

import { renderDiagramWithCli } from './renderDiagramWithCli';
import { GitRepositoryInfo } from './gitUtils';

async function run() {
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

        const repoInfo: GitRepositoryInfo = {
            originUrl: tl.getInput('repoUri'),
            repoName: tl.getInput('repoName'),
            branchName: tl.getInput('branchName')
        }

        await renderDiagramWithCli(projectFolder, outputFile, {
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
}

run();