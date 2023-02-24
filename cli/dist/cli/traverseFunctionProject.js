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
exports.traverseFunctions = void 0;
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
var traverseDotNetOrJavaProject_1 = require("./traverseDotNetOrJavaProject");
// Collects all function.json files in a Functions project. Also tries to supplement them with bindings
// extracted from code (if the project is .Net or Java). Also parses and organizes orchestrators/activities 
// (if the project uses Durable Functions)
function traverseFunctions(projectFolder, log) {
    return __awaiter(this, void 0, void 0, function () {
        var hostJsonMatch, hostJsonFolder, projectKind, functions, _a, proxies;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, traverseFunctionProjectUtils_1.findFileRecursivelyAsync(projectFolder, 'host.json', false)];
                case 1:
                    hostJsonMatch = _b.sent();
                    if (!hostJsonMatch) {
                        throw new Error('host.json file not found under the provided project path');
                    }
                    log(">>> Found host.json at " + hostJsonMatch.filePath);
                    hostJsonFolder = path.dirname(hostJsonMatch.filePath);
                    projectKind = 'other';
                    return [4 /*yield*/, traverseFunctionProjectUtils_1.isCSharpProjectAsync(hostJsonFolder)];
                case 2:
                    if (!_b.sent()) return [3 /*break*/, 3];
                    projectKind = 'cSharp';
                    return [3 /*break*/, 7];
                case 3: return [4 /*yield*/, traverseFunctionProjectUtils_1.isFSharpProjectAsync(hostJsonFolder)];
                case 4:
                    if (!_b.sent()) return [3 /*break*/, 5];
                    projectKind = 'fSharp';
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, traverseFunctionProjectUtils_1.isJavaProjectAsync(hostJsonFolder)];
                case 6:
                    if (_b.sent()) {
                        projectKind = 'java';
                    }
                    _b.label = 7;
                case 7:
                    _a = projectKind;
                    switch (_a) {
                        case 'cSharp': return [3 /*break*/, 8];
                        case 'fSharp': return [3 /*break*/, 8];
                        case 'java': return [3 /*break*/, 8];
                    }
                    return [3 /*break*/, 11];
                case 8: return [4 /*yield*/, traverseDotNetOrJavaProject_1.traverseProjectCode(projectKind, projectFolder)];
                case 9:
                    functions = _b.sent();
                    return [4 /*yield*/, mapOrchestratorsAndActivitiesAsync(projectKind, functions, projectFolder)];
                case 10:
                    // Now enriching it with more info extracted from code
                    functions = _b.sent();
                    return [3 /*break*/, 14];
                case 11: return [4 /*yield*/, readFunctionsJson(hostJsonFolder, log)];
                case 12:
                    functions = _b.sent();
                    return [4 /*yield*/, mapOrchestratorsAndActivitiesAsync(projectKind, functions, hostJsonFolder)];
                case 13:
                    // Now enriching it with more info extracted from code
                    functions = _b.sent();
                    return [3 /*break*/, 14];
                case 14: return [4 /*yield*/, readProxiesJson(projectFolder, log)];
                case 15:
                    proxies = _b.sent();
                    return [2 /*return*/, { functions: functions, proxies: proxies, projectFolder: projectFolder }];
            }
        });
    });
}
exports.traverseFunctions = traverseFunctions;
function readFunctionsJson(hostJsonFolder, log) {
    return __awaiter(this, void 0, void 0, function () {
        var functions, promises;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    functions = {};
                    return [4 /*yield*/, fs.promises.readdir(hostJsonFolder)];
                case 1:
                    promises = (_a.sent()).map(function (functionName) { return __awaiter(_this, void 0, void 0, function () {
                        var fullPath, functionJsonFilePath, isDirectory, functionJsonExists, functionJsonString, functionJson, err_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    fullPath = path.join(hostJsonFolder, functionName);
                                    functionJsonFilePath = path.join(fullPath, 'function.json');
                                    return [4 /*yield*/, fs.promises.lstat(fullPath)];
                                case 1:
                                    isDirectory = (_a.sent()).isDirectory();
                                    functionJsonExists = fs.existsSync(functionJsonFilePath);
                                    if (!(isDirectory && functionJsonExists)) return [3 /*break*/, 5];
                                    _a.label = 2;
                                case 2:
                                    _a.trys.push([2, 4, , 5]);
                                    return [4 /*yield*/, fs.promises.readFile(functionJsonFilePath, { encoding: 'utf8' })];
                                case 3:
                                    functionJsonString = _a.sent();
                                    functionJson = JSON.parse(functionJsonString);
                                    functions[functionName] = { bindings: functionJson.bindings, isCalledBy: [], isSignalledBy: [] };
                                    return [3 /*break*/, 5];
                                case 4:
                                    err_1 = _a.sent();
                                    log(">>> Failed to parse " + functionJsonFilePath + ": " + err_1);
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(promises)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, functions];
            }
        });
    });
}
// Tries to read proxies.json file from project folder
function readProxiesJson(projectFolder, log) {
    return __awaiter(this, void 0, void 0, function () {
        var proxiesJsonPath, proxiesJsonString, proxies, notAddedToCsProjFile, csProjFile, proxiesJsonEntryRegex, proxyName, proxy, proxyNameRegex, match, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    proxiesJsonPath = path.join(projectFolder, 'proxies.json');
                    if (!fs.existsSync(proxiesJsonPath)) {
                        return [2 /*return*/, {}];
                    }
                    return [4 /*yield*/, fs.promises.readFile(proxiesJsonPath, { encoding: 'utf8' })];
                case 1:
                    proxiesJsonString = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 6, , 7]);
                    proxies = JSON.parse(proxiesJsonString).proxies;
                    if (!proxies) {
                        return [2 /*return*/, {}];
                    }
                    notAddedToCsProjFile = false;
                    return [4 /*yield*/, traverseFunctionProjectUtils_1.isCSharpProjectAsync(projectFolder)];
                case 3:
                    if (!_a.sent()) return [3 /*break*/, 5];
                    return [4 /*yield*/, traverseFunctionProjectUtils_1.findFileRecursivelyAsync(projectFolder, '.+\\.csproj$', true)];
                case 4:
                    csProjFile = _a.sent();
                    proxiesJsonEntryRegex = new RegExp("\\s*=\\s*\"proxies.json\"\\s*>");
                    if (!!csProjFile && csProjFile.code && (!proxiesJsonEntryRegex.exec(csProjFile.code))) {
                        notAddedToCsProjFile = true;
                    }
                    _a.label = 5;
                case 5:
                    // Also adding filePath and lineNr
                    for (proxyName in proxies) {
                        proxy = proxies[proxyName];
                        proxy.filePath = proxiesJsonPath;
                        if (notAddedToCsProjFile) {
                            proxy.warningNotAddedToCsProjFile = true;
                        }
                        proxyNameRegex = new RegExp("\"" + proxyName + "\"\\s*:");
                        match = proxyNameRegex.exec(proxiesJsonString);
                        if (!!match) {
                            proxy.pos = match.index;
                            proxy.lineNr = traverseFunctionProjectUtils_1.posToLineNr(proxiesJsonString, proxy.pos);
                        }
                    }
                    return [2 /*return*/, proxies];
                case 6:
                    err_2 = _a.sent();
                    log(">>> Failed to parse " + proxiesJsonPath + ": " + err_2);
                    return [2 /*return*/, {}];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Tries to match orchestrations and their activities by parsing source code
function mapOrchestratorsAndActivitiesAsync(projectKind, functions, projectFolder) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function () {
        var functionNames, orchestratorNames, orchestrators, activityNames, activities, entityNames, entities, otherFunctionNames, otherFunctions, _i, orchestrators_1, orch, regex, _e, otherFunctions_1, func, _f, orchestrators_2, subOrch, regex_1, eventNames, _g, eventNames_1, eventName, regex_2, _h, otherFunctions_2, func, _j, entities_1, entity, _k, otherFunctions_3, func, regex, _l, _m, func;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0:
                    functionNames = Object.keys(functions);
                    orchestratorNames = functionNames.filter(function (name) { return functions[name].bindings.some(function (b) { return b.type === 'orchestrationTrigger'; }); });
                    return [4 /*yield*/, getFunctionsAndTheirCodesAsync(orchestratorNames, projectKind, projectFolder)];
                case 1:
                    orchestrators = _o.sent();
                    activityNames = Object.keys(functions).filter(function (name) { return functions[name].bindings.some(function (b) { return b.type === 'activityTrigger'; }); });
                    return [4 /*yield*/, getFunctionsAndTheirCodesAsync(activityNames, projectKind, projectFolder)];
                case 2:
                    activities = _o.sent();
                    entityNames = functionNames.filter(function (name) { return functions[name].bindings.some(function (b) { return b.type === 'entityTrigger'; }); });
                    return [4 /*yield*/, getFunctionsAndTheirCodesAsync(entityNames, projectKind, projectFolder)];
                case 3:
                    entities = _o.sent();
                    otherFunctionNames = functionNames.filter(function (name) { return !functions[name].bindings.some(function (b) { return ['orchestrationTrigger', 'activityTrigger', 'entityTrigger'].includes(b.type); }); });
                    return [4 /*yield*/, getFunctionsAndTheirCodesAsync(otherFunctionNames, projectKind, projectFolder)];
                case 4:
                    otherFunctions = _o.sent();
                    for (_i = 0, orchestrators_1 = orchestrators; _i < orchestrators_1.length; _i++) {
                        orch = orchestrators_1[_i];
                        regex = traverseFunctionProjectUtils_1.TraversalRegexes.getStartNewOrchestrationRegex(orch.name);
                        for (_e = 0, otherFunctions_1 = otherFunctions; _e < otherFunctions_1.length; _e++) {
                            func = otherFunctions_1[_e];
                            // If this function seems to be calling that orchestrator
                            if (!!regex.exec(func.code)) {
                                functions[orch.name].isCalledBy = (_a = functions[orch.name].isCalledBy) !== null && _a !== void 0 ? _a : [];
                                functions[orch.name].isCalledBy.push(func.name);
                            }
                        }
                        // Matching suborchestrators
                        for (_f = 0, orchestrators_2 = orchestrators; _f < orchestrators_2.length; _f++) {
                            subOrch = orchestrators_2[_f];
                            if (orch.name === subOrch.name) {
                                continue;
                            }
                            regex_1 = traverseFunctionProjectUtils_1.TraversalRegexes.getCallSubOrchestratorRegex(subOrch.name);
                            if (!!regex_1.exec(orch.code)) {
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
                        eventNames = getEventNames(orch.code);
                        for (_g = 0, eventNames_1 = eventNames; _g < eventNames_1.length; _g++) {
                            eventName = eventNames_1[_g];
                            regex_2 = traverseFunctionProjectUtils_1.TraversalRegexes.getRaiseEventRegex(eventName);
                            for (_h = 0, otherFunctions_2 = otherFunctions; _h < otherFunctions_2.length; _h++) {
                                func = otherFunctions_2[_h];
                                // If this function seems to be sending that event
                                if (!!regex_2.exec(func.code)) {
                                    functions[orch.name].isSignalledBy = (_c = functions[orch.name].isSignalledBy) !== null && _c !== void 0 ? _c : [];
                                    functions[orch.name].isSignalledBy.push({ name: func.name, signalName: eventName });
                                }
                            }
                        }
                    }
                    for (_j = 0, entities_1 = entities; _j < entities_1.length; _j++) {
                        entity = entities_1[_j];
                        // Trying to match this entity with its calling function
                        for (_k = 0, otherFunctions_3 = otherFunctions; _k < otherFunctions_3.length; _k++) {
                            func = otherFunctions_3[_k];
                            regex = traverseFunctionProjectUtils_1.TraversalRegexes.getSignalEntityRegex(entity.name);
                            if (!!regex.exec(func.code)) {
                                functions[entity.name].isCalledBy = (_d = functions[entity.name].isCalledBy) !== null && _d !== void 0 ? _d : [];
                                functions[entity.name].isCalledBy.push(func.name);
                            }
                        }
                    }
                    // Also adding file paths and code positions
                    for (_l = 0, _m = otherFunctions.concat(orchestrators).concat(activities).concat(entities); _l < _m.length; _l++) {
                        func = _m[_l];
                        functions[func.name].filePath = func.filePath;
                        functions[func.name].pos = func.pos;
                        functions[func.name].lineNr = func.lineNr;
                    }
                    return [2 /*return*/, functions];
            }
        });
    });
}
// Tries to extract event names that this orchestrator is awaiting
function getEventNames(orchestratorCode) {
    var result = [];
    var regex = traverseFunctionProjectUtils_1.TraversalRegexes.waitForExternalEventRegex;
    var match;
    while (!!(match = regex.exec(orchestratorCode))) {
        result.push(match[4]);
    }
    return result;
}
// Tries to load code for functions of certain type
function getFunctionsAndTheirCodesAsync(functionNames, projectKind, hostJsonFolder) {
    return __awaiter(this, void 0, void 0, function () {
        var promises;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    promises = functionNames.map(function (name) { return __awaiter(_this, void 0, void 0, function () {
                        var match, _a, code, pos, lineNr;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _a = projectKind;
                                    switch (_a) {
                                        case 'cSharp': return [3 /*break*/, 1];
                                        case 'fSharp': return [3 /*break*/, 3];
                                        case 'java': return [3 /*break*/, 5];
                                    }
                                    return [3 /*break*/, 7];
                                case 1: return [4 /*yield*/, traverseFunctionProjectUtils_1.findFileRecursivelyAsync(hostJsonFolder, '.+\\.cs$', true, traverseFunctionProjectUtils_1.TraversalRegexes.getDotNetFunctionNameRegex(name))];
                                case 2:
                                    match = _b.sent();
                                    return [3 /*break*/, 9];
                                case 3: return [4 /*yield*/, traverseFunctionProjectUtils_1.findFileRecursivelyAsync(hostJsonFolder, '.+\\.fs$', true, traverseFunctionProjectUtils_1.TraversalRegexes.getDotNetFunctionNameRegex(name))];
                                case 4:
                                    match = _b.sent();
                                    return [3 /*break*/, 9];
                                case 5: return [4 /*yield*/, traverseFunctionProjectUtils_1.findFileRecursivelyAsync(hostJsonFolder, '.+\\.java$', true, traverseFunctionProjectUtils_1.TraversalRegexes.getDotNetFunctionNameRegex(name))];
                                case 6:
                                    match = _b.sent();
                                    return [3 /*break*/, 9];
                                case 7: return [4 /*yield*/, traverseFunctionProjectUtils_1.findFileRecursivelyAsync(path.join(hostJsonFolder, name), '(index\\.ts|index\\.js|__init__\\.py)$', true)];
                                case 8:
                                    match = _b.sent();
                                    _b.label = 9;
                                case 9:
                                    if (!match) {
                                        return [2 /*return*/, undefined];
                                    }
                                    code = projectKind === 'other' ? match.code : traverseFunctionProjectUtils_1.getCodeInBrackets(match.code, match.pos + match.length, '{', '}', '\n').code;
                                    pos = !match.pos ? 0 : match.pos;
                                    lineNr = traverseFunctionProjectUtils_1.posToLineNr(match.code, pos);
                                    return [2 /*return*/, { name: name, code: code, filePath: match.filePath, pos: pos, lineNr: lineNr }];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(promises)];
                case 1: return [2 /*return*/, (_a.sent()).filter(function (f) { return !!f; })];
            }
        });
    });
}
// Tries to match orchestrator with its activities
function mapActivitiesToOrchestrator(functions, orch, activityNames) {
    var _a;
    for (var _i = 0, activityNames_1 = activityNames; _i < activityNames_1.length; _i++) {
        var activityName = activityNames_1[_i];
        // If this orchestrator seems to be calling this activity
        var regex = traverseFunctionProjectUtils_1.TraversalRegexes.getCallActivityRegex(activityName);
        if (!!regex.exec(orch.code)) {
            // Then mapping this activity to this orchestrator
            functions[activityName].isCalledBy = (_a = functions[activityName].isCalledBy) !== null && _a !== void 0 ? _a : [];
            functions[activityName].isCalledBy.push(orch.name);
        }
    }
}
