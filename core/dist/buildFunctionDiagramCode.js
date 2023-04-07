"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFunctionDiagramCode = void 0;
var space = '#32;';
function getTriggerBindingText(binding) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    switch (binding.type) {
        case 'httpTrigger':
            return (binding.authLevel === 'anonymous' ? '#127760;' : '#128274;') + " http" + (!binding.methods ? '' : ':[' + binding.methods.join(',') + ']') + (!binding.route ? '' : ':' + binding.route);
        case 'blobTrigger':
            var blobPath = (_a = binding.blobPath) !== null && _a !== void 0 ? _a : ((_b = binding.path) !== null && _b !== void 0 ? _b : '');
            return space + "blob:" + blobPath;
        case 'cosmosDBTrigger':
            return space + "cosmosDB:" + ((_c = binding.databaseName) !== null && _c !== void 0 ? _c : '') + ":" + ((_d = binding.collectionName) !== null && _d !== void 0 ? _d : '');
        case 'eventHubTrigger':
            return space + "eventHub:" + ((_e = binding.eventHubName) !== null && _e !== void 0 ? _e : '');
        case 'kafkaTrigger':
            return space + "kafka:" + ((_f = binding.brokerList) !== null && _f !== void 0 ? _f : '');
        case 'eventGridTrigger':
            return space + "eventGrid:" + ((_g = binding.topicEndpointUri) !== null && _g !== void 0 ? _g : '');
        case 'serviceBusTrigger':
            var queueOrTopicName = (_h = binding.queueOrTopicName) !== null && _h !== void 0 ? _h : ((_j = binding.queueName) !== null && _j !== void 0 ? _j : ((_k = binding.topicName) !== null && _k !== void 0 ? _k : ''));
            return space + "serviceBus:" + queueOrTopicName + (!binding.subscriptionName ? '' : ':' + binding.subscriptionName);
        case 'queueTrigger':
            return space + "queue:" + ((_l = binding.queueName) !== null && _l !== void 0 ? _l : '');
        case 'timerTrigger':
            return space + "timer:" + ((_m = binding.schedule) !== null && _m !== void 0 ? _m : '');
        default:
            return "" + space + binding.type;
    }
}
function getBindingText(binding) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    switch (binding.type) {
        case 'table':
            return space + "table:" + ((_a = binding.tableName) !== null && _a !== void 0 ? _a : '');
        case 'blob':
            var blobPath = (_b = binding.blobPath) !== null && _b !== void 0 ? _b : ((_c = binding.path) !== null && _c !== void 0 ? _c : '');
            return space + "blob:" + blobPath;
        case 'cosmosDB':
            return space + "cosmosDB:" + ((_d = binding.databaseName) !== null && _d !== void 0 ? _d : '') + ":" + ((_e = binding.collectionName) !== null && _e !== void 0 ? _e : '');
        case 'eventHub':
            return space + "eventHub:" + ((_f = binding.eventHubName) !== null && _f !== void 0 ? _f : '');
        case 'kafka':
            return space + "kafka:" + ((_g = binding.brokerList) !== null && _g !== void 0 ? _g : '');
        case 'eventGrid':
            return space + "eventGrid:" + ((_h = binding.topicEndpointUri) !== null && _h !== void 0 ? _h : '');
        case 'serviceBus':
            var queueOrTopicName = (_j = binding.queueOrTopicName) !== null && _j !== void 0 ? _j : ((_k = binding.queueName) !== null && _k !== void 0 ? _k : ((_l = binding.topicName) !== null && _l !== void 0 ? _l : ''));
            return space + "serviceBus:" + queueOrTopicName + (!binding.subscriptionName ? '' : ':' + binding.subscriptionName);
        case 'queue':
            return space + "queue:" + ((_m = binding.queueName) !== null && _m !== void 0 ? _m : '');
        default:
            return "" + space + binding.type;
    }
}
// Translates functions and their bindings into a Mermaid Flowchart diagram code
function buildFunctionDiagramCode(functionsMap, proxiesMap, settings) {
    var _a, _b;
    if (settings === void 0) { settings = {}; }
    var code = '';
    if (!settings.doNotRenderFunctions) {
        var functions = [];
        // Determine what kind of function this one is
        for (var name_1 in functionsMap) {
            var func = functionsMap[name_1];
            var triggerBinding = undefined, inputBindings = [], outputBindings = [], otherBindings = [];
            var nodeCode = name_1 + "{{\"" + space + name_1 + "\"}}:::function";
            for (var i = 0; i < func.bindings.length; i++) {
                var binding = func.bindings[i];
                binding.index = i;
                if (binding.type === 'orchestrationTrigger') {
                    nodeCode = name_1 + "[[\"" + space + name_1 + "\"]]:::orchestrator";
                }
                else if (binding.type === 'activityTrigger') {
                    nodeCode = name_1 + "[/\"" + space + name_1 + "\"/]:::activity";
                }
                else if (binding.type === 'entityTrigger') {
                    nodeCode = name_1 + "[(\"" + space + name_1 + "\")]:::entity";
                }
                if (binding.type.endsWith('Trigger')) {
                    triggerBinding = binding;
                }
                else if (binding.direction === 'in') {
                    inputBindings.push(binding);
                }
                else if (binding.direction === 'out') {
                    outputBindings.push(binding);
                }
                else {
                    otherBindings.push(binding);
                }
            }
            functions.push(__assign({ name: name_1, nodeCode: nodeCode, triggerBinding: triggerBinding, inputBindings: inputBindings, outputBindings: outputBindings, otherBindings: otherBindings }, func));
        }
        // Sorting by trigger type, then by name. Moving the ones that are being called to the bottom.
        var getFunctionHash_1 = function (f) {
            var _a;
            var hash = (!!((_a = f.isCalledBy) === null || _a === void 0 ? void 0 : _a.length) || !f.triggerBinding || !f.triggerBinding.type) ? '' : f.triggerBinding.type;
            hash += '~' + f.name;
            return hash;
        };
        functions.sort(function (f1, f2) {
            var s1 = getFunctionHash_1(f1);
            var s2 = getFunctionHash_1(f2);
            return (s1 > s2) ? 1 : ((s2 > s1) ? -1 : 0);
        });
        // Rendering
        for (var _i = 0, functions_1 = functions; _i < functions_1.length; _i++) {
            var func = functions_1[_i];
            code += func.nodeCode + "\n";
            // Making Functions nodes a bit darker
            code += "style " + func.name + " fill:#D9D9FF,stroke-width:2px\n";
            if (!!((_a = func.isCalledBy) === null || _a === void 0 ? void 0 : _a.length)) {
                for (var _c = 0, _d = func.isCalledBy; _c < _d.length; _c++) {
                    var calledBy = _d[_c];
                    code += calledBy + " ---> " + func.name + "\n";
                }
            }
            else if (!!func.triggerBinding) {
                code += func.name + ".binding" + func.triggerBinding.index + "." + func.triggerBinding.type + ">\"" + getTriggerBindingText(func.triggerBinding) + "\"]:::" + func.triggerBinding.type + " --> " + func.name + "\n";
            }
            for (var _e = 0, _f = func.inputBindings; _e < _f.length; _e++) {
                var inputBinding = _f[_e];
                code += func.name + ".binding" + inputBinding.index + "." + inputBinding.type + "([\"" + getBindingText(inputBinding) + "\"]):::" + inputBinding.type + " -.-> " + func.name + "\n";
            }
            for (var _g = 0, _h = func.outputBindings; _g < _h.length; _g++) {
                var outputBinding = _h[_g];
                code += func.name + " -.-> " + func.name + ".binding" + outputBinding.index + "." + outputBinding.type + "([\"" + getBindingText(outputBinding) + "\"]):::" + outputBinding.type + "\n";
            }
            for (var _j = 0, _k = func.otherBindings; _j < _k.length; _j++) {
                var otherBinding = _k[_j];
                code += func.name + " -.- " + func.name + ".binding" + otherBinding.index + "." + otherBinding.type + "([\"" + getBindingText(otherBinding) + "\"]):::" + otherBinding.type + "\n";
            }
            if (!!((_b = func.isSignalledBy) === null || _b === void 0 ? void 0 : _b.length)) {
                for (var _l = 0, _m = func.isSignalledBy; _l < _m.length; _l++) {
                    var signalledBy = _m[_l];
                    code += signalledBy.name + " -- \"#9889; " + signalledBy.signalName + "\" ---> " + func.name + "\n";
                }
            }
            if (!!func.isCalledByItself) {
                code += func.name + " -- \"[ContinueAsNew]\" --> " + func.name + "\n";
            }
        }
    }
    // Also proxies
    if (!settings.doNotRenderProxies && (Object.keys(proxiesMap).length > 0)) {
        var proxyNodesColor = '#FFE6C8';
        var nodeTitle = "";
        var notAddedToCsProjFile = false;
        for (var name_2 in proxiesMap) {
            var proxy = proxiesMap[name_2];
            var proxyPurifiedName = name_2.replace(/ /g, '');
            notAddedToCsProjFile = proxy.warningNotAddedToCsProjFile;
            nodeTitle = '';
            if (!!proxy.matchCondition) {
                if (!!proxy.matchCondition.methods && !!proxy.matchCondition.methods.length) {
                    nodeTitle += (!!nodeTitle ? ':' : '') + ("[" + proxy.matchCondition.methods.join(',') + "]");
                }
                if (!!proxy.matchCondition.route) {
                    nodeTitle += (!!nodeTitle ? ':' : '') + proxy.matchCondition.route;
                }
            }
            if (!nodeTitle) {
                nodeTitle = name_2;
            }
            var nodeName = "proxy." + proxyPurifiedName;
            code += "proxies.json -. \"" + name_2 + "\" .-> " + nodeName + "([\"" + space + nodeTitle + "\"]):::proxy\n";
            code += "style " + nodeName + " fill:" + proxyNodesColor + "\n";
            if (!!proxy.backendUri) {
                nodeTitle = proxy.backendUri.replace(/'response./g, "'");
                var nextNodeName_1 = "proxy." + proxyPurifiedName + ".backendUri";
                code += nodeName + " " + getRequestOverridesArrowCode(proxy.requestOverrides) + " " + nextNodeName_1 + "[\"" + space + nodeTitle + "\"]:::http\n";
                code += "style " + nextNodeName_1 + " fill:" + proxyNodesColor + "\n";
                nodeName = nextNodeName_1;
            }
            var nextNodeName = "proxy." + proxyPurifiedName + ".response";
            code += nodeName + " " + getResponseOverridesArrowCode(proxy.responseOverrides) + " " + nextNodeName + "([\"" + space + ".\"]):::http\n";
            code += "style " + nextNodeName + " fill:" + proxyNodesColor + "\n";
        }
        nodeTitle = "proxies.json";
        var nodeColor = proxyNodesColor;
        if (notAddedToCsProjFile) {
            nodeTitle += " #9888; Not added to .CSPROJ file!";
            nodeColor = "#FF8080";
        }
        code += "proxies.json[\"" + space + nodeTitle + "\"]\n";
        code += "style proxies.json fill:" + nodeColor + "\n";
    }
    return code;
}
exports.buildFunctionDiagramCode = buildFunctionDiagramCode;
var maxSymbolsInTitle = 150;
function getRequestOverridesArrowCode(requestOverrides) {
    if (!requestOverrides) {
        return "-->";
    }
    var arrowText = JSON.stringify(requestOverrides)
        .replace(/"/g, "'")
        .replace(/'backend.request./g, "'");
    if (arrowText.length > maxSymbolsInTitle) {
        arrowText = arrowText.substr(0, maxSymbolsInTitle) + '...';
    }
    return "-- \"" + arrowText + space + "\" -->";
}
function getResponseOverridesArrowCode(responseOverrides) {
    if (!responseOverrides) {
        return "-->";
    }
    if (!!responseOverrides['response.body']) {
        responseOverrides['response.body'] = '...';
    }
    var arrowText = JSON.stringify(responseOverrides)
        .replace(/"/g, "'")
        .replace(/'response./g, "'");
    if (arrowText.length > maxSymbolsInTitle) {
        arrowText = arrowText.substr(0, maxSymbolsInTitle) + '...';
    }
    return "-- \"" + arrowText + space + "\" -->";
}