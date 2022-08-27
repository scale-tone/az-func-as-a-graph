"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFunctionDiagramCode = void 0;
const space = '#32;';
function getTriggerBindingText(binding) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    switch (binding.type) {
        case 'httpTrigger':
            return `${binding.authLevel === 'anonymous' ? '#127760;' : '#128274;'} http${!binding.methods ? '' : ':[' + binding.methods.join(',') + ']'}${!binding.route ? '' : ':' + binding.route}`;
        case 'blobTrigger':
            const blobPath = (_a = binding.blobPath) !== null && _a !== void 0 ? _a : ((_b = binding.path) !== null && _b !== void 0 ? _b : '');
            return `${space}blob:${blobPath}`;
        case 'cosmosDBTrigger':
            return `${space}cosmosDB:${(_c = binding.databaseName) !== null && _c !== void 0 ? _c : ''}:${(_d = binding.collectionName) !== null && _d !== void 0 ? _d : ''}`;
        case 'eventHubTrigger':
            return `${space}eventHub:${(_e = binding.eventHubName) !== null && _e !== void 0 ? _e : ''}`;
        case 'serviceBusTrigger':
            const queueOrTopicName = (_f = binding.queueOrTopicName) !== null && _f !== void 0 ? _f : ((_g = binding.queueName) !== null && _g !== void 0 ? _g : ((_h = binding.topicName) !== null && _h !== void 0 ? _h : ''));
            return `${space}serviceBus:${queueOrTopicName}${!binding.subscriptionName ? '' : ':' + binding.subscriptionName}`;
        case 'queueTrigger':
            return `${space}queue:${(_j = binding.queueName) !== null && _j !== void 0 ? _j : ''}`;
        case 'timerTrigger':
            return `${space}timer:${(_k = binding.schedule) !== null && _k !== void 0 ? _k : ''}`;
        default:
            return `${space}${binding.type}`;
    }
}
function getBindingText(binding) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    switch (binding.type) {
        case 'table':
            return `${space}table:${(_a = binding.tableName) !== null && _a !== void 0 ? _a : ''}`;
        case 'blob':
            const blobPath = (_b = binding.blobPath) !== null && _b !== void 0 ? _b : ((_c = binding.path) !== null && _c !== void 0 ? _c : '');
            return `${space}blob:${blobPath}`;
        case 'cosmosDB':
            return `${space}cosmosDB:${(_d = binding.databaseName) !== null && _d !== void 0 ? _d : ''}:${(_e = binding.collectionName) !== null && _e !== void 0 ? _e : ''}`;
        case 'eventHub':
            return `${space}eventHub:${(_f = binding.eventHubName) !== null && _f !== void 0 ? _f : ''}`;
        case 'eventGrid':
            return `${space}eventGrid:${(_g = binding.topicEndpointUri) !== null && _g !== void 0 ? _g : ''}`;
        case 'serviceBus':
            const queueOrTopicName = (_h = binding.queueOrTopicName) !== null && _h !== void 0 ? _h : ((_j = binding.queueName) !== null && _j !== void 0 ? _j : ((_k = binding.topicName) !== null && _k !== void 0 ? _k : ''));
            return `${space}serviceBus:${queueOrTopicName}${!binding.subscriptionName ? '' : ':' + binding.subscriptionName}`;
        case 'queue':
            return `${space}queue:${(_l = binding.queueName) !== null && _l !== void 0 ? _l : ''}`;
        default:
            return `${space}${binding.type}`;
    }
}
// Translates functions and their bindings into a Mermaid Flowchart diagram code
function buildFunctionDiagramCode(functionsMap, proxiesMap, settings = {}) {
    var _a, _b;
    let code = '';
    if (!settings.doNotRenderFunctions) {
        const functions = [];
        // Determine what kind of function this one is
        for (const name in functionsMap) {
            const func = functionsMap[name];
            let triggerBinding = undefined, inputBindings = [], outputBindings = [], otherBindings = [];
            let nodeCode = `${name}{{"${space}${name}"}}:::function`;
            for (let i = 0; i < func.bindings.length; i++) {
                const binding = func.bindings[i];
                binding.index = i;
                if (binding.type === 'orchestrationTrigger') {
                    nodeCode = `${name}[["${space}${name}"]]:::orchestrator`;
                }
                else if (binding.type === 'activityTrigger') {
                    nodeCode = `${name}[/"${space}${name}"/]:::activity`;
                }
                else if (binding.type === 'entityTrigger') {
                    nodeCode = `${name}[("${space}${name}")]:::entity`;
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
            functions.push(Object.assign({ name, nodeCode, triggerBinding, inputBindings, outputBindings, otherBindings }, func));
        }
        // Sorting by trigger type, then by name. Moving the ones that are being called to the bottom.
        const getFunctionHash = (f) => {
            var _a;
            let hash = (!!((_a = f.isCalledBy) === null || _a === void 0 ? void 0 : _a.length) || !f.triggerBinding || !f.triggerBinding.type) ? '' : f.triggerBinding.type;
            hash += '~' + f.name;
            return hash;
        };
        functions.sort((f1, f2) => {
            let s1 = getFunctionHash(f1);
            let s2 = getFunctionHash(f2);
            return (s1 > s2) ? 1 : ((s2 > s1) ? -1 : 0);
        });
        // Rendering
        for (const func of functions) {
            code += `${func.nodeCode}\n`;
            // Making Functions nodes a bit darker
            code += `style ${func.name} fill:#D9D9FF,stroke-width:2px\n`;
            if (!!((_a = func.isCalledBy) === null || _a === void 0 ? void 0 : _a.length)) {
                for (const calledBy of func.isCalledBy) {
                    code += `${calledBy} ---> ${func.name}\n`;
                }
            }
            else if (!!func.triggerBinding) {
                code += `${func.name}.binding${func.triggerBinding.index}.${func.triggerBinding.type}>"${getTriggerBindingText(func.triggerBinding)}"]:::${func.triggerBinding.type} --> ${func.name}\n`;
            }
            for (const inputBinding of func.inputBindings) {
                code += `${func.name}.binding${inputBinding.index}.${inputBinding.type}(["${getBindingText(inputBinding)}"]):::${inputBinding.type} -.-> ${func.name}\n`;
            }
            for (const outputBinding of func.outputBindings) {
                code += `${func.name} -.-> ${func.name}.binding${outputBinding.index}.${outputBinding.type}(["${getBindingText(outputBinding)}"]):::${outputBinding.type}\n`;
            }
            for (const otherBinding of func.otherBindings) {
                code += `${func.name} -.- ${func.name}.binding${otherBinding.index}.${otherBinding.type}(["${getBindingText(otherBinding)}"]):::${otherBinding.type}\n`;
            }
            if (!!((_b = func.isSignalledBy) === null || _b === void 0 ? void 0 : _b.length)) {
                for (const signalledBy of func.isSignalledBy) {
                    code += `${signalledBy.name} -- "#9889; ${signalledBy.signalName}" ---> ${func.name}\n`;
                }
            }
            if (!!func.isCalledByItself) {
                code += `${func.name} -- "[ContinueAsNew]" --> ${func.name}\n`;
            }
        }
    }
    // Also proxies
    if (!settings.doNotRenderProxies && (Object.keys(proxiesMap).length > 0)) {
        const proxyNodesColor = '#FFE6C8';
        let nodeTitle = ``;
        let notAddedToCsProjFile = false;
        for (const name in proxiesMap) {
            const proxy = proxiesMap[name];
            const proxyPurifiedName = name.replace(/ /g, '');
            notAddedToCsProjFile = proxy.warningNotAddedToCsProjFile;
            nodeTitle = '';
            if (!!proxy.matchCondition) {
                if (!!proxy.matchCondition.methods && !!proxy.matchCondition.methods.length) {
                    nodeTitle += (!!nodeTitle ? ':' : '') + `[${proxy.matchCondition.methods.join(',')}]`;
                }
                if (!!proxy.matchCondition.route) {
                    nodeTitle += (!!nodeTitle ? ':' : '') + proxy.matchCondition.route;
                }
            }
            if (!nodeTitle) {
                nodeTitle = name;
            }
            let nodeName = `proxy.${proxyPurifiedName}`;
            code += `proxies.json -. "${name}" .-> ${nodeName}(["${space}${nodeTitle}"]):::proxy\n`;
            code += `style ${nodeName} fill:${proxyNodesColor}\n`;
            if (!!proxy.backendUri) {
                nodeTitle = proxy.backendUri.replace(/'response./g, `'`);
                const nextNodeName = `proxy.${proxyPurifiedName}.backendUri`;
                code += `${nodeName} ${getRequestOverridesArrowCode(proxy.requestOverrides)} ${nextNodeName}["${space}${nodeTitle}"]:::http\n`;
                code += `style ${nextNodeName} fill:${proxyNodesColor}\n`;
                nodeName = nextNodeName;
            }
            const nextNodeName = `proxy.${proxyPurifiedName}.response`;
            code += `${nodeName} ${getResponseOverridesArrowCode(proxy.responseOverrides)} ${nextNodeName}(["${space}."]):::http\n`;
            code += `style ${nextNodeName} fill:${proxyNodesColor}\n`;
        }
        nodeTitle = `proxies.json`;
        let nodeColor = proxyNodesColor;
        if (notAddedToCsProjFile) {
            nodeTitle += ` #9888; Not added to .CSPROJ file!`;
            nodeColor = `#FF8080`;
        }
        code += `proxies.json["${space}${nodeTitle}"]\n`;
        code += `style proxies.json fill:${nodeColor}\n`;
    }
    return code;
}
exports.buildFunctionDiagramCode = buildFunctionDiagramCode;
const maxSymbolsInTitle = 150;
function getRequestOverridesArrowCode(requestOverrides) {
    if (!requestOverrides) {
        return `-->`;
    }
    let arrowText = JSON.stringify(requestOverrides)
        .replace(/"/g, `'`)
        .replace(/'backend.request./g, `'`);
    if (arrowText.length > maxSymbolsInTitle) {
        arrowText = arrowText.substr(0, maxSymbolsInTitle) + '...';
    }
    return `-- "${arrowText}${space}" -->`;
}
function getResponseOverridesArrowCode(responseOverrides) {
    if (!responseOverrides) {
        return `-->`;
    }
    if (!!responseOverrides['response.body']) {
        responseOverrides['response.body'] = '...';
    }
    let arrowText = JSON.stringify(responseOverrides)
        .replace(/"/g, `'`)
        .replace(/'response./g, `'`);
    if (arrowText.length > maxSymbolsInTitle) {
        arrowText = arrowText.substr(0, maxSymbolsInTitle) + '...';
    }
    return `-- "${arrowText}${space}" -->`;
}
//# sourceMappingURL=buildFunctionDiagramCode.js.map