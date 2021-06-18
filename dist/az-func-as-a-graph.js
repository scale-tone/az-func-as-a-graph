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
        const proc = cp.fork(mermaidCliPath, ['-i', inputFile, '-o', outputFile]);
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
function az_func_as_a_graph(projectFolder, outputFile) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!projectFolder) {
            console.error('Path to an Azure Functions project not specified');
            return;
        }
        if (!outputFile) {
            outputFile = 'function-graph.svg';
        }
        var tempFilesAndFolders = [];
        try {
            const traverseResult = yield traverseFunctionProject_1.traverseFunctionProject(projectFolder, console.log);
            tempFilesAndFolders = traverseResult.tempFolders;
            const functions = traverseResult.functions;
            const diagramCode = 'graph LR\n' + (yield buildFunctionDiagramCode_1.buildFunctionDiagramCode(functions));
            const tempFileName = path.join(os.tmpdir(), crypto.randomBytes(20).toString('hex') + '.mmd');
            fs.writeFileSync(tempFileName, diagramCode);
            tempFilesAndFolders.push(tempFileName);
            yield runMermaidCli(tempFileName, outputFile);
            if (outputFile.toLowerCase().endsWith('.svg')) {
                var svg = yield fs.promises.readFile(outputFile, { encoding: 'utf8' });
                svg = yield applyIcons(svg);
                yield fs.promises.writeFile(outputFile, svg);
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
az_func_as_a_graph(process.argv[2], process.argv[3]);
//# sourceMappingURL=az-func-as-a-graph.js.map