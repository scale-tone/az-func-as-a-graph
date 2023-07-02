/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FileSystemWrapper = void 0;
const vscode = __webpack_require__(1);
const fileSystemWrapperBase_1 = __webpack_require__(3);
class FileSystemWrapper extends fileSystemWrapperBase_1.FileSystemWrapperBase {
    joinPath(path1, path2) {
        return vscode.Uri.joinPath(vscode.Uri.parse(path1), path2).toString();
    }
    dirName(path1) {
        const i = path1.lastIndexOf('/');
        if (i < 0) {
            throw new Error(`Failed to extract parent folder name from path ${path1}. The path does not contain a separator.`);
        }
        return path1.substring(0, i);
    }
    async readFile(path) {
        const uri = vscode.Uri.parse(path);
        const bytes = await vscode.workspace.fs.readFile(uri);
        return new TextDecoder().decode(bytes);
    }
    async isDirectory(path) {
        const uri = vscode.Uri.parse(path);
        const stat = await vscode.workspace.fs.stat(uri);
        return stat.type === vscode.FileType.Directory;
    }
    async readDir(path) {
        const uri = vscode.Uri.parse(path);
        const files = await vscode.workspace.fs.readDirectory(uri);
        return files.map(f => f[0]);
    }
    async pathExists(path) {
        const uri = vscode.Uri.parse(path);
        try {
            const stat = await vscode.workspace.fs.stat(uri);
            return stat.type === vscode.FileType.File || stat.type === vscode.FileType.Directory;
        }
        catch (err) {
            return false;
        }
    }
}
exports.FileSystemWrapper = FileSystemWrapper;


/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FileSystemWrapperBase = void 0;
const traverseFunctionProjectUtils_1 = __webpack_require__(4);
const ExcludedFolders = ['node_modules', 'target', 'bin', 'obj', '.vs', '.vscode', '.env', '.python_packages', '.git', '.github'];
// Base class for implementing filesystem wrappers
class FileSystemWrapperBase {
    async readFunctionsJson(hostJsonFolder, log) {
        let functions = {};
        // Reading function.json files, in parallel
        const promises = (await this.readDir(hostJsonFolder)).map(async (functionName) => {
            const fullPath = this.joinPath(hostJsonFolder, functionName);
            const functionJsonFilePath = this.joinPath(fullPath, 'function.json');
            const isDirectory = await this.isDirectory(fullPath);
            const functionJsonExists = await this.pathExists(functionJsonFilePath);
            if (isDirectory && functionJsonExists) {
                try {
                    const functionJsonString = await this.readFile(functionJsonFilePath);
                    const functionJson = JSON.parse(functionJsonString);
                    functions[functionName] = { bindings: functionJson.bindings, isCalledBy: [], isSignalledBy: [] };
                }
                catch (err) {
                    log(`>>> Failed to parse ${functionJsonFilePath}: ${err}`);
                }
            }
        });
        await Promise.all(promises);
        return functions;
    }
    async readProxiesJson(projectFolder, log) {
        const proxiesJsonPath = this.joinPath(projectFolder, 'proxies.json');
        if (!(await this.pathExists(proxiesJsonPath))) {
            return {};
        }
        const proxiesJsonString = await this.readFile(proxiesJsonPath);
        try {
            const proxies = JSON.parse(proxiesJsonString).proxies;
            if (!proxies) {
                return {};
            }
            var notAddedToCsProjFile = false;
            if (await this.isCSharpProjectAsync(projectFolder)) {
                // Also checking that proxies.json is added to .csproj file
                const csProjFile = await this.findFileRecursivelyAsync(projectFolder, '.+\\.csproj$', true);
                const proxiesJsonEntryRegex = new RegExp(`\\s*=\\s*"proxies.json"\\s*>`);
                if (!!csProjFile && csProjFile.code && (!proxiesJsonEntryRegex.exec(csProjFile.code))) {
                    notAddedToCsProjFile = true;
                }
            }
            // Also adding filePath and lineNr
            for (var proxyName in proxies) {
                const proxy = proxies[proxyName];
                proxy.filePath = proxiesJsonPath;
                if (notAddedToCsProjFile) {
                    proxy.warningNotAddedToCsProjFile = true;
                }
                const proxyNameRegex = new RegExp(`"${proxyName}"\\s*:`);
                const match = proxyNameRegex.exec(proxiesJsonString);
                if (!!match) {
                    proxy.pos = match.index;
                    proxy.lineNr = (0, traverseFunctionProjectUtils_1.posToLineNr)(proxiesJsonString, proxy.pos);
                }
            }
            return proxies;
        }
        catch (err) {
            log(`>>> Failed to parse ${proxiesJsonPath}: ${err}`);
            return {};
        }
    }
    async isCSharpProjectAsync(projectFolder) {
        return (await this.readDir(projectFolder)).some(fn => {
            fn = fn.toLowerCase();
            return (fn.endsWith('.csproj') && fn !== 'extensions.csproj');
        });
    }
    async isFSharpProjectAsync(projectFolder) {
        return (await this.readDir(projectFolder)).some(fn => {
            fn = fn.toLowerCase();
            return fn.endsWith('.fsproj');
        });
    }
    async isJavaProjectAsync(projectFolder) {
        const javaFileMatch = await this.findFileRecursivelyAsync(projectFolder, `.+\\.java$`, false);
        return !!javaFileMatch;
    }
    async isPowershellProjectAsync(projectFolder) {
        const firstFunctionJsonFile = await this.findFileRecursivelyAsync(projectFolder, `function.json`, false);
        if (!firstFunctionJsonFile || !firstFunctionJsonFile.filePath) {
            return false;
        }
        const psFileMatch = await this.findFileRecursivelyAsync(this.dirName(firstFunctionJsonFile.filePath), `.+\\.ps1$`, false);
        return !!psFileMatch;
    }
    async isPythonV2ProjectAsync(projectFolder) {
        const pyFileMatch = await this.findFileRecursivelyAsync(projectFolder, `.+\\.py$`, false);
        const functionJsonFileMatch = await this.findFileRecursivelyAsync(projectFolder, `function.json`, false);
        return !!pyFileMatch && !functionJsonFileMatch;
    }
    async findFileRecursivelyAsync(folder, fileName, returnFileContents, pattern) {
        const fileNameRegex = typeof fileName === 'string' ? new RegExp(fileName, 'i') : fileName;
        const subFolders = [];
        for (const name of await this.readDir(folder)) {
            const fullPath = this.joinPath(folder, name);
            const isDirectory = await this.isDirectory(fullPath);
            if (!!isDirectory) {
                if (!ExcludedFolders.includes(name.toLowerCase())) {
                    subFolders.push(fullPath);
                }
            }
            else if (!!fileNameRegex.exec(name)) {
                if (!pattern) {
                    return {
                        filePath: fullPath,
                        code: returnFileContents ? (await this.readFile(fullPath)) : undefined
                    };
                }
                const code = await this.readFile(fullPath);
                const match = pattern.exec(code);
                if (!!match) {
                    return {
                        filePath: fullPath,
                        code: returnFileContents ? code : undefined,
                        pos: match.index,
                        length: match[0].length
                    };
                }
            }
        }
        // Now recursively trying subfolders. Doing this _after_ checking the current folder.
        for (const subFolder of subFolders) {
            const result = await this.findFileRecursivelyAsync(subFolder, fileNameRegex, returnFileContents, pattern);
            if (!!result) {
                return result;
            }
        }
        return undefined;
    }
    async *findFilesRecursivelyAsync(folder, fileNameRegex) {
        for (const name of await this.readDir(folder)) {
            var fullPath = this.joinPath(folder, name);
            const isDirectory = await this.isDirectory(fullPath);
            if (!!isDirectory) {
                if (ExcludedFolders.includes(name.toLowerCase())) {
                    continue;
                }
                for await (const path of this.findFilesRecursivelyAsync(fullPath, fileNameRegex)) {
                    yield path;
                }
            }
            else if (!!fileNameRegex.exec(name)) {
                yield fullPath;
            }
        }
    }
    async *findFunctionsRecursivelyAsync(folder, fileNameRegex, functionAttributeRegex) {
        for await (const fullPath of this.findFilesRecursivelyAsync(folder, fileNameRegex)) {
            const code = await this.readFile(fullPath);
            var match;
            while (!!(match = functionAttributeRegex.regex.exec(code))) {
                let functionName = (0, traverseFunctionProjectUtils_1.cleanupFunctionName)(match[functionAttributeRegex.pos]);
                const functionAttributeEndPos = match.index + match[0].length;
                const body = (0, traverseFunctionProjectUtils_1.getCodeInBrackets)(code, functionAttributeEndPos, '{', '}', '\n');
                if (body.openBracketPos >= 0 && !!body.code) {
                    yield {
                        functionName,
                        filePath: fullPath,
                        pos: match.index,
                        lineNr: (0, traverseFunctionProjectUtils_1.posToLineNr)(code, match.index),
                        declarationCode: body.code.substring(0, body.openBracketPos),
                        bodyCode: body.code.substring(body.openBracketPos)
                    };
                }
                else {
                    // Returning the rest of the file
                    yield {
                        functionName,
                        filePath: fullPath,
                        pos: match.index,
                        lineNr: (0, traverseFunctionProjectUtils_1.posToLineNr)(code, match.index),
                        declarationCode: code.substring(functionAttributeEndPos),
                        bodyCode: code.substring(functionAttributeEndPos)
                    };
                    break;
                }
            }
        }
    }
}
exports.FileSystemWrapperBase = FileSystemWrapperBase;


/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getCodeInBracketsReverse = exports.getCodeInBrackets = exports.posToLineNr = exports.removeNamespace = exports.cleanupFunctionName = void 0;
function cleanupFunctionName(name) {
    if (!name) {
        return name;
    }
    const nameofMatch = new RegExp(`nameof\\s*\\(\\s*([\\w\\.]+)\\s*\\)`).exec(name);
    if (!!nameofMatch) {
        return removeNamespace(nameofMatch[1]);
    }
    name = name.trim();
    if (name.startsWith('"')) {
        return name.replace(/^"/, '').replace(/"$/, '');
    }
    return removeNamespace(name);
}
exports.cleanupFunctionName = cleanupFunctionName;
function removeNamespace(name) {
    if (!name) {
        return name;
    }
    const dotPos = name.lastIndexOf('.');
    if (dotPos >= 0) {
        name = name.substring(dotPos + 1);
    }
    return name.trim();
}
exports.removeNamespace = removeNamespace;
// Primitive way of getting a line number out of symbol position
function posToLineNr(code, pos) {
    if (!code) {
        return 0;
    }
    const lineBreaks = code.substr(0, pos).match(/(\r\n|\r|\n)/g);
    return !lineBreaks ? 1 : lineBreaks.length + 1;
}
exports.posToLineNr = posToLineNr;
// Complements regex's inability to keep up with nested brackets
function getCodeInBrackets(str, startFrom, openingBracket, closingBracket, mustHaveSymbols = '') {
    var bracketCount = 0, openBracketPos = -1, mustHaveSymbolFound = !mustHaveSymbols;
    for (var i = startFrom; i < str.length; i++) {
        switch (str[i]) {
            case openingBracket:
                if (bracketCount <= 0) {
                    openBracketPos = i;
                }
                bracketCount++;
                break;
            case closingBracket:
                bracketCount--;
                if (bracketCount <= 0 && mustHaveSymbolFound) {
                    return { code: str.substring(startFrom, i + 1), openBracketPos: openBracketPos - startFrom };
                }
                break;
        }
        if (bracketCount > 0 && mustHaveSymbols.includes(str[i])) {
            mustHaveSymbolFound = true;
        }
    }
    return { code: '', openBracketPos: -1 };
}
exports.getCodeInBrackets = getCodeInBrackets;
// Complements regex's inability to keep up with nested brackets
function getCodeInBracketsReverse(str, openingBracket, closingBracket) {
    var bracketCount = 0, closingBracketPos = 0;
    for (var i = str.length - 1; i >= 0; i--) {
        switch (str[i]) {
            case closingBracket:
                if (bracketCount <= 0) {
                    closingBracketPos = i;
                }
                bracketCount++;
                break;
            case openingBracket:
                bracketCount--;
                if (bracketCount <= 0) {
                    return { code: str.substring(0, closingBracketPos + 1), openBracketPos: i };
                }
                break;
        }
    }
    return { code: '', openBracketPos: -1 };
}
exports.getCodeInBracketsReverse = getCodeInBracketsReverse;


/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FunctionGraphView = void 0;
const vscode = __webpack_require__(1);
const functionProjectParser_1 = __webpack_require__(6);
const FileSystemWrapper_1 = __webpack_require__(2);
// Represents the function graph view
class FunctionGraphView {
    constructor(_context, _functionProjectUri) {
        this._context = _context;
        this._functionProjectUri = _functionProjectUri;
        // Reference to the already opened WebView with the main page
        this._webViewPanel = null;
        this._staticsFolder = vscode.Uri.joinPath(this._context.extensionUri, 'HtmlStatics');
        this._webViewPanel = this.showWebView();
    }
    // Closes this web view
    cleanup() {
        if (!!this._webViewPanel) {
            this._webViewPanel.dispose();
        }
    }
    // Opens a WebView with function graph page in it
    showWebView() {
        const title = `Functions Graph (${this._functionProjectUri.fsPath})`;
        const panel = vscode.window.createWebviewPanel(FunctionGraphView.viewType, title, vscode.ViewColumn.One, {
            retainContextWhenHidden: true,
            enableScripts: true,
            localResourceRoots: [this._staticsFolder]
        });
        const fileUri = vscode.Uri.joinPath(this._staticsFolder, 'index.html');
        vscode.workspace.fs.readFile(fileUri).then(htmlBytes => {
            let html = new TextDecoder().decode(htmlBytes);
            html = this.fixLinksToStatics(html, this._staticsFolder, panel.webview);
            html = this.embedTheme(html);
            panel.webview.html = html;
        }, err => {
            vscode.window.showErrorMessage(`az-func-as-a-graph failed. ${err.message ?? err}`);
        });
        // handle events from WebView
        panel.webview.onDidReceiveMessage(request => this.handleMessageFromWebView(panel.webview, request), undefined, this._context.subscriptions);
        return panel;
    }
    // Embeds the current color theme
    embedTheme(html) {
        if ([2, 3].includes(vscode.window.activeColorTheme.kind)) {
            return html.replace('<script>var ClientConfig={}</script>', '<script>var ClientConfig={\'theme\':\'dark\'}</script>');
        }
        return html;
    }
    // Does communication between code in WebView and this class
    handleMessageFromWebView(webView, request) {
        switch (request.kind) {
            case 'ShowMessage':
                vscode.window.showInformationMessage(request.data);
                return;
            case 'ShowError':
                vscode.window.showErrorMessage(`az-func-as-a-graph failed. ${request.data}`);
                return;
            case 'SaveAs':
                // Just to be extra sure...
                if (!this.looksLikeSvg(request.data)) {
                    vscode.window.showErrorMessage(`Invalid data format. Save failed.`);
                    return;
                }
                // Saving some file to local hard drive
                vscode.window.showSaveDialog({ defaultUri: vscode.Uri.file('func-map.svg'), filters: { 'SVG Images': ['svg'] } }).then(filePath => {
                    if (!filePath) {
                        return;
                    }
                    const bytes = new TextEncoder().encode(request.data);
                    vscode.workspace.fs.writeFile(filePath, bytes).then(() => {
                        vscode.window.showInformationMessage(`SVG image saved to ${filePath}`);
                    }, err => {
                        vscode.window.showErrorMessage(`Failed to save. ${err.message ?? err}`);
                    });
                });
                return;
            case 'SaveFunctionGraphAsJson':
                if (!this._traversalResult) {
                    return;
                }
                // Saving some file to local hard drive
                vscode.window.showSaveDialog({ defaultUri: vscode.Uri.file('func-map.json'), filters: { 'JSON': ['json'] } }).then(filePath => {
                    if (!filePath) {
                        return;
                    }
                    const bytes = new TextEncoder().encode(JSON.stringify(this._traversalResult, null, 3));
                    vscode.workspace.fs.writeFile(filePath, bytes).then(() => {
                        vscode.window.showInformationMessage(`Diagram JSON saved to ${filePath}`);
                    }, err => {
                        vscode.window.showErrorMessage(`Failed to save. ${err.message ?? err}`);
                    });
                });
                return;
            case 'GotoFunctionCode':
                if (!this._traversalResult) {
                    return;
                }
                const functionName = request.data;
                var functionOrProxy = null;
                if (functionName.startsWith('proxy.')) {
                    functionOrProxy = this._traversalResult.proxies[functionName.substr(6)];
                }
                else {
                    functionOrProxy = this._traversalResult.functions[functionName];
                }
                vscode.window.showTextDocument(vscode.Uri.parse(functionOrProxy.filePath)).then(ed => {
                    const pos = ed.document.positionAt(!!functionOrProxy.pos ? functionOrProxy.pos : 0);
                    ed.selection = new vscode.Selection(pos, pos);
                    ed.revealRange(new vscode.Range(pos, pos));
                });
                return;
            case 'Refresh':
                functionProjectParser_1.FunctionProjectParser.parseFunctions(this._functionProjectUri.toString(), new FileSystemWrapper_1.FileSystemWrapper(), console.log).then(res => {
                    console.log(`>>>>>> ${this._functionProjectUri}: ${Object.keys(res.functions).length} functions`);
                    this._traversalResult = res;
                    webView.postMessage(this._traversalResult);
                }).catch(err => {
                    this._traversalResult = undefined;
                    webView.postMessage(undefined);
                    vscode.window.showErrorMessage(`az-func-as-a-graph failed. ${err.message ?? err}`);
                });
                return;
        }
    }
    fixLinksToStatics(originalHtml, staticsFolder, webView) {
        var resultHtml = originalHtml;
        const regex = / (href|src)="\/([0-9a-z.\/]+)"/ig;
        var match;
        while (match = regex.exec(originalHtml)) {
            const relativePath = match[2];
            const localPath = vscode.Uri.joinPath(staticsFolder, relativePath);
            const newPath = webView.asWebviewUri(localPath).toString();
            resultHtml = resultHtml.replace(`/${relativePath}`, newPath);
        }
        return resultHtml;
    }
    // Validates incoming SVG, just to be extra sure...
    looksLikeSvg(data) {
        return data.startsWith('<svg') && data.endsWith('</svg>') && !data.toLowerCase().includes('<script');
    }
}
exports.FunctionGraphView = FunctionGraphView;
FunctionGraphView.viewType = 'az-func-as-a-graph';


/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FunctionProjectParser = void 0;
const functionProjectScriptParser_1 = __webpack_require__(7);
const cSharpFunctionProjectParser_1 = __webpack_require__(9);
const fSharpFunctionProjectParser_1 = __webpack_require__(11);
const javaFunctionProjectParser_1 = __webpack_require__(12);
const powershellFunctionProjectParser_1 = __webpack_require__(13);
const pythonV2FunctionProjectParser_1 = __webpack_require__(14);
// Parses Azure Functions projects to produce Functions map (list of all Functions, their bindings and connections to other Functions)
class FunctionProjectParser {
    // Collects all function.json files in a Functions project. Also tries to supplement them with bindings
    // extracted from code (if the project is .Net or Java). Also parses and organizes orchestrators/activities 
    // (if the project uses Durable Functions)
    static async parseFunctions(projectFolder, fileSystemWrapper, log) {
        const hostJsonMatch = await fileSystemWrapper.findFileRecursivelyAsync(projectFolder, 'host.json', false);
        if (!hostJsonMatch) {
            throw new Error('host.json file not found under the provided project path');
        }
        log(`>>> Found host.json at ${hostJsonMatch.filePath}`);
        const hostJsonFolder = fileSystemWrapper.dirName(hostJsonMatch.filePath);
        let parser;
        if (await fileSystemWrapper.isCSharpProjectAsync(hostJsonFolder)) {
            parser = new cSharpFunctionProjectParser_1.CSharpFunctionProjectParser(fileSystemWrapper, log);
        }
        else if (await fileSystemWrapper.isFSharpProjectAsync(hostJsonFolder)) {
            parser = new fSharpFunctionProjectParser_1.FSharpFunctionProjectParser(fileSystemWrapper, log);
        }
        else if (await fileSystemWrapper.isJavaProjectAsync(hostJsonFolder)) {
            parser = new javaFunctionProjectParser_1.JavaFunctionProjectParser(fileSystemWrapper, log);
        }
        else if (await fileSystemWrapper.isPowershellProjectAsync(hostJsonFolder)) {
            parser = new powershellFunctionProjectParser_1.PowershellFunctionProjectParser(fileSystemWrapper, log);
        }
        else if (await fileSystemWrapper.isPythonV2ProjectAsync(hostJsonFolder)) {
            parser = new pythonV2FunctionProjectParser_1.PythonV2FunctionProjectParser(fileSystemWrapper, log);
        }
        else {
            parser = new functionProjectScriptParser_1.FunctionProjectScriptParser(fileSystemWrapper, log);
            // For script-based functions use host.json's folder as the root
            projectFolder = hostJsonFolder;
        }
        const functions = await parser.traverseFunctions(projectFolder);
        // Also reading proxies
        const proxies = await fileSystemWrapper.readProxiesJson(projectFolder, log);
        return { functions, proxies, projectFolder };
    }
}
exports.FunctionProjectParser = FunctionProjectParser;


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FunctionProjectScriptParser = void 0;
const traverseFunctionProjectUtils_1 = __webpack_require__(4);
const functionProjectParserBase_1 = __webpack_require__(8);
class FunctionProjectScriptParser extends functionProjectParserBase_1.FunctionProjectParserBase {
    async traverseFunctions(projectFolder) {
        let functions;
        functions = await this._fileSystemWrapper.readFunctionsJson(projectFolder, this._log);
        // Now enriching it with more info extracted from code
        functions = await this.mapOrchestratorsAndActivitiesAsync(functions, projectFolder);
        return functions;
    }
    async getFunctionsAndTheirCodesAsync(functionNames, hostJsonFolder) {
        const promises = functionNames.map(async (name) => {
            let match = await this._fileSystemWrapper.findFileRecursivelyAsync(this._fileSystemWrapper.joinPath(hostJsonFolder, name), '(index\\.ts|index\\.js|__init__\\.py)$', true);
            if (!match) {
                return undefined;
            }
            const pos = !match.pos ? 0 : match.pos;
            const lineNr = (0, traverseFunctionProjectUtils_1.posToLineNr)(match.code, pos);
            return { name, code: match.code, filePath: match.filePath, pos, lineNr };
        });
        return (await Promise.all(promises)).filter(f => !!f);
    }
}
exports.FunctionProjectScriptParser = FunctionProjectScriptParser;


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FunctionProjectParserBase = void 0;
const traverseFunctionProjectUtils_1 = __webpack_require__(4);
// Parses Azure Functions projects to produce Functions map (list of all Functions, their bindings and connections to other Functions)
class FunctionProjectParserBase {
    constructor(_fileSystemWrapper, _log) {
        this._fileSystemWrapper = _fileSystemWrapper;
        this._log = _log;
        this.singleParamRegex = new RegExp(`("|nameof\\s*\\()?([\\w\\.-]+)`);
        this.eventHubParamsRegex = new RegExp(`"([^"]+)"`);
        this.signalRParamsRegex = new RegExp(`"([^"]+)"`);
        this.rabbitMqParamsRegex = new RegExp(`"([^"]+)"`);
        this.blobParamsRegex = new RegExp(`"([^"]+)"`);
        this.cosmosDbParamsRegex = new RegExp(`"([^"]+)"(.|\r|\n)+?"([^"]+)"`);
        this.signalRConnInfoParamsRegex = new RegExp(`"([^"]+)"`);
        this.eventGridParamsRegex = new RegExp(`"([^"]+)"(.|\r|\n)+?"([^"]+)"`);
        this.isOutRegex = new RegExp(`^\\s*\\]\\s*(out |ICollector|IAsyncCollector).*?(,|\\()`, 'g');
        this.httpMethods = [`get`, `head`, `post`, `put`, `delete`, `connect`, `options`, `trace`, `patch`];
        this.httpTriggerRouteRegex = new RegExp(`Route\\s*=\\s*"(.*)"`);
        this.functionReturnTypeRegex = new RegExp(`public\\s*(static\\s*|async\\s*)*(Task\\s*<\\s*)?([\\w\\.]+)`);
    }
    // Tries to match orchestrations and their activities by parsing source code
    async mapOrchestratorsAndActivitiesAsync(functions, projectFolder) {
        const functionNames = Object.keys(functions);
        const orchestratorNames = functionNames.filter(name => functions[name].bindings.some((b) => b.type === 'orchestrationTrigger'));
        const orchestrators = await this.getFunctionsAndTheirCodesAsync(orchestratorNames, projectFolder);
        const activityNames = Object.keys(functions).filter(name => functions[name].bindings.some((b) => b.type === 'activityTrigger'));
        const activities = await this.getFunctionsAndTheirCodesAsync(activityNames, projectFolder);
        const entityNames = functionNames.filter(name => functions[name].bindings.some((b) => b.type === 'entityTrigger'));
        const entities = await this.getFunctionsAndTheirCodesAsync(entityNames, projectFolder);
        const otherFunctionNames = functionNames.filter(name => !functions[name].bindings.some((b) => ['orchestrationTrigger', 'activityTrigger', 'entityTrigger'].includes(b.type)));
        const otherFunctions = await this.getFunctionsAndTheirCodesAsync(otherFunctionNames, projectFolder);
        for (const orch of orchestrators) {
            // Trying to match this orchestrator with its calling function
            const regex = this.getStartNewOrchestrationRegex(orch.name);
            for (const func of otherFunctions) {
                // If this function seems to be calling that orchestrator
                if (!!regex.exec(func.code)) {
                    functions[orch.name].isCalledBy = functions[orch.name].isCalledBy ?? [];
                    functions[orch.name].isCalledBy.push(func.name);
                }
            }
            // Matching suborchestrators
            for (const subOrch of orchestrators) {
                if (orch.name === subOrch.name) {
                    continue;
                }
                // If this orchestrator seems to be calling that suborchestrator
                const regex = this.getCallSubOrchestratorRegex(subOrch.name);
                if (!!regex.exec(orch.code)) {
                    // Mapping that suborchestrator to this orchestrator
                    functions[subOrch.name].isCalledBy = functions[subOrch.name].isCalledBy ?? [];
                    functions[subOrch.name].isCalledBy.push(orch.name);
                }
            }
            // Mapping activities to orchestrators
            this.mapActivitiesToOrchestrator(functions, orch, activityNames);
            // Checking whether orchestrator calls itself
            if (!!this.getContinueAsNewRegex().exec(orch.code)) {
                functions[orch.name].isCalledByItself = true;
            }
            // Trying to map event producers with their consumers
            const eventNames = this.getEventNames(orch.code);
            for (const eventName of eventNames) {
                const regex = this.getRaiseEventRegex(eventName);
                for (const func of otherFunctions) {
                    // If this function seems to be sending that event
                    if (!!regex.exec(func.code)) {
                        functions[orch.name].isSignalledBy = functions[orch.name].isSignalledBy ?? [];
                        functions[orch.name].isSignalledBy.push({ name: func.name, signalName: eventName });
                    }
                }
            }
        }
        for (const entity of entities) {
            // Trying to match this entity with its calling function
            for (const func of otherFunctions) {
                // If this function seems to be calling that entity
                const regex = this.getSignalEntityRegex(entity.name);
                if (!!regex.exec(func.code)) {
                    functions[entity.name].isCalledBy = functions[entity.name].isCalledBy ?? [];
                    functions[entity.name].isCalledBy.push(func.name);
                }
            }
        }
        // Also adding file paths and code positions
        for (const func of otherFunctions.concat(orchestrators).concat(activities).concat(entities)) {
            functions[func.name].filePath = func.filePath;
            functions[func.name].pos = func.pos;
            functions[func.name].lineNr = func.lineNr;
        }
        return functions;
    }
    // Tries to extract event names that this orchestrator is awaiting
    getEventNames(orchestratorCode) {
        const result = [];
        const regex = this.getWaitForExternalEventRegex();
        var match;
        while (!!(match = regex.regex.exec(orchestratorCode))) {
            result.push(match[regex.pos]);
        }
        return result;
    }
    // Tries to match orchestrator with its activities
    mapActivitiesToOrchestrator(functions, orch, activityNames) {
        for (const activityName of activityNames) {
            // If this orchestrator seems to be calling this activity
            const regex = this.getCallActivityRegex(activityName);
            if (!!regex.exec(orch.code)) {
                // Then mapping this activity to this orchestrator
                functions[activityName].isCalledBy = functions[activityName].isCalledBy ?? [];
                functions[activityName].isCalledBy.push(orch.name);
            }
        }
    }
    // Extracts additional bindings info from C#/F# source code
    tryExtractBindings(funcCode) {
        const result = [];
        if (!funcCode) {
            return result;
        }
        const regex = this.getBindingAttributeRegex();
        let match;
        while (!!(match = regex.regex.exec(funcCode))) {
            const isReturn = match[regex.pos - 1] === 'return:';
            let attributeName = match[regex.pos];
            if (attributeName.endsWith(`Attribute`)) {
                attributeName = attributeName.substring(0, attributeName.length - `Attribute`.length);
            }
            const attributeCodeStartIndex = match.index + match[0].length;
            const attributeCode = (0, traverseFunctionProjectUtils_1.getCodeInBrackets)(funcCode, attributeCodeStartIndex, '(', ')', '').code;
            this.isOutRegex.lastIndex = attributeCodeStartIndex + attributeCode.length;
            const isOut = !!this.isOutRegex.exec(funcCode);
            switch (attributeName) {
                case 'read_blob':
                case 'blob_input':
                case 'blob_output':
                case 'BlobInput':
                case 'BlobOutput':
                case 'Blob': {
                    const binding = {
                        type: 'blob',
                        direction: attributeName === 'Blob' ? (isReturn || isOut ? 'out' : 'in') : (attributeName.toLowerCase().endsWith('output') ? 'out' : 'in')
                    };
                    const paramsMatch = this.blobParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.path = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'blob_trigger':
                case 'BlobTrigger': {
                    const binding = { type: 'blobTrigger' };
                    const paramsMatch = this.blobParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.path = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'table_input':
                case 'table_output':
                case 'TableInput':
                case 'TableOutput':
                case 'Table': {
                    const binding = {
                        type: 'table',
                        direction: attributeName === 'Table' ? (isReturn || isOut ? 'out' : 'in') : (attributeName.toLowerCase().endsWith('output') ? 'out' : 'in')
                    };
                    const paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.tableName = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'CosmosDBInput':
                case 'CosmosDBOutput':
                case 'CosmosDB': {
                    const binding = {
                        type: 'cosmosDB',
                        direction: attributeName === 'CosmosDB' ? (isReturn || isOut ? 'out' : 'in') : (attributeName.toLowerCase().endsWith('output') ? 'out' : 'in')
                    };
                    const paramsMatch = this.cosmosDbParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.databaseName = paramsMatch[1];
                        binding.collectionName = paramsMatch[3];
                    }
                    result.push(binding);
                    break;
                }
                case 'cosmos_db_trigger':
                case 'CosmosDBTrigger': {
                    const binding = { type: 'cosmosDBTrigger' };
                    const paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.databaseName = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'event_grid_output':
                case 'EventGrid':
                case 'EventGridOutput': {
                    const binding = { type: 'eventGrid', direction: 'out' };
                    const paramsMatch = this.eventGridParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.topicEndpointUri = paramsMatch[1];
                        binding.topicKeySetting = paramsMatch[3];
                    }
                    result.push(binding);
                    break;
                }
                case 'EventGridTrigger': {
                    const binding = { type: 'eventGridTrigger' };
                    const paramsMatch = this.eventGridParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.topicEndpointUri = paramsMatch[1];
                        binding.topicKeySetting = paramsMatch[3];
                    }
                    result.push(binding);
                    break;
                }
                case 'event_hub_output':
                case 'EventHub':
                case 'EventHubOutput': {
                    const binding = { type: 'eventHub', direction: 'out' };
                    const paramsMatch = this.eventHubParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.eventHubName = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'event_hub_message_trigger':
                case 'EventHubTrigger': {
                    const binding = { type: 'eventHubTrigger' };
                    const paramsMatch = this.eventHubParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.eventHubName = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'Kafka':
                case 'KafkaOutput': {
                    const binding = { type: 'kafka', direction: 'out' };
                    const paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.brokerList = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'KafkaTrigger': {
                    const binding = { type: 'kafkaTrigger' };
                    const paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.brokerList = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'queue_output':
                case 'Queue':
                case 'QueueOutput': {
                    const binding = { type: 'queue', direction: 'out' };
                    const paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'queue_trigger':
                case 'QueueTrigger': {
                    const binding = { type: 'queueTrigger' };
                    const paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'service_bus_queue_output':
                case 'service_bus_topic_output':
                case 'ServiceBus':
                case 'ServiceBusOutput': {
                    const binding = { type: 'serviceBus', direction: 'out' };
                    const paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'service_bus_queue_trigger':
                case 'service_bus_topic_trigger':
                case 'ServiceBusTrigger':
                case 'ServiceBusQueueTrigger':
                case 'ServiceBusTopicTrigger': {
                    const binding = { type: 'serviceBusTrigger' };
                    const paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'SignalRConnectionInfo':
                case 'SignalRConnectionInfoInput': {
                    const binding = { type: 'signalRConnectionInfo', direction: 'in' };
                    const paramsMatch = this.signalRConnInfoParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.hubName = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'SignalR':
                case 'SignalROutput': {
                    const binding = { type: 'signalR', direction: 'out' };
                    const paramsMatch = this.signalRParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['hubName'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'SignalRTrigger': {
                    const binding = { type: 'signalRTrigger' };
                    const paramsMatch = this.signalRParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['hubName'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'RabbitMQ':
                case 'RabbitMQOutput': {
                    const binding = { type: 'rabbitMQ', direction: 'out' };
                    const paramsMatch = this.rabbitMqParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'RabbitMQTrigger': {
                    const binding = { type: 'rabbitMQTrigger' };
                    const paramsMatch = this.rabbitMqParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'SendGrid':
                case 'SendGridOutput': {
                    result.push({ type: 'sendGrid', direction: 'out' });
                    break;
                }
                case 'TwilioSms': {
                    result.push({ type: 'twilioSms', direction: 'out' });
                    break;
                }
                case 'route':
                case 'HttpTrigger': {
                    const binding = { type: 'httpTrigger', methods: [] };
                    const httpTriggerRouteMatch = this.httpTriggerRouteRegex.exec(attributeCode);
                    if (!!httpTriggerRouteMatch) {
                        binding.route = httpTriggerRouteMatch[1];
                    }
                    const lowerAttributeCode = attributeCode.toLowerCase();
                    for (const httpMethod of this.httpMethods) {
                        if (lowerAttributeCode.includes(`"${httpMethod}"`)) {
                            binding.methods.push(httpMethod);
                        }
                    }
                    if (/level.anonymous/i.exec(attributeCode)) {
                        binding.authLevel = 'anonymous';
                    }
                    result.push(binding);
                    result.push({ type: 'http', direction: 'out' });
                    break;
                }
                case 'orchestration_trigger':
                case 'OrchestrationTrigger':
                case 'DurableOrchestrationTrigger': {
                    result.push({ type: 'orchestrationTrigger', direction: 'in' });
                    break;
                }
                case 'activity_trigger':
                case 'ActivityTrigger':
                case 'DurableActivityTrigger': {
                    result.push({ type: 'activityTrigger', direction: 'in' });
                    break;
                }
                case 'EntityTrigger':
                case 'DurableEntityTrigger': {
                    result.push({ type: 'entityTrigger', direction: 'in' });
                    break;
                }
                case 'schedule':
                case 'TimerTrigger': {
                    const binding = { type: 'timerTrigger' };
                    const paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['schedule'] = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'DurableClient': {
                    result.push({ type: 'durableClient', direction: 'in' });
                    break;
                }
                default: {
                    result.push({ type: attributeName, direction: isReturn || isOut ? 'out' : 'in' });
                    break;
                }
            }
        }
        return result;
    }
    getBindingAttributeRegex() {
        return {
            regex: new RegExp(`(\\[|@)(<)?\\s*(return:)?\\s*(\\w+)`, 'g'),
            pos: 4
        };
    }
    getStartNewOrchestrationRegex(orchName) {
        return new RegExp(`(StartNew|StartNewAsync|start_new|scheduleNewOrchestrationInstance)(\\s*<[\\w\\.-\\[\\]\\<\\>,\\s]+>)?\\s*\\(\\s*(["'\`]|nameof\\s*\\(\\s*[\\w\\.-]*|[\\w\\s\\.]+\\.\\s*)${orchName}\\s*["'\\),]{1}`, 'i');
    }
    getCallSubOrchestratorRegex(subOrchName) {
        return new RegExp(`(CallSubOrchestrator|CallSubOrchestratorWithRetry|call_sub_orchestrator)(Async)?(\\s*<[\\w\\.-\\[\\]\\<\\>,\\s]+>)?\\s*\\(\\s*(["'\`]|nameof\\s*\\(\\s*[\\w\\.-]*|[\\w\\s\\.]+\\.\\s*)${subOrchName}\\s*["'\\),]{1}`, 'i');
    }
    getContinueAsNewRegex() {
        return new RegExp(`ContinueAsNew\\s*\\(`, 'i');
    }
    getRaiseEventRegex(eventName) {
        return new RegExp(`(RaiseEvent|raise_event)(Async)?(.|\r|\n)*${eventName}`, 'i');
    }
    getSignalEntityRegex(entityName) {
        return new RegExp(`${entityName}\\s*["'>]{1}`);
    }
    getWaitForExternalEventRegex() {
        return {
            regex: new RegExp(`(WaitForExternalEvent|wait_for_external_event)(<[\\s\\w,\\.-\\[\\]\\(\\)\\<\\>]+>)?\\s*\\(\\s*(nameof\\s*\\(\\s*|["'\`]|[\\w\\s\\.]+\\.\\s*)?([\\s\\w\\.-]+)\\s*["'\`\\),]{1}`, 'gi'),
            pos: 4
        };
    }
    getCallActivityRegex(activityName) {
        return new RegExp(`(CallActivity|call_activity)[\\s\\w,\\.-<>\\[\\]\\(\\)\\?]*\\([\\s\\w\\.-]*["'\`]?${activityName}\\s*["'\`\\),]{1}`, 'i');
    }
    getClassDefinitionRegex(className) {
        return new RegExp(`class\\s*${className}`);
    }
}
exports.FunctionProjectParserBase = FunctionProjectParserBase;


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CSharpFunctionProjectParser = void 0;
const traverseFunctionProjectUtils_1 = __webpack_require__(4);
const functionProjectCodeParser_1 = __webpack_require__(10);
class CSharpFunctionProjectParser extends functionProjectCodeParser_1.FunctionProjectCodeParser {
    async getFunctionsAndTheirCodesAsync(functionNames, hostJsonFolder) {
        const promises = functionNames.map(async (name) => {
            const match = await this._fileSystemWrapper.findFileRecursivelyAsync(hostJsonFolder, '.+\\.cs$', true, this.getFunctionStartRegex(name));
            if (!match) {
                return undefined;
            }
            const pos = !match.pos ? 0 : match.pos;
            const lineNr = (0, traverseFunctionProjectUtils_1.posToLineNr)(match.code, pos);
            const code = (0, traverseFunctionProjectUtils_1.getCodeInBrackets)(match.code, match.pos + match.length, '{', '}', '\n').code;
            return { name, code, filePath: match.filePath, pos, lineNr };
        });
        return (await Promise.all(promises)).filter(f => !!f);
    }
    async traverseProjectCode(projectFolder) {
        const result = {};
        const fileNameRegex = new RegExp('.+\\.cs$', 'i');
        for await (const func of this._fileSystemWrapper.findFunctionsRecursivelyAsync(projectFolder, fileNameRegex, this.getFunctionAttributeRegex())) {
            const bindings = this.tryExtractBindings(func.declarationCode);
            if (!(bindings.some(b => b.type === 'orchestrationTrigger') ||
                bindings.some(b => b.type === 'entityTrigger') ||
                bindings.some(b => b.type === 'activityTrigger'))) {
                // Also trying to extract multiple output bindings
                bindings.push(...await this.extractOutputBindings(projectFolder, func.declarationCode, fileNameRegex));
            }
            result[func.functionName] = {
                filePath: func.filePath,
                pos: func.pos,
                lineNr: func.lineNr,
                bindings: [...bindings]
            };
        }
        return result;
    }
    async extractOutputBindings(projectFolder, functionCode, fileNameRegex) {
        const returnTypeMatch = this.functionReturnTypeRegex.exec(functionCode);
        if (!returnTypeMatch) {
            return [];
        }
        const returnTypeName = (0, traverseFunctionProjectUtils_1.removeNamespace)(returnTypeMatch[3]);
        if (!returnTypeName) {
            return [];
        }
        const returnTypeDefinition = await this._fileSystemWrapper.findFileRecursivelyAsync(projectFolder, fileNameRegex, true, this.getClassDefinitionRegex(returnTypeName));
        if (!returnTypeDefinition) {
            return [];
        }
        const classBody = (0, traverseFunctionProjectUtils_1.getCodeInBrackets)(returnTypeDefinition.code, (returnTypeDefinition.pos ?? 0) + (returnTypeDefinition.length ?? 0), '{', '}');
        if (!classBody.code) {
            return [];
        }
        return this.tryExtractBindings(classBody.code);
    }
}
exports.CSharpFunctionProjectParser = CSharpFunctionProjectParser;


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FunctionProjectCodeParser = void 0;
const functionProjectParserBase_1 = __webpack_require__(8);
class FunctionProjectCodeParser extends functionProjectParserBase_1.FunctionProjectParserBase {
    async traverseFunctions(projectFolder) {
        let functions;
        functions = await this.traverseProjectCode(projectFolder);
        // Now enriching it with more info extracted from code
        functions = await this.mapOrchestratorsAndActivitiesAsync(functions, projectFolder);
        return functions;
    }
    getFunctionStartRegex(funcName) {
        return new RegExp(`FunctionName(Attribute)?\\s*\\(\\s*(nameof\\s*\\(\\s*|["'\`]|[\\w\\s\\.]+\\.\\s*)${funcName}\\s*["'\`\\)]{1}`);
    }
    getFunctionAttributeRegex() {
        return {
            regex: new RegExp(`\\[\\s*Function(Name)?(Attribute)?\\s*\\((["\\w\\s\\.\\(\\)-]+)\\)\\s*\\]`, 'g'),
            pos: 3
        };
    }
}
exports.FunctionProjectCodeParser = FunctionProjectCodeParser;


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FSharpFunctionProjectParser = void 0;
const traverseFunctionProjectUtils_1 = __webpack_require__(4);
const functionProjectCodeParser_1 = __webpack_require__(10);
class FSharpFunctionProjectParser extends functionProjectCodeParser_1.FunctionProjectCodeParser {
    async getFunctionsAndTheirCodesAsync(functionNames, hostJsonFolder) {
        const promises = functionNames.map(async (name) => {
            const match = await this._fileSystemWrapper.findFileRecursivelyAsync(hostJsonFolder, '.+\\.fs$', true, this.getFunctionStartRegex(name));
            if (!match) {
                return undefined;
            }
            const code = (0, traverseFunctionProjectUtils_1.getCodeInBrackets)(match.code, match.pos + match.length, '{', '}', '\n').code;
            const pos = !match.pos ? 0 : match.pos;
            const lineNr = (0, traverseFunctionProjectUtils_1.posToLineNr)(match.code, pos);
            return { name, code, filePath: match.filePath, pos, lineNr };
        });
        return (await Promise.all(promises)).filter(f => !!f);
    }
    async traverseProjectCode(projectFolder) {
        const result = {};
        for await (const func of this._fileSystemWrapper.findFunctionsRecursivelyAsync(projectFolder, new RegExp('.+\\.fs$', 'i'), this.getFunctionAttributeRegex())) {
            const bindings = this.tryExtractBindings(func.declarationCode);
            result[func.functionName] = {
                filePath: func.filePath,
                pos: func.pos,
                lineNr: func.lineNr,
                bindings: [...bindings]
            };
        }
        return result;
    }
    getFunctionAttributeRegex() {
        return {
            regex: new RegExp(`\\[<\\s*Function(Name)?\\s*\\((["\\w\\s\\.\\(\\)-]+)\\)`, 'g'),
            pos: 2
        };
    }
}
exports.FSharpFunctionProjectParser = FSharpFunctionProjectParser;


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JavaFunctionProjectParser = void 0;
const traverseFunctionProjectUtils_1 = __webpack_require__(4);
const functionProjectCodeParser_1 = __webpack_require__(10);
class JavaFunctionProjectParser extends functionProjectCodeParser_1.FunctionProjectCodeParser {
    async getFunctionsAndTheirCodesAsync(functionNames, hostJsonFolder) {
        const promises = functionNames.map(async (name) => {
            const match = await this._fileSystemWrapper.findFileRecursivelyAsync(hostJsonFolder, '.+\\.java$', true, this.getFunctionStartRegex(name));
            if (!match) {
                return undefined;
            }
            const code = (0, traverseFunctionProjectUtils_1.getCodeInBrackets)(match.code, match.pos + match.length, '{', '}', '\n').code;
            const pos = !match.pos ? 0 : match.pos;
            const lineNr = (0, traverseFunctionProjectUtils_1.posToLineNr)(match.code, pos);
            return { name, code, filePath: match.filePath, pos, lineNr };
        });
        return (await Promise.all(promises)).filter(f => !!f);
    }
    async traverseProjectCode(projectFolder) {
        const result = {};
        for await (const func of this._fileSystemWrapper.findFunctionsRecursivelyAsync(projectFolder, new RegExp('.+\\.java$', 'i'), this.getFunctionAttributeRegex())) {
            const bindings = this.tryExtractBindings(func.declarationCode);
            result[func.functionName] = {
                filePath: func.filePath,
                pos: func.pos,
                lineNr: func.lineNr,
                bindings: [...bindings]
            };
        }
        return result;
    }
    getFunctionAttributeRegex() {
        return {
            regex: new RegExp(`@\\s*FunctionName\\s*\\((["\\w\\s\\.\\(\\)-]+)\\)`, 'g'),
            pos: 1
        };
    }
}
exports.JavaFunctionProjectParser = JavaFunctionProjectParser;


/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PowershellFunctionProjectParser = void 0;
const traverseFunctionProjectUtils_1 = __webpack_require__(4);
const functionProjectParserBase_1 = __webpack_require__(8);
class PowershellFunctionProjectParser extends functionProjectParserBase_1.FunctionProjectParserBase {
    async traverseFunctions(projectFolder) {
        let functions;
        functions = await this._fileSystemWrapper.readFunctionsJson(projectFolder, this._log);
        // Now enriching it with more info extracted from code
        functions = await this.mapOrchestratorsAndActivitiesAsync(functions, projectFolder);
        return functions;
    }
    async getFunctionsAndTheirCodesAsync(functionNames, hostJsonFolder) {
        const promises = functionNames.map(async (name) => {
            let scriptFile = 'run\\.ps1$';
            const functionJsonMatch = await this._fileSystemWrapper.findFileRecursivelyAsync(this._fileSystemWrapper.joinPath(hostJsonFolder, name), 'function.json$', true);
            if (!!functionJsonMatch) {
                const functionJson = JSON.parse(functionJsonMatch.code);
                if (!!functionJson.scriptFile) {
                    scriptFile = functionJson.scriptFile.replace('.', '\\.');
                }
            }
            const match = await this._fileSystemWrapper.findFileRecursivelyAsync(this._fileSystemWrapper.joinPath(hostJsonFolder, name), scriptFile, true);
            if (!match) {
                return undefined;
            }
            const pos = !match.pos ? 0 : match.pos;
            const lineNr = (0, traverseFunctionProjectUtils_1.posToLineNr)(match.code, pos);
            return { name, code: match.code, filePath: match.filePath, pos, lineNr };
        });
        return (await Promise.all(promises)).filter(f => !!f);
    }
    getStartNewOrchestrationRegex(orchName) {
        return new RegExp(`(Start-DurableOrchestration|Start-NewOrchestration).*-FunctionName\\s*["']${orchName}["']`, 'i');
    }
    getCallActivityRegex(activityName) {
        return new RegExp(`(Invoke-DurableActivity|Invoke-ActivityFunction).*-FunctionName\\s*["']${activityName}["']`, 'i');
    }
    getRaiseEventRegex(eventName) {
        return new RegExp(`Send-DurableExternalEvent.*-EventName\\s*["']${eventName}["']`, 'i');
    }
    getWaitForExternalEventRegex() {
        return {
            regex: new RegExp(`Start-DurableExternalEventListener.*-EventName\\s*["']([\\s\\w\\.-]+)["']`, 'gi'),
            pos: 1
        };
    }
}
exports.PowershellFunctionProjectParser = PowershellFunctionProjectParser;


/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PythonV2FunctionProjectParser = void 0;
const traverseFunctionProjectUtils_1 = __webpack_require__(4);
const functionProjectCodeParser_1 = __webpack_require__(10);
class PythonV2FunctionProjectParser extends functionProjectCodeParser_1.FunctionProjectCodeParser {
    async getFunctionsAndTheirCodesAsync(functionNames, hostJsonFolder) {
        const promises = functionNames.map(async (name) => {
            const match = await this._fileSystemWrapper.findFileRecursivelyAsync(hostJsonFolder, '.+\\.py$', true, this.getFunctionStartRegex(name));
            if (!match) {
                return undefined;
            }
            const { declarationCode, bodyCode } = this.getFunctionCode(match.code, match.pos);
            const pos = !match.pos ? 0 : match.pos;
            const lineNr = (0, traverseFunctionProjectUtils_1.posToLineNr)(match.code, pos);
            return { name, code: bodyCode, filePath: match.filePath, pos, lineNr };
        });
        return (await Promise.all(promises)).filter(f => !!f);
    }
    async traverseProjectCode(projectFolder) {
        const result = {};
        for await (const func of this.findFunctionsRecursivelyAsync(projectFolder)) {
            const bindings = this.tryExtractBindings(func.declarationCode);
            result[func.functionName] = {
                filePath: func.filePath,
                pos: func.pos,
                lineNr: func.lineNr,
                bindings: [...bindings]
            };
        }
        return result;
    }
    async *findFunctionsRecursivelyAsync(folder) {
        const fileNameRegex = new RegExp('.+\\.py$', 'i');
        const functionAttributeRegex = this.getFunctionAttributeRegex();
        const functionNameRegex = new RegExp(`\\.\\s*function_name\\s*\\(\\s*name\\s*=\\s*["']([\\w-]+)["']`);
        for await (const fullPath of this._fileSystemWrapper.findFilesRecursivelyAsync(folder, fileNameRegex)) {
            const code = await this._fileSystemWrapper.readFile(fullPath);
            let match;
            while (!!(match = functionAttributeRegex.regex.exec(code))) {
                let functionName = match[functionAttributeRegex.pos];
                let { declarationCode, bodyCode } = this.getFunctionCode(code, match.index);
                const functionNameMatch = functionNameRegex.exec(declarationCode);
                if (!!functionNameMatch) {
                    functionName = functionNameMatch[1];
                    // Need to remove this line so that it does not appear as binding
                    declarationCode = declarationCode.replace('function_name', '');
                }
                yield {
                    functionName,
                    filePath: fullPath,
                    pos: match.index,
                    lineNr: (0, traverseFunctionProjectUtils_1.posToLineNr)(code, match.index),
                    declarationCode,
                    bodyCode
                };
            }
        }
    }
    getFunctionCode(code, endPos) {
        let declarationCode = '';
        let bodyCode = '';
        const defRegex = new RegExp('^(async)?\\s*def ', 'gm');
        const nextMethodRegex = new RegExp('^[^\\s]', 'gm');
        defRegex.lastIndex = endPos;
        const defMatch = defRegex.exec(code);
        if (!!defMatch) {
            declarationCode = code.substring(endPos, defMatch.index);
            endPos = defMatch.index + defMatch[0].length;
            nextMethodRegex.lastIndex = endPos;
            const nextMethodMatch = nextMethodRegex.exec(code);
            if (!!nextMethodMatch) {
                bodyCode = code.substring(endPos, nextMethodMatch.index);
            }
            else {
                bodyCode = code.substring(endPos);
            }
        }
        else {
            declarationCode = code.substring(endPos);
            bodyCode = code.substring(endPos);
        }
        return { declarationCode, bodyCode };
    }
    getFunctionAttributeRegex() {
        return {
            regex: new RegExp(`@[\\w\\s]+\\.\\s*(function_name|route|blob_trigger|cosmos_db_trigger|event_hub_message_trigger|queue_trigger|service_bus_queue_trigger|service_bus_topic_trigger|orchestration_trigger|activity_trigger|schedule)(.|\r|\n)+?def\\s+([\\w-]+)`, 'g'),
            pos: 3
        };
    }
    getFunctionStartRegex(funcName) {
        return new RegExp(`(@[\\w\\s]+\\.\\s*function_name\\s*\\(\\s*name\\s*=\\s*["']${funcName}["']|^(async)?\\s*def\\s+${funcName})`, 'm');
    }
    getBindingAttributeRegex() {
        return {
            regex: new RegExp(`@[\\w\\s]+\\.\\s*(\\w+)\\s*\\(`, 'g'),
            pos: 1
        };
    }
    getStartNewOrchestrationRegex(orchName) {
        return new RegExp(`\\.\\s*start_new\\s*\\(\\s*["']${orchName}["']`);
    }
}
exports.PythonV2FunctionProjectParser = PythonV2FunctionProjectParser;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
const vscode = __webpack_require__(1);
const FileSystemWrapper_1 = __webpack_require__(2);
const FunctionGraphView_1 = __webpack_require__(5);
let graphViews = [];
const fsWrapper = new FileSystemWrapper_1.FileSystemWrapper();
const MaxProjectsToShowAutomatically = 5;
async function showAllFunctionProjects(context) {
    if (!vscode.workspace.workspaceFolders) {
        return;
    }
    const hostJsonFolders = [];
    try {
        for (const folder of vscode.workspace.workspaceFolders) {
            for await (const hostJsonPath of fsWrapper.findFilesRecursivelyAsync(folder.uri.toString(), new RegExp('host.json', 'i'))) {
                hostJsonFolders.push(fsWrapper.dirName(hostJsonPath));
            }
        }
        if (hostJsonFolders.length > MaxProjectsToShowAutomatically) {
            const userResponse = await vscode.window.showWarningMessage(`az-func-as-a-graph found ${hostJsonFolders.length} Azure Functions projects in current workspace. Do you want to visualize all of them?`, 'Yes', 'No');
            if (userResponse !== 'Yes') {
                return;
            }
        }
    }
    catch (err) {
        vscode.window.showErrorMessage(`az-func-as-a-graph failed. ${err.message ?? err}`);
    }
    for (const hostJsonFolder of hostJsonFolders) {
        graphViews.push(new FunctionGraphView_1.FunctionGraphView(context, vscode.Uri.parse(hostJsonFolder)));
    }
}
async function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('az-func-as-a-graph.ShowGraph', async (item) => {
        if (!!item) {
            const pathToHostJson = item.toString();
            if (pathToHostJson.toLowerCase().endsWith('host.json')) {
                graphViews.push(new FunctionGraphView_1.FunctionGraphView(context, vscode.Uri.parse(fsWrapper.dirName(pathToHostJson))));
            }
            return;
        }
        await showAllFunctionProjects(context);
    }));
    if (!vscode.workspace.workspaceFolders) {
        return;
    }
    const config = vscode.workspace.getConfiguration('az-func-as-a-graph');
    if (!!config.get('showGraphAtStartup', true)) {
        // Showing graphs of all Functions in the workspace
        await showAllFunctionProjects(context);
    }
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() {
    for (const view of graphViews) {
        view.cleanup();
    }
}
exports.deactivate = deactivate;

})();

var __webpack_export_target__ = exports;
for(var i in __webpack_exports__) __webpack_export_target__[i] = __webpack_exports__[i];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;
//# sourceMappingURL=extension.js.map