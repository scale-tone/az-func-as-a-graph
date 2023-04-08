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
exports.PowershellFunctionProjectParser = void 0;
const traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
const functionProjectParserBase_1 = require("./functionProjectParserBase");
class PowershellFunctionProjectParser extends functionProjectParserBase_1.FunctionProjectParserBase {
    traverseFunctions(projectFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            let functions;
            functions = yield this._fileSystemWrapper.readFunctionsJson(projectFolder, this._log);
            // Now enriching it with more info extracted from code
            functions = yield this.mapOrchestratorsAndActivitiesAsync(functions, projectFolder);
            return functions;
        });
    }
    getFunctionsAndTheirCodesAsync(functionNames, hostJsonFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = functionNames.map((name) => __awaiter(this, void 0, void 0, function* () {
                let match = yield this._fileSystemWrapper.findFileRecursivelyAsync(this._fileSystemWrapper.joinPath(hostJsonFolder, name), '.+\\.ps1$', true);
                if (!match) {
                    return undefined;
                }
                const pos = !match.pos ? 0 : match.pos;
                const lineNr = traverseFunctionProjectUtils_1.posToLineNr(match.code, pos);
                return { name, code: match.code, filePath: match.filePath, pos, lineNr };
            }));
            return (yield Promise.all(promises)).filter(f => !!f);
        });
    }
    getStartNewOrchestrationRegex(orchName) {
        return new RegExp(`(Start-DurableOrchestration|Start-NewOrchestration).*-FunctionName\\s*["']${orchName}["']`, 'i');
    }
    getCallActivityRegex(activityName) {
        return new RegExp(`(Invoke-DurableActivity|Invoke-ActivityFunction).*-FunctionName\\s*["']${activityName}["']`, 'i');
    }
    getRaiseEventRegex(eventName) {
        return new RegExp(`Send-DurableExternalEvent.*-EventName\\s*["']${eventName}["']`, 'i');
    }
    getWaitForExternalEventRegex() {
        return {
            regex: new RegExp(`Start-DurableExternalEventListener.*-EventName\\s*["']([\\s\\w\\.-]+)["']`, 'gi'),
            pos: 1
        };
    }
}
exports.PowershellFunctionProjectParser = PowershellFunctionProjectParser;
//# sourceMappingURL=powershellFunctionProjectParser.js.map