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
exports.BindingsParser = exports.TraversalRegexes = exports.findFileRecursivelyAsync = exports.getCodeInBracketsReverse = exports.getCodeInBrackets = exports.isJavaProjectAsync = exports.isFSharpProjectAsync = exports.isCSharpProjectAsync = exports.posToLineNr = exports.cloneFromGitHub = exports.ExcludedFolders = void 0;
var os = __importStar(require("os"));
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var util = __importStar(require("util"));
var child_process_1 = require("child_process");
var execAsync = util.promisify(child_process_1.exec);
var gitCloneTimeoutInSeconds = 60;
exports.ExcludedFolders = ['node_modules', 'obj', '.vs', '.vscode', '.env', '.python_packages', '.git', '.github'];
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
// Primitive way of getting a line number out of symbol position
function posToLineNr(code, pos) {
    if (!code) {
        return 0;
    }
    var lineBreaks = code.substr(0, pos).match(/(\r\n|\r|\n)/g);
    return !lineBreaks ? 1 : lineBreaks.length + 1;
}
exports.posToLineNr = posToLineNr;
// Checks if the given folder looks like a C# function project
function isCSharpProjectAsync(projectFolder) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs.promises.readdir(projectFolder)];
                case 1: return [2 /*return*/, (_a.sent()).some(function (fn) {
                        fn = fn.toLowerCase();
                        return (fn.endsWith('.csproj') && fn !== 'extensions.csproj');
                    })];
            }
        });
    });
}
exports.isCSharpProjectAsync = isCSharpProjectAsync;
// Checks if the given folder looks like a F# function project
function isFSharpProjectAsync(projectFolder) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs.promises.readdir(projectFolder)];
                case 1: return [2 /*return*/, (_a.sent()).some(function (fn) {
                        fn = fn.toLowerCase();
                        return fn.endsWith('.fsproj');
                    })];
            }
        });
    });
}
exports.isFSharpProjectAsync = isFSharpProjectAsync;
// Checks if the given folder looks like a Java Functions project
function isJavaProjectAsync(projectFolder) {
    return __awaiter(this, void 0, void 0, function () {
        var javaFileMatch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, findFileRecursivelyAsync(projectFolder, ".+\\.java$", false)];
                case 1:
                    javaFileMatch = _a.sent();
                    return [2 /*return*/, !!javaFileMatch];
            }
        });
    });
}
exports.isJavaProjectAsync = isJavaProjectAsync;
// Complements regex's inability to keep up with nested brackets
function getCodeInBrackets(str, startFrom, openingBracket, closingBracket, mustHaveSymbols) {
    if (mustHaveSymbols === void 0) { mustHaveSymbols = ''; }
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
// fileName can be a regex, pattern should be a regex (which will be searched for in the matching files).
// If returnFileContents == true, returns file content. Otherwise returns full path to the file.
function findFileRecursivelyAsync(folder, fileName, returnFileContents, pattern) {
    return __awaiter(this, void 0, void 0, function () {
        var fileNameRegex, subFolders, _i, _a, name_1, fullPath, isDirectory, _b, _c, code, match, _d, subFolders_1, subFolder, result;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    fileNameRegex = typeof fileName === 'string' ? new RegExp(fileName, 'i') : fileName;
                    subFolders = [];
                    _i = 0;
                    return [4 /*yield*/, fs.promises.readdir(folder)];
                case 1:
                    _a = _e.sent();
                    _e.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 11];
                    name_1 = _a[_i];
                    fullPath = path.join(folder, name_1);
                    return [4 /*yield*/, fs.promises.lstat(fullPath)];
                case 3:
                    isDirectory = (_e.sent()).isDirectory();
                    if (!!!isDirectory) return [3 /*break*/, 4];
                    if (!exports.ExcludedFolders.includes(name_1.toLowerCase())) {
                        subFolders.push(fullPath);
                    }
                    return [3 /*break*/, 10];
                case 4:
                    if (!!!fileNameRegex.exec(name_1)) return [3 /*break*/, 10];
                    if (!!pattern) return [3 /*break*/, 8];
                    _b = {
                        filePath: fullPath
                    };
                    if (!returnFileContents) return [3 /*break*/, 6];
                    return [4 /*yield*/, fs.promises.readFile(fullPath, { encoding: 'utf8' })];
                case 5:
                    _c = (_e.sent());
                    return [3 /*break*/, 7];
                case 6:
                    _c = undefined;
                    _e.label = 7;
                case 7: return [2 /*return*/, (_b.code = _c,
                        _b)];
                case 8: return [4 /*yield*/, fs.promises.readFile(fullPath, { encoding: 'utf8' })];
                case 9:
                    code = _e.sent();
                    match = pattern.exec(code);
                    if (!!match) {
                        return [2 /*return*/, {
                                filePath: fullPath,
                                code: returnFileContents ? code : undefined,
                                pos: match.index,
                                length: match[0].length
                            }];
                    }
                    _e.label = 10;
                case 10:
                    _i++;
                    return [3 /*break*/, 2];
                case 11:
                    _d = 0, subFolders_1 = subFolders;
                    _e.label = 12;
                case 12:
                    if (!(_d < subFolders_1.length)) return [3 /*break*/, 15];
                    subFolder = subFolders_1[_d];
                    return [4 /*yield*/, findFileRecursivelyAsync(subFolder, fileNameRegex, returnFileContents, pattern)];
                case 13:
                    result = _e.sent();
                    if (!!result) {
                        return [2 /*return*/, result];
                    }
                    _e.label = 14;
                case 14:
                    _d++;
                    return [3 /*break*/, 12];
                case 15: return [2 /*return*/, undefined];
            }
        });
    });
}
exports.findFileRecursivelyAsync = findFileRecursivelyAsync;
// General-purpose regexes
var TraversalRegexes = /** @class */ (function () {
    function TraversalRegexes() {
    }
    TraversalRegexes.getStartNewOrchestrationRegex = function (orchName) {
        return new RegExp("(StartNew|StartNewAsync|start_new|scheduleNewOrchestrationInstance)(\\s*<[\\w\\.-\\[\\]\\<\\>,\\s]+>)?\\s*\\(\\s*([\"'`]|nameof\\s*\\(\\s*[\\w\\.-]*|[\\w\\s\\.]+\\.\\s*)" + orchName + "\\s*[\"'\\),]{1}", 'i');
    };
    TraversalRegexes.getCallSubOrchestratorRegex = function (subOrchName) {
        return new RegExp("(CallSubOrchestrator|CallSubOrchestratorWithRetry|call_sub_orchestrator)(Async)?(\\s*<[\\w\\.-\\[\\]\\<\\>,\\s]+>)?\\s*\\(\\s*([\"'`]|nameof\\s*\\(\\s*[\\w\\.-]*|[\\w\\s\\.]+\\.\\s*)" + subOrchName + "\\s*[\"'\\),]{1}", 'i');
    };
    TraversalRegexes.getRaiseEventRegex = function (eventName) {
        return new RegExp("(RaiseEvent|raise_event)(Async)?(.|\r|\n)*" + eventName, 'i');
    };
    TraversalRegexes.getSignalEntityRegex = function (entityName) {
        return new RegExp(entityName + "\\s*[\"'>]{1}");
    };
    TraversalRegexes.getDotNetFunctionNameRegex = function (funcName) {
        return new RegExp("FunctionName(Attribute)?\\s*\\(\\s*(nameof\\s*\\(\\s*|[\"'`]|[\\w\\s\\.]+\\.\\s*)" + funcName + "\\s*[\"'`\\)]{1}");
    };
    TraversalRegexes.getJavaFunctionNameRegex = function (funcName) {
        return new RegExp("@\\s*FunctionName\\s*\\([\"\\s\\w\\.-]*" + funcName + "\"?\\)");
    };
    TraversalRegexes.getCallActivityRegex = function (activityName) {
        return new RegExp("(CallActivity|call_activity)[\\s\\w,\\.-<>\\[\\]\\(\\)\\?]*\\([\\s\\w\\.-]*[\"'`]?" + activityName + "\\s*[\"'`\\),]{1}", 'i');
    };
    TraversalRegexes.getClassDefinitionRegex = function (className) {
        return new RegExp("class\\s*" + className);
    };
    TraversalRegexes.continueAsNewRegex = new RegExp("ContinueAsNew\\s*\\(", 'i');
    TraversalRegexes.waitForExternalEventRegex = new RegExp("(WaitForExternalEvent|wait_for_external_event)(<[\\s\\w,\\.-\\[\\]\\(\\)\\<\\>]+>)?\\s*\\(\\s*(nameof\\s*\\(\\s*|[\"'`]|[\\w\\s\\.]+\\.\\s*)?([\\s\\w\\.-]+)\\s*[\"'`\\),]{1}", 'gi');
    return TraversalRegexes;
}());
exports.TraversalRegexes = TraversalRegexes;
// In .Net not all bindings are mentioned in function.json, so we need to analyze source code to extract them
var BindingsParser = /** @class */ (function () {
    function BindingsParser() {
    }
    // Extracts additional bindings info from C#/F# source code
    BindingsParser.tryExtractBindings = function (funcCode) {
        var result = [];
        if (!funcCode) {
            return result;
        }
        var regex = this.bindingAttributeRegex;
        var match;
        while (!!(match = regex.exec(funcCode))) {
            var isReturn = !!match[3];
            var attributeName = match[4];
            if (attributeName.endsWith("Attribute")) {
                attributeName = attributeName.substring(0, attributeName.length - "Attribute".length);
            }
            var attributeCodeStartIndex = match.index + match[0].length;
            var attributeCode = getCodeInBrackets(funcCode, attributeCodeStartIndex, '(', ')', '').code;
            this.isOutRegex.lastIndex = attributeCodeStartIndex + attributeCode.length;
            var isOut = !!this.isOutRegex.exec(funcCode);
            switch (attributeName) {
                case 'BlobInput':
                case 'BlobOutput':
                case 'Blob': {
                    var binding = {
                        type: 'blob',
                        direction: attributeName === 'Blob' ? (isReturn || isOut ? 'out' : 'in') : (attributeName === 'BlobOutput' ? 'out' : 'in')
                    };
                    var paramsMatch = this.blobParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.path = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'BlobTrigger': {
                    var binding = { type: 'blobTrigger' };
                    var paramsMatch = this.blobParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.path = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'TableInput':
                case 'TableOutput':
                case 'Table': {
                    var binding = {
                        type: 'table',
                        direction: attributeName === 'Table' ? (isReturn || isOut ? 'out' : 'in') : (attributeName === 'TableOutput' ? 'out' : 'in')
                    };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.tableName = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'CosmosDBInput':
                case 'CosmosDBOutput':
                case 'CosmosDB': {
                    var binding = {
                        type: 'cosmosDB',
                        direction: attributeName === 'CosmosDB' ? (isReturn || isOut ? 'out' : 'in') : (attributeName === 'CosmosDBOutput' ? 'out' : 'in')
                    };
                    var paramsMatch = this.cosmosDbParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.databaseName = paramsMatch[1];
                        binding.collectionName = paramsMatch[3];
                    }
                    result.push(binding);
                    break;
                }
                case 'CosmosDBTrigger': {
                    var binding = { type: 'cosmosDBTrigger' };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.databaseName = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'EventGrid':
                case 'EventGridOutput': {
                    var binding = { type: 'eventGrid', direction: 'out' };
                    var paramsMatch = this.eventGridParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.topicEndpointUri = paramsMatch[1];
                        binding.topicKeySetting = paramsMatch[3];
                    }
                    result.push(binding);
                    break;
                }
                case 'EventGridTrigger': {
                    var binding = { type: 'eventGridTrigger' };
                    var paramsMatch = this.eventGridParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.topicEndpointUri = paramsMatch[1];
                        binding.topicKeySetting = paramsMatch[3];
                    }
                    result.push(binding);
                    break;
                }
                case 'EventHub':
                case 'EventHubOutput': {
                    var binding = { type: 'eventHub', direction: 'out' };
                    var paramsMatch = this.eventHubParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.eventHubName = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'EventHubTrigger': {
                    var binding = { type: 'eventHubTrigger' };
                    var paramsMatch = this.eventHubParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.eventHubName = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'Kafka':
                case 'KafkaOutput': {
                    var binding = { type: 'kafka', direction: 'out' };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.brokerList = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'KafkaTrigger': {
                    var binding = { type: 'kafkaTrigger' };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.brokerList = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'Queue':
                case 'QueueOutput': {
                    var binding = { type: 'queue', direction: 'out' };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'QueueTrigger': {
                    var binding = { type: 'queueTrigger' };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'ServiceBus':
                case 'ServiceBusOutput': {
                    var binding = { type: 'serviceBus', direction: 'out' };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'ServiceBusTrigger':
                case 'ServiceBusQueueTrigger':
                case 'ServiceBusTopicTrigger': {
                    var binding = { type: 'serviceBusTrigger' };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'SignalRConnectionInfo':
                case 'SignalRConnectionInfoInput': {
                    var binding = { type: 'signalRConnectionInfo', direction: 'in' };
                    var paramsMatch = this.signalRConnInfoParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.hubName = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'SignalR':
                case 'SignalROutput': {
                    var binding = { type: 'signalR', direction: 'out' };
                    var paramsMatch = this.signalRParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['hubName'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'SignalRTrigger': {
                    var binding = { type: 'signalRTrigger' };
                    var paramsMatch = this.signalRParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['hubName'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'RabbitMQ':
                case 'RabbitMQOutput': {
                    var binding = { type: 'rabbitMQ', direction: 'out' };
                    var paramsMatch = this.rabbitMqParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'RabbitMQTrigger': {
                    var binding = { type: 'rabbitMQTrigger' };
                    var paramsMatch = this.rabbitMqParamsRegex.exec(attributeCode);
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
                case 'HttpTrigger': {
                    var binding = { type: 'httpTrigger', methods: [] };
                    var httpTriggerRouteMatch = this.httpTriggerRouteRegex.exec(attributeCode);
                    if (!!httpTriggerRouteMatch) {
                        binding.route = httpTriggerRouteMatch[1];
                    }
                    var lowerAttributeCode = attributeCode.toLowerCase();
                    for (var _i = 0, _a = this.httpMethods; _i < _a.length; _i++) {
                        var httpMethod = _a[_i];
                        if (lowerAttributeCode.includes("\"" + httpMethod + "\"")) {
                            binding.methods.push(httpMethod);
                        }
                    }
                    result.push(binding);
                    result.push({ type: 'http', direction: 'out' });
                    break;
                }
                case 'OrchestrationTrigger':
                case 'DurableOrchestrationTrigger': {
                    result.push({ type: 'orchestrationTrigger', direction: 'in' });
                    break;
                }
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
                default: {
                    result.push({ type: attributeName, direction: isReturn || isOut ? 'out' : 'in' });
                    break;
                }
            }
        }
        return result;
    };
    BindingsParser.bindingAttributeRegex = new RegExp("(\\[|@)(<)?\\s*(return:)?\\s*(\\w+)", 'g');
    BindingsParser.singleParamRegex = new RegExp("(\"|nameof\\s*\\()?([\\w\\.-]+)");
    BindingsParser.eventHubParamsRegex = new RegExp("\"([^\"]+)\"");
    BindingsParser.signalRParamsRegex = new RegExp("\"([^\"]+)\"");
    BindingsParser.rabbitMqParamsRegex = new RegExp("\"([^\"]+)\"");
    BindingsParser.blobParamsRegex = new RegExp("\"([^\"]+)\"");
    BindingsParser.cosmosDbParamsRegex = new RegExp("\"([^\"]+)\"(.|\r|\n)+?\"([^\"]+)\"");
    BindingsParser.signalRConnInfoParamsRegex = new RegExp("\"([^\"]+)\"");
    BindingsParser.eventGridParamsRegex = new RegExp("\"([^\"]+)\"(.|\r|\n)+?\"([^\"]+)\"");
    BindingsParser.isOutRegex = new RegExp("^\\s*\\]\\s*(out |ICollector|IAsyncCollector).*?(,|\\()", 'g');
    BindingsParser.httpMethods = ["get", "head", "post", "put", "delete", "connect", "options", "trace", "patch"];
    BindingsParser.httpTriggerRouteRegex = new RegExp("Route\\s*=\\s*\"(.*)\"");
    BindingsParser.functionAttributeRegex = new RegExp("\\[\\s*Function(Name)?(Attribute)?\\s*\\(([\"\\w\\s\\.\\(\\)-]+)\\)\\s*\\]", 'g');
    BindingsParser.functionReturnTypeRegex = new RegExp("public\\s*(static\\s*|async\\s*)*(Task\\s*<\\s*)?([\\w\\.]+)");
    BindingsParser.javaFunctionAttributeRegex = new RegExp("@\\s*FunctionName\\s*\\(([\"\\w\\s\\.\\(\\)-]+)\\)", 'g');
    BindingsParser.fSharpFunctionAttributeRegex = new RegExp("\\[<\\s*Function(Name)?\\s*\\(([\"\\w\\s\\.\\(\\)-]+)\\)", 'g');
    return BindingsParser;
}());
exports.BindingsParser = BindingsParser;
