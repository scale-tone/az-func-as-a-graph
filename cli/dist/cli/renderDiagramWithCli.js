"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertLocalPathsToRemote = exports.getGitRepoInfo = exports.renderDiagramWithCli = void 0;
var rimraf = __importStar(require("rimraf"));
var os = __importStar(require("os"));
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var cp = __importStar(require("child_process"));
var crypto = __importStar(require("crypto"));
var util = __importStar(require("util"));
var execAsync = util.promisify(cp.exec);
var traverseFunctionProject_1 = require("./traverseFunctionProject");
var buildFunctionDiagramCode_1 = require("../ui/src/buildFunctionDiagramCode");
var fileSystemUtils_1 = require("./fileSystemUtils");
// Does the main job
function renderDiagramWithCli(projectFolder, outputFile, settings) {
    if (settings === void 0) { settings = {}; }
    return __awaiter(this, void 0, void 0, function () {
        var outputFolder, tempFilesAndFolders, gitInfo, traverseResult, repoInfo, outputFileExt, diagramCode, tempInputFile, isHtmlOutput, tempOutputFile, _i, tempFilesAndFolders_1, tempFolder;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!projectFolder) {
                        console.error('Path to an Azure Functions project not specified');
                        return [2 /*return*/];
                    }
                    // To support both old and new property names
                    if (!!settings.htmlTemplateFile && !settings.templateFile) {
                        settings.templateFile = settings.htmlTemplateFile;
                    }
                    if (!outputFile) {
                        outputFile = 'function-graph.svg';
                    }
                    outputFolder = path.dirname(outputFile);
                    if (!fs.existsSync(outputFolder)) {
                        console.log("Creating output folder " + outputFolder);
                        fs.promises.mkdir(outputFolder, { recursive: true });
                    }
                    tempFilesAndFolders = [];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 19, 20]);
                    if (!projectFolder.toLowerCase().startsWith('http')) return [3 /*break*/, 3];
                    console.log("Cloning " + projectFolder);
                    return [4 /*yield*/, fileSystemUtils_1.cloneFromGitHub(projectFolder)];
                case 2:
                    gitInfo = _a.sent();
                    console.log("Successfully cloned to " + gitInfo.gitTempFolder);
                    tempFilesAndFolders.push(gitInfo.gitTempFolder);
                    projectFolder = gitInfo.projectFolder;
                    _a.label = 3;
                case 3: return [4 /*yield*/, traverseFunctionProject_1.traverseFunctions(projectFolder, console.log)];
                case 4:
                    traverseResult = _a.sent();
                    projectFolder = traverseResult.projectFolder;
                    return [4 /*yield*/, getGitRepoInfo(projectFolder, settings.repoInfo)];
                case 5:
                    repoInfo = _a.sent();
                    if (!!repoInfo) {
                        console.log("Using repo URI: " + repoInfo.originUrl + ", repo name: " + repoInfo.repoName + ", branch: " + repoInfo.branchName + ", tag: " + repoInfo.tagName);
                        // changing local paths to remote repo URLs
                        convertLocalPathsToRemote(traverseResult.functions, settings.sourcesRootFolder, repoInfo);
                        convertLocalPathsToRemote(traverseResult.proxies, settings.sourcesRootFolder, repoInfo);
                    }
                    outputFileExt = path.extname(outputFile).toLowerCase();
                    if (!(outputFileExt === '.json')) return [3 /*break*/, 7];
                    // just saving the Function Graph as JSON and quitting
                    return [4 /*yield*/, fs.promises.writeFile(outputFile, JSON.stringify({
                            functions: traverseResult.functions,
                            proxies: traverseResult.proxies
                        }, null, 4))];
                case 6:
                    // just saving the Function Graph as JSON and quitting
                    _a.sent();
                    console.log("Functions Map saved to " + outputFile);
                    return [2 /*return*/];
                case 7: return [4 /*yield*/, buildFunctionDiagramCode_1.buildFunctionDiagramCode(traverseResult.functions, traverseResult.proxies, settings)];
                case 8:
                    diagramCode = _a.sent();
                    diagramCode = 'graph LR\n' + (!!diagramCode ? diagramCode : 'empty["#32;(empty)"]');
                    console.log('Diagram code:');
                    console.log(diagramCode);
                    if (!(outputFileExt === '.md')) return [3 /*break*/, 10];
                    // just saving the diagram as a Markdown file and quitting
                    return [4 /*yield*/, saveOutputAsMarkdown(!!repoInfo ? repoInfo.repoName : path.basename(projectFolder), outputFile, diagramCode, settings)];
                case 9:
                    // just saving the diagram as a Markdown file and quitting
                    _a.sent();
                    console.log("Diagram was successfully generated and saved to " + outputFile);
                    console.log(tempFilesAndFolders);
                    return [2 /*return*/];
                case 10:
                    tempInputFile = path.join(os.tmpdir(), crypto.randomBytes(20).toString('hex') + '.mmd');
                    return [4 /*yield*/, fs.promises.writeFile(tempInputFile, diagramCode)];
                case 11:
                    _a.sent();
                    tempFilesAndFolders.push(tempInputFile);
                    isHtmlOutput = ['.htm', '.html'].includes(outputFileExt);
                    tempOutputFile = path.join(os.tmpdir(), crypto.randomBytes(20).toString('hex') + (isHtmlOutput ? '.svg' : outputFileExt));
                    tempFilesAndFolders.push(tempOutputFile);
                    return [4 /*yield*/, runMermaidCli(tempInputFile, tempOutputFile)];
                case 12:
                    _a.sent();
                    if (!isHtmlOutput) return [3 /*break*/, 14];
                    return [4 /*yield*/, saveOutputAsHtml(!!repoInfo ? repoInfo.repoName : path.basename(projectFolder), outputFile, tempOutputFile, traverseResult, settings)];
                case 13:
                    _a.sent();
                    return [3 /*break*/, 18];
                case 14:
                    if (!(outputFileExt === '.svg')) return [3 /*break*/, 16];
                    return [4 /*yield*/, saveOutputAsSvg(outputFile, tempOutputFile)];
                case 15:
                    _a.sent();
                    return [3 /*break*/, 18];
                case 16: return [4 /*yield*/, fs.promises.copyFile(tempOutputFile, outputFile)];
                case 17:
                    _a.sent();
                    _a.label = 18;
                case 18:
                    console.log("Diagram was successfully generated and saved to " + outputFile);
                    return [3 /*break*/, 20];
                case 19:
                    for (_i = 0, tempFilesAndFolders_1 = tempFilesAndFolders; _i < tempFilesAndFolders_1.length; _i++) {
                        tempFolder = tempFilesAndFolders_1[_i];
                        rimraf.sync(tempFolder);
                    }
                    return [7 /*endfinally*/];
                case 20: return [2 /*return*/];
            }
        });
    });
}
exports.renderDiagramWithCli = renderDiagramWithCli;
// saves resulting Function Graph as SVG
function saveOutputAsSvg(outputFile, tempOutputFile) {
    return __awaiter(this, void 0, void 0, function () {
        var svg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs.promises.readFile(tempOutputFile, { encoding: 'utf8' })];
                case 1:
                    svg = _a.sent();
                    return [4 /*yield*/, applyIcons(svg)];
                case 2:
                    svg = _a.sent();
                    // Adding some indent to node labels, so that icons fit in
                    svg = svg.replace('</style>', '.label > g > text { transform: translateX(25px); }' +
                        '</style>');
                    return [4 /*yield*/, fs.promises.writeFile(outputFile, svg)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// saves resulting Function Graph as HTML
function saveOutputAsHtml(projectName, outputFile, tempOutputFile, traverseResult, settings) {
    return __awaiter(this, void 0, void 0, function () {
        var htmlTemplateFile, html, svg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    htmlTemplateFile = !!settings.templateFile ? settings.templateFile : path.resolve(__dirname, '..', '..', 'graph-template.htm');
                    return [4 /*yield*/, fs.promises.readFile(htmlTemplateFile, { encoding: 'utf8' })];
                case 1:
                    html = _a.sent();
                    return [4 /*yield*/, fs.promises.readFile(tempOutputFile, { encoding: 'utf8' })];
                case 2:
                    svg = _a.sent();
                    return [4 /*yield*/, applyIcons(svg)];
                case 3:
                    svg = _a.sent();
                    html = html.replace(/{{GRAPH_SVG}}/g, svg);
                    html = html.replace(/{{PROJECT_NAME}}/g, projectName);
                    html = html.replace(/const functionsMap = {}/g, "const functionsMap = " + JSON.stringify(traverseResult.functions));
                    html = html.replace(/const proxiesMap = {}/g, "const proxiesMap = " + JSON.stringify(traverseResult.proxies));
                    return [4 /*yield*/, fs.promises.writeFile(outputFile, html)];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// saves resulting Function Graph as .md file
function saveOutputAsMarkdown(projectName, outputFile, diagramCode, settings) {
    return __awaiter(this, void 0, void 0, function () {
        var markdownTemplateFile, markdown;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    markdownTemplateFile = !!settings.templateFile ? settings.templateFile : path.resolve(__dirname, '..', '..', 'graph-template.md');
                    return [4 /*yield*/, fs.promises.readFile(markdownTemplateFile, { encoding: 'utf8' })];
                case 1:
                    markdown = _a.sent();
                    markdown = markdown.replace(/{{GRAPH_CODE}}/g, diagramCode);
                    markdown = markdown.replace(/{{PROJECT_NAME}}/g, projectName);
                    return [4 /*yield*/, fs.promises.writeFile(outputFile, markdown)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// executes mermaid CLI from command line
function runMermaidCli(inputFile, outputFile) {
    return __awaiter(this, void 0, void 0, function () {
        var packageJsonPath, mermaidCliPath, mermaidConfigPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    packageJsonPath = path.resolve(__dirname, '..', '..');
                    mermaidCliPath = path.resolve(packageJsonPath, 'node_modules', '@mermaid-js', 'mermaid-cli', 'index.bundle.js');
                    if (!!fs.existsSync(mermaidCliPath)) return [3 /*break*/, 2];
                    console.log("installing mermaid-cli in " + packageJsonPath + "...");
                    // Something got broken in the latest mermaid-cli, so need to lock down the version here
                    return [4 /*yield*/, execAsync('npm i --no-save @mermaid-js/mermaid-cli@9.1.4', { cwd: packageJsonPath })];
                case 1:
                    // Something got broken in the latest mermaid-cli, so need to lock down the version here
                    _a.sent();
                    console.log('mermaid-cli installed');
                    _a.label = 2;
                case 2:
                    mermaidConfigPath = path.resolve(__dirname, '..', '..', 'mermaid.config.json');
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var proc = cp.fork(mermaidCliPath, ['-i', inputFile, '-o', outputFile, '-c', mermaidConfigPath]);
                            proc.on('exit', function (exitCode) {
                                if (exitCode === 0) {
                                    resolve();
                                }
                                else {
                                    reject(new Error("Mermaid failed with status code " + exitCode));
                                }
                            });
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// injects icons SVG into the resulting SVG
function applyIcons(svg) {
    return __awaiter(this, void 0, void 0, function () {
        var iconsSvg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs.promises.readFile(path.resolve(__dirname, '..', 'all-azure-icons.svg'), { encoding: 'utf8' })];
                case 1:
                    iconsSvg = _a.sent();
                    // Placing icons code into a <defs> block at the top
                    svg = svg.replace("><style>", ">\n<defs>\n" + iconsSvg + "</defs>\n<style>");
                    // Adding <use> blocks referencing relevant icons
                    svg = svg.replace(/<g style="opacity: [0-9.]+;" transform="translate\([0-9,.-]+\)" id="[^"]+" class="node (\w+).*?<g transform="translate\([0-9,.-]+\)" class="label"><g transform="translate\([0-9,.-]+\)">/g, "$&<use href=\"#az-icon-$1\" width=\"20px\" height=\"20px\"/>");
                    return [2 /*return*/, svg];
            }
        });
    });
}
// Tries to get remote origin info from git
function getGitRepoInfo(projectFolder, repoInfoFromSettings) {
    if (repoInfoFromSettings === void 0) { repoInfoFromSettings = null; }
    return __awaiter(this, void 0, void 0, function () {
        var localGitFolder, parentFolder, execParams, originUrl, err_1, branchName, tagName, err_2, repoName, p;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    localGitFolder = projectFolder;
                    while (!fs.existsSync(path.join(localGitFolder, '.git'))) {
                        parentFolder = path.dirname(localGitFolder);
                        if (!parentFolder || localGitFolder === parentFolder) {
                            return [2 /*return*/, null];
                        }
                        localGitFolder = parentFolder;
                    }
                    execParams = { env: { GIT_DIR: path.join(localGitFolder, '.git') } };
                    originUrl = repoInfoFromSettings === null || repoInfoFromSettings === void 0 ? void 0 : repoInfoFromSettings.originUrl;
                    if (!!originUrl) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, execAsync('git config --get remote.origin.url', execParams)];
                case 2:
                    originUrl = (_a.sent())
                        .stdout
                        .toString()
                        .replace(/\n+$/, '') // trims end-of-line, if any
                        .replace(/\/+$/, ''); // trims the trailing slash, if any
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.warn("Unable to get remote origin URL. " + err_1);
                    return [2 /*return*/, null];
                case 4:
                    // This tool should never expose any credentials
                    originUrl = originUrl.replace(/:\/\/[^\/]*@/i, '://');
                    if (originUrl.endsWith('.git')) {
                        originUrl = originUrl.substr(0, originUrl.length - 4);
                    }
                    branchName = repoInfoFromSettings === null || repoInfoFromSettings === void 0 ? void 0 : repoInfoFromSettings.branchName, tagName = repoInfoFromSettings === null || repoInfoFromSettings === void 0 ? void 0 : repoInfoFromSettings.tagName;
                    if (!(!branchName && !tagName)) return [3 /*break*/, 11];
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 9, , 10]);
                    return [4 /*yield*/, execAsync('git rev-parse --abbrev-ref HEAD', execParams)];
                case 6:
                    branchName = (_a.sent())
                        .stdout
                        .toString()
                        .replace(/\n+$/, ''); // trims end-of-line, if any
                    if (!(branchName === 'HEAD')) return [3 /*break*/, 8];
                    return [4 /*yield*/, execAsync('git describe --tags', execParams)];
                case 7:
                    // trying to get that tag name
                    tagName = (_a.sent())
                        .stdout
                        .toString()
                        .replace(/\n+$/, ''); // trims end-of-line, if any
                    _a.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9:
                    err_2 = _a.sent();
                    console.warn("Unable to detect branch/tag name. " + err_2);
                    return [3 /*break*/, 10];
                case 10:
                    // defaulting to master
                    if (!branchName) {
                        branchName = 'master';
                    }
                    _a.label = 11;
                case 11:
                    repoName = repoInfoFromSettings === null || repoInfoFromSettings === void 0 ? void 0 : repoInfoFromSettings.repoName;
                    if (!repoName) {
                        p = originUrl.lastIndexOf('/');
                        if (p < 0) {
                            return [2 /*return*/, null];
                        }
                        repoName = originUrl.substr(p + 1);
                    }
                    return [2 /*return*/, { originUrl: originUrl, repoName: repoName, branchName: branchName, tagName: tagName }];
            }
        });
    });
}
exports.getGitRepoInfo = getGitRepoInfo;
// tries to point source links to the remote repo
function convertLocalPathsToRemote(map, sourcesRootFolder, repoInfo) {
    var isGitHub = repoInfo.originUrl.match(/^https:\/\/[^\/]*github.(com|dev)\//i);
    var isAzDevOps = repoInfo.originUrl.match(/^https:\/\/[^\/]*dev.azure.com\//i);
    for (var funcName in map) {
        var func = map[funcName];
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
            var repoNameWithSeparators = path.sep + repoInfo.repoName + path.sep;
            relativePathStartPos = func.filePath.indexOf(repoNameWithSeparators);
            if (relativePathStartPos < 0) {
                continue;
            }
            relativePathStartPos = relativePathStartPos + repoNameWithSeparators.length;
        }
        var relativePath = func.filePath.substr(relativePathStartPos).split(path.sep).filter(function (s) { return !!s; });
        if (!!isGitHub) {
            func.filePath = repoInfo.originUrl + "/blob/" + (!repoInfo.tagName ? repoInfo.branchName : repoInfo.tagName) + "/" + relativePath.join('/') + "#L" + func.lineNr;
        }
        else if (!!isAzDevOps) {
            func.filePath = repoInfo.originUrl + "?path=" + encodeURIComponent('/' + relativePath.join('/')) + "&version=" + (!repoInfo.tagName ? 'GB' + repoInfo.branchName : 'GT' + repoInfo.tagName) + "&line=" + func.lineNr + "&lineEnd=" + (func.lineNr + 1) + "&lineStartColumn=1";
        }
    }
}
exports.convertLocalPathsToRemote = convertLocalPathsToRemote;
