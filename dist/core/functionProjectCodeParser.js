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
exports.FunctionProjectCodeParser = void 0;
const functionProjectParserBase_1 = require("./functionProjectParserBase");
class FunctionProjectCodeParser extends functionProjectParserBase_1.FunctionProjectParserBase {
    traverseFunctions(projectFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            let functions;
            functions = yield this.traverseProjectCode(projectFolder);
            // Now enriching it with more info extracted from code
            functions = yield this.mapOrchestratorsAndActivitiesAsync(functions, projectFolder);
            return functions;
        });
    }
    getFunctionStartRegex(funcName) {
        return new RegExp(`FunctionName(Attribute)?\\s*\\(\\s*(nameof\\s*\\(\\s*|["'\`]|[\\w\\s\\.]+\\.\\s*)${funcName}\\s*["'\`\\)]{1}`);
    }
    getFunctionAttributeRegex() {
        return {
            regex: new RegExp(`\\[\\s*Function(Name)?(Attribute)?\\s*\\((["\\w\\s\\.\\(\\)-]+)\\)\\s*\\]`, 'g'),
            pos: 3
        };
    }
}
exports.FunctionProjectCodeParser = FunctionProjectCodeParser;
//# sourceMappingURL=functionProjectCodeParser.js.map