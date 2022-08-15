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
exports.traverseFunctionProject = void 0;
var os = __importStar(require("os"));
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var child_process_1 = require("child_process");
var traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
var ExcludedFolders = ['node_modules', 'obj', '.vs', '.vscode', '.env', '.python_packages', '.git', '.github'];
// Collects all function.json files in a Functions project. Also tries to supplement them with bindings
// extracted from .Net code (if the project is .Net). Also parses and organizes orchestrators/activities 
// (if the project uses Durable Functions)
function traverseFunctionProject(projectFolder, log) {
    return __awaiter(this, void 0, void 0, function () {
        var functions, tempFolders, gitInfo, hostJsonMatch, hostJsonFolder, publishTempFolder, promises, proxies;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    functions = {}, tempFolders = [];
                    if (!projectFolder.toLowerCase().startsWith('http')) return [3 /*break*/, 2];
                    log("Cloning " + projectFolder);
                    return [4 /*yield*/, traverseFunctionProjectUtils_1.cloneFromGitHub(projectFolder)];
                case 1:
                    gitInfo = _a.sent();
                    log("Successfully cloned to " + gitInfo.gitTempFolder);
                    tempFolders.push(gitInfo.gitTempFolder);
                    projectFolder = gitInfo.projectFolder;
                    _a.label = 2;
                case 2: return [4 /*yield*/, findFileRecursivelyAsync(projectFolder, 'host.json', false)];
                case 3:
                    hostJsonMatch = _a.sent();
                    if (!hostJsonMatch) {
                        throw new Error('host.json file not found under the provided project path');
                    }
                    log(">>> Found host.json at " + hostJsonMatch.filePath);
                    hostJsonFolder = path.dirname(hostJsonMatch.filePath);
                    return [4 /*yield*/, traverseFunctionProjectUtils_1.isDotNetProjectAsync(hostJsonFolder)];
                case 4:
                    if (!_a.sent()) return [3 /*break*/, 6];
                    return [4 /*yield*/, fs.promises.mkdtemp(path.join(os.tmpdir(), 'dotnet-publish-'))];
                case 5:
                    publishTempFolder = _a.sent();
                    tempFolders.push(publishTempFolder);
                    log(">>> Publishing " + hostJsonFolder + " to " + publishTempFolder + "...");
                    child_process_1.execSync("dotnet publish -o " + publishTempFolder, { cwd: hostJsonFolder });
                    hostJsonFolder = publishTempFolder;
                    _a.label = 6;
                case 6: return [4 /*yield*/, fs.promises.readdir(hostJsonFolder)];
                case 7:
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
                case 8:
                    _a.sent();
                    return [4 /*yield*/, mapOrchestratorsAndActivitiesAsync(functions, projectFolder, hostJsonFolder)];
                case 9:
                    // Now enriching data from function.json with more info extracted from code
                    functions = _a.sent();
                    return [4 /*yield*/, readProxiesJson(projectFolder, log)];
                case 10:
                    proxies = _a.sent();
                    return [2 /*return*/, { functions: functions, proxies: proxies, tempFolders: tempFolders, projectFolder: projectFolder }];
            }
        });
    });
}
exports.traverseFunctionProject = traverseFunctionProject;
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
                    return [4 /*yield*/, traverseFunctionProjectUtils_1.isDotNetProjectAsync(projectFolder)];
                case 3:
                    if (!_a.sent()) return [3 /*break*/, 5];
                    return [4 /*yield*/, findFileRecursivelyAsync(projectFolder, '.+\\.csproj$', true)];
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
// fileName can be a regex, pattern should be a regex (which will be searched for in the matching files).
// If returnFileContents == true, returns file content. Otherwise returns full path to the file.
function findFileRecursivelyAsync(folder, fileName, returnFileContents, pattern) {
    return __awaiter(this, void 0, void 0, function () {
        var fileNameRegex, _i, _a, name_1, fullPath, result, _b, _c, code, match;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    fileNameRegex = new RegExp(fileName, 'i');
                    _i = 0;
                    return [4 /*yield*/, fs.promises.readdir(folder)];
                case 1:
                    _a = _d.sent();
                    _d.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 12];
                    name_1 = _a[_i];
                    fullPath = path.join(folder, name_1);
                    return [4 /*yield*/, fs.promises.lstat(fullPath)];
                case 3:
                    if (!(_d.sent()).isDirectory()) return [3 /*break*/, 5];
                    if (ExcludedFolders.includes(name_1.toLowerCase())) {
                        return [3 /*break*/, 11];
                    }
                    return [4 /*yield*/, findFileRecursivelyAsync(fullPath, fileName, returnFileContents, pattern)];
                case 4:
                    result = _d.sent();
                    if (!!result) {
                        return [2 /*return*/, result];
                    }
                    return [3 /*break*/, 11];
                case 5:
                    if (!!!fileNameRegex.exec(name_1)) return [3 /*break*/, 11];
                    if (!!pattern) return [3 /*break*/, 9];
                    _b = {
                        filePath: fullPath
                    };
                    if (!returnFileContents) return [3 /*break*/, 7];
                    return [4 /*yield*/, fs.promises.readFile(fullPath, { encoding: 'utf8' })];
                case 6:
                    _c = (_d.sent());
                    return [3 /*break*/, 8];
                case 7:
                    _c = undefined;
                    _d.label = 8;
                case 8: return [2 /*return*/, (_b.code = _c,
                        _b)];
                case 9: return [4 /*yield*/, fs.promises.readFile(fullPath, { encoding: 'utf8' })];
                case 10:
                    code = _d.sent();
                    match = pattern.exec(code);
                    if (!!match) {
                        return [2 /*return*/, {
                                filePath: fullPath,
                                code: returnFileContents ? code : undefined,
                                pos: match.index,
                                length: match[0].length
                            }];
                    }
                    _d.label = 11;
                case 11:
                    _i++;
                    return [3 /*break*/, 2];
                case 12: return [2 /*return*/, undefined];
            }
        });
    });
}
// Tries to match orchestrations and their activities by parsing source code
function mapOrchestratorsAndActivitiesAsync(functions, projectFolder, hostJsonFolder) {
    return __awaiter(this, void 0, void 0, function () {
        var isDotNet, functionNames, orchestratorNames, orchestrators, activityNames, activities, entityNames, entities, otherFunctionNames, otherFunctions, _i, orchestrators_1, orch, regex, _a, otherFunctions_1, func, _b, orchestrators_2, subOrch, regex_1, eventNames, _c, eventNames_1, eventName, regex_2, _d, otherFunctions_2, func, _e, entities_1, entity, _f, otherFunctions_3, func, regex, _g, _h, func, bindingsFromFunctionJson, bindingsFromCode, existingBindingTypes, _j, bindingsFromCode_1, binding, _k, bindingsFromFunctionJson_1, binding, _l, _m, func;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0: return [4 /*yield*/, traverseFunctionProjectUtils_1.isDotNetProjectAsync(projectFolder)];
                case 1:
                    isDotNet = _o.sent();
                    functionNames = Object.keys(functions);
                    orchestratorNames = functionNames.filter(function (name) { return functions[name].bindings.some(function (b) { return b.type === 'orchestrationTrigger'; }); });
                    return [4 /*yield*/, getFunctionsAndTheirCodesAsync(orchestratorNames, isDotNet, projectFolder, hostJsonFolder)];
                case 2:
                    orchestrators = _o.sent();
                    activityNames = Object.keys(functions).filter(function (name) { return functions[name].bindings.some(function (b) { return b.type === 'activityTrigger'; }); });
                    return [4 /*yield*/, getFunctionsAndTheirCodesAsync(activityNames, isDotNet, projectFolder, hostJsonFolder)];
                case 3:
                    activities = _o.sent();
                    entityNames = functionNames.filter(function (name) { return functions[name].bindings.some(function (b) { return b.type === 'entityTrigger'; }); });
                    return [4 /*yield*/, getFunctionsAndTheirCodesAsync(entityNames, isDotNet, projectFolder, hostJsonFolder)];
                case 4:
                    entities = _o.sent();
                    otherFunctionNames = functionNames.filter(function (name) { return !functions[name].bindings.some(function (b) { return ['orchestrationTrigger', 'activityTrigger', 'entityTrigger'].includes(b.type); }); });
                    return [4 /*yield*/, getFunctionsAndTheirCodesAsync(otherFunctionNames, isDotNet, projectFolder, hostJsonFolder)];
                case 5:
                    otherFunctions = _o.sent();
                    for (_i = 0, orchestrators_1 = orchestrators; _i < orchestrators_1.length; _i++) {
                        orch = orchestrators_1[_i];
                        regex = traverseFunctionProjectUtils_1.TraversalRegexes.getStartNewOrchestrationRegex(orch.name);
                        for (_a = 0, otherFunctions_1 = otherFunctions; _a < otherFunctions_1.length; _a++) {
                            func = otherFunctions_1[_a];
                            // If this function seems to be calling that orchestrator
                            if (!!regex.exec(func.code)) {
                                functions[orch.name].isCalledBy.push(func.name);
                            }
                        }
                        // Matching suborchestrators
                        for (_b = 0, orchestrators_2 = orchestrators; _b < orchestrators_2.length; _b++) {
                            subOrch = orchestrators_2[_b];
                            if (orch.name === subOrch.name) {
                                continue;
                            }
                            regex_1 = traverseFunctionProjectUtils_1.TraversalRegexes.getCallSubOrchestratorRegex(subOrch.name);
                            if (!!regex_1.exec(orch.code)) {
                                // Mapping that suborchestrator to this orchestrator
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
                        for (_c = 0, eventNames_1 = eventNames; _c < eventNames_1.length; _c++) {
                            eventName = eventNames_1[_c];
                            regex_2 = traverseFunctionProjectUtils_1.TraversalRegexes.getRaiseEventRegex(eventName);
                            for (_d = 0, otherFunctions_2 = otherFunctions; _d < otherFunctions_2.length; _d++) {
                                func = otherFunctions_2[_d];
                                // If this function seems to be sending that event
                                if (!!regex_2.exec(func.code)) {
                                    functions[orch.name].isSignalledBy.push({ name: func.name, signalName: eventName });
                                }
                            }
                        }
                    }
                    for (_e = 0, entities_1 = entities; _e < entities_1.length; _e++) {
                        entity = entities_1[_e];
                        // Trying to match this entity with its calling function
                        for (_f = 0, otherFunctions_3 = otherFunctions; _f < otherFunctions_3.length; _f++) {
                            func = otherFunctions_3[_f];
                            regex = traverseFunctionProjectUtils_1.TraversalRegexes.getSignalEntityRegex(entity.name);
                            if (!!regex.exec(func.code)) {
                                functions[entity.name].isCalledBy.push(func.name);
                            }
                        }
                    }
                    if (isDotNet) {
                        // Trying to extract extra binding info from C# code
                        for (_g = 0, _h = activities.concat(otherFunctions); _g < _h.length; _g++) {
                            func = _h[_g];
                            bindingsFromFunctionJson = functions[func.name].bindings;
                            bindingsFromCode = traverseFunctionProjectUtils_1.DotNetBindingsParser.tryExtractBindings(func.code);
                            existingBindingTypes = bindingsFromFunctionJson.map(function (b) { return b.type; });
                            for (_j = 0, bindingsFromCode_1 = bindingsFromCode; _j < bindingsFromCode_1.length; _j++) {
                                binding = bindingsFromCode_1[_j];
                                // Only pushing extracted binding, if a binding with that type doesn't exist yet in function.json,
                                // so that no duplicates are produced
                                if (!existingBindingTypes.includes(binding.type)) {
                                    bindingsFromFunctionJson.push(binding);
                                }
                            }
                            // Also setting default direction
                            for (_k = 0, bindingsFromFunctionJson_1 = bindingsFromFunctionJson; _k < bindingsFromFunctionJson_1.length; _k++) {
                                binding = bindingsFromFunctionJson_1[_k];
                                if (!binding.direction) {
                                    binding.direction = 'in';
                                }
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
function getFunctionsAndTheirCodesAsync(functionNames, isDotNet, projectFolder, hostJsonFolder) {
    return __awaiter(this, void 0, void 0, function () {
        var promises;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    promises = functionNames.map(function (name) { return __awaiter(_this, void 0, void 0, function () {
                        var match, code, pos, lineNr;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (isDotNet ?
                                        findFileRecursivelyAsync(projectFolder, '.+\\.(f|c)s$', true, traverseFunctionProjectUtils_1.TraversalRegexes.getDotNetFunctionNameRegex(name)) :
                                        findFileRecursivelyAsync(path.join(hostJsonFolder, name), '(index\\.ts|index\\.js|__init__\\.py)$', true))];
                                case 1:
                                    match = _a.sent();
                                    if (!match) {
                                        return [2 /*return*/, undefined];
                                    }
                                    code = !isDotNet ? match.code : traverseFunctionProjectUtils_1.getCodeInBrackets(match.code, match.pos + match.length, '{', '}', ' \n');
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
    for (var _i = 0, activityNames_1 = activityNames; _i < activityNames_1.length; _i++) {
        var activityName = activityNames_1[_i];
        // If this orchestrator seems to be calling this activity
        var regex = traverseFunctionProjectUtils_1.TraversalRegexes.getCallActivityRegex(activityName);
        if (!!regex.exec(orch.code)) {
            // Then mapping this activity to this orchestrator
            if (!functions[activityName].isCalledBy) {
                functions[activityName].isCalledBy = [];
            }
            functions[activityName].isCalledBy.push(orch.name);
        }
    }
}
