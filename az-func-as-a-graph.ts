import * as rimraf from 'rimraf';

import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import * as crypto from 'crypto';

import { traverseFunctionProject } from './traverse-func/traverseFunctionProject';
import { buildFunctionDiagramCode } from './ui/src/buildFunctionDiagramCode';
import { FunctionsMap } from './ui/src/shared/FunctionsMap';

function runMermaidCli(inputFile: string, outputFile: string): Promise<void> {

    // Explicitly installing mermaid-cli. Don't want to add it to package.json, because it is quite heavy.
    const mermaidCliPath = path.join('.', 'node_modules', '@mermaid-js', 'mermaid-cli', 'index.bundle.js');
    if (!fs.existsSync(mermaidCliPath)) {
        cp.execSync('npm i --no-save @mermaid-js/mermaid-cli');
    }

    return new Promise((resolve, reject) => {

        const proc = cp.fork(mermaidCliPath, ['-i', inputFile, '-o', outputFile]);

        proc.on('exit', (exitCode) => {

            if (exitCode === 0) {
                resolve();
            } else {
                reject(new Error(`Mermaid failed with status code ${exitCode}`));
            }
        });
    });
}

async function applyIcons(svg: string): Promise<string> {

    const iconsSvg = await fs.promises.readFile(path.join('.', 'ui', 'build', 'static', 'icons', 'all-azure-icons.svg'), { encoding: 'utf8' });

    // Placing icons code into a <defs> block at the top
    svg = svg.replace(`><style>`, `>\n<defs>\n${iconsSvg}</defs>\n<style>`);

    // Adding <use> blocks referencing relevant icons
    svg = svg.replace(/<g class="node (\w+).*?<g class="label" transform="translate\([0-9,.-]+\)"><g transform="translate\([0-9,.-]+\)">/g,
    `$&<use href="#az-icon-$1" width="20px" height="20px"/>`);

    return svg;
}

// Tries to convert local file names to their GitHub URL equivalents
function convertLocalPathsToGitHub(functions: FunctionsMap, orgUrl: string, repoName: string, branchName: string): FunctionsMap{

    if (!orgUrl || !repoName || !branchName) {
        return functions;
    }

    for (const funcName in functions) {
        
        const func = functions[funcName];

        if (!func.filePath) {
            continue;
        }

        const repoNameWithSeparators = path.sep + repoName + path.sep;

        const pos = func.filePath.indexOf(repoNameWithSeparators);
        if (pos < 0) {
            continue;
        }

        const relativePath = func.filePath.substr(pos + repoNameWithSeparators.length).split(path.sep);
        func.filePath = `${orgUrl}/${repoName}/blob/${branchName}/${relativePath.join('/')}#L${func.lineNr}`;
    }

    return functions;
}

// Does the main job
async function az_func_as_a_graph(projectFolder: string, outputFile: string, htmlTemplateFile: string) {

    if (!projectFolder) {
        console.error('Path to an Azure Functions project not specified');
        return;
    }

    if (!outputFile) {
        outputFile = 'function-graph.svg';
    }

    if (!htmlTemplateFile) {
        htmlTemplateFile = 'graph-template.htm';
    }
    
    var tempFilesAndFolders = [];
    try {

        const traverseResult = await traverseFunctionProject(projectFolder, console.log);

        tempFilesAndFolders = traverseResult.tempFolders;

        var functions = traverseResult.functions;
        const diagramCode = 'graph LR\n' + await buildFunctionDiagramCode(functions);
        
        const tempInputFile = path.join(os.tmpdir(), crypto.randomBytes(20).toString('hex') + '.mmd');
        await fs.promises.writeFile(tempInputFile, diagramCode);
        tempFilesAndFolders.push(tempInputFile);

        const outputFileExt = path.extname(outputFile).toLowerCase();
        const isHtmlOutput = ['.htm', '.html'].includes(outputFileExt);

        const tempOutputFile = path.join(os.tmpdir(), crypto.randomBytes(20).toString('hex') + (isHtmlOutput ? '.svg' : outputFileExt));
        tempFilesAndFolders.push(tempOutputFile);

        await runMermaidCli(tempInputFile, tempOutputFile);

        if (isHtmlOutput) {

            var html = await fs.promises.readFile(htmlTemplateFile, { encoding: 'utf8' });

            var svg = await fs.promises.readFile(tempOutputFile, { encoding: 'utf8' });
            svg = await applyIcons(svg);

            const projectName = path.basename(projectFolder);

            html = html.replace(/{{PROJECT_NAME}}/g, projectName);
            html = html.replace(/{{GRAPH_SVG}}/g, svg);

            functions = convertLocalPathsToGitHub(functions, traverseResult.orgUrl, traverseResult.repoName, traverseResult.branchName);
            html = html.replace(/const functionsMap = {}/g, `const functionsMap = ${JSON.stringify(functions)}`);

            await fs.promises.writeFile(outputFile, html);

        } else if (outputFileExt === '.svg') {

            var svg = await fs.promises.readFile(tempOutputFile, { encoding: 'utf8' });
            svg = await applyIcons(svg);
            await fs.promises.writeFile(outputFile, svg);

        } else {

            await fs.promises.copyFile(tempOutputFile, outputFile);
        }

        console.log(`Diagram was successfully generated and saved to ${outputFile}`);

    } catch (err) {

        console.error(`Failed to generate graph. ${err}`);

    } finally {
        for (const tempFolder of tempFilesAndFolders) {
            rimraf.sync(tempFolder)
        }
    }
}

az_func_as_a_graph(process.argv[2], process.argv[3], process.argv[4]);