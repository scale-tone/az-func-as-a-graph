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
exports.traverseFunctions = void 0;
const fs = require("fs");
const path = require("path");
const traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
const traverseDotNetOrJavaProject_1 = require("./traverseDotNetOrJavaProject");
// Collects all function.json files in a Functions project. Also tries to supplement them with bindings
// extracted from code (if the project is .Net or Java). Also parses and organizes orchestrators/activities 
// (if the project uses Durable Functions)
function traverseFunctions(projectFolder, log) {
    return __awaiter(this, void 0, void 0, function* () {
        const hostJsonMatch = yield traverseFunctionProjectUtils_1.findFileRecursivelyAsync(projectFolder, 'host.json', false);
        if (!hostJsonMatch) {
            throw new Error('host.json file not found under the provided project path');
        }
        log(`>>> Found host.json at ${hostJsonMatch.filePath}`);
        let hostJsonFolder = path.dirname(hostJsonMatch.filePath);
        let projectKind = 'other';
        if (yield traverseFunctionProjectUtils_1.isCSharpProjectAsync(hostJsonFolder)) {
            projectKind = 'cSharp';
        }
        else if (yield traverseFunctionProjectUtils_1.isFSharpProjectAsync(hostJsonFolder)) {
            projectKind = 'fSharp';
        }
        else if (yield traverseFunctionProjectUtils_1.isJavaProjectAsync(hostJsonFolder)) {
            projectKind = 'java';
        }
        let functions;
        switch (projectKind) {
            case 'cSharp':
            case 'fSharp':
            case 'java':
                functions = yield traverseDotNetOrJavaProject_1.traverseProjectCode(projectKind, projectFolder);
                // Now enriching it with more info extracted from code
                functions = yield mapOrchestratorsAndActivitiesAsync(projectKind, functions, projectFolder);
                break;
            default:
                functions = yield readFunctionsJson(hostJsonFolder, log);
                // Now enriching it with more info extracted from code
                functions = yield mapOrchestratorsAndActivitiesAsync(projectKind, functions, hostJsonFolder);
                break;
        }
        // Also reading proxies
        const proxies = yield readProxiesJson(projectFolder, log);
        return { functions, proxies, projectFolder };
    });
}
exports.traverseFunctions = traverseFunctions;
function readFunctionsJson(hostJsonFolder, log) {
    return __awaiter(this, void 0, void 0, function* () {
        let functions = {};
        // Reading function.json files, in parallel
        const promises = (yield fs.promises.readdir(hostJsonFolder)).map((functionName) => __awaiter(this, void 0, void 0, function* () {
            const fullPath = path.join(hostJsonFolder, functionName);
            const functionJsonFilePath = path.join(fullPath, 'function.json');
            const isDirectory = (yield fs.promises.lstat(fullPath)).isDirectory();
            const functionJsonExists = fs.existsSync(functionJsonFilePath);
            if (isDirectory && functionJsonExists) {
                try {
                    const functionJsonString = yield fs.promises.readFile(functionJsonFilePath, { encoding: 'utf8' });
                    const functionJson = JSON.parse(functionJsonString);
                    functions[functionName] = { bindings: functionJson.bindings, isCalledBy: [], isSignalledBy: [] };
                }
                catch (err) {
                    log(`>>> Failed to parse ${functionJsonFilePath}: ${err}`);
                }
            }
        }));
        yield Promise.all(promises);
        return functions;
    });
}
// Tries to read proxies.json file from project folder
function readProxiesJson(projectFolder, log) {
    return __awaiter(this, void 0, void 0, function* () {
        const proxiesJsonPath = path.join(projectFolder, 'proxies.json');
        if (!fs.existsSync(proxiesJsonPath)) {
            return {};
        }
        const proxiesJsonString = yield fs.promises.readFile(proxiesJsonPath, { encoding: 'utf8' });
        try {
            const proxies = JSON.parse(proxiesJsonString).proxies;
            if (!proxies) {
                return {};
            }
            var notAddedToCsProjFile = false;
            if (yield traverseFunctionProjectUtils_1.isCSharpProjectAsync(projectFolder)) {
                // Also checking that proxies.json is added to .csproj file
                const csProjFile = yield traverseFunctionProjectUtils_1.findFileRecursivelyAsync(projectFolder, '.+\\.csproj$', true);
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
                    proxy.lineNr = traverseFunctionProjectUtils_1.posToLineNr(proxiesJsonString, proxy.pos);
                }
            }
            return proxies;
        }
        catch (err) {
            log(`>>> Failed to parse ${proxiesJsonPath}: ${err}`);
            return {};
        }
    });
}
// Tries to match orchestrations and their activities by parsing source code
function mapOrchestratorsAndActivitiesAsync(projectKind, functions, projectFolder) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        const functionNames = Object.keys(functions);
        const orchestratorNames = functionNames.filter(name => functions[name].bindings.some((b) => b.type === 'orchestrationTrigger'));
        const orchestrators = yield getFunctionsAndTheirCodesAsync(orchestratorNames, projectKind, projectFolder);
        const activityNames = Object.keys(functions).filter(name => functions[name].bindings.some((b) => b.type === 'activityTrigger'));
        const activities = yield getFunctionsAndTheirCodesAsync(activityNames, projectKind, projectFolder);
        const entityNames = functionNames.filter(name => functions[name].bindings.some((b) => b.type === 'entityTrigger'));
        const entities = yield getFunctionsAndTheirCodesAsync(entityNames, projectKind, projectFolder);
        const otherFunctionNames = functionNames.filter(name => !functions[name].bindings.some((b) => ['orchestrationTrigger', 'activityTrigger', 'entityTrigger'].includes(b.type)));
        const otherFunctions = yield getFunctionsAndTheirCodesAsync(otherFunctionNames, projectKind, projectFolder);
        for (const orch of orchestrators) {
            // Trying to match this orchestrator with its calling function
            const regex = traverseFunctionProjectUtils_1.TraversalRegexes.getStartNewOrchestrationRegex(orch.name);
            for (const func of otherFunctions) {
                // If this function seems to be calling that orchestrator
                if (!!regex.exec(func.code)) {
                    functions[orch.name].isCalledBy = (_a = functions[orch.name].isCalledBy) !== null && _a !== void 0 ? _a : [];
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
                    functions[subOrch.name].isCalledBy = (_b = functions[subOrch.name].isCalledBy) !== null && _b !== void 0 ? _b : [];
                    functions[subOrch.name].isCalledBy.push(orch.name);
                }
            }
            // Mapping activities to orchestrators
            mapActivitiesToOrchestrator(functions, orch, activityNames);
            // Checking whether orchestrator calls itself
            if (!!traverseFunctionProjectUtils_1.TraversalRegexes.continueAsNewRegex.exec(orch.code)) {
                functions[orch.name].isCalledByItself = true;
            }
            // Trying to map event producers with their consumers
            const eventNames = getEventNames(orch.code);
            for (const eventName of eventNames) {
                const regex = traverseFunctionProjectUtils_1.TraversalRegexes.getRaiseEventRegex(eventName);
                for (const func of otherFunctions) {
                    // If this function seems to be sending that event
                    if (!!regex.exec(func.code)) {
                        functions[orch.name].isSignalledBy = (_c = functions[orch.name].isSignalledBy) !== null && _c !== void 0 ? _c : [];
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
                    functions[entity.name].isCalledBy = (_d = functions[entity.name].isCalledBy) !== null && _d !== void 0 ? _d : [];
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
    });
}
// Tries to extract event names that this orchestrator is awaiting
function getEventNames(orchestratorCode) {
    const result = [];
    const regex = traverseFunctionProjectUtils_1.TraversalRegexes.waitForExternalEventRegex;
    var match;
    while (!!(match = regex.exec(orchestratorCode))) {
        result.push(match[4]);
    }
    return result;
}
// Tries to load code for functions of certain type
function getFunctionsAndTheirCodesAsync(functionNames, projectKind, hostJsonFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        const promises = functionNames.map((name) => __awaiter(this, void 0, void 0, function* () {
            let match;
            switch (projectKind) {
                case 'cSharp':
                    match = yield traverseFunctionProjectUtils_1.findFileRecursivelyAsync(hostJsonFolder, '.+\\.cs$', true, traverseFunctionProjectUtils_1.TraversalRegexes.getDotNetFunctionNameRegex(name));
                    break;
                case 'fSharp':
                    match = yield traverseFunctionProjectUtils_1.findFileRecursivelyAsync(hostJsonFolder, '.+\\.fs$', true, traverseFunctionProjectUtils_1.TraversalRegexes.getDotNetFunctionNameRegex(name));
                    break;
                case 'java':
                    match = yield traverseFunctionProjectUtils_1.findFileRecursivelyAsync(hostJsonFolder, '.+\\.java$', true, traverseFunctionProjectUtils_1.TraversalRegexes.getDotNetFunctionNameRegex(name));
                    break;
                default:
                    match = yield traverseFunctionProjectUtils_1.findFileRecursivelyAsync(path.join(hostJsonFolder, name), '(index\\.ts|index\\.js|__init__\\.py)$', true);
            }
            if (!match) {
                return undefined;
            }
            const code = projectKind === 'other' ? match.code : traverseFunctionProjectUtils_1.getCodeInBrackets(match.code, match.pos + match.length, '{', '}', '\n').code;
            const pos = !match.pos ? 0 : match.pos;
            const lineNr = traverseFunctionProjectUtils_1.posToLineNr(match.code, pos);
            return { name, code, filePath: match.filePath, pos, lineNr };
        }));
        return (yield Promise.all(promises)).filter(f => !!f);
    });
}
// Tries to match orchestrator with its activities
function mapActivitiesToOrchestrator(functions, orch, activityNames) {
    var _a;
    for (const activityName of activityNames) {
        // If this orchestrator seems to be calling this activity
        const regex = traverseFunctionProjectUtils_1.TraversalRegexes.getCallActivityRegex(activityName);
        if (!!regex.exec(orch.code)) {
            // Then mapping this activity to this orchestrator
            functions[activityName].isCalledBy = (_a = functions[activityName].isCalledBy) !== null && _a !== void 0 ? _a : [];
            functions[activityName].isCalledBy.push(orch.name);
        }
    }
}
//# sourceMappingURL=traverseFunctionProject.js.map