import { Context, HttpRequest } from "@azure/functions"
import * as rimraf from 'rimraf';

import { cloneFromGitHub, getGitRepoInfo, convertLocalPathsToRemote } from "../cli/gitUtils";
import { FunctionProjectParser } from "../func-project-parser/functionProjectParser";
import { FileSystemWrapper } from "../cli/fileSystemWrapper";

// Main function
export default async function (context: Context, req: HttpRequest): Promise<void> {

    let tempFolders = [];
    try {

        let projectFolder = req.body as string;

        // If it is a git repo, cloning it
        if (projectFolder.toLowerCase().startsWith('http')) {

            context.log(`Cloning ${projectFolder}`);

            const gitInfo = await cloneFromGitHub(projectFolder);

            context.log(`Successfully cloned to ${gitInfo.gitTempFolder}`);

            tempFolders.push(gitInfo.gitTempFolder);
            projectFolder = gitInfo.projectFolder;
        }

        const result = await FunctionProjectParser.parseFunctions(projectFolder, new FileSystemWrapper(), context.log);
        projectFolder = result.projectFolder;

        // Trying to convert local source file paths into links to remote repo
        const repoInfo = await getGitRepoInfo(projectFolder);
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