import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { exec } from 'child_process';
const execAsync = util.promisify(exec);

const gitCloneTimeoutInSeconds = 60;

// Does a git clone into a temp folder and returns info about that cloned code
export async function cloneFromGitHub(url: string): Promise<{gitTempFolder: string, projectFolder: string}> {

    let repoName = '', branchName = '', relativePath = '', gitTempFolder = '';

    let restOfUrl: string[] = [];
    const match = /(https:\/\/github.com\/.*?)\/([^\/]+)(\/tree\/)?(.*)/i.exec(url);

    if (!match || match.length < 5) {

        // expecting repo name to be the last segment of remote origin URL
        repoName = url.substr(url.lastIndexOf('/') + 1);

    } else {

        const orgUrl = match[1];

        repoName = match[2];
        if (repoName.toLowerCase().endsWith('.git')) {
            repoName = repoName.substr(0, repoName.length - 4);
        }

        url = `${orgUrl}/${repoName}.git`;

        if (!!match[4]) {
            restOfUrl = match[4].split('/').filter(s => !!s);
        }
    }

    gitTempFolder = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'git-clone-'));

    let getGitTimeoutPromise = () => {

        return new Promise<void>((resolve, reject) => setTimeout(() => reject(new Error(`git clone timed out after ${gitCloneTimeoutInSeconds} sec.`)), gitCloneTimeoutInSeconds * 1000));
    };

    // The provided URL might contain both branch name and relative path. The only way to separate one from another
    // is to repeatedly try cloning assumed branch names, until we finally succeed.
    for (let i = restOfUrl.length; i > 0; i--) {

        try {

            const assumedBranchName = restOfUrl.slice(0, i).join('/');

            const clonePromise = execAsync(`git clone ${url} --branch ${assumedBranchName}`, { cwd: gitTempFolder });
    
            // It turned out that the above command can hang forever for unknown reason. So need to put a timeout.
            await Promise.race([clonePromise, getGitTimeoutPromise()]);

            branchName = assumedBranchName;
            relativePath = path.join(...restOfUrl.slice(i, restOfUrl.length));

            break;
        } catch {
            continue;
        }
    }

    if (!branchName) {

        // Just doing a normal git clone
        const clonePromise = execAsync(`git clone ${url}`, { cwd: gitTempFolder });

        // It turned out that the above command can hang forever for unknown reason. So need to put a timeout.
        await Promise.race([clonePromise, getGitTimeoutPromise()]);
    }

    return { gitTempFolder, projectFolder: path.join(gitTempFolder, repoName, relativePath) };
}

export type GitRepositoryInfo = {
    originUrl: string;
    repoName: string;
    branchName?: string;
    tagName?: string;
}

// Tries to get remote origin info from git
export async function getGitRepoInfo(projectFolder: string, repoInfoFromSettings: GitRepositoryInfo = null): Promise<GitRepositoryInfo> {

    // looking for .git folder
    var localGitFolder = projectFolder;
    while (!fs.existsSync(path.join(localGitFolder, '.git'))) {
       
        const parentFolder = path.dirname(localGitFolder);

        if (!parentFolder || localGitFolder === parentFolder) {
            return null;
        }

        localGitFolder = parentFolder;
    }

    const execParams = { env: { GIT_DIR: path.join(localGitFolder, '.git') } };

    var originUrl = repoInfoFromSettings?.originUrl;
    if (!originUrl) {
        
        // trying to get remote origin URL via git
        try {

            originUrl = (await execAsync('git config --get remote.origin.url', execParams))
                .stdout
                .toString()
                .replace(/\n+$/, '') // trims end-of-line, if any
                .replace(/\/+$/, ''); // trims the trailing slash, if any
                    
        } catch (err) {
            
            console.warn(`Unable to get remote origin URL. ${err}`);
            return null;
        }
    }

    // This tool should never expose any credentials
    originUrl = originUrl.replace(/:\/\/[^\/]*@/i, '://');

    if (originUrl.endsWith('.git')) {
        originUrl = originUrl.substr(0, originUrl.length - 4);
    }

    var branchName = repoInfoFromSettings?.branchName, tagName = repoInfoFromSettings?.tagName;
    if (!branchName && !tagName) {
        
        // trying to get branch/tag name (which might be different from default) via git
        try {
        
            branchName = (await execAsync('git rev-parse --abbrev-ref HEAD', execParams))
                .stdout
                .toString()
                .replace(/\n+$/, '') // trims end-of-line, if any
            
            if (branchName === 'HEAD') { // this indicates that we're on a tag
    
                // trying to get that tag name
                tagName = (await execAsync('git describe --tags', execParams))
                    .stdout
                    .toString()
                    .replace(/\n+$/, '') // trims end-of-line, if any
            }
            
        } catch (err) {
            
            console.warn(`Unable to detect branch/tag name. ${err}`);
        }
    
        // defaulting to master
        if (!branchName) {
            branchName = 'master';
        }
    }

    var repoName = repoInfoFromSettings?.repoName;
    if (!repoName) {
        
        // expecting repo name to be the last segment of remote origin URL
        const p = originUrl.lastIndexOf('/');
        if (p < 0) {
            return null;
        }
        repoName = originUrl.substr(p + 1);
    }
    
    return { originUrl, repoName, branchName, tagName };
}

type FunctionsOrProxiesMap = { [name: string]: { filePath?: string, lineNr?: number } };
// tries to point source links to the remote repo
export function convertLocalPathsToRemote(map: FunctionsOrProxiesMap, sourcesRootFolder: string, repoInfo: GitRepositoryInfo) {

    const isGitHub = repoInfo.originUrl.match(/^https:\/\/[^\/]*github.(com|dev)\//i);
    const isAzDevOps = repoInfo.originUrl.match(/^https:\/\/[^\/]*dev.azure.com\//i);

    for (const funcName in map) {
        
        const func = map[funcName];

        if (!func.filePath) {
            continue;
        }

        var relativePathStartPos;
        // if root folder for sources is known, then anchoring to it
        if (func.filePath.startsWith(sourcesRootFolder)) {

            relativePathStartPos = sourcesRootFolder.length;
            
        } else {

            // otherwise trying to anchor to repo name (which needs to be present in the path)
            const repoNameWithSeparators = path.sep + repoInfo.repoName + path.sep;

            relativePathStartPos = func.filePath.indexOf(repoNameWithSeparators);
            if (relativePathStartPos < 0) {
                continue;
            }

            relativePathStartPos = relativePathStartPos + repoNameWithSeparators.length;
        }

        const relativePath = func.filePath.substr(relativePathStartPos).split(path.sep).filter(s => !!s);

        if (!!isGitHub) {

            func.filePath = `${repoInfo.originUrl}/blob/${!repoInfo.tagName ? repoInfo.branchName : repoInfo.tagName}/${relativePath.join('/')}#L${func.lineNr}`;

        } else if (!!isAzDevOps) {

            func.filePath = `${repoInfo.originUrl}?path=${encodeURIComponent('/' + relativePath.join('/'))}&version=${!repoInfo.tagName ? 'GB' + repoInfo.branchName : 'GT' + repoInfo.tagName}&line=${func.lineNr}&lineEnd=${func.lineNr + 1}&lineStartColumn=1`;
            
        }
    }
}