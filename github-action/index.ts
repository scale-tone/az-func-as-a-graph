import * as core from '@actions/core';
import * as github from '@actions/github';

import { renderDiagram } from 'az-func-as-a-graph.core/dist/cliUtils';
import { GitRepositoryInfo } from 'az-func-as-a-graph.core/dist/gitUtils';

const nameToGreet = core.getInput('who-to-greet');

async function run() {
    try {

        const projectFolder = core.getInput('projectFolder');
        if (!projectFolder) {
        
            core.setFailed('projectFolder parameter is required');
            return;
        }
        
        const outputFile = core.getInput('outputFile');
        if (!outputFile) {
            core.setFailed('outputFile parameter is required');
            return;
        }

        console.warn(`ENV: ${JSON.stringify(process.env)}`)

        console.warn(`github context: ${JSON.stringify(github.context)}`);

    }
    catch (err) {
        core.setFailed(err.message ?? err);
    }
}

run();