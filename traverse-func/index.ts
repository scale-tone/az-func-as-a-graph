import { Context, HttpRequest } from "@azure/functions"
import * as rimraf from 'rimraf';

import { traverseFunctionProject } from '../cli/traverseFunctionProject';
import { getGitRepoInfo, convertLocalPathsToRemote } from '../cli/renderDiagramWithCli';

// Main function
export default async function (context: Context, req: HttpRequest): Promise<void> {

    var tempFolders = [];
    try {

        var projectFolder = req.body as string;

        const result = await traverseFunctionProject(projectFolder, context.log);
        projectFolder = result.projectFolder;
        tempFolders.push(...result.tempFolders);

        // Trying to convert local source file paths into links to remote repo
        const repoInfo = getGitRepoInfo(projectFolder);
        if (!!repoInfo) {
            
            context.log(`Using repo URI: ${repoInfo.originUrl}, repo name: ${repoInfo.repoName}, branch: ${repoInfo.branchName}, tag: ${repoInfo.tagName}`);

            // changing local paths to remote repo URLs
            convertLocalPathsToRemote(result.functions, null, repoInfo) as any;
            convertLocalPathsToRemote(result.proxies, null, repoInfo) as any;
        }    

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