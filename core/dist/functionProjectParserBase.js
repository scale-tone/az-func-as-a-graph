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
exports.FunctionProjectParserBase = void 0;
var traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
// Parses Azure Functions projects to produce Functions map (list of all Functions, their bindings and connections to other Functions)
var FunctionProjectParserBase = /** @class */ (function () {
    function FunctionProjectParserBase(_fileSystemWrapper, _log) {
        this._fileSystemWrapper = _fileSystemWrapper;
        this._log = _log;
        this.singleParamRegex = new RegExp("(\"|nameof\\s*\\()?([\\w\\.-]+)");
        this.eventHubParamsRegex = new RegExp("\"([^\"]+)\"");
        this.signalRParamsRegex = new RegExp("\"([^\"]+)\"");
        this.rabbitMqParamsRegex = new RegExp("\"([^\"]+)\"");
        this.blobParamsRegex = new RegExp("\"([^\"]+)\"");
        this.cosmosDbParamsRegex = new RegExp("\"([^\"]+)\"(.|\r|\n)+?\"([^\"]+)\"");
        this.signalRConnInfoParamsRegex = new RegExp("\"([^\"]+)\"");
        this.eventGridParamsRegex = new RegExp("\"([^\"]+)\"(.|\r|\n)+?\"([^\"]+)\"");
        this.isOutRegex = new RegExp("^\\s*\\]\\s*(out |ICollector|IAsyncCollector).*?(,|\\()", 'g');
        this.httpMethods = ["get", "head", "post", "put", "delete", "connect", "options", "trace", "patch"];
        this.httpTriggerRouteRegex = new RegExp("Route\\s*=\\s*\"(.*)\"");
        this.functionReturnTypeRegex = new RegExp("public\\s*(static\\s*|async\\s*)*(Task\\s*<\\s*)?([\\w\\.]+)");
    }
    // Tries to match orchestrations and their activities by parsing source code
    FunctionProjectParserBase.prototype.mapOrchestratorsAndActivitiesAsync = function (functions, projectFolder) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function () {
            var functionNames, orchestratorNames, orchestrators, activityNames, activities, entityNames, entities, otherFunctionNames, otherFunctions, _i, orchestrators_1, orch, regex, _e, otherFunctions_1, func, _f, orchestrators_2, subOrch, regex_1, eventNames, _g, eventNames_1, eventName, regex_2, _h, otherFunctions_2, func, _j, entities_1, entity, _k, otherFunctions_3, func, regex, _l, _m, func;
            return __generator(this, function (_o) {
                switch (_o.label) {
                    case 0:
                        functionNames = Object.keys(functions);
                        orchestratorNames = functionNames.filter(function (name) { return functions[name].bindings.some(function (b) { return b.type === 'orchestrationTrigger'; }); });
                        return [4 /*yield*/, this.getFunctionsAndTheirCodesAsync(orchestratorNames, projectFolder)];
                    case 1:
                        orchestrators = _o.sent();
                        activityNames = Object.keys(functions).filter(function (name) { return functions[name].bindings.some(function (b) { return b.type === 'activityTrigger'; }); });
                        return [4 /*yield*/, this.getFunctionsAndTheirCodesAsync(activityNames, projectFolder)];
                    case 2:
                        activities = _o.sent();
                        entityNames = functionNames.filter(function (name) { return functions[name].bindings.some(function (b) { return b.type === 'entityTrigger'; }); });
                        return [4 /*yield*/, this.getFunctionsAndTheirCodesAsync(entityNames, projectFolder)];
                    case 3:
                        entities = _o.sent();
                        otherFunctionNames = functionNames.filter(function (name) { return !functions[name].bindings.some(function (b) { return ['orchestrationTrigger', 'activityTrigger', 'entityTrigger'].includes(b.type); }); });
                        return [4 /*yield*/, this.getFunctionsAndTheirCodesAsync(otherFunctionNames, projectFolder)];
                    case 4:
                        otherFunctions = _o.sent();
                        for (_i = 0, orchestrators_1 = orchestrators; _i < orchestrators_1.length; _i++) {
                            orch = orchestrators_1[_i];
                            regex = this.getStartNewOrchestrationRegex(orch.name);
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
                                regex_1 = this.getCallSubOrchestratorRegex(subOrch.name);
                                if (!!regex_1.exec(orch.code)) {
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
                            eventNames = this.getEventNames(orch.code);
                            for (_g = 0, eventNames_1 = eventNames; _g < eventNames_1.length; _g++) {
                                eventName = eventNames_1[_g];
                                regex_2 = this.getRaiseEventRegex(eventName);
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
                                regex = this.getSignalEntityRegex(entity.name);
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
    };
    // Tries to extract event names that this orchestrator is awaiting
    FunctionProjectParserBase.prototype.getEventNames = function (orchestratorCode) {
        var result = [];
        var regex = this.getWaitForExternalEventRegex();
        var match;
        while (!!(match = regex.regex.exec(orchestratorCode))) {
            result.push(match[regex.pos]);
        }
        return result;
    };
    // Tries to match orchestrator with its activities
    FunctionProjectParserBase.prototype.mapActivitiesToOrchestrator = function (functions, orch, activityNames) {
        var _a;
        for (var _i = 0, activityNames_1 = activityNames; _i < activityNames_1.length; _i++) {
            var activityName = activityNames_1[_i];
            // If this orchestrator seems to be calling this activity
            var regex = this.getCallActivityRegex(activityName);
            if (!!regex.exec(orch.code)) {
                // Then mapping this activity to this orchestrator
                functions[activityName].isCalledBy = (_a = functions[activityName].isCalledBy) !== null && _a !== void 0 ? _a : [];
                functions[activityName].isCalledBy.push(orch.name);
            }
        }
    };
    // Extracts additional bindings info from C#/F# source code
    FunctionProjectParserBase.prototype.tryExtractBindings = function (funcCode) {
        var result = [];
        if (!funcCode) {
            return result;
        }
        var regex = this.getBindingAttributeRegex();
        var match;
        while (!!(match = regex.regex.exec(funcCode))) {
            var isReturn = match[regex.pos - 1] === 'return:';
            var attributeName = match[regex.pos];
            if (attributeName.endsWith("Attribute")) {
                attributeName = attributeName.substring(0, attributeName.length - "Attribute".length);
            }
            var attributeCodeStartIndex = match.index + match[0].length;
            var attributeCode = traverseFunctionProjectUtils_1.getCodeInBrackets(funcCode, attributeCodeStartIndex, '(', ')', '').code;
            this.isOutRegex.lastIndex = attributeCodeStartIndex + attributeCode.length;
            var isOut = !!this.isOutRegex.exec(funcCode);
            switch (attributeName) {
                case 'read_blob':
                case 'blob_input':
                case 'blob_output':
                case 'BlobInput':
                case 'BlobOutput':
                case 'Blob': {
                    var binding = {
                        type: 'blob',
                        direction: attributeName === 'Blob' ? (isReturn || isOut ? 'out' : 'in') : (attributeName.toLowerCase().endsWith('output') ? 'out' : 'in')
                    };
                    var paramsMatch = this.blobParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.path = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'blob_trigger':
                case 'BlobTrigger': {
                    var binding = { type: 'blobTrigger' };
                    var paramsMatch = this.blobParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.path = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'table_input':
                case 'table_output':
                case 'TableInput':
                case 'TableOutput':
                case 'Table': {
                    var binding = {
                        type: 'table',
                        direction: attributeName === 'Table' ? (isReturn || isOut ? 'out' : 'in') : (attributeName.toLowerCase().endsWith('output') ? 'out' : 'in')
                    };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.tableName = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'CosmosDBInput':
                case 'CosmosDBOutput':
                case 'CosmosDB': {
                    var binding = {
                        type: 'cosmosDB',
                        direction: attributeName === 'CosmosDB' ? (isReturn || isOut ? 'out' : 'in') : (attributeName.toLowerCase().endsWith('output') ? 'out' : 'in')
                    };
                    var paramsMatch = this.cosmosDbParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.databaseName = paramsMatch[1];
                        binding.collectionName = paramsMatch[3];
                    }
                    result.push(binding);
                    break;
                }
                case 'cosmos_db_trigger':
                case 'CosmosDBTrigger': {
                    var binding = { type: 'cosmosDBTrigger' };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.databaseName = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'event_grid_output':
                case 'EventGrid':
                case 'EventGridOutput': {
                    var binding = { type: 'eventGrid', direction: 'out' };
                    var paramsMatch = this.eventGridParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.topicEndpointUri = paramsMatch[1];
                        binding.topicKeySetting = paramsMatch[3];
                    }
                    result.push(binding);
                    break;
                }
                case 'EventGridTrigger': {
                    var binding = { type: 'eventGridTrigger' };
                    var paramsMatch = this.eventGridParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.topicEndpointUri = paramsMatch[1];
                        binding.topicKeySetting = paramsMatch[3];
                    }
                    result.push(binding);
                    break;
                }
                case 'event_hub_output':
                case 'EventHub':
                case 'EventHubOutput': {
                    var binding = { type: 'eventHub', direction: 'out' };
                    var paramsMatch = this.eventHubParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.eventHubName = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'event_hub_message_trigger':
                case 'EventHubTrigger': {
                    var binding = { type: 'eventHubTrigger' };
                    var paramsMatch = this.eventHubParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.eventHubName = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'Kafka':
                case 'KafkaOutput': {
                    var binding = { type: 'kafka', direction: 'out' };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.brokerList = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'KafkaTrigger': {
                    var binding = { type: 'kafkaTrigger' };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.brokerList = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'queue_output':
                case 'Queue':
                case 'QueueOutput': {
                    var binding = { type: 'queue', direction: 'out' };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'queue_trigger':
                case 'QueueTrigger': {
                    var binding = { type: 'queueTrigger' };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'service_bus_queue_output':
                case 'service_bus_topic_output':
                case 'ServiceBus':
                case 'ServiceBusOutput': {
                    var binding = { type: 'serviceBus', direction: 'out' };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'service_bus_queue_trigger':
                case 'service_bus_topic_trigger':
                case 'ServiceBusTrigger':
                case 'ServiceBusQueueTrigger':
                case 'ServiceBusTopicTrigger': {
                    var binding = { type: 'serviceBusTrigger' };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'SignalRConnectionInfo':
                case 'SignalRConnectionInfoInput': {
                    var binding = { type: 'signalRConnectionInfo', direction: 'in' };
                    var paramsMatch = this.signalRConnInfoParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.hubName = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'SignalR':
                case 'SignalROutput': {
                    var binding = { type: 'signalR', direction: 'out' };
                    var paramsMatch = this.signalRParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['hubName'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'SignalRTrigger': {
                    var binding = { type: 'signalRTrigger' };
                    var paramsMatch = this.signalRParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['hubName'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'RabbitMQ':
                case 'RabbitMQOutput': {
                    var binding = { type: 'rabbitMQ', direction: 'out' };
                    var paramsMatch = this.rabbitMqParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'RabbitMQTrigger': {
                    var binding = { type: 'rabbitMQTrigger' };
                    var paramsMatch = this.rabbitMqParamsRegex.exec(attributeCode);
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
                case 'route':
                case 'HttpTrigger': {
                    var binding = { type: 'httpTrigger', methods: [] };
                    var httpTriggerRouteMatch = this.httpTriggerRouteRegex.exec(attributeCode);
                    if (!!httpTriggerRouteMatch) {
                        binding.route = httpTriggerRouteMatch[1];
                    }
                    var lowerAttributeCode = attributeCode.toLowerCase();
                    for (var _i = 0, _a = this.httpMethods; _i < _a.length; _i++) {
                        var httpMethod = _a[_i];
                        if (lowerAttributeCode.includes("\"" + httpMethod + "\"")) {
                            binding.methods.push(httpMethod);
                        }
                    }
                    if (/level.anonymous/i.exec(attributeCode)) {
                        binding.authLevel = 'anonymous';
                    }
                    result.push(binding);
                    result.push({ type: 'http', direction: 'out' });
                    break;
                }
                case 'orchestration_trigger':
                case 'OrchestrationTrigger':
                case 'DurableOrchestrationTrigger': {
                    result.push({ type: 'orchestrationTrigger', direction: 'in' });
                    break;
                }
                case 'activity_trigger':
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
                case 'schedule':
                case 'TimerTrigger': {
                    var binding = { type: 'timerTrigger' };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['schedule'] = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'OrchestrationClient':
                case 'DurableClient':
                case 'DurableClientInput': {
                    result.push({ type: 'durableClient', direction: 'in' });
                    break;
                }
                default: {
                    // Doing nothing for now, as there are too many "false positives"
                    break;
                }
            }
        }
        return result;
    };
    FunctionProjectParserBase.prototype.getBindingAttributeRegex = function () {
        return {
            regex: new RegExp("(\\[|@)(<)?\\s*(return:)?\\s*(\\w+)", 'g'),
            pos: 4
        };
    };
    FunctionProjectParserBase.prototype.getStartNewOrchestrationRegex = function (orchName) {
        return new RegExp("(StartNew|StartNewAsync|start_new|scheduleNewOrchestrationInstance|scheduleNewOrchestrationInstanceAsync)(\\s*<[\\w\\.-\\[\\]\\<\\>,\\s]+>)?\\s*\\(\\s*([\"'`]|nameof\\s*\\(\\s*[\\w\\.-]*|[\\w\\s\\.]+\\.\\s*)" + orchName + "\\s*[\"'\\),]{1}", 'i');
    };
    FunctionProjectParserBase.prototype.getCallSubOrchestratorRegex = function (subOrchName) {
        return new RegExp("(CallSubOrchestrator|CallSubOrchestratorWithRetry|call_sub_orchestrator)(Async)?(\\s*<[\\w\\.-\\[\\]\\<\\>,\\s]+>)?\\s*\\(\\s*([\"'`]|nameof\\s*\\(\\s*[\\w\\.-]*|[\\w\\s\\.]+\\.\\s*)" + subOrchName + "\\s*[\"'\\),]{1}", 'i');
    };
    FunctionProjectParserBase.prototype.getContinueAsNewRegex = function () {
        return new RegExp("ContinueAsNew\\s*\\(", 'i');
    };
    FunctionProjectParserBase.prototype.getRaiseEventRegex = function (eventName) {
        return new RegExp("(RaiseEvent|raise_event)(Async)?(.|\r|\n)*" + eventName, 'i');
    };
    FunctionProjectParserBase.prototype.getSignalEntityRegex = function (entityName) {
        return new RegExp(entityName + "\\s*[\"'>]{1}");
    };
    FunctionProjectParserBase.prototype.getWaitForExternalEventRegex = function () {
        return {
            regex: new RegExp("(WaitForExternalEvent|wait_for_external_event)(<[\\s\\w,\\.-\\[\\]\\(\\)\\<\\>]+>)?\\s*\\(\\s*(nameof\\s*\\(\\s*|[\"'`]|[\\w\\s\\.]+\\.\\s*)?([\\s\\w\\.-]+)\\s*[\"'`\\),]{1}", 'gi'),
            pos: 4
        };
    };
    FunctionProjectParserBase.prototype.getCallActivityRegex = function (activityName) {
        return new RegExp("(CallActivity|call_activity)[\\s\\w,\\.-<>\\[\\]\\(\\)\\?]*\\([\\s\\w\\.-]*[\"'`]?" + activityName + "\\s*[\"'`\\),]{1}", 'i');
    };
    FunctionProjectParserBase.prototype.getClassDefinitionRegex = function (className) {
        return new RegExp("class\\s*" + className);
    };
    return FunctionProjectParserBase;
}());
exports.FunctionProjectParserBase = FunctionProjectParserBase;
