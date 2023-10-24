import * as rimraf from 'rimraf';

import { GraphCliSettings, renderDiagram } from 'az-func-as-a-graph.core/dist/cliUtils';
import { cloneFromGitHub } from 'az-func-as-a-graph.core/dist/gitUtils';

// Does the main job
export async function renderDiagramWithCli(projectFolder: string, outputFile: string, settings: GraphCliSettings = {}) {

    if (!projectFolder) {
        console.error('Path to an Azure Functions project not specified');
        return;
    }

    let tempFolder = '';
    try {

        // If it is a git repo, cloning it
        if (projectFolder.toLowerCase().startsWith('http')) {

            console.log(`Cloning ${projectFolder}`);
    
            const gitInfo = await cloneFromGitHub(projectFolder);
    
            console.log(`Successfully cloned to ${gitInfo.gitTempFolder}`);
    
            tempFolder = gitInfo.gitTempFolder;
            projectFolder = gitInfo.projectFolder;
        }

        await renderDiagram(projectFolder, outputFile, settings);        

    } finally {

        if (!!tempFolder) {
            
            console.log(`Removing ${tempFolder}`);
            rimraf.sync(tempFolder)
        }
    }
}