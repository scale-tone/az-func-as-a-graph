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
exports.convertLocalPathsToRemote = exports.getGitRepoInfo = exports.renderDiagramWithCli = void 0;
const rimraf = require("rimraf");
const os = require("os");
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const crypto = require("crypto");
const util = require("util");
const execAsync = util.promisify(cp.exec);
const traverseFunctionProject_1 = require("./traverseFunctionProject");
const buildFunctionDiagramCode_1 = require("../ui/src/buildFunctionDiagramCode");
const fileSystemUtils_1 = require("./fileSystemUtils");
// Does the main job
function renderDiagramWithCli(projectFolder, outputFile, settings = {}) {
    return __awaiter(this, void 0, void 0, function* () {
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
            // If it is a git repo, cloning it
            if (projectFolder.toLowerCase().startsWith('http')) {
                console.log(`Cloning ${projectFolder}`);
                const gitInfo = yield fileSystemUtils_1.cloneFromGitHub(projectFolder);
                console.log(`Successfully cloned to ${gitInfo.gitTempFolder}`);
                tempFilesAndFolders.push(gitInfo.gitTempFolder);
                projectFolder = gitInfo.projectFolder;
            }
            const traverseResult = yield traverseFunctionProject_1.traverseFunctions(projectFolder, console.log);
            projectFolder = traverseResult.projectFolder;
            // Trying to convert local source file paths into links to remote repo
            const repoInfo = yield getGitRepoInfo(projectFolder, settings.repoInfo);
            if (!!repoInfo) {
                console.log(`Using repo URI: ${repoInfo.originUrl}, repo name: ${repoInfo.repoName}, branch: ${repoInfo.branchName}, tag: ${repoInfo.tagName}`);
                // changing local paths to remote repo URLs
                convertLocalPathsToRemote(traverseResult.functions, settings.sourcesRootFolder, repoInfo);
                convertLocalPathsToRemote(traverseResult.proxies, settings.sourcesRootFolder, repoInfo);
            }
            const outputFileExt = path.extname(outputFile).toLowerCase();
            if (outputFileExt === '.json') {
                // just saving the Function Graph as JSON and quitting
                yield fs.promises.writeFile(outputFile, JSON.stringify({
                    functions: traverseResult.functions,
                    proxies: traverseResult.proxies
                }, null, 4));
                console.log(`Functions Map saved to ${outputFile}`);
                return;
            }
            var diagramCode = yield buildFunctionDiagramCode_1.buildFunctionDiagramCode(traverseResult.functions, traverseResult.proxies, settings);
            diagramCode = 'graph LR\n' + (!!diagramCode ? diagramCode : 'empty["#32;(empty)"]');
            console.log('Diagram code:');
            console.log(diagramCode);
            if (outputFileExt === '.md') {
                // just saving the diagram as a Markdown file and quitting
                yield saveOutputAsMarkdown(!!repoInfo ? repoInfo.repoName : path.basename(projectFolder), outputFile, diagramCode, settings);
                console.log(`Diagram was successfully generated and saved to ${outputFile}`);
                console.log(tempFilesAndFolders);
                return;
            }
            const tempInputFile = path.join(os.tmpdir(), crypto.randomBytes(20).toString('hex') + '.mmd');
            yield fs.promises.writeFile(tempInputFile, diagramCode);
            tempFilesAndFolders.push(tempInputFile);
            const isHtmlOutput = ['.htm', '.html'].includes(outputFileExt);
            const tempOutputFile = path.join(os.tmpdir(), crypto.randomBytes(20).toString('hex') + (isHtmlOutput ? '.svg' : outputFileExt));
            tempFilesAndFolders.push(tempOutputFile);
            yield runMermaidCli(tempInputFile, tempOutputFile);
            if (isHtmlOutput) {
                yield saveOutputAsHtml(!!repoInfo ? repoInfo.repoName : path.basename(projectFolder), outputFile, tempOutputFile, traverseResult, settings);
            }
            else if (outputFileExt === '.svg') {
                yield saveOutputAsSvg(outputFile, tempOutputFile);
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
// saves resulting Function Graph as SVG
function saveOutputAsSvg(outputFile, tempOutputFile) {
    return __awaiter(this, void 0, void 0, function* () {
        var svg = yield fs.promises.readFile(tempOutputFile, { encoding: 'utf8' });
        svg = yield applyIcons(svg);
        // Adding some indent to node labels, so that icons fit in
        svg = svg.replace('</style>', '.label > g > text { transform: translateX(25px); }' +
            '</style>');
        yield fs.promises.writeFile(outputFile, svg);
    });
}
// saves resulting Function Graph as HTML
function saveOutputAsHtml(projectName, outputFile, tempOutputFile, traverseResult, settings) {
    return __awaiter(this, void 0, void 0, function* () {
        const htmlTemplateFile = !!settings.templateFile ? settings.templateFile : path.resolve(__dirname, '..', '..', 'graph-template.htm');
        var html = yield fs.promises.readFile(htmlTemplateFile, { encoding: 'utf8' });
        var svg = yield fs.promises.readFile(tempOutputFile, { encoding: 'utf8' });
        svg = yield applyIcons(svg);
        html = html.replace(/{{GRAPH_SVG}}/g, svg);
        html = html.replace(/{{PROJECT_NAME}}/g, projectName);
        html = html.replace(/const functionsMap = {}/g, `const functionsMap = ${JSON.stringify(traverseResult.functions)}`);
        html = html.replace(/const proxiesMap = {}/g, `const proxiesMap = ${JSON.stringify(traverseResult.proxies)}`);
        yield fs.promises.writeFile(outputFile, html);
    });
}
// saves resulting Function Graph as .md file
function saveOutputAsMarkdown(projectName, outputFile, diagramCode, settings) {
    return __awaiter(this, void 0, void 0, function* () {
        const markdownTemplateFile = !!settings.templateFile ? settings.templateFile : path.resolve(__dirname, '..', '..', 'graph-template.md');
        var markdown = yield fs.promises.readFile(markdownTemplateFile, { encoding: 'utf8' });
        markdown = markdown.replace(/{{GRAPH_CODE}}/g, diagramCode);
        markdown = markdown.replace(/{{PROJECT_NAME}}/g, projectName);
        yield fs.promises.writeFile(outputFile, markdown);
    });
}
// executes mermaid CLI from command line
function runMermaidCli(inputFile, outputFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const packageJsonPath = path.resolve(__dirname, '..', '..');
        // Explicitly installing mermaid-cli. Don't want to add it to package.json, because it is quite heavy.
        const mermaidCliPath = path.resolve(packageJsonPath, 'node_modules', '@mermaid-js', 'mermaid-cli', 'index.bundle.js');
        if (!fs.existsSync(mermaidCliPath)) {
            console.log(`installing mermaid-cli in ${packageJsonPath}...`);
            // Something got broken in the latest mermaid-cli, so need to lock down the version here
            yield execAsync('npm i --no-save @mermaid-js/mermaid-cli@9.1.4', { cwd: packageJsonPath });
            console.log('mermaid-cli installed');
        }
        const mermaidConfigPath = path.resolve(__dirname, '..', '..', 'mermaid.config.json');
        yield new Promise((resolve, reject) => {
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
    });
}
// injects icons SVG into the resulting SVG
function applyIcons(svg) {
    return __awaiter(this, void 0, void 0, function* () {
        const iconsSvg = yield fs.promises.readFile(path.resolve(__dirname, '..', 'all-azure-icons.svg'), { encoding: 'utf8' });
        // Placing icons code into a <defs> block at the top
        svg = svg.replace(`><style>`, `>\n<defs>\n${iconsSvg}</defs>\n<style>`);
        // Adding <use> blocks referencing relevant icons
        svg = svg.replace(/<g style="opacity: [0-9.]+;" transform="translate\([0-9,.-]+\)" id="[^"]+" class="node (\w+).*?<g transform="translate\([0-9,.-]+\)" class="label"><g transform="translate\([0-9,.-]+\)">/g, `$&<use href="#az-icon-$1" width="20px" height="20px"/>`);
        return svg;
    });
}
// Tries to get remote origin info from git
function getGitRepoInfo(projectFolder, repoInfoFromSettings = null) {
    return __awaiter(this, void 0, void 0, function* () {
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
        var originUrl = repoInfoFromSettings === null || repoInfoFromSettings === void 0 ? void 0 : repoInfoFromSettings.originUrl;
        if (!originUrl) {
            // trying to get remote origin URL via git
            try {
                originUrl = (yield execAsync('git config --get remote.origin.url', execParams))
                    .stdout
                    .toString()
                    .replace(/\n+$/, '') // trims end-of-line, if any
                    .replace(/\/+$/, ''); // trims the trailing slash, if any
            }
            catch (err) {
                console.warn(`Unable to get remote origin URL. ${err}`);
                return null;
            }
        }
        // This tool should never expose any credentials
        originUrl = originUrl.replace(/:\/\/[^\/]*@/i, '://');
        if (originUrl.endsWith('.git')) {
            originUrl = originUrl.substr(0, originUrl.length - 4);
        }
        var branchName = repoInfoFromSettings === null || repoInfoFromSettings === void 0 ? void 0 : repoInfoFromSettings.branchName, tagName = repoInfoFromSettings === null || repoInfoFromSettings === void 0 ? void 0 : repoInfoFromSettings.tagName;
        if (!branchName && !tagName) {
            // trying to get branch/tag name (which might be different from default) via git
            try {
                branchName = (yield execAsync('git rev-parse --abbrev-ref HEAD', execParams))
                    .stdout
                    .toString()
                    .replace(/\n+$/, ''); // trims end-of-line, if any
                if (branchName === 'HEAD') { // this indicates that we're on a tag
                    // trying to get that tag name
                    tagName = (yield execAsync('git describe --tags', execParams))
                        .stdout
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
        }
        var repoName = repoInfoFromSettings === null || repoInfoFromSettings === void 0 ? void 0 : repoInfoFromSettings.repoName;
        if (!repoName) {
            // expecting repo name to be the last segment of remote origin URL
            const p = originUrl.lastIndexOf('/');
            if (p < 0) {
                return null;
            }
            repoName = originUrl.substr(p + 1);
        }
        return { originUrl, repoName, branchName, tagName };
    });
}
exports.getGitRepoInfo = getGitRepoInfo;
// tries to point source links to the remote repo
function convertLocalPathsToRemote(map, sourcesRootFolder, repoInfo) {
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
}
exports.convertLocalPathsToRemote = convertLocalPathsToRemote;
//# sourceMappingURL=renderDiagramWithCli.js.map