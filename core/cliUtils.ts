import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import * as crypto from 'crypto';
import * as util from 'util';
const execAsync = util.promisify(cp.exec);

import { GraphSettings, TraverseFunctionResult } from './FunctionsMap';
import { GitRepositoryInfo, convertLocalPathsToRemote, getGitRepoInfo } from './gitUtils';
import { FunctionProjectParser } from './functionProjectParser';
import { FileSystemWrapper } from './fileSystemWrapper';
import { buildFunctionDiagramCode } from './buildFunctionDiagramCode';

export type GraphCliSettings = GraphSettings & {
    templateFile?: string;
    htmlTemplateFile?: string; // obsolete, but still supported
    repoInfo?: GitRepositoryInfo;
    sourcesRootFolder?: string;
};

// Generates a diagram for a given Functions project and saves it to a given outputFile
export async function renderDiagram(projectFolder: string, outputFile: string = 'function-graph.svg', settings: GraphCliSettings = {}, log: (s: any) => void = console.log) { 

    // To support both old and new property names
    if (!!settings.htmlTemplateFile && !settings.templateFile) {
        settings.templateFile = settings.htmlTemplateFile;
    }
    
    const outputFolder = path.dirname(outputFile);
    if (!fs.existsSync(outputFolder)) {
        
        log(`Creating output folder ${outputFolder}`);
        fs.promises.mkdir(outputFolder, { recursive: true });
    }

    const traverseResult = await FunctionProjectParser.parseFunctions(projectFolder, new FileSystemWrapper(), log);
    projectFolder = traverseResult.projectFolder;

    // Trying to convert local source file paths into links to remote repo
    const repoInfo = await getGitRepoInfo(projectFolder, settings.repoInfo);
    if (!!repoInfo) {
        
        log(`Using repo URI: ${repoInfo.originUrl}, repo name: ${repoInfo.repoName}, branch: ${repoInfo.branchName}, tag: ${repoInfo.tagName}`);

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

        log(`Functions Map saved to ${outputFile}`);

        return;
    }

    var diagramCode = await buildFunctionDiagramCode(traverseResult.functions, traverseResult.proxies, settings);
    diagramCode = 'graph LR\n' + (!!diagramCode ? diagramCode : 'empty["#32;(empty)"]');

    log('Diagram code:');
    log(diagramCode);
    
    if (outputFileExt === '.md') {

        // just saving the diagram as a Markdown file and quitting
        await saveOutputAsMarkdown(!!repoInfo ? repoInfo.repoName : path.basename(projectFolder), outputFile, diagramCode, settings);

        log(`Diagram was successfully generated and saved to ${outputFile}`);

        return;
    }

    const tempInputFile = path.join(os.tmpdir(), crypto.randomBytes(20).toString('hex') + '.mmd');
    const isHtmlOutput = ['.htm', '.html'].includes(outputFileExt);
    const tempOutputFile = path.join(os.tmpdir(), crypto.randomBytes(20).toString('hex') + (isHtmlOutput ? '.svg' : outputFileExt));

    try {

        await fs.promises.writeFile(tempInputFile, diagramCode);

        await runMermaidCli(tempInputFile, tempOutputFile, log);

        if (isHtmlOutput) {
    
            await saveOutputAsHtml(!!repoInfo ? repoInfo.repoName : path.basename(projectFolder), outputFile, tempOutputFile, traverseResult, settings);
    
        } else if (outputFileExt === '.svg') {
    
            await saveOutputAsSvg(outputFile, tempOutputFile);
    
        } else {
    
            await fs.promises.copyFile(tempOutputFile, outputFile);
        }
    
        log(`Diagram was successfully generated and saved to ${outputFile}`);

    } finally {

        await fs.promises.rm(tempInputFile, {force: true});        
        await fs.promises.rm(tempOutputFile, {force: true});        
    }
}

// saves resulting Function Graph as SVG
async function saveOutputAsSvg(outputFile: string, tempOutputFile: string) {
    
    var svg = await fs.promises.readFile(tempOutputFile, { encoding: 'utf8' });

    svg = await applyIcons(svg);

    // Adding some indent to node labels, so that icons fit in
    svg = svg.replace('</style>',
        '.label > g > text { transform: translateX(25px); }' +
        '</style>'
    );
    
    await fs.promises.writeFile(outputFile, svg);
}

// saves resulting Function Graph as HTML
async function saveOutputAsHtml(projectName: string, outputFile: string, tempOutputFile: string, traverseResult: TraverseFunctionResult, settings: GraphCliSettings) {
    
    const htmlTemplateFile = !!settings.templateFile ? settings.templateFile : path.resolve(__dirname, 'graph-template.htm');

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
    
    const markdownTemplateFile = !!settings.templateFile ? settings.templateFile : path.resolve(__dirname, 'graph-template.md');

    var markdown = await fs.promises.readFile(markdownTemplateFile, { encoding: 'utf8' });

    markdown = markdown.replace(/{{GRAPH_CODE}}/g, diagramCode);
    markdown = markdown.replace(/{{PROJECT_NAME}}/g, projectName);

    await fs.promises.writeFile(outputFile, markdown);
}

// executes mermaid CLI from command line
async function runMermaidCli(inputFile: string, outputFile: string, log: (s: any) => void): Promise<void> {

    const packageJsonPath = path.resolve(__dirname, '..', '..', '..');

    // Explicitly installing mermaid-cli. Don't want to add it to package.json, because it is quite heavy.
    const mermaidCliPath = path.resolve(packageJsonPath, 'node_modules', '@mermaid-js', 'mermaid-cli', 'index.bundle.js');

    if (!fs.existsSync(mermaidCliPath)) {
        log(`installing mermaid-cli in ${packageJsonPath}...`)
        // Something got broken in the latest mermaid-cli, so need to lock down the version here
        await execAsync('npm i --no-save @mermaid-js/mermaid-cli@9.1.4', { cwd: packageJsonPath });
        log('mermaid-cli installed')
    }

    const mermaidConfigPath = path.resolve(__dirname, 'mermaid.config.json');

    await new Promise<void>((resolve, reject) => {

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
export async function applyIcons(svg: string): Promise<string> {

    const iconsSvg = await fs.promises.readFile(path.resolve(__dirname, 'all-azure-icons.svg'), { encoding: 'utf8' });

    // Placing icons code into a <defs> block at the top
    svg = svg.replace(`><style>`, `>\n<defs>\n${iconsSvg}</defs>\n<style>`);

    // Adding <use> blocks referencing relevant icons
    svg = svg.replace(/<g style="opacity: [0-9.]+;" transform="translate\([0-9,.-]+\)" id="[^"]+" class="node (\w+).*?<g transform="translate\([0-9,.-]+\)" class="label"><g transform="translate\([0-9,.-]+\)">/g,
        `$&<use href="#az-icon-$1" width="20px" height="20px"/>`);

    return svg;
}