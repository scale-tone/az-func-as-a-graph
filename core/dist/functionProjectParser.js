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
exports.FunctionProjectParser = void 0;
var functionProjectScriptParser_1 = require("./functionProjectScriptParser");
var functionProjectCodeParser_1 = require("./functionProjectCodeParser");
var powershellFunctionProjectParser_1 = require("./powershellFunctionProjectParser");
// Parses Azure Functions projects to produce Functions map (list of all Functions, their bindings and connections to other Functions)
var FunctionProjectParser = /** @class */ (function () {
    function FunctionProjectParser() {
    }
    // Collects all function.json files in a Functions project. Also tries to supplement them with bindings
    // extracted from code (if the project is .Net or Java). Also parses and organizes orchestrators/activities 
    // (if the project uses Durable Functions)
    FunctionProjectParser.parseFunctions = function (projectFolder, fileSystemWrapper, log) {
        return __awaiter(this, void 0, void 0, function () {
            var hostJsonMatch, hostJsonFolder, parser, functions, proxies;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fileSystemWrapper.findFileRecursivelyAsync(projectFolder, 'host.json', false)];
                    case 1:
                        hostJsonMatch = _a.sent();
                        if (!hostJsonMatch) {
                            throw new Error('host.json file not found under the provided project path');
                        }
                        log(">>> Found host.json at " + hostJsonMatch.filePath);
                        hostJsonFolder = fileSystemWrapper.dirName(hostJsonMatch.filePath);
                        return [4 /*yield*/, fileSystemWrapper.isCSharpProjectAsync(hostJsonFolder)];
                    case 2:
                        if (!_a.sent()) return [3 /*break*/, 3];
                        parser = new functionProjectCodeParser_1.CSharpFunctionProjectParser(fileSystemWrapper, log);
                        return [3 /*break*/, 9];
                    case 3: return [4 /*yield*/, fileSystemWrapper.isFSharpProjectAsync(hostJsonFolder)];
                    case 4:
                        if (!_a.sent()) return [3 /*break*/, 5];
                        parser = new functionProjectCodeParser_1.FSharpFunctionProjectParser(fileSystemWrapper, log);
                        return [3 /*break*/, 9];
                    case 5: return [4 /*yield*/, fileSystemWrapper.isJavaProjectAsync(hostJsonFolder)];
                    case 6:
                        if (!_a.sent()) return [3 /*break*/, 7];
                        parser = new functionProjectCodeParser_1.JavaFunctionProjectParser(fileSystemWrapper, log);
                        return [3 /*break*/, 9];
                    case 7: return [4 /*yield*/, fileSystemWrapper.isPowershellProjectAsync(hostJsonFolder)];
                    case 8:
                        if (_a.sent()) {
                            parser = new powershellFunctionProjectParser_1.PowershellFunctionProjectParser(fileSystemWrapper, log);
                        }
                        else {
                            parser = new functionProjectScriptParser_1.FunctionProjectScriptParser(fileSystemWrapper, log);
                            // For script-based functions use host.json's folder as the root
                            projectFolder = hostJsonFolder;
                        }
                        _a.label = 9;
                    case 9: return [4 /*yield*/, parser.traverseFunctions(projectFolder)];
                    case 10:
                        functions = _a.sent();
                        return [4 /*yield*/, fileSystemWrapper.readProxiesJson(projectFolder, log)];
                    case 11:
                        proxies = _a.sent();
                        return [2 /*return*/, { functions: functions, proxies: proxies, projectFolder: projectFolder }];
                }
            });
        });
    };
    return FunctionProjectParser;
}());
exports.FunctionProjectParser = FunctionProjectParser;
