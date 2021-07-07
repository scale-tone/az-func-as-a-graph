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
const rimraf = require("rimraf");
const os = require("os");
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const crypto = require("crypto");
const traverseFunctionProject_1 = require("./traverse-func/traverseFunctionProject");
const buildFunctionDiagramCode_1 = require("./ui/src/buildFunctionDiagramCode");
function runMermaidCli(inputFile, outputFile) {
    // Explicitly installing mermaid-cli. Don't want to add it to package.json, because it is quite heavy.
    const mermaidCliPath = path.join('.', 'node_modules', '@mermaid-js', 'mermaid-cli', 'index.bundle.js');
    if (!fs.existsSync(mermaidCliPath)) {
        cp.execSync('npm i --no-save @mermaid-js/mermaid-cli');
    }
    return new Promise((resolve, reject) => {
        const proc = cp.fork(mermaidCliPath, ['-i', inputFile, '-o', outputFile, '-c', 'mermaid.config.json']);
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
function applyIcons(svg) {
    return __awaiter(this, void 0, void 0, function* () {
        const iconsSvg = yield fs.promises.readFile(path.join('.', 'ui', 'build', 'static', 'icons', 'all-azure-icons.svg'), { encoding: 'utf8' });
        // Placing icons code into a <defs> block at the top
        svg = svg.replace(`><style>`, `>\n<defs>\n${iconsSvg}</defs>\n<style>`);
        // Adding <use> blocks referencing relevant icons
        svg = svg.replace(/<g class="node (\w+).*?<g class="label" transform="translate\([0-9,.-]+\)"><g transform="translate\([0-9,.-]+\)">/g, `$&<use href="#az-icon-$1" width="20px" height="20px"/>`);
        return svg;
    });
}
// Tries to convert local file names to their GitHub URL equivalents
function convertLocalPathsToGitHub(functions, gitHubInfo) {
    if (!gitHubInfo || !gitHubInfo.orgUrl || !gitHubInfo.repoName || !gitHubInfo.branchName) {
        return functions;
    }
    for (const funcName in functions) {
        const func = functions[funcName];
        if (!func.filePath) {
            continue;
        }
        const repoNameWithSeparators = path.sep + gitHubInfo.repoName + path.sep;
        const pos = func.filePath.indexOf(repoNameWithSeparators);
        if (pos < 0) {
            continue;
        }
        const relativePath = func.filePath.substr(pos + repoNameWithSeparators.length).split(path.sep);
        func.filePath = `${gitHubInfo.orgUrl}/${gitHubInfo.repoName}/blob/${gitHubInfo.branchName}/${relativePath.join('/')}#L${func.lineNr}`;
    }
    return functions;
}
// Does the main job
function az_func_as_a_graph(projectFolder, outputFile, settingsFile) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!projectFolder) {
            console.error('Path to an Azure Functions project not specified');
            return;
        }
        if (!outputFile) {
            outputFile = 'function-graph.svg';
        }
        var htmlTemplateFile = 'graph-template.htm';
        var graphSettings = {};
        var tempFilesAndFolders = [];
        try {
            if (!!settingsFile) {
                if (['.htm', '.html'].includes(path.extname(settingsFile).toLowerCase())) {
                    htmlTemplateFile = settingsFile;
                }
                else {
                    const graphSettingsString = yield fs.promises.readFile(settingsFile, { encoding: 'utf8' });
                    graphSettings = JSON.parse(graphSettingsString);
                    if (!!graphSettings.htmlTemplateFile) {
                        htmlTemplateFile = graphSettings.htmlTemplateFile;
                    }
                }
            }
            const traverseResult = yield traverseFunctionProject_1.traverseFunctionProject(projectFolder, console.log);
            tempFilesAndFolders = traverseResult.tempFolders;
            const diagramCode = 'graph LR\n' + (yield buildFunctionDiagramCode_1.buildFunctionDiagramCode(traverseResult.functions, traverseResult.proxies, graphSettings));
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
                const projectName = path.basename(projectFolder);
                html = html.replace(/{{PROJECT_NAME}}/g, projectName);
                html = html.replace(/{{GRAPH_SVG}}/g, svg);
                html = html.replace(/const functionsMap = {}/g, `const functionsMap = ${JSON.stringify(convertLocalPathsToGitHub(traverseResult.functions, traverseResult.gitHubInfo))}`);
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
        catch (err) {
            console.error(`Failed to generate graph. ${err}`);
        }
        finally {
            for (const tempFolder of tempFilesAndFolders) {
                rimraf.sync(tempFolder);
            }
        }
    });
}
az_func_as_a_graph(process.argv[2], process.argv[3], process.argv[4]);
//# sourceMappingURL=az-func-as-a-graph.js.map