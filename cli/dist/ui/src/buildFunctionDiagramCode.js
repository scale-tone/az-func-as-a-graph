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
    var _a, _b, _c, _d, _e, _f, _g;
    switch (binding.type) {
        case 'httpTrigger':
            return (binding.authLevel === 'anonymous' ? '#127760;' : '#128274;') + " http" + (!binding.methods ? '' : ':[' + binding.methods.join(',') + ']') + (!binding.route ? '' : ':' + binding.route);
        case 'blobTrigger':
            return space + "blob:" + ((_a = binding.path) !== null && _a !== void 0 ? _a : '');
        case 'cosmosDBTrigger':
            return space + "cosmosDB:" + ((_b = binding.databaseName) !== null && _b !== void 0 ? _b : '') + ":" + ((_c = binding.collectionName) !== null && _c !== void 0 ? _c : '');
        case 'eventHubTrigger':
            return space + "eventHub:" + ((_d = binding.eventHubName) !== null && _d !== void 0 ? _d : '');
        case 'serviceBusTrigger':
            return space + "serviceBus:" + (!binding.queueName ? ((_e = binding.topicName) !== null && _e !== void 0 ? _e : '') : binding.queueName) + (!binding.subscriptionName ? '' : ':' + binding.subscriptionName);
        case 'queueTrigger':
            return space + "queue:" + ((_f = binding.queueName) !== null && _f !== void 0 ? _f : '');
        case 'timerTrigger':
            return space + "timer:" + ((_g = binding.schedule) !== null && _g !== void 0 ? _g : '');
        default:
            return "" + space + binding.type;
    }
}
function getBindingText(binding) {
    var _a, _b, _c, _d, _e, _f, _g;
    switch (binding.type) {
        case 'table':
            return space + "table:" + ((_a = binding.tableName) !== null && _a !== void 0 ? _a : '');
        case 'blob':
            return space + "blob:" + ((_b = binding.path) !== null && _b !== void 0 ? _b : '');
        case 'cosmosDB':
            return space + "cosmosDB:" + ((_c = binding.databaseName) !== null && _c !== void 0 ? _c : '') + ":" + ((_d = binding.collectionName) !== null && _d !== void 0 ? _d : '');
        case 'eventHub':
            return space + "eventHub:" + ((_e = binding.eventHubName) !== null && _e !== void 0 ? _e : '');
        case 'serviceBus':
            return space + "serviceBus:" + (!binding.queueName ? ((_f = binding.topicName) !== null && _f !== void 0 ? _f : '') : binding.queueName) + (!binding.subscriptionName ? '' : ':' + binding.subscriptionName);
        case 'queue':
            return space + "queue:" + ((_g = binding.queueName) !== null && _g !== void 0 ? _g : '');
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
            for (var _i = 0, _c = func.bindings; _i < _c.length; _i++) {
                var binding = _c[_i];
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
        for (var _d = 0, functions_1 = functions; _d < functions_1.length; _d++) {
            var func = functions_1[_d];
            code += func.nodeCode + "\n";
            // Making Functions nodes a bit darker
            code += "style " + func.name + " fill:#D9D9FF,stroke-width:2px\n";
            if (!!((_a = func.isCalledBy) === null || _a === void 0 ? void 0 : _a.length)) {
                for (var _e = 0, _f = func.isCalledBy; _e < _f.length; _e++) {
                    var calledBy = _f[_e];
                    code += calledBy + " ---> " + func.name + "\n";
                }
            }
            else if (!!func.triggerBinding) {
                code += func.name + "." + func.triggerBinding.type + ">\"" + getTriggerBindingText(func.triggerBinding) + "\"]:::" + func.triggerBinding.type + " --> " + func.name + "\n";
            }
            for (var i = 0; i < func.inputBindings.length; i++) {
                var inputBinding = func.inputBindings[i];
                code += func.name + "." + i + "." + inputBinding.type + "([\"" + getBindingText(inputBinding) + "\"]):::" + inputBinding.type + " -.-> " + func.name + "\n";
            }
            for (var i = 0; i < func.outputBindings.length; i++) {
                var outputBinding = func.outputBindings[i];
                code += func.name + " -.-> " + func.name + "." + i + "." + outputBinding.type + "([\"" + getBindingText(outputBinding) + "\"]):::" + outputBinding.type + "\n";
            }
            for (var i = 0; i < func.otherBindings.length; i++) {
                var otherBinding = func.otherBindings[i];
                code += func.name + " -.- " + func.name + "." + i + "." + otherBinding.type + "([\"" + getBindingText(otherBinding) + "\"]):::" + otherBinding.type + "\n";
            }
            if (!!((_b = func.isSignalledBy) === null || _b === void 0 ? void 0 : _b.length)) {
                for (var _g = 0, _h = func.isSignalledBy; _g < _h.length; _g++) {
                    var signalledBy = _h[_g];
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
