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
exports.DotNetBindingsParser = exports.TraversalRegexes = exports.getCodeInBrackets = exports.isDotNetProjectAsync = exports.posToLineNr = exports.CloneFromGitHub = void 0;
const os = require("os");
const fs = require("fs");
const path = require("path");
const child_process_1 = require("child_process");
// Does a git clone into a temp folder and returns info about the repo
function CloneFromGitHub(url) {
    return __awaiter(this, void 0, void 0, function* () {
        var orgUrl = '', repoName = '', branchName = '', relativePath = '', gitTempFolder = '';
        var restOfUrl = [];
        const match = /(https:\/\/github.com\/.*?)\/([^\/]+)(\/tree\/)?(.*)/i.exec(url);
        if (!match || match.length < 5) {
            url += '.git';
        }
        else {
            orgUrl = match[1];
            repoName = match[2];
            if (repoName.toLowerCase().endsWith('.git')) {
                repoName = repoName.substr(0, repoName.length - 4);
            }
            url = `${orgUrl}/${repoName}.git`;
            if (!!match[4]) {
                restOfUrl.push(...match[4].split('/'));
            }
        }
        gitTempFolder = yield fs.promises.mkdtemp(path.join(os.tmpdir(), 'git-clone-'));
        // The provided URL might contain both branch name and relative path. The only way to separate one from another
        // is to repeatedly try cloning assumed branch names, until we finally succeed.
        for (var i = restOfUrl.length; i > 0; i--) {
            try {
                const assumedBranchName = restOfUrl.slice(0, i).join('/');
                child_process_1.execSync(`git clone ${url} --branch ${assumedBranchName}`, { cwd: gitTempFolder });
                branchName = assumedBranchName;
                relativePath = path.join(...restOfUrl.slice(i, restOfUrl.length));
                break;
            }
            catch (_a) {
                continue;
            }
        }
        if (!branchName) {
            // Just doing a normal git clone
            child_process_1.execSync(`git clone ${url}`, { cwd: gitTempFolder });
            // And getting the current branch name (it might be different from default)
            branchName = child_process_1.execSync('git rev-parse --abbrev-ref HEAD', { env: { GIT_DIR: path.join(gitTempFolder, repoName, '.git') } }).toString();
        }
        return { orgUrl, repoName, branchName, relativePath, gitTempFolder };
    });
}
exports.CloneFromGitHub = CloneFromGitHub;
// Primitive way of getting a line number out of symbol position
function posToLineNr(code, pos) {
    const lineBreaks = code.substr(0, pos).match(/(\r\n|\r|\n)/g);
    return !lineBreaks ? 1 : lineBreaks.length + 1;
}
exports.posToLineNr = posToLineNr;
// Checks if the given folder looks like a .Net project
function isDotNetProjectAsync(projectFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield fs.promises.readdir(projectFolder)).some(fn => {
            fn = fn.toLowerCase();
            return (fn.endsWith('.sln')) ||
                (fn.endsWith('.fsproj')) ||
                (fn.endsWith('.csproj') && fn !== 'extensions.csproj');
        });
    });
}
exports.isDotNetProjectAsync = isDotNetProjectAsync;
// Complements regex's inability to keep up with nested brackets
function getCodeInBrackets(str, startFrom, openingBracket, closingBracket, mustHaveSymbols) {
    var bracketCount = 0, openBracketPos = 0, mustHaveSymbolFound = false;
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
                    return str.substring(startFrom, i);
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
class TraversalRegexes {
    static getStartNewOrchestrationRegex(orchName) {
        return new RegExp(`(StartNew|StartNewAsync|start_new)(\\s*<[\\w\.-\\[\\]]+>)?\\s*\\(\\s*(["'\`]|nameof\\s*\\(\\s*[\\w\.-]*)${orchName}\\s*["'\\)]{1}`, 'i');
    }
    static getCallSubOrchestratorRegex(subOrchName) {
        return new RegExp(`(CallSubOrchestrator|CallSubOrchestratorWithRetry|call_sub_orchestrator)(Async)?(\\s*<[\\w\.-\\[\\]]+>)?\\s*\\(\\s*(["'\`]|nameof\\s*\\(\\s*[\\w\.-]*)${subOrchName}\\s*["'\\)]{1}`, 'i');
    }
    static getRaiseEventRegex(eventName) {
        return new RegExp(`(RaiseEvent|raise_event)(Async)?(.|\r|\n)*${eventName}`, 'i');
    }
    static getSignalEntityRegex(entityName) {
        return new RegExp(`${entityName}\\s*["'>]{1}`);
    }
    static getDotNetFunctionNameRegex(funcName) {
        return new RegExp(`FunctionName(Attribute)?\\s*\\(\\s*(nameof\\s*\\(\\s*|["'\`])${funcName}\\s*["'\`\\)]{1}`);
    }
    static getCallActivityRegex(activityName) {
        return new RegExp(`(CallActivity|call_activity)[\\s\\w\.-<>\\[\\]\\(]*\\([\\s\\w\.-]*["'\`]?${activityName}\\s*["'\`\\)]{1}`, 'i');
    }
}
exports.TraversalRegexes = TraversalRegexes;
TraversalRegexes.continueAsNewRegex = new RegExp(`ContinueAsNew\\s*\\(`, 'i');
TraversalRegexes.waitForExternalEventRegex = new RegExp(`(WaitForExternalEvent|wait_for_external_event)(<[\\s\\w\.-\\[\\]]+>)?\\s*\\(\\s*(nameof\\s*\\(\\s*|["'\`])?([\\s\\w\.-]+)\\s*["'\`\\),]{1}`, 'gi');
// In .Net not all bindings are mentioned in function.json, so we need to analyze source code to extract them
class DotNetBindingsParser {
    static tryExtractBindings(func) {
        const result = [];
        if (!func.code) {
            return result;
        }
        const regex = this.returnAttributeRegex;
        var match;
        while (!!(match = regex.exec(func.code))) {
            const isReturn = !!match[2];
            const attributeName = match[3];
            const attributeCode = getCodeInBrackets(func.code, match.index + match[0].length - 1, '(', ')', '"');
            switch (attributeName) {
                case 'Blob': {
                    const binding = { type: 'blob', direction: isReturn ? 'out' : 'inout' };
                    const paramsMatch = this.blobParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['path'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'Table': {
                    const binding = { type: 'table', direction: isReturn ? 'out' : 'inout' };
                    const paramsMatch = this.tableParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['tableName'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'CosmosDB': {
                    const binding = { type: 'cosmosDB', direction: isReturn ? 'out' : 'inout' };
                    const paramsMatch = this.cosmosDbParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['databaseName'] = paramsMatch[1];
                        binding['collectionName'] = paramsMatch[3];
                    }
                    result.push(binding);
                    break;
                }
                case 'SignalRConnectionInfo': {
                    const binding = { type: 'signalRConnectionInfo', direction: 'in' };
                    const paramsMatch = this.signalRConnInfoParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['hubName'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'EventGrid': {
                    const binding = { type: 'eventGrid', direction: 'out' };
                    const paramsMatch = this.eventGridParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['topicEndpointUri'] = paramsMatch[1];
                        binding['topicKeySetting'] = paramsMatch[3];
                    }
                    result.push(binding);
                    break;
                }
                case 'EventHub': {
                    const binding = { type: 'eventHub', direction: 'out' };
                    const paramsMatch = this.eventHubParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['eventHubName'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'Queue': {
                    const binding = { type: 'queue', direction: 'out' };
                    const paramsMatch = this.queueParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'ServiceBus': {
                    const binding = { type: 'serviceBus', direction: 'out' };
                    const paramsMatch = this.serviceBusParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'SignalR': {
                    const binding = { type: 'signalR', direction: 'out' };
                    const paramsMatch = this.signalRParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['hubName'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'RabbitMQ': {
                    const binding = { type: 'rabbitMQ', direction: 'out' };
                    const paramsMatch = this.rabbitMqParamsRegex.exec(attributeCode);
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
    }
}
exports.DotNetBindingsParser = DotNetBindingsParser;
DotNetBindingsParser.returnAttributeRegex = new RegExp(`\\[(<)?\\s*(return:)?\\s*(\\w+)(Attribute)?\\s*\\(`, 'g');
DotNetBindingsParser.blobParamsRegex = new RegExp(`"([^"]+)"`);
DotNetBindingsParser.tableParamsRegex = new RegExp(`"([^"]+)"`);
DotNetBindingsParser.cosmosDbParamsRegex = new RegExp(`"([^"]+)"(.|\r|\n)+?"([^"]+)"`);
DotNetBindingsParser.signalRConnInfoParamsRegex = new RegExp(`"([^"]+)"`);
DotNetBindingsParser.eventGridParamsRegex = new RegExp(`"([^"]+)"(.|\r|\n)+?"([^"]+)"`);
DotNetBindingsParser.eventHubParamsRegex = new RegExp(`"([^"]+)"`);
DotNetBindingsParser.queueParamsRegex = new RegExp(`"([^"]+)"`);
DotNetBindingsParser.serviceBusParamsRegex = new RegExp(`"([^"]+)"`);
DotNetBindingsParser.signalRParamsRegex = new RegExp(`"([^"]+)"`);
DotNetBindingsParser.rabbitMqParamsRegex = new RegExp(`"([^"]+)"`);
//# sourceMappingURL=traverseFunctionProjectUtils.js.map