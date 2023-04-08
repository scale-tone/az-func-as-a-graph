"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BindingsParser = exports.getCodeInBracketsReverse = exports.getCodeInBrackets = exports.posToLineNr = exports.removeNamespace = exports.cleanupFunctionName = void 0;
function cleanupFunctionName(name) {
    if (!name) {
        return name;
    }
    var nameofMatch = new RegExp("nameof\\s*\\(\\s*([\\w\\.]+)\\s*\\)").exec(name);
    if (!!nameofMatch) {
        return removeNamespace(nameofMatch[1]);
    }
    name = name.trim();
    if (name.startsWith('"')) {
        return name.replace(/^"/, '').replace(/"$/, '');
    }
    return removeNamespace(name);
}
exports.cleanupFunctionName = cleanupFunctionName;
function removeNamespace(name) {
    if (!name) {
        return name;
    }
    var dotPos = name.lastIndexOf('.');
    if (dotPos >= 0) {
        name = name.substring(dotPos + 1);
    }
    return name.trim();
}
exports.removeNamespace = removeNamespace;
// Primitive way of getting a line number out of symbol position
function posToLineNr(code, pos) {
    if (!code) {
        return 0;
    }
    var lineBreaks = code.substr(0, pos).match(/(\r\n|\r|\n)/g);
    return !lineBreaks ? 1 : lineBreaks.length + 1;
}
exports.posToLineNr = posToLineNr;
// Complements regex's inability to keep up with nested brackets
function getCodeInBrackets(str, startFrom, openingBracket, closingBracket, mustHaveSymbols) {
    if (mustHaveSymbols === void 0) { mustHaveSymbols = ''; }
    var bracketCount = 0, openBracketPos = -1, mustHaveSymbolFound = !mustHaveSymbols;
    for (var i = startFrom; i < str.length; i++) {
        switch (str[i]) {
            case openingBracket:
                if (bracketCount <= 0) {
                    openBracketPos = i;
                }
                bracketCount++;
                break;
            case closingBracket:
                bracketCount--;
                if (bracketCount <= 0 && mustHaveSymbolFound) {
                    return { code: str.substring(startFrom, i + 1), openBracketPos: openBracketPos - startFrom };
                }
                break;
        }
        if (bracketCount > 0 && mustHaveSymbols.includes(str[i])) {
            mustHaveSymbolFound = true;
        }
    }
    return { code: '', openBracketPos: -1 };
}
exports.getCodeInBrackets = getCodeInBrackets;
// Complements regex's inability to keep up with nested brackets
function getCodeInBracketsReverse(str, openingBracket, closingBracket) {
    var bracketCount = 0, closingBracketPos = 0;
    for (var i = str.length - 1; i >= 0; i--) {
        switch (str[i]) {
            case closingBracket:
                if (bracketCount <= 0) {
                    closingBracketPos = i;
                }
                bracketCount++;
                break;
            case openingBracket:
                bracketCount--;
                if (bracketCount <= 0) {
                    return { code: str.substring(0, closingBracketPos + 1), openBracketPos: i };
                }
                break;
        }
    }
    return { code: '', openBracketPos: -1 };
}
exports.getCodeInBracketsReverse = getCodeInBracketsReverse;
// In .Net not all bindings are mentioned in function.json, so we need to analyze source code to extract them
var BindingsParser = /** @class */ (function () {
    function BindingsParser() {
    }
    // Extracts additional bindings info from C#/F# source code
    BindingsParser.tryExtractBindings = function (funcCode) {
        var result = [];
        if (!funcCode) {
            return result;
        }
        var regex = this.bindingAttributeRegex;
        var match;
        while (!!(match = regex.exec(funcCode))) {
            var isReturn = !!match[3];
            var attributeName = match[4];
            if (attributeName.endsWith("Attribute")) {
                attributeName = attributeName.substring(0, attributeName.length - "Attribute".length);
            }
            var attributeCodeStartIndex = match.index + match[0].length;
            var attributeCode = getCodeInBrackets(funcCode, attributeCodeStartIndex, '(', ')', '').code;
            this.isOutRegex.lastIndex = attributeCodeStartIndex + attributeCode.length;
            var isOut = !!this.isOutRegex.exec(funcCode);
            switch (attributeName) {
                case 'BlobInput':
                case 'BlobOutput':
                case 'Blob': {
                    var binding = {
                        type: 'blob',
                        direction: attributeName === 'Blob' ? (isReturn || isOut ? 'out' : 'in') : (attributeName === 'BlobOutput' ? 'out' : 'in')
                    };
                    var paramsMatch = this.blobParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.path = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'BlobTrigger': {
                    var binding = { type: 'blobTrigger' };
                    var paramsMatch = this.blobParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.path = paramsMatch[1];
                    }
                    result.push(binding);
                    break;
                }
                case 'TableInput':
                case 'TableOutput':
                case 'Table': {
                    var binding = {
                        type: 'table',
                        direction: attributeName === 'Table' ? (isReturn || isOut ? 'out' : 'in') : (attributeName === 'TableOutput' ? 'out' : 'in')
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
                        direction: attributeName === 'CosmosDB' ? (isReturn || isOut ? 'out' : 'in') : (attributeName === 'CosmosDBOutput' ? 'out' : 'in')
                    };
                    var paramsMatch = this.cosmosDbParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.databaseName = paramsMatch[1];
                        binding.collectionName = paramsMatch[3];
                    }
                    result.push(binding);
                    break;
                }
                case 'CosmosDBTrigger': {
                    var binding = { type: 'cosmosDBTrigger' };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding.databaseName = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
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
                case 'QueueTrigger': {
                    var binding = { type: 'queueTrigger' };
                    var paramsMatch = this.singleParamRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[2];
                    }
                    result.push(binding);
                    break;
                }
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
                    result.push(binding);
                    result.push({ type: 'http', direction: 'out' });
                    break;
                }
                case 'OrchestrationTrigger':
                case 'DurableOrchestrationTrigger': {
                    result.push({ type: 'orchestrationTrigger', direction: 'in' });
                    break;
                }
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
                default: {
                    result.push({ type: attributeName, direction: isReturn || isOut ? 'out' : 'in' });
                    break;
                }
            }
        }
        return result;
    };
    BindingsParser.getFunctionAttributeRegex = function () {
        return new RegExp("\\[\\s*Function(Name)?(Attribute)?\\s*\\(([\"\\w\\s\\.\\(\\)-]+)\\)\\s*\\]", 'g');
    };
    BindingsParser.getJavaFunctionAttributeRegex = function () {
        return new RegExp("@\\s*FunctionName\\s*\\(([\"\\w\\s\\.\\(\\)-]+)\\)", 'g');
    };
    BindingsParser.getFSharpFunctionAttributeRegex = function () {
        return new RegExp("\\[<\\s*Function(Name)?\\s*\\(([\"\\w\\s\\.\\(\\)-]+)\\)", 'g');
    };
    BindingsParser.bindingAttributeRegex = new RegExp("(\\[|@)(<)?\\s*(return:)?\\s*(\\w+)", 'g');
    BindingsParser.singleParamRegex = new RegExp("(\"|nameof\\s*\\()?([\\w\\.-]+)");
    BindingsParser.eventHubParamsRegex = new RegExp("\"([^\"]+)\"");
    BindingsParser.signalRParamsRegex = new RegExp("\"([^\"]+)\"");
    BindingsParser.rabbitMqParamsRegex = new RegExp("\"([^\"]+)\"");
    BindingsParser.blobParamsRegex = new RegExp("\"([^\"]+)\"");
    BindingsParser.cosmosDbParamsRegex = new RegExp("\"([^\"]+)\"(.|\r|\n)+?\"([^\"]+)\"");
    BindingsParser.signalRConnInfoParamsRegex = new RegExp("\"([^\"]+)\"");
    BindingsParser.eventGridParamsRegex = new RegExp("\"([^\"]+)\"(.|\r|\n)+?\"([^\"]+)\"");
    BindingsParser.isOutRegex = new RegExp("^\\s*\\]\\s*(out |ICollector|IAsyncCollector).*?(,|\\()", 'g');
    BindingsParser.httpMethods = ["get", "head", "post", "put", "delete", "connect", "options", "trace", "patch"];
    BindingsParser.httpTriggerRouteRegex = new RegExp("Route\\s*=\\s*\"(.*)\"");
    BindingsParser.functionReturnTypeRegex = new RegExp("public\\s*(static\\s*|async\\s*)*(Task\\s*<\\s*)?([\\w\\.]+)");
    return BindingsParser;
}());
exports.BindingsParser = BindingsParser;
