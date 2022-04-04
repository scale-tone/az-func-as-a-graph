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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
exports.DotNetBindingsParser = exports.TraversalRegexes = exports.getCodeInBrackets = exports.isDotNetProjectAsync = exports.posToLineNr = exports.cloneFromGitHub = void 0;
var os = __importStar(require("os"));
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var child_process_1 = require("child_process");
// Does a git clone into a temp folder and returns info about that cloned code
function cloneFromGitHub(url) {
    return __awaiter(this, void 0, void 0, function () {
        var repoName, branchName, relativePath, gitTempFolder, restOfUrl, match, orgUrl, i, assumedBranchName;
        return __generator(this, function (_a) {
            switch (_a.label) {
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
                    gitTempFolder = _a.sent();
                    // The provided URL might contain both branch name and relative path. The only way to separate one from another
                    // is to repeatedly try cloning assumed branch names, until we finally succeed.
                    for (i = restOfUrl.length; i > 0; i--) {
                        try {
                            assumedBranchName = restOfUrl.slice(0, i).join('/');
                            child_process_1.execSync("git clone " + url + " --branch " + assumedBranchName, { cwd: gitTempFolder });
                            branchName = assumedBranchName;
                            relativePath = path.join.apply(path, restOfUrl.slice(i, restOfUrl.length));
                            break;
                        }
                        catch (_b) {
                            continue;
                        }
                    }
                    if (!branchName) {
                        // Just doing a normal git clone
                        child_process_1.execSync("git clone " + url, { cwd: gitTempFolder });
                    }
                    return [2 /*return*/, { gitTempFolder: gitTempFolder, projectFolder: path.join(gitTempFolder, repoName, relativePath) }];
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
// Checks if the given folder looks like a .Net project
function isDotNetProjectAsync(projectFolder) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs.promises.readdir(projectFolder)];
                case 1: return [2 /*return*/, (_a.sent()).some(function (fn) {
                        fn = fn.toLowerCase();
                        return fn.endsWith('.sln') ||
                            fn.endsWith('.fsproj') ||
                            (fn.endsWith('.csproj') && fn !== 'extensions.csproj');
                    })];
            }
        });
    });
}
exports.isDotNetProjectAsync = isDotNetProjectAsync;
// Complements regex's inability to keep up with nested brackets
function getCodeInBrackets(str, startFrom, openingBracket, closingBracket, mustHaveSymbols) {
    if (mustHaveSymbols === void 0) { mustHaveSymbols = ''; }
    var bracketCount = 0, openBracketPos = 0, mustHaveSymbolFound = !mustHaveSymbols;
    for (var i = startFrom; i < str.length; i++) {
        switch (str[i]) {
            case openingBracket:
                if (bracketCount <= 0) {
                    openBracketPos = i + 1;
                }
                bracketCount++;
                break;
            case closingBracket:
                bracketCount--;
                if (bracketCount <= 0 && mustHaveSymbolFound) {
                    return str.substring(startFrom, i + 1);
                }
                break;
        }
        if (bracketCount > 0 && mustHaveSymbols.includes(str[i])) {
            mustHaveSymbolFound = true;
        }
    }
    return '';
}
exports.getCodeInBrackets = getCodeInBrackets;
// General-purpose regexes
var TraversalRegexes = /** @class */ (function () {
    function TraversalRegexes() {
    }
    TraversalRegexes.getStartNewOrchestrationRegex = function (orchName) {
        return new RegExp("(StartNew|StartNewAsync|start_new)(\\s*<[\\w\\.-\\[\\]\\<\\>,\\s]+>)?\\s*\\(\\s*([\"'`]|nameof\\s*\\(\\s*[\\w\\.-]*|[\\w\\s\\.]+\\.\\s*)" + orchName + "\\s*[\"'\\),]{1}", 'i');
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
    TraversalRegexes.getCallActivityRegex = function (activityName) {
        return new RegExp("(CallActivity|call_activity)[\\s\\w,\\.-<>\\[\\]\\(\\)\\?]*\\([\\s\\w\\.-]*[\"'`]?" + activityName + "\\s*[\"'`\\),]{1}", 'i');
    };
    TraversalRegexes.continueAsNewRegex = new RegExp("ContinueAsNew\\s*\\(", 'i');
    TraversalRegexes.waitForExternalEventRegex = new RegExp("(WaitForExternalEvent|wait_for_external_event)(<[\\s\\w,\\.-\\[\\]\\(\\)\\<\\>]+>)?\\s*\\(\\s*(nameof\\s*\\(\\s*|[\"'`]|[\\w\\s\\.]+\\.\\s*)?([\\s\\w\\.-]+)\\s*[\"'`\\),]{1}", 'gi');
    return TraversalRegexes;
}());
exports.TraversalRegexes = TraversalRegexes;
// In .Net not all bindings are mentioned in function.json, so we need to analyze source code to extract them
var DotNetBindingsParser = /** @class */ (function () {
    function DotNetBindingsParser() {
    }
    // Extracts additional bindings info from C#/F# source code
    DotNetBindingsParser.tryExtractBindings = function (funcCode) {
        var result = [];
        if (!funcCode) {
            return result;
        }
        var regex = this.bindingAttributeRegex;
        var match;
        while (!!(match = regex.exec(funcCode))) {
            var isReturn = !!match[2];
            var attributeName = match[3];
            var attributeCodeStartIndex = match.index + match[0].length - 1;
            var attributeCode = getCodeInBrackets(funcCode, attributeCodeStartIndex, '(', ')', '');
            this.isOutRegex.lastIndex = attributeCodeStartIndex + attributeCode.length;
            var isOut = !!this.isOutRegex.exec(funcCode);
            switch (attributeName) {
                case 'Blob': {
                    var binding = { type: 'blob', direction: isReturn || isOut ? 'out' : 'in' };
                    var paramsMatch = this.blobParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['path'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'Table': {
                    var binding = { type: 'table', direction: isReturn || isOut ? 'out' : 'in' };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['tableName'] = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'CosmosDB': {
                    var binding = { type: 'cosmosDB', direction: isReturn || isOut ? 'out' : 'in' };
                    var paramsMatch = this.cosmosDbParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['databaseName'] = paramsMatch[1];
                        binding['collectionName'] = paramsMatch[3];
                    }
                    result.push(binding);
                    break;
                }
                case 'SignalRConnectionInfo': {
                    var binding = { type: 'signalRConnectionInfo', direction: 'in' };
                    var paramsMatch = this.signalRConnInfoParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['hubName'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'EventGrid': {
                    var binding = { type: 'eventGrid', direction: 'out' };
                    var paramsMatch = this.eventGridParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['topicEndpointUri'] = paramsMatch[1];
                        binding['topicKeySetting'] = paramsMatch[3];
                    }
                    result.push(binding);
                    break;
                }
                case 'EventHub': {
                    var binding = { type: 'eventHub', direction: 'out' };
                    var paramsMatch = this.eventHubParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['eventHubName'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'Queue': {
                    var binding = { type: 'queue', direction: 'out' };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'ServiceBus': {
                    var binding = { type: 'serviceBus', direction: 'out' };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'SignalR': {
                    var binding = { type: 'signalR', direction: 'out' };
                    var paramsMatch = this.signalRParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['hubName'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'RabbitMQ': {
                    var binding = { type: 'rabbitMQ', direction: 'out' };
                    var paramsMatch = this.rabbitMqParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'SendGrid': {
                    result.push({ type: 'sendGrid', direction: 'out' });
                    break;
                }
                case 'TwilioSms': {
                    result.push({ type: 'twilioSms', direction: 'out' });
                    break;
                }
            }
        }
        return result;
    };
    DotNetBindingsParser.bindingAttributeRegex = new RegExp("\\[(<)?\\s*(return:)?\\s*(\\w+)(Attribute)?\\s*\\(", 'g');
    DotNetBindingsParser.singleParamRegex = new RegExp("(\"|nameof\\s*\\()?([\\w\\.-]+)");
    DotNetBindingsParser.eventHubParamsRegex = new RegExp("\"([^\"]+)\"");
    DotNetBindingsParser.signalRParamsRegex = new RegExp("\"([^\"]+)\"");
    DotNetBindingsParser.rabbitMqParamsRegex = new RegExp("\"([^\"]+)\"");
    DotNetBindingsParser.blobParamsRegex = new RegExp("\"([^\"]+)\"");
    DotNetBindingsParser.cosmosDbParamsRegex = new RegExp("\"([^\"]+)\"(.|\r|\n)+?\"([^\"]+)\"");
    DotNetBindingsParser.signalRConnInfoParamsRegex = new RegExp("\"([^\"]+)\"");
    DotNetBindingsParser.eventGridParamsRegex = new RegExp("\"([^\"]+)\"(.|\r|\n)+?\"([^\"]+)\"");
    DotNetBindingsParser.isOutRegex = new RegExp("\\]\\s*(out |ICollector|IAsyncCollector).*?(,|\\()", 'g');
    return DotNetBindingsParser;
}());
exports.DotNetBindingsParser = DotNetBindingsParser;
