import * as rimraf from 'rimraf';

import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import * as crypto from 'crypto';

import { traverseFunctionProject } from './traverse-func/traverseFunctionProject';
import { buildFunctionDiagramCode } from './ui/src/buildFunctionDiagramCode';

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

    const iconFolder = path.join('.', 'ui', 'build', 'static', 'icons');

    var iconsSvg = '';
    const azIconIdPrefix = 'az-icon-';

    for (const iconFileName of await fs.promises.readdir(iconFolder)) {
        const iconFilePath = path.join(iconFolder, iconFileName);

        var iconSvg = await fs.promises.readFile(iconFilePath, { encoding: 'utf8' });

        // removing xml prefix
        iconSvg = iconSvg.replace(/<\?xml .+\?>/, '');

        // adding/replacing id attribute
        const idString = ` id="${azIconIdPrefix}${path.basename(iconFilePath, '.svg')}"`;

        const match = /\s+id=".+"/.exec(iconSvg);
        if (!!match) {

            iconSvg = iconSvg.substr(0, match.index) + idString + iconSvg.substr(match.index + match[0].length);

        } else {

            iconSvg = iconSvg.replace(/<svg\s+/, `<svg id="${azIconIdPrefix}${path.basename(iconFilePath, '.svg')}" `);
        }

        iconsSvg += iconSvg + '\n';
    }

    svg = svg.replace(`><style>`, `>\n<defs>\n${iconsSvg}</defs>\n<style>`);

    svg = svg.replace(/<g class="node (\w+).*?<g class="label" transform="translate\([0-9,.-]+\)"><g transform="translate\([0-9,.-]+\)">/g,
    `$&<use href="#${azIconIdPrefix}$1" width="20px" height="20px"/>`);

    return svg;
}

async function az_func_as_a_graph(projectFolder: string, outputFile: string) {

    if (!projectFolder) {
        console.error('Path to an Azure Functions project not specified');
        return;
    }

    if (!outputFile) {
        outputFile = 'function-graph.png';
    }
    
    var tempFilesAndFolders = [];
    try {

        const traverseResult = await traverseFunctionProject(projectFolder, console.log);
        tempFilesAndFolders = traverseResult.tempFolders;

        const functions = traverseResult.functions;
        const diagramCode = 'graph LR\n' + await buildFunctionDiagramCode(functions);
        
        const tempFileName = path.join(os.tmpdir(), crypto.randomBytes(20).toString('hex') + '.mmd');
        fs.writeFileSync(tempFileName, diagramCode);
        tempFilesAndFolders.push(tempFileName);

        await runMermaidCli(tempFileName, outputFile);

        if (outputFile.toLowerCase().endsWith('.svg')) {

            var svg = await fs.promises.readFile(outputFile, { encoding: 'utf8' });
            svg = await applyIcons(svg);
            await fs.promises.writeFile(outputFile, svg);
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

az_func_as_a_graph(process.argv[2], process.argv[3]);