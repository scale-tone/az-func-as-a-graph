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
const traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
// Parses Azure Functions projects to produce Functions map (list of all Functions, their bindings and connections to other Functions)
class FunctionProjectParserBase {
    constructor(_fileSystemWrapper, _log) {
        this._fileSystemWrapper = _fileSystemWrapper;
        this._log = _log;
        this.singleParamRegex = new RegExp(`("|nameof\\s*\\()?([\\w\\.-]+)`);
        this.eventHubParamsRegex = new RegExp(`"([^"]+)"`);
        this.signalRParamsRegex = new RegExp(`"([^"]+)"`);
        this.rabbitMqParamsRegex = new RegExp(`"([^"]+)"`);
        this.blobParamsRegex = new RegExp(`"([^"]+)"`);
        this.cosmosDbParamsRegex = new RegExp(`"([^"]+)"(.|\r|\n)+?"([^"]+)"`);
        this.signalRConnInfoParamsRegex = new RegExp(`"([^"]+)"`);
        this.eventGridParamsRegex = new RegExp(`"([^"]+)"(.|\r|\n)+?"([^"]+)"`);
        this.isOutRegex = new RegExp(`^\\s*\\]\\s*(out |ICollector|IAsyncCollector).*?(,|\\()`, 'g');
        this.httpMethods = [`get`, `head`, `post`, `put`, `delete`, `connect`, `options`, `trace`, `patch`];
        this.httpTriggerRouteRegex = new RegExp(`Route\\s*=\\s*"(.*)"`);
        this.functionReturnTypeRegex = new RegExp(`public\\s*(static\\s*|async\\s*)*(Task\\s*<\\s*)?([\\w\\.]+)`);
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
    // Extracts additional bindings info from C#/F# source code
    tryExtractBindings(funcCode) {
        const result = [];
        if (!funcCode) {
            return result;
        }
        const regex = this.getBindingAttributeRegex();
        let match;
        while (!!(match = regex.regex.exec(funcCode))) {
            const isReturn = match[regex.pos - 1] === 'return:';
            let attributeName = match[regex.pos];
            if (attributeName.endsWith(`Attribute`)) {
                attributeName = attributeName.substring(0, attributeName.length - `Attribute`.length);
            }
            const attributeCodeStartIndex = match.index + match[0].length;
            const attributeCode = traverseFunctionProjectUtils_1.getCodeInBrackets(funcCode, attributeCodeStartIndex, '(', ')', '').code;
            this.isOutRegex.lastIndex = attributeCodeStartIndex + attributeCode.length;
            const isOut = !!this.isOutRegex.exec(funcCode);
            switch (attributeName) {
                case 'read_blob':
                case 'blob_input':
                case 'blob_output':
                case 'BlobInput':
                case 'BlobOutput':
                case 'Blob': {
                    const binding = {
                        type: 'blob',
                        direction: attributeName === 'Blob' ? (isReturn || isOut ? 'out' : 'in') : (attributeName.toLowerCase().endsWith('output') ? 'out' : 'in')
                    };
                    const paramsMatch = this.blobParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.path = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'blob_trigger':
                case 'BlobTrigger': {
                    const binding = { type: 'blobTrigger' };
                    const paramsMatch = this.blobParamsRegex.exec(attributeCode);
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
                    const binding = {
                        type: 'table',
                        direction: attributeName === 'Table' ? (isReturn || isOut ? 'out' : 'in') : (attributeName.toLowerCase().endsWith('output') ? 'out' : 'in')
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
                        direction: attributeName === 'CosmosDB' ? (isReturn || isOut ? 'out' : 'in') : (attributeName.toLowerCase().endsWith('output') ? 'out' : 'in')
                    };
                    const paramsMatch = this.cosmosDbParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.databaseName = paramsMatch[1];
                        binding.collectionName = paramsMatch[3];
                    }
                    result.push(binding);
                    break;
                }
                case 'cosmos_db_trigger':
                case 'CosmosDBTrigger': {
                    const binding = { type: 'cosmosDBTrigger' };
                    const paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.databaseName = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
                case 'event_grid_output':
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
                case 'event_hub_output':
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
                case 'event_hub_message_trigger':
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
                case 'queue_output':
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
                case 'queue_trigger':
                case 'QueueTrigger': {
                    const binding = { type: 'queueTrigger' };
                    const paramsMatch = this.singleParamRegex.exec(attributeCode);
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
                    const binding = { type: 'serviceBus', direction: 'out' };
                    const paramsMatch = this.singleParamRegex.exec(attributeCode);
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
                case 'route':
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
                    const binding = { type: 'timerTrigger' };
                    const paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['schedule'] = paramsMatch[2];
                    }
                    result.push(binding);
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
    getBindingAttributeRegex() {
        return {
            regex: new RegExp(`(\\[|@)(<)?\\s*(return:)?\\s*(\\w+)`, 'g'),
            pos: 4
        };
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
    getCallActivityRegex(activityName) {
        return new RegExp(`(CallActivity|call_activity)[\\s\\w,\\.-<>\\[\\]\\(\\)\\?]*\\([\\s\\w\\.-]*["'\`]?${activityName}\\s*["'\`\\),]{1}`, 'i');
    }
    getClassDefinitionRegex(className) {
        return new RegExp(`class\\s*${className}`);
    }
}
exports.FunctionProjectParserBase = FunctionProjectParserBase;
//# sourceMappingURL=functionProjectParserBase.js.map