"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderDiagramWithCli = void 0;
const rimraf = require("rimraf");
const os = require("os");
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const crypto = require("crypto");
const traverseFunctionProject_1 = require("./traverseFunctionProject");
const traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
const buildFunctionDiagramCode_1 = require("../ui/src/buildFunctionDiagramCode");
// Does the main job
function renderDiagramWithCli(projectFolder, outputFile, settings = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!projectFolder) {
            console.error('Path to an Azure Functions project not specified');
            return;
        }
        if (!outputFile) {
            outputFile = 'function-graph.svg';
        }
        const outputFolder = path.dirname(outputFile);
        if (!fs.existsSync(outputFolder)) {
            console.log(`Creating output folder ${outputFolder}`);
            fs.promises.mkdir(outputFolder, { recursive: true });
        }
        const htmlTemplateFile = !!settings.htmlTemplateFile ? settings.htmlTemplateFile : path.resolve(__dirname, '..', '..', 'graph-template.htm');
        var tempFilesAndFolders = [];
        try {
            // If it is a git repo, cloning it
            if (projectFolder.toLowerCase().startsWith('http')) {
                console.log(`Cloning ${projectFolder}`);
                const gitInfo = yield traverseFunctionProjectUtils_1.cloneFromGitHub(projectFolder);
                console.log(`Successfully cloned to ${gitInfo.gitTempFolder}`);
                tempFilesAndFolders.push(gitInfo.gitTempFolder);
                projectFolder = gitInfo.projectFolder;
            }
            const traverseResult = yield traverseFunctionProject_1.traverseFunctionProject(projectFolder, console.log);
            tempFilesAndFolders.push(...traverseResult.tempFolders);
            var diagramCode = yield buildFunctionDiagramCode_1.buildFunctionDiagramCode(traverseResult.functions, traverseResult.proxies, settings);
            diagramCode = 'graph LR\n' + (!!diagramCode ? diagramCode : 'empty["#32;(empty)"]');
            console.log('Diagram code:');
            console.log(diagramCode);
            const tempInputFile = path.join(os.tmpdir(), crypto.randomBytes(20).toString('hex') + '.mmd');
            yield fs.promises.writeFile(tempInputFile, diagramCode);
            tempFilesAndFolders.push(tempInputFile);
            const outputFileExt = path.extname(outputFile).toLowerCase();
            const isHtmlOutput = ['.htm', '.html'].includes(outputFileExt);
            const tempOutputFile = path.join(os.tmpdir(), crypto.randomBytes(20).toString('hex') + (isHtmlOutput ? '.svg' : outputFileExt));
            tempFilesAndFolders.push(tempOutputFile);
            yield runMermaidCli(tempInputFile, tempOutputFile);
            if (isHtmlOutput) {
                var html = yield fs.promises.readFile(htmlTemplateFile, { encoding: 'utf8' });
                var svg = yield fs.promises.readFile(tempOutputFile, { encoding: 'utf8' });
                svg = yield applyIcons(svg);
                html = html.replace(/{{GRAPH_SVG}}/g, svg);
                // Trying to convert local source file paths into links to remote repo
                const repoInfo = !!settings.repoInfo ? settings.repoInfo : getGitRepoInfo(projectFolder);
                // This tool should never expose any credentials
                repoInfo.originUrl = repoInfo.originUrl.replace(/:\/\/[^\/]*@/i, '://');
                console.log(`Using repo URI: ${repoInfo.originUrl}, repo name: ${repoInfo.repoName}, branch: ${repoInfo.branchName}, tag: ${repoInfo.tagName}`);
                html = html.replace(/{{PROJECT_NAME}}/g, repoInfo.repoName);
                const functionsMap = !repoInfo ? traverseResult.functions : convertLocalPathsToRemote(traverseResult.functions, settings.sourcesRootFolder, repoInfo);
                const proxiesMap = !repoInfo ? traverseResult.proxies : convertLocalPathsToRemote(traverseResult.proxies, settings.sourcesRootFolder, repoInfo);
                html = html.replace(/const functionsMap = {}/g, `const functionsMap = ${JSON.stringify(functionsMap)}`);
                html = html.replace(/const proxiesMap = {}/g, `const proxiesMap = ${JSON.stringify(proxiesMap)}`);
                yield fs.promises.writeFile(outputFile, html);
            }
            else if (outputFileExt === '.svg') {
                var svg = yield fs.promises.readFile(tempOutputFile, { encoding: 'utf8' });
                svg = yield applyIcons(svg);
                yield fs.promises.writeFile(outputFile, svg);
            }
            else {
                yield fs.promises.copyFile(tempOutputFile, outputFile);
            }
            console.log(`Diagram was successfully generated and saved to ${outputFile}`);
        }
        finally {
            for (const tempFolder of tempFilesAndFolders) {
                rimraf.sync(tempFolder);
            }
        }
    });
}
exports.renderDiagramWithCli = renderDiagramWithCli;
// executes mermaid CLI from command line
function runMermaidCli(inputFile, outputFile) {
    const packageJsonPath = path.resolve(__dirname, '..', '..');
    // Explicitly installing mermaid-cli. Don't want to add it to package.json, because it is quite heavy.
    const mermaidCliPath = path.resolve(packageJsonPath, 'node_modules', '@mermaid-js', 'mermaid-cli', 'index.bundle.js');
    if (!fs.existsSync(mermaidCliPath)) {
        console.log(`installing mermaid-cli in ${packageJsonPath}...`);
        cp.execSync('npm i --no-save @mermaid-js/mermaid-cli', { cwd: packageJsonPath });
        console.log('mermaid-cli installed');
    }
    const mermaidConfigPath = path.resolve(__dirname, '..', '..', 'mermaid.config.json');
    return new Promise((resolve, reject) => {
        const proc = cp.fork(mermaidCliPath, ['-i', inputFile, '-o', outputFile, '-c', mermaidConfigPath]);
        proc.on('exit', (exitCode) => {
            if (exitCode === 0) {
                resolve();
            }
            else {
                reject(new Error(`Mermaid failed with status code ${exitCode}`));
            }
        });
    });
}
// injects icons SVG into the resulting SVG
function applyIcons(svg) {
    return __awaiter(this, void 0, void 0, function* () {
        const iconsSvg = yield fs.promises.readFile(path.resolve(__dirname, '..', 'all-azure-icons.svg'), { encoding: 'utf8' });
        // Placing icons code into a <defs> block at the top
        svg = svg.replace(`><style>`, `>\n<defs>\n${iconsSvg}</defs>\n<style>`);
        // Adding <use> blocks referencing relevant icons
        svg = svg.replace(/<g class="node (\w+).*?<g class="label" transform="translate\([0-9,.-]+\)"><g transform="translate\([0-9,.-]+\)">/g, `$&<use href="#az-icon-$1" width="20px" height="20px"/>`);
        return svg;
    });
}
// Tries to get remote origin info from git
function getGitRepoInfo(projectFolder) {
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
    // trying to get remote origin URL
    var originUrl;
    try {
        originUrl = cp.execSync('git config --get remote.origin.url', execSyncParams)
            .toString()
            .replace(/\n+$/, '') // trims end-of-line, if any
            .replace(/\/+$/, ''); // trims the trailing slash, if any
    }
    catch (_a) {
        return null;
    }
    if (originUrl.endsWith('.git')) {
        originUrl = originUrl.substr(0, originUrl.length - 4);
    }
    // expecting repo name to be the last segment of remote origin URL
    const p = originUrl.lastIndexOf('/');
    if (p < 0) {
        return null;
    }
    const repoName = originUrl.substr(p + 1);
    // trying to get branch name (which might be different from default)
    var branchName = '', tagName = '';
    try {
        branchName = cp.execSync('git rev-parse --abbrev-ref HEAD', execSyncParams)
            .toString()
            .replace(/\n+$/, ''); // trims end-of-line, if any
        if (branchName === 'HEAD') { // this indicates that we're on a tag
            // trying to get that tag name
            tagName = cp.execSync('git describe --tags', execSyncParams)
                .toString()
                .replace(/\n+$/, ''); // trims end-of-line, if any
        }
    }
    catch (err) {
        console.warn(`Unable to detect branch/tag name. ${err}`);
    }
    // defaulting to master
    if (!branchName) {
        branchName = 'master';
    }
    return { originUrl, repoName, branchName, tagName };
}
// tries to point source links to the remote repo
function convertLocalPathsToRemote(map, sourcesRootFolder, repoInfo) {
    const isGitHub = repoInfo.originUrl.match(/^https:\/\/[^\/]*github.com\//i);
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
        }
        else {
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
        }
        else if (!!isAzDevOps) {
            func.filePath = `${repoInfo.originUrl}?path=${encodeURIComponent('/' + relativePath.join('/'))}&version=${!repoInfo.tagName ? 'GB' + repoInfo.branchName : 'GT' + repoInfo.tagName}&line=${func.lineNr}&lineEnd=${func.lineNr + 1}&lineStartColumn=1`;
        }
    }
    return map;
}
//# sourceMappingURL=renderDiagramWithCli.js.map