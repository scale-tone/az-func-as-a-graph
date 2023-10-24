import * as core from '@actions/core';
import * as github from '@actions/github';

import { renderDiagram } from 'az-func-as-a-graph.core/dist/cliUtils';
import { GitRepositoryInfo } from 'az-func-as-a-graph.core/dist/gitUtils';

async function run() {
    try {

        core.info('INFO FROM TINO');
        core.info(process.env.GITHUB_WORKSPACE);
        core.info('INFO FROM TINO');

        let projectFolder = core.getInput('projectFolder');
        if (!projectFolder) {
            projectFolder = process.env.GITHUB_WORKSPACE
        }

        let outputFile = core.getInput('outputFile');
        if (!outputFile) {
            outputFile = `${github.context.payload.repository.name}.diagram.htm`;
        }

        const repoInfo: GitRepositoryInfo = {
            originUrl: github.context.payload.repository.html_url,
            repoName: github.context.payload.repository.name,
            branchName: github.context.ref.startsWith('refs/heads/') ? github.context.ref.substring('refs/heads/'.length) : undefined,
            tagName: github.context.ref.startsWith('refs/tags/') ? github.context.ref.substring('refs/tags/'.length) : undefined,
        }

        await renderDiagram(projectFolder, outputFile, {
            repoInfo,
            sourcesRootFolder: process.env.GITHUB_WORKSPACE,
            templateFile: core.getInput('templateFile'),
            doNotRenderFunctions: core.getBooleanInput('doNotRenderFunctions'),
            doNotRenderProxies: core.getBooleanInput('doNotRenderProxies')
        });

    }
    catch (err) {
        core.setFailed(err.message ?? err);
    }
}

run();