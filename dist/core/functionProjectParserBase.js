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
exports.FunctionProjectParserBase = void 0;
// Parses Azure Functions projects to produce Functions map (list of all Functions, their bindings and connections to other Functions)
class FunctionProjectParserBase {
    constructor(_fileSystemWrapper, _log) {
        this._fileSystemWrapper = _fileSystemWrapper;
        this._log = _log;
    }
    // Tries to match orchestrations and their activities by parsing source code
    mapOrchestratorsAndActivitiesAsync(functions, projectFolder) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const functionNames = Object.keys(functions);
            const orchestratorNames = functionNames.filter(name => functions[name].bindings.some((b) => b.type === 'orchestrationTrigger'));
            const orchestrators = yield this.getFunctionsAndTheirCodesAsync(orchestratorNames, projectFolder);
            const activityNames = Object.keys(functions).filter(name => functions[name].bindings.some((b) => b.type === 'activityTrigger'));
            const activities = yield this.getFunctionsAndTheirCodesAsync(activityNames, projectFolder);
            const entityNames = functionNames.filter(name => functions[name].bindings.some((b) => b.type === 'entityTrigger'));
            const entities = yield this.getFunctionsAndTheirCodesAsync(entityNames, projectFolder);
            const otherFunctionNames = functionNames.filter(name => !functions[name].bindings.some((b) => ['orchestrationTrigger', 'activityTrigger', 'entityTrigger'].includes(b.type)));
            const otherFunctions = yield this.getFunctionsAndTheirCodesAsync(otherFunctionNames, projectFolder);
            for (const orch of orchestrators) {
                // Trying to match this orchestrator with its calling function
                const regex = this.getStartNewOrchestrationRegex(orch.name);
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
                    const regex = this.getCallSubOrchestratorRegex(subOrch.name);
                    if (!!regex.exec(orch.code)) {
                        // Mapping that suborchestrator to this orchestrator
                        functions[subOrch.name].isCalledBy = (_b = functions[subOrch.name].isCalledBy) !== null && _b !== void 0 ? _b : [];
                        functions[subOrch.name].isCalledBy.push(orch.name);
                    }
                }
                // Mapping activities to orchestrators
                this.mapActivitiesToOrchestrator(functions, orch, activityNames);
                // Checking whether orchestrator calls itself
                if (!!this.getContinueAsNewRegex().exec(orch.code)) {
                    functions[orch.name].isCalledByItself = true;
                }
                // Trying to map event producers with their consumers
                const eventNames = this.getEventNames(orch.code);
                for (const eventName of eventNames) {
                    const regex = this.getRaiseEventRegex(eventName);
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
                    const regex = this.getSignalEntityRegex(entity.name);
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
    getEventNames(orchestratorCode) {
        const result = [];
        const regex = this.getWaitForExternalEventRegex();
        var match;
        while (!!(match = regex.regex.exec(orchestratorCode))) {
            result.push(match[regex.pos]);
        }
        return result;
    }
    // Tries to match orchestrator with its activities
    mapActivitiesToOrchestrator(functions, orch, activityNames) {
        var _a;
        for (const activityName of activityNames) {
            // If this orchestrator seems to be calling this activity
            const regex = this.getCallActivityRegex(activityName);
            if (!!regex.exec(orch.code)) {
                // Then mapping this activity to this orchestrator
                functions[activityName].isCalledBy = (_a = functions[activityName].isCalledBy) !== null && _a !== void 0 ? _a : [];
                functions[activityName].isCalledBy.push(orch.name);
            }
        }
    }
    getStartNewOrchestrationRegex(orchName) {
        return new RegExp(`(StartNew|StartNewAsync|start_new|scheduleNewOrchestrationInstance)(\\s*<[\\w\\.-\\[\\]\\<\\>,\\s]+>)?\\s*\\(\\s*(["'\`]|nameof\\s*\\(\\s*[\\w\\.-]*|[\\w\\s\\.]+\\.\\s*)${orchName}\\s*["'\\),]{1}`, 'i');
    }
    getCallSubOrchestratorRegex(subOrchName) {
        return new RegExp(`(CallSubOrchestrator|CallSubOrchestratorWithRetry|call_sub_orchestrator)(Async)?(\\s*<[\\w\\.-\\[\\]\\<\\>,\\s]+>)?\\s*\\(\\s*(["'\`]|nameof\\s*\\(\\s*[\\w\\.-]*|[\\w\\s\\.]+\\.\\s*)${subOrchName}\\s*["'\\),]{1}`, 'i');
    }
    getContinueAsNewRegex() {
        return new RegExp(`ContinueAsNew\\s*\\(`, 'i');
    }
    getRaiseEventRegex(eventName) {
        return new RegExp(`(RaiseEvent|raise_event)(Async)?(.|\r|\n)*${eventName}`, 'i');
    }
    getSignalEntityRegex(entityName) {
        return new RegExp(`${entityName}\\s*["'>]{1}`);
    }
    getWaitForExternalEventRegex() {
        return {
            regex: new RegExp(`(WaitForExternalEvent|wait_for_external_event)(<[\\s\\w,\\.-\\[\\]\\(\\)\\<\\>]+>)?\\s*\\(\\s*(nameof\\s*\\(\\s*|["'\`]|[\\w\\s\\.]+\\.\\s*)?([\\s\\w\\.-]+)\\s*["'\`\\),]{1}`, 'gi'),
            pos: 4
        };
    }
    getDotNetFunctionNameRegex(funcName) {
        return new RegExp(`FunctionName(Attribute)?\\s*\\(\\s*(nameof\\s*\\(\\s*|["'\`]|[\\w\\s\\.]+\\.\\s*)${funcName}\\s*["'\`\\)]{1}`);
    }
    getJavaFunctionNameRegex(funcName) {
        return new RegExp(`@\\s*FunctionName\\s*\\(["\\s\\w\\.-]*${funcName}"?\\)`);
    }
    getCallActivityRegex(activityName) {
        return new RegExp(`(CallActivity|call_activity)[\\s\\w,\\.-<>\\[\\]\\(\\)\\?]*\\([\\s\\w\\.-]*["'\`]?${activityName}\\s*["'\`\\),]{1}`, 'i');
    }
    getClassDefinitionRegex(className) {
        return new RegExp(`class\\s*${className}`);
    }
}
exports.FunctionProjectParserBase = FunctionProjectParserBase;
//# sourceMappingURL=functionProjectParserBase.js.map