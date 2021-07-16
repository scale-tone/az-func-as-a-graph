import { Context, HttpRequest } from "@azure/functions"
import * as rimraf from 'rimraf';

import { traverseFunctionProject } from './traverseFunctionProject';
import { cloneFromGitHub } from './traverseFunctionProjectUtils';

// Main function
export default async function (context: Context, req: HttpRequest): Promise<void> {

    var tempFolders = [];
    try {

        var projectFolder = req.body as string;

        // If it is a git repo, cloning it
        if (projectFolder.toLowerCase().startsWith('http')) {

            const gitInfo = await cloneFromGitHub(projectFolder);
            tempFolders.push(gitInfo.gitTempFolder);
            projectFolder = gitInfo.projectFolder;
        }

        const result = await traverseFunctionProject(projectFolder, context.log);
        tempFolders.push(...result.tempFolders);
        context.res = { body: { functions: result.functions, proxies: result.proxies } };
        
    } catch (err) {

        context.log(`>>> Failed: ${err}`);

        context.res = {
            status: 500,
            body: err.message
        };

    } finally {

        for (const tempFolder of tempFolders) {
            context.log(`>>> Asynchronously removing ${tempFolder}`);
            setTimeout(() => { rimraf.sync(tempFolder) }, 0);
        }
    }
};