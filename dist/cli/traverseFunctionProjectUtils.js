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
exports.BindingsParser = exports.TraversalRegexes = exports.findFileRecursivelyAsync = exports.getCodeInBracketsReverse = exports.getCodeInBrackets = exports.isJavaProjectAsync = exports.isFSharpProjectAsync = exports.isCSharpProjectAsync = exports.posToLineNr = exports.cloneFromGitHub = exports.ExcludedFolders = void 0;
const os = require("os");
const fs = require("fs");
const path = require("path");
const util = require("util");
const child_process_1 = require("child_process");
const execAsync = util.promisify(child_process_1.exec);
const gitCloneTimeoutInSeconds = 60;
exports.ExcludedFolders = ['node_modules', 'obj', '.vs', '.vscode', '.env', '.python_packages', '.git', '.github'];
// Does a git clone into a temp folder and returns info about that cloned code
function cloneFromGitHub(url) {
    return __awaiter(this, void 0, void 0, function* () {
        let repoName = '', branchName = '', relativePath = '', gitTempFolder = '';
        let restOfUrl = [];
        const match = /(https:\/\/github.com\/.*?)\/([^\/]+)(\/tree\/)?(.*)/i.exec(url);
        if (!match || match.length < 5) {
            // expecting repo name to be the last segment of remote origin URL
            repoName = url.substr(url.lastIndexOf('/') + 1);
        }
        else {
            const orgUrl = match[1];
            repoName = match[2];
            if (repoName.toLowerCase().endsWith('.git')) {
                repoName = repoName.substr(0, repoName.length - 4);
            }
            url = `${orgUrl}/${repoName}.git`;
            if (!!match[4]) {
                restOfUrl = match[4].split('/').filter(s => !!s);
            }
        }
        gitTempFolder = yield fs.promises.mkdtemp(path.join(os.tmpdir(), 'git-clone-'));
        let getGitTimeoutPromise = () => {
            return new Promise((resolve, reject) => setTimeout(() => reject(new Error(`git clone timed out after ${gitCloneTimeoutInSeconds} sec.`)), gitCloneTimeoutInSeconds * 1000));
        };
        // The provided URL might contain both branch name and relative path. The only way to separate one from another
        // is to repeatedly try cloning assumed branch names, until we finally succeed.
        for (let i = restOfUrl.length; i > 0; i--) {
            try {
                const assumedBranchName = restOfUrl.slice(0, i).join('/');
                const clonePromise = execAsync(`git clone ${url} --branch ${assumedBranchName}`, { cwd: gitTempFolder });
                // It turned out that the above command can hang forever for unknown reason. So need to put a timeout.
                yield Promise.race([clonePromise, getGitTimeoutPromise()]);
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
            const clonePromise = execAsync(`git clone ${url}`, { cwd: gitTempFolder });
            // It turned out that the above command can hang forever for unknown reason. So need to put a timeout.
            yield Promise.race([clonePromise, getGitTimeoutPromise()]);
        }
        return { gitTempFolder, projectFolder: path.join(gitTempFolder, repoName, relativePath) };
    });
}
exports.cloneFromGitHub = cloneFromGitHub;
// Primitive way of getting a line number out of symbol position
function posToLineNr(code, pos) {
    if (!code) {
        return 0;
    }
    const lineBreaks = code.substr(0, pos).match(/(\r\n|\r|\n)/g);
    return !lineBreaks ? 1 : lineBreaks.length + 1;
}
exports.posToLineNr = posToLineNr;
// Checks if the given folder looks like a C# function project
function isCSharpProjectAsync(projectFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield fs.promises.readdir(projectFolder)).some(fn => {
            fn = fn.toLowerCase();
            return (fn.endsWith('.csproj') && fn !== 'extensions.csproj');
        });
    });
}
exports.isCSharpProjectAsync = isCSharpProjectAsync;
// Checks if the given folder looks like a F# function project
function isFSharpProjectAsync(projectFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield fs.promises.readdir(projectFolder)).some(fn => {
            fn = fn.toLowerCase();
            return fn.endsWith('.fsproj');
        });
    });
}
exports.isFSharpProjectAsync = isFSharpProjectAsync;
// Checks if the given folder looks like a Java Functions project
function isJavaProjectAsync(projectFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        const javaFileMatch = yield findFileRecursivelyAsync(projectFolder, `.+\\.java$`, false);
        return !!javaFileMatch;
    });
}
exports.isJavaProjectAsync = isJavaProjectAsync;
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
// fileName can be a regex, pattern should be a regex (which will be searched for in the matching files).
// If returnFileContents == true, returns file content. Otherwise returns full path to the file.
function findFileRecursivelyAsync(folder, fileName, returnFileContents, pattern) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileNameRegex = typeof fileName === 'string' ? new RegExp(fileName, 'i') : fileName;
        const subFolders = [];
        for (const name of yield fs.promises.readdir(folder)) {
            const fullPath = path.join(folder, name);
            const isDirectory = (yield fs.promises.lstat(fullPath)).isDirectory();
            if (!!isDirectory) {
                if (!exports.ExcludedFolders.includes(name.toLowerCase())) {
                    subFolders.push(fullPath);
                }
            }
            else if (!!fileNameRegex.exec(name)) {
                if (!pattern) {
                    return {
                        filePath: fullPath,
                        code: returnFileContents ? (yield fs.promises.readFile(fullPath, { encoding: 'utf8' })) : undefined
                    };
                }
                const code = yield fs.promises.readFile(fullPath, { encoding: 'utf8' });
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
            const result = yield findFileRecursivelyAsync(subFolder, fileNameRegex, returnFileContents, pattern);
            if (!!result) {
                return result;
            }
        }
        return undefined;
    });
}
exports.findFileRecursivelyAsync = findFileRecursivelyAsync;
// General-purpose regexes
class TraversalRegexes {
    static getStartNewOrchestrationRegex(orchName) {
        return new RegExp(`(StartNew|StartNewAsync|start_new|scheduleNewOrchestrationInstance)(\\s*<[\\w\\.-\\[\\]\\<\\>,\\s]+>)?\\s*\\(\\s*(["'\`]|nameof\\s*\\(\\s*[\\w\\.-]*|[\\w\\s\\.]+\\.\\s*)${orchName}\\s*["'\\),]{1}`, 'i');
    }
    static getCallSubOrchestratorRegex(subOrchName) {
        return new RegExp(`(CallSubOrchestrator|CallSubOrchestratorWithRetry|call_sub_orchestrator)(Async)?(\\s*<[\\w\\.-\\[\\]\\<\\>,\\s]+>)?\\s*\\(\\s*(["'\`]|nameof\\s*\\(\\s*[\\w\\.-]*|[\\w\\s\\.]+\\.\\s*)${subOrchName}\\s*["'\\),]{1}`, 'i');
    }
    static getRaiseEventRegex(eventName) {
        return new RegExp(`(RaiseEvent|raise_event)(Async)?(.|\r|\n)*${eventName}`, 'i');
    }
    static getSignalEntityRegex(entityName) {
        return new RegExp(`${entityName}\\s*["'>]{1}`);
    }
    static getDotNetFunctionNameRegex(funcName) {
        return new RegExp(`FunctionName(Attribute)?\\s*\\(\\s*(nameof\\s*\\(\\s*|["'\`]|[\\w\\s\\.]+\\.\\s*)${funcName}\\s*["'\`\\)]{1}`);
    }
    static getJavaFunctionNameRegex(funcName) {
        return new RegExp(`@\\s*FunctionName\\s*\\(["\\s\\w\\.-]*${funcName}"?\\)`);
    }
    static getCallActivityRegex(activityName) {
        return new RegExp(`(CallActivity|call_activity)[\\s\\w,\\.-<>\\[\\]\\(\\)\\?]*\\([\\s\\w\\.-]*["'\`]?${activityName}\\s*["'\`\\),]{1}`, 'i');
    }
    static getClassDefinitionRegex(className) {
        return new RegExp(`class\\s*${className}`);
    }
}
exports.TraversalRegexes = TraversalRegexes;
TraversalRegexes.continueAsNewRegex = new RegExp(`ContinueAsNew\\s*\\(`, 'i');
TraversalRegexes.waitForExternalEventRegex = new RegExp(`(WaitForExternalEvent|wait_for_external_event)(<[\\s\\w,\\.-\\[\\]\\(\\)\\<\\>]+>)?\\s*\\(\\s*(nameof\\s*\\(\\s*|["'\`]|[\\w\\s\\.]+\\.\\s*)?([\\s\\w\\.-]+)\\s*["'\`\\),]{1}`, 'gi');
// In .Net not all bindings are mentioned in function.json, so we need to analyze source code to extract them
class BindingsParser {
    // Extracts additional bindings info from C#/F# source code
    static tryExtractBindings(funcCode) {
        const result = [];
        if (!funcCode) {
            return result;
        }
        const regex = this.bindingAttributeRegex;
        var match;
        while (!!(match = regex.exec(funcCode))) {
            const isReturn = !!match[3];
            let attributeName = match[4];
            if (attributeName.endsWith(`Attribute`)) {
                attributeName = attributeName.substring(0, attributeName.length - `Attribute`.length);
            }
            const attributeCodeStartIndex = match.index + match[0].length;
            const attributeCode = getCodeInBrackets(funcCode, attributeCodeStartIndex, '(', ')', '').code;
            this.isOutRegex.lastIndex = attributeCodeStartIndex + attributeCode.length;
            const isOut = !!this.isOutRegex.exec(funcCode);
            switch (attributeName) {
                case 'BlobInput':
                case 'BlobOutput':
                case 'Blob': {
                    const binding = {
                        type: 'blob',
                        direction: attributeName === 'Blob' ? (isReturn || isOut ? 'out' : 'in') : (attributeName === 'BlobOutput' ? 'out' : 'in')
                    };
                    const paramsMatch = this.blobParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.path = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'BlobTrigger': {
                    const binding = { type: 'blobTrigger' };
                    const paramsMatch = this.blobParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.path = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'TableInput':
                case 'TableOutput':
                case 'Table': {
                    const binding = {
                        type: 'table',
                        direction: attributeName === 'Table' ? (isReturn || isOut ? 'out' : 'in') : (attributeName === 'TableOutput' ? 'out' : 'in')
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
                        direction: attributeName === 'CosmosDB' ? (isReturn || isOut ? 'out' : 'in') : (attributeName === 'CosmosDBOutput' ? 'out' : 'in')
                    };
                    const paramsMatch = this.cosmosDbParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.databaseName = paramsMatch[1];
                        binding.collectionName = paramsMatch[3];
                    }
                    result.push(binding);
                    break;
                }
                case 'CosmosDBTrigger': {
                    const binding = { type: 'cosmosDBTrigger' };
                    const paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.databaseName = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
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
                case 'QueueTrigger': {
                    const binding = { type: 'queueTrigger' };
                    const paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
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
    }
}
exports.BindingsParser = BindingsParser;
BindingsParser.bindingAttributeRegex = new RegExp(`(\\[|@)(<)?\\s*(return:)?\\s*(\\w+)`, 'g');
BindingsParser.singleParamRegex = new RegExp(`("|nameof\\s*\\()?([\\w\\.-]+)`);
BindingsParser.eventHubParamsRegex = new RegExp(`"([^"]+)"`);
BindingsParser.signalRParamsRegex = new RegExp(`"([^"]+)"`);
BindingsParser.rabbitMqParamsRegex = new RegExp(`"([^"]+)"`);
BindingsParser.blobParamsRegex = new RegExp(`"([^"]+)"`);
BindingsParser.cosmosDbParamsRegex = new RegExp(`"([^"]+)"(.|\r|\n)+?"([^"]+)"`);
BindingsParser.signalRConnInfoParamsRegex = new RegExp(`"([^"]+)"`);
BindingsParser.eventGridParamsRegex = new RegExp(`"([^"]+)"(.|\r|\n)+?"([^"]+)"`);
BindingsParser.isOutRegex = new RegExp(`^\\s*\\]\\s*(out |ICollector|IAsyncCollector).*?(,|\\()`, 'g');
BindingsParser.httpMethods = [`get`, `head`, `post`, `put`, `delete`, `connect`, `options`, `trace`, `patch`];
BindingsParser.httpTriggerRouteRegex = new RegExp(`Route\\s*=\\s*"(.*)"`);
BindingsParser.functionAttributeRegex = new RegExp(`\\[\\s*Function(Name)?(Attribute)?\\s*\\((["\\w\\s\\.\\(\\)-]+)\\)\\s*\\]`, 'g');
BindingsParser.functionReturnTypeRegex = new RegExp(`public\\s*(static\\s*|async\\s*)*(Task\\s*<\\s*)?([\\w\\.]+)`);
BindingsParser.javaFunctionAttributeRegex = new RegExp(`@\\s*FunctionName\\s*\\((["\\w\\s\\.\\(\\)-]+)\\)`, 'g');
BindingsParser.fSharpFunctionAttributeRegex = new RegExp(`\\[<\\s*Function(Name)?\\s*\\((["\\w\\s\\.\\(\\)-]+)\\)`, 'g');
//# sourceMappingURL=traverseFunctionProjectUtils.js.map