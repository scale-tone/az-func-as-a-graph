import * as rimraf from 'rimraf';

import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import * as crypto from 'crypto';

import { traverseFunctionProject } from './traverseFunctionProject';
import { buildFunctionDiagramCode, GraphSettings } from '../ui/src/buildFunctionDiagramCode';
import { TraverseFunctionResult } from '../ui/src/shared/FunctionsMap';

export type GraphCliSettings = GraphSettings & {
    templateFile?: string;
    htmlTemplateFile?: string; // obsolete, but still supported
    repoInfo?: GitRepositoryInfo;
    sourcesRootFolder?: string;
};

// Does the main job
export async function renderDiagramWithCli(projectFolder: string, outputFile: string, settings: GraphCliSettings = {}) {

    if (!projectFolder) {
        console.error('Path to an Azure Functions project not specified');
        return;
    }

    // To support both old and new property names
    if (!!settings.htmlTemplateFile && !settings.templateFile) {
        settings.templateFile = settings.htmlTemplateFile;
    }

    if (!outputFile) {
        outputFile = 'function-graph.svg';
    }
    const outputFolder = path.dirname(outputFile);
    if (!fs.existsSync(outputFolder)) {
        
        console.log(`Creating output folder ${outputFolder}`);
        fs.promises.mkdir(outputFolder, { recursive: true });
    }

    var tempFilesAndFolders = [];

    try {

        const traverseResult = await traverseFunctionProject(projectFolder, console.log);
        projectFolder = traverseResult.projectFolder;

        // Trying to convert local source file paths into links to remote repo
        const repoInfo = getGitRepoInfo(projectFolder, settings.repoInfo);
        if (!!repoInfo) {
            
            console.log(`Using repo URI: ${repoInfo.originUrl}, repo name: ${repoInfo.repoName}, branch: ${repoInfo.branchName}, tag: ${repoInfo.tagName}`);

            // changing local paths to remote repo URLs
            convertLocalPathsToRemote(traverseResult.functions, settings.sourcesRootFolder, repoInfo) as any;
            convertLocalPathsToRemote(traverseResult.proxies, settings.sourcesRootFolder, repoInfo) as any;
        }    

        const outputFileExt = path.extname(outputFile).toLowerCase();

        if (outputFileExt === '.json') {

            // just saving the Function Graph as JSON and quitting
            await fs.promises.writeFile(outputFile, JSON.stringify({
                functions: traverseResult.functions,
                proxies: traverseResult.proxies
            }, null, 4));

            console.log(`Functions Map saved to ${outputFile}`);

            return;
        }

        tempFilesAndFolders.push(...traverseResult.tempFolders);

        var diagramCode = await buildFunctionDiagramCode(traverseResult.functions, traverseResult.proxies, settings);
        diagramCode = 'graph LR\n' + (!!diagramCode ? diagramCode : 'empty["#32;(empty)"]');

        console.log('Diagram code:');
        console.log(diagramCode);
        
        if (outputFileExt === '.md') {

            // just saving the diagram as a Markdown file and quitting
            await saveOutputAsMarkdown(!!repoInfo ? repoInfo.repoName : path.basename(projectFolder), outputFile, diagramCode, settings);

            console.log(`Diagram was successfully generated and saved to ${outputFile}`);

            console.log(tempFilesAndFolders);

            return;
        }

        const tempInputFile = path.join(os.tmpdir(), crypto.randomBytes(20).toString('hex') + '.mmd');
        await fs.promises.writeFile(tempInputFile, diagramCode);
        tempFilesAndFolders.push(tempInputFile);

        const isHtmlOutput = ['.htm', '.html'].includes(outputFileExt);

        const tempOutputFile = path.join(os.tmpdir(), crypto.randomBytes(20).toString('hex') + (isHtmlOutput ? '.svg' : outputFileExt));
        tempFilesAndFolders.push(tempOutputFile);

        await runMermaidCli(tempInputFile, tempOutputFile);

        if (isHtmlOutput) {

            await saveOutputAsHtml(!!repoInfo ? repoInfo.repoName : path.basename(projectFolder), outputFile, tempOutputFile, traverseResult, settings);

        } else if (outputFileExt === '.svg') {

            await saveOutputAsSvg(outputFile, tempOutputFile);

        } else {

            await fs.promises.copyFile(tempOutputFile, outputFile);
        }

        console.log(`Diagram was successfully generated and saved to ${outputFile}`);

    } finally {
        for (const tempFolder of tempFilesAndFolders) {
            rimraf.sync(tempFolder)
        }
    }
}

// saves resulting Function Graph as SVG
async function saveOutputAsSvg(outputFile: string, tempOutputFile: string) {
    
    var svg = await fs.promises.readFile(tempOutputFile, { encoding: 'utf8' });
    svg = await applyIcons(svg);
    await fs.promises.writeFile(outputFile, svg);
}

// saves resulting Function Graph as HTML
async function saveOutputAsHtml(projectName: string, outputFile: string, tempOutputFile: string, traverseResult: TraverseFunctionResult, settings: GraphCliSettings) {
    
    const htmlTemplateFile = !!settings.templateFile ? settings.templateFile : path.resolve(__dirname, '..', '..', 'graph-template.htm');

    var html = await fs.promises.readFile(htmlTemplateFile, { encoding: 'utf8' });

    var svg = await fs.promises.readFile(tempOutputFile, { encoding: 'utf8' });
    svg = await applyIcons(svg);
    html = html.replace(/{{GRAPH_SVG}}/g, svg);

    html = html.replace(/{{PROJECT_NAME}}/g, projectName);

    html = html.replace(/const functionsMap = {}/g, `const functionsMap = ${JSON.stringify(traverseResult.functions)}`);
    html = html.replace(/const proxiesMap = {}/g, `const proxiesMap = ${JSON.stringify(traverseResult.proxies)}`);

    await fs.promises.writeFile(outputFile, html);
}

// saves resulting Function Graph as .md file
async function saveOutputAsMarkdown(projectName: string, outputFile: string, diagramCode: string, settings: GraphCliSettings) {
    
    const markdownTemplateFile = !!settings.templateFile ? settings.templateFile : path.resolve(__dirname, '..', '..', 'graph-template.md');

    var markdown = await fs.promises.readFile(markdownTemplateFile, { encoding: 'utf8' });

    markdown = markdown.replace(/{{GRAPH_CODE}}/g, diagramCode);
    markdown = markdown.replace(/{{PROJECT_NAME}}/g, projectName);

    await fs.promises.writeFile(outputFile, markdown);
}

// executes mermaid CLI from command line
function runMermaidCli(inputFile: string, outputFile: string): Promise<void> {

    const packageJsonPath = path.resolve(__dirname, '..', '..');

    // Explicitly installing mermaid-cli. Don't want to add it to package.json, because it is quite heavy.
    const mermaidCliPath = path.resolve(packageJsonPath, 'node_modules', '@mermaid-js', 'mermaid-cli', 'index.bundle.js');

    if (!fs.existsSync(mermaidCliPath)) {
        console.log(`installing mermaid-cli in ${packageJsonPath}...`)
        // Something got broken in the latest mermaid-cli, so need to lock down the version here
        cp.execSync('npm i --no-save @mermaid-js/mermaid-cli@8.13.0', { cwd: packageJsonPath });
        console.log('mermaid-cli installed')
    }

    const mermaidConfigPath = path.resolve(__dirname, '..', '..', 'mermaid.config.json');

    return new Promise((resolve, reject) => {

        const proc = cp.fork(mermaidCliPath, ['-i', inputFile, '-o', outputFile, '-c', mermaidConfigPath]);

        proc.on('exit', (exitCode) => {

            if (exitCode === 0) {
                resolve();
            } else {
                reject(new Error(`Mermaid failed with status code ${exitCode}`));
            }
        });
    });
}

// injects icons SVG into the resulting SVG
async function applyIcons(svg: string): Promise<string> {

    const iconsSvg = await fs.promises.readFile(path.resolve(__dirname, '..', 'all-azure-icons.svg'), { encoding: 'utf8' });

    // Placing icons code into a <defs> block at the top
    svg = svg.replace(`><style>`, `>\n<defs>\n${iconsSvg}</defs>\n<style>`);

    // Adding <use> blocks referencing relevant icons
    svg = svg.replace(/<g class="node (\w+).*?<g class="label" transform="translate\([0-9,.-]+\)"><g transform="translate\([0-9,.-]+\)">/g,
    `$&<use href="#az-icon-$1" width="20px" height="20px"/>`);

    return svg;
}

export type GitRepositoryInfo = {
    originUrl: string;
    repoName: string;
    branchName?: string;
    tagName?: string;
}
// Tries to get remote origin info from git
export function getGitRepoInfo(projectFolder: string, repoInfoFromSettings: GitRepositoryInfo = null): GitRepositoryInfo {

    // looking for .git folder
    var localGitFolder = projectFolder;
    while (!fs.existsSync(path.join(localGitFolder, '.git'))) {
       
        const parentFolder = path.dirname(localGitFolder);

        if (!parentFolder || localGitFolder === parentFolder) {
            return null;
        }

        localGitFolder = parentFolder;
    }

    const execSyncParams = { env: { GIT_DIR: path.join(localGitFolder, '.git') } };

    var originUrl = repoInfoFromSettings?.originUrl;
    if (!originUrl) {
        
        // trying to get remote origin URL via git
        try {

            originUrl = cp.execSync('git config --get remote.origin.url', execSyncParams)
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
        
            branchName = cp.execSync('git rev-parse --abbrev-ref HEAD', execSyncParams)
                .toString()
                .replace(/\n+$/, '') // trims end-of-line, if any
            
            if (branchName === 'HEAD') { // this indicates that we're on a tag
    
                // trying to get that tag name
                tagName = cp.execSync('git describe --tags', execSyncParams)
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