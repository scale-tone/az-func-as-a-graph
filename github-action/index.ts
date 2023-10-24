import * as core from '@actions/core';
import * as github from '@actions/github';

import { renderDiagram } from 'az-func-as-a-graph.core/dist/cliUtils';
import { GitRepositoryInfo } from 'az-func-as-a-graph.core/dist/gitUtils';

const nameToGreet = core.getInput('who-to-greet');

async function run() {
    try {

        let projectFolder = core.getInput('projectFolder');
        if (!projectFolder) {
            projectFolder = process.env.GITHUB_WORKSPACE
        }

        console.warn(`projectFolder: ${projectFolder}`);
        
        let outputFile = core.getInput('outputFile');
        if (!outputFile) {
            outputFile = `${github.context.payload.repository.name}.diagram.htm`;
        }

        console.warn(`outputFile: ${outputFile}`);

        const repoInfo: GitRepositoryInfo = {
            originUrl: github.context.payload.repository.html_url,
            repoName: github.context.payload.repository.name,
            branchName: github.context.ref.startsWith('refs/heads/') ? github.context.ref.substring('refs/heads/'.length) : undefined,
            tagName: github.context.ref.startsWith('refs/tags/') ? github.context.ref.substring('refs/tags/'.length) : undefined,
        }

        console.warn(JSON.stringify(repoInfo));

    }
    catch (err) {
        core.setFailed(err.message ?? err);
    }
}

run();