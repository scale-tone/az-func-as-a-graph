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
    async *findFunctionsRecursivelyAsync(folder, fileNameRegex, functionAttributeRegex, functionNamePosInRegex) {
        for await (const fullPath of this.findFilesRecursivelyAsync(folder, fileNameRegex)) {
            const code = await this.readFile(fullPath);
            var match;
            while (!!(match = functionAttributeRegex.exec(code))) {
                let functionName = (0, traverseFunctionProjectUtils_1.cleanupFunctionName)(match[functionNamePosInRegex]);
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
exports.BindingsParser = exports.TraversalRegexes = exports.getCodeInBracketsReverse = exports.getCodeInBrackets = exports.posToLineNr = exports.mapActivitiesToOrchestrator = exports.getEventNames = exports.removeNamespace = exports.cleanupFunctionName = void 0;
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
// Tries to extract event names that this orchestrator is awaiting
function getEventNames(orchestratorCode) {
    const result = [];
    const regex = TraversalRegexes.waitForExternalEventRegex;
    var match;
    while (!!(match = regex.exec(orchestratorCode))) {
        result.push(match[4]);
    }
    return result;
}
exports.getEventNames = getEventNames;
// Tries to match orchestrator with its activities
function mapActivitiesToOrchestrator(functions, orch, activityNames) {
    for (const activityName of activityNames) {
        // If this orchestrator seems to be calling this activity
        const regex = TraversalRegexes.getCallActivityRegex(activityName);
        if (!!regex.exec(orch.code)) {
            // Then mapping this activity to this orchestrator
            functions[activityName].isCalledBy = functions[activityName].isCalledBy ?? [];
            functions[activityName].isCalledBy.push(orch.name);
        }
    }
}
exports.mapActivitiesToOrchestrator = mapActivitiesToOrchestrator;
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
    static getFunctionAttributeRegex() {
        return new RegExp(`\\[\\s*Function(Name)?(Attribute)?\\s*\\((["\\w\\s\\.\\(\\)-]+)\\)\\s*\\]`, 'g');
    }
    static getJavaFunctionAttributeRegex() {
        return new RegExp(`@\\s*FunctionName\\s*\\((["\\w\\s\\.\\(\\)-]+)\\)`, 'g');
    }
    static getFSharpFunctionAttributeRegex() {
        return new RegExp(`\\[<\\s*Function(Name)?\\s*\\((["\\w\\s\\.\\(\\)-]+)\\)`, 'g');
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
BindingsParser.functionReturnTypeRegex = new RegExp(`public\\s*(static\\s*|async\\s*)*(Task\\s*<\\s*)?([\\w\\.]+)`);


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
const traverseFunctionProjectUtils_1 = __webpack_require__(4);
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
            parser = new CSharpFunctionProjectParser(fileSystemWrapper, log);
        }
        else if (await fileSystemWrapper.isFSharpProjectAsync(hostJsonFolder)) {
            parser = new FSharpFunctionProjectParser(fileSystemWrapper, log);
        }
        else if (await fileSystemWrapper.isJavaProjectAsync(hostJsonFolder)) {
            parser = new JavaFunctionProjectParser(fileSystemWrapper, log);
        }
        else {
            parser = new FunctionProjectScriptParser(fileSystemWrapper, log);
            // For script-based functions use host.json's folder as the root
            projectFolder = hostJsonFolder;
        }
        const functions = await parser.traverseFunctions(projectFolder);
        // Also reading proxies
        const proxies = await fileSystemWrapper.readProxiesJson(projectFolder, log);
        return { functions, proxies, projectFolder };
    }
    constructor(_fileSystemWrapper, _log) {
        this._fileSystemWrapper = _fileSystemWrapper;
        this._log = _log;
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
            const regex = traverseFunctionProjectUtils_1.TraversalRegexes.getStartNewOrchestrationRegex(orch.name);
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
                const regex = traverseFunctionProjectUtils_1.TraversalRegexes.getCallSubOrchestratorRegex(subOrch.name);
                if (!!regex.exec(orch.code)) {
                    // Mapping that suborchestrator to this orchestrator
                    functions[subOrch.name].isCalledBy = functions[subOrch.name].isCalledBy ?? [];
                    functions[subOrch.name].isCalledBy.push(orch.name);
                }
            }
            // Mapping activities to orchestrators
            (0, traverseFunctionProjectUtils_1.mapActivitiesToOrchestrator)(functions, orch, activityNames);
            // Checking whether orchestrator calls itself
            if (!!traverseFunctionProjectUtils_1.TraversalRegexes.continueAsNewRegex.exec(orch.code)) {
                functions[orch.name].isCalledByItself = true;
            }
            // Trying to map event producers with their consumers
            const eventNames = (0, traverseFunctionProjectUtils_1.getEventNames)(orch.code);
            for (const eventName of eventNames) {
                const regex = traverseFunctionProjectUtils_1.TraversalRegexes.getRaiseEventRegex(eventName);
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
                const regex = traverseFunctionProjectUtils_1.TraversalRegexes.getSignalEntityRegex(entity.name);
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
}
exports.FunctionProjectParser = FunctionProjectParser;
class FunctionProjectScriptParser extends FunctionProjectParser {
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
class FunctionProjectCodeParser extends FunctionProjectParser {
    async traverseFunctions(projectFolder) {
        let functions;
        functions = await this.traverseProjectCode(projectFolder);
        // Now enriching it with more info extracted from code
        functions = await this.mapOrchestratorsAndActivitiesAsync(functions, projectFolder);
        return functions;
    }
}
class CSharpFunctionProjectParser extends FunctionProjectCodeParser {
    async getFunctionsAndTheirCodesAsync(functionNames, hostJsonFolder) {
        const promises = functionNames.map(async (name) => {
            const match = await this._fileSystemWrapper.findFileRecursivelyAsync(hostJsonFolder, '.+\\.cs$', true, traverseFunctionProjectUtils_1.TraversalRegexes.getDotNetFunctionNameRegex(name));
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
        for await (const func of this._fileSystemWrapper.findFunctionsRecursivelyAsync(projectFolder, fileNameRegex, traverseFunctionProjectUtils_1.BindingsParser.getFunctionAttributeRegex(), 3)) {
            const bindings = traverseFunctionProjectUtils_1.BindingsParser.tryExtractBindings(func.declarationCode);
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
        const returnTypeMatch = traverseFunctionProjectUtils_1.BindingsParser.functionReturnTypeRegex.exec(functionCode);
        if (!returnTypeMatch) {
            return [];
        }
        const returnTypeName = (0, traverseFunctionProjectUtils_1.removeNamespace)(returnTypeMatch[3]);
        if (!returnTypeName) {
            return [];
        }
        const returnTypeDefinition = await this._fileSystemWrapper.findFileRecursivelyAsync(projectFolder, fileNameRegex, true, traverseFunctionProjectUtils_1.TraversalRegexes.getClassDefinitionRegex(returnTypeName));
        if (!returnTypeDefinition) {
            return [];
        }
        const classBody = (0, traverseFunctionProjectUtils_1.getCodeInBrackets)(returnTypeDefinition.code, (returnTypeDefinition.pos ?? 0) + (returnTypeDefinition.length ?? 0), '{', '}');
        if (!classBody.code) {
            return [];
        }
        return traverseFunctionProjectUtils_1.BindingsParser.tryExtractBindings(classBody.code);
    }
}
class FSharpFunctionProjectParser extends FunctionProjectCodeParser {
    async getFunctionsAndTheirCodesAsync(functionNames, hostJsonFolder) {
        const promises = functionNames.map(async (name) => {
            const match = await this._fileSystemWrapper.findFileRecursivelyAsync(hostJsonFolder, '.+\\.fs$', true, traverseFunctionProjectUtils_1.TraversalRegexes.getDotNetFunctionNameRegex(name));
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
        for await (const func of this._fileSystemWrapper.findFunctionsRecursivelyAsync(projectFolder, new RegExp('.+\\.fs$', 'i'), traverseFunctionProjectUtils_1.BindingsParser.getFSharpFunctionAttributeRegex(), 2)) {
            const bindings = traverseFunctionProjectUtils_1.BindingsParser.tryExtractBindings(func.declarationCode);
            result[func.functionName] = {
                filePath: func.filePath,
                pos: func.pos,
                lineNr: func.lineNr,
                bindings: [...bindings]
            };
        }
        return result;
    }
}
class JavaFunctionProjectParser extends FunctionProjectCodeParser {
    async getFunctionsAndTheirCodesAsync(functionNames, hostJsonFolder) {
        const promises = functionNames.map(async (name) => {
            const match = await this._fileSystemWrapper.findFileRecursivelyAsync(hostJsonFolder, '.+\\.java$', true, traverseFunctionProjectUtils_1.TraversalRegexes.getDotNetFunctionNameRegex(name));
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
        for await (const func of this._fileSystemWrapper.findFunctionsRecursivelyAsync(projectFolder, new RegExp('.+\\.java$', 'i'), traverseFunctionProjectUtils_1.BindingsParser.getJavaFunctionAttributeRegex(), 1)) {
            const bindings = traverseFunctionProjectUtils_1.BindingsParser.tryExtractBindings(func.declarationCode);
            result[func.functionName] = {
                filePath: func.filePath,
                pos: func.pos,
                lineNr: func.lineNr,
                bindings: [...bindings]
            };
        }
        return result;
    }
}


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