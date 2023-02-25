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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.traverseProjectCode = exports.traverseFunctions = void 0;
const path = require("path");
const traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
const fileSystemUtils_1 = require("./fileSystemUtils");
// Collects all function.json files in a Functions project. Also tries to supplement them with bindings
// extracted from code (if the project is .Net or Java). Also parses and organizes orchestrators/activities 
// (if the project uses Durable Functions)
function traverseFunctions(projectFolder, log) {
    return __awaiter(this, void 0, void 0, function* () {
        const hostJsonMatch = yield fileSystemUtils_1.findFileRecursivelyAsync(projectFolder, 'host.json', false);
        if (!hostJsonMatch) {
            throw new Error('host.json file not found under the provided project path');
        }
        log(`>>> Found host.json at ${hostJsonMatch.filePath}`);
        let hostJsonFolder = path.dirname(hostJsonMatch.filePath);
        let projectKind = 'other';
        if (yield fileSystemUtils_1.isCSharpProjectAsync(hostJsonFolder)) {
            projectKind = 'cSharp';
        }
        else if (yield fileSystemUtils_1.isFSharpProjectAsync(hostJsonFolder)) {
            projectKind = 'fSharp';
        }
        else if (yield fileSystemUtils_1.isJavaProjectAsync(hostJsonFolder)) {
            projectKind = 'java';
        }
        let functions;
        switch (projectKind) {
            case 'cSharp':
            case 'fSharp':
            case 'java':
                functions = yield traverseProjectCode(projectKind, projectFolder);
                // Now enriching it with more info extracted from code
                functions = yield mapOrchestratorsAndActivitiesAsync(projectKind, functions, projectFolder);
                break;
            default:
                functions = yield fileSystemUtils_1.readFunctionsJson(hostJsonFolder, log);
                // Now enriching it with more info extracted from code
                functions = yield mapOrchestratorsAndActivitiesAsync(projectKind, functions, hostJsonFolder);
                break;
        }
        // Also reading proxies
        const proxies = yield fileSystemUtils_1.readProxiesJson(projectFolder, log);
        return { functions, proxies, projectFolder };
    });
}
exports.traverseFunctions = traverseFunctions;
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
            traverseFunctionProjectUtils_1.mapActivitiesToOrchestrator(functions, orch, activityNames);
            // Checking whether orchestrator calls itself
            if (!!traverseFunctionProjectUtils_1.TraversalRegexes.continueAsNewRegex.exec(orch.code)) {
                functions[orch.name].isCalledByItself = true;
            }
            // Trying to map event producers with their consumers
            const eventNames = traverseFunctionProjectUtils_1.getEventNames(orch.code);
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
// Tries to load code for functions of certain type
function getFunctionsAndTheirCodesAsync(functionNames, projectKind, hostJsonFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        const promises = functionNames.map((name) => __awaiter(this, void 0, void 0, function* () {
            let match;
            switch (projectKind) {
                case 'cSharp':
                    match = yield fileSystemUtils_1.findFileRecursivelyAsync(hostJsonFolder, '.+\\.cs$', true, traverseFunctionProjectUtils_1.TraversalRegexes.getDotNetFunctionNameRegex(name));
                    break;
                case 'fSharp':
                    match = yield fileSystemUtils_1.findFileRecursivelyAsync(hostJsonFolder, '.+\\.fs$', true, traverseFunctionProjectUtils_1.TraversalRegexes.getDotNetFunctionNameRegex(name));
                    break;
                case 'java':
                    match = yield fileSystemUtils_1.findFileRecursivelyAsync(hostJsonFolder, '.+\\.java$', true, traverseFunctionProjectUtils_1.TraversalRegexes.getDotNetFunctionNameRegex(name));
                    break;
                default:
                    match = yield fileSystemUtils_1.findFileRecursivelyAsync(path.join(hostJsonFolder, name), '(index\\.ts|index\\.js|__init__\\.py)$', true);
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
function traverseProjectCode(projectKind, projectFolder) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        let result = {};
        let fileNameRegex;
        let funcAttributeRegex;
        let funcNamePosIndex;
        switch (projectKind) {
            case 'cSharp':
                fileNameRegex = new RegExp('.+\\.cs$', 'i');
                funcAttributeRegex = traverseFunctionProjectUtils_1.BindingsParser.functionAttributeRegex;
                funcNamePosIndex = 3;
                break;
            case 'fSharp':
                fileNameRegex = new RegExp('.+\\.fs$', 'i');
                funcAttributeRegex = traverseFunctionProjectUtils_1.BindingsParser.fSharpFunctionAttributeRegex;
                funcNamePosIndex = 2;
                break;
            case 'java':
                fileNameRegex = new RegExp('.+\\.java$', 'i');
                funcAttributeRegex = traverseFunctionProjectUtils_1.BindingsParser.javaFunctionAttributeRegex;
                funcNamePosIndex = 1;
                break;
            default:
                return;
        }
        try {
            for (var _b = __asyncValues(fileSystemUtils_1.findFunctionsRecursivelyAsync(projectFolder, fileNameRegex, funcAttributeRegex, funcNamePosIndex)), _c; _c = yield _b.next(), !_c.done;) {
                const func = _c.value;
                const bindings = traverseFunctionProjectUtils_1.BindingsParser.tryExtractBindings(func.declarationCode);
                if (projectKind === 'cSharp' && !(bindings.some(b => b.type === 'orchestrationTrigger') ||
                    bindings.some(b => b.type === 'entityTrigger') ||
                    bindings.some(b => b.type === 'activityTrigger'))) {
                    // Also trying to extract multiple output bindings
                    bindings.push(...yield extractOutputBindings(projectFolder, func.declarationCode, fileNameRegex));
                }
                result[func.functionName] = {
                    filePath: func.filePath,
                    pos: func.pos,
                    lineNr: func.lineNr,
                    bindings: [...bindings]
                };
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return result;
    });
}
exports.traverseProjectCode = traverseProjectCode;
function extractOutputBindings(projectFolder, functionCode, fileNameRegex) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const returnTypeMatch = traverseFunctionProjectUtils_1.BindingsParser.functionReturnTypeRegex.exec(functionCode);
        if (!returnTypeMatch) {
            return [];
        }
        const returnTypeName = traverseFunctionProjectUtils_1.removeNamespace(returnTypeMatch[3]);
        if (!returnTypeName) {
            return [];
        }
        const returnTypeDefinition = yield fileSystemUtils_1.findFileRecursivelyAsync(projectFolder, fileNameRegex, true, traverseFunctionProjectUtils_1.TraversalRegexes.getClassDefinitionRegex(returnTypeName));
        if (!returnTypeDefinition) {
            return [];
        }
        const classBody = traverseFunctionProjectUtils_1.getCodeInBrackets(returnTypeDefinition.code, ((_a = returnTypeDefinition.pos) !== null && _a !== void 0 ? _a : 0) + ((_b = returnTypeDefinition.length) !== null && _b !== void 0 ? _b : 0), '{', '}');
        if (!classBody.code) {
            return [];
        }
        return traverseFunctionProjectUtils_1.BindingsParser.tryExtractBindings(classBody.code);
    });
}
//# sourceMappingURL=traverseFunctionProject.js.map