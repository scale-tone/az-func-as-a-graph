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
exports.convertLocalPathsToRemote = exports.getGitRepoInfo = exports.cloneFromGitHub = void 0;
var os = __importStar(require("os"));
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var util = __importStar(require("util"));
var child_process_1 = require("child_process");
var execAsync = util.promisify(child_process_1.exec);
var gitCloneTimeoutInSeconds = 60;
// Does a git clone into a temp folder and returns info about that cloned code
function cloneFromGitHub(url) {
    return __awaiter(this, void 0, void 0, function () {
        var repoName, branchName, relativePath, gitTempFolder, restOfUrl, match, orgUrl, getGitTimeoutPromise, i, assumedBranchName, clonePromise, _a, clonePromise;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    repoName = '', branchName = '', relativePath = '', gitTempFolder = '';
                    restOfUrl = [];
                    match = /(https:\/\/github.com\/.*?)\/([^\/]+)(\/tree\/)?(.*)/i.exec(url);
                    if (!match || match.length < 5) {
                        // expecting repo name to be the last segment of remote origin URL
                        repoName = url.substr(url.lastIndexOf('/') + 1);
                    }
                    else {
                        orgUrl = match[1];
                        repoName = match[2];
                        if (repoName.toLowerCase().endsWith('.git')) {
                            repoName = repoName.substr(0, repoName.length - 4);
                        }
                        url = orgUrl + "/" + repoName + ".git";
                        if (!!match[4]) {
                            restOfUrl = match[4].split('/').filter(function (s) { return !!s; });
                        }
                    }
                    return [4 /*yield*/, fs.promises.mkdtemp(path.join(os.tmpdir(), 'git-clone-'))];
                case 1:
                    gitTempFolder = _b.sent();
                    getGitTimeoutPromise = function () {
                        return new Promise(function (resolve, reject) { return setTimeout(function () { return reject(new Error("git clone timed out after " + gitCloneTimeoutInSeconds + " sec.")); }, gitCloneTimeoutInSeconds * 1000); });
                    };
                    i = restOfUrl.length;
                    _b.label = 2;
                case 2:
                    if (!(i > 0)) return [3 /*break*/, 7];
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 5, , 6]);
                    assumedBranchName = restOfUrl.slice(0, i).join('/');
                    clonePromise = execAsync("git clone " + url + " --branch " + assumedBranchName, { cwd: gitTempFolder });
                    // It turned out that the above command can hang forever for unknown reason. So need to put a timeout.
                    return [4 /*yield*/, Promise.race([clonePromise, getGitTimeoutPromise()])];
                case 4:
                    // It turned out that the above command can hang forever for unknown reason. So need to put a timeout.
                    _b.sent();
                    branchName = assumedBranchName;
                    relativePath = path.join.apply(path, restOfUrl.slice(i, restOfUrl.length));
                    return [3 /*break*/, 7];
                case 5:
                    _a = _b.sent();
                    return [3 /*break*/, 6];
                case 6:
                    i--;
                    return [3 /*break*/, 2];
                case 7:
                    if (!!branchName) return [3 /*break*/, 9];
                    clonePromise = execAsync("git clone " + url, { cwd: gitTempFolder });
                    // It turned out that the above command can hang forever for unknown reason. So need to put a timeout.
                    return [4 /*yield*/, Promise.race([clonePromise, getGitTimeoutPromise()])];
                case 8:
                    // It turned out that the above command can hang forever for unknown reason. So need to put a timeout.
                    _b.sent();
                    _b.label = 9;
                case 9: return [2 /*return*/, { gitTempFolder: gitTempFolder, projectFolder: path.join(gitTempFolder, repoName, relativePath) }];
            }
        });
    });
}
exports.cloneFromGitHub = cloneFromGitHub;
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
