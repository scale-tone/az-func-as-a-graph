"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFunctionDiagramCode = void 0;
const space = '#32;';
function getTriggerBindingText(binding) {
    var _a, _b, _c, _d, _e, _f, _g;
    switch (binding.type) {
        case 'httpTrigger':
            return `${binding.authLevel === 'anonymous' ? '#127760;' : '#128274;'} http${!binding.methods ? '' : ':[' + binding.methods.join(',') + ']'}${!binding.route ? '' : ':' + binding.route}`;
        case 'blobTrigger':
            return `${space}blob:${(_a = binding.path) !== null && _a !== void 0 ? _a : ''}`;
        case 'cosmosDBTrigger':
            return `${space}cosmosDB:${(_b = binding.databaseName) !== null && _b !== void 0 ? _b : ''}:${(_c = binding.collectionName) !== null && _c !== void 0 ? _c : ''}`;
        case 'eventHubTrigger':
            return `${space}eventHub:${(_d = binding.eventHubName) !== null && _d !== void 0 ? _d : ''}`;
        case 'serviceBusTrigger':
            return `${space}serviceBus:${!binding.queueName ? ((_e = binding.topicName) !== null && _e !== void 0 ? _e : '') : binding.queueName}${!binding.subscriptionName ? '' : ':' + binding.subscriptionName}`;
        case 'queueTrigger':
            return `${space}queue:${(_f = binding.queueName) !== null && _f !== void 0 ? _f : ''}`;
        case 'timerTrigger':
            return `${space}timer:${(_g = binding.schedule) !== null && _g !== void 0 ? _g : ''}`;
        default:
            return `${space}${binding.type}`;
    }
}
function getBindingText(binding) {
    var _a, _b, _c, _d, _e, _f, _g;
    switch (binding.type) {
        case 'table':
            return `${space}table:${(_a = binding.tableName) !== null && _a !== void 0 ? _a : ''}`;
        case 'blob':
            return `${space}blob:${(_b = binding.path) !== null && _b !== void 0 ? _b : ''}`;
        case 'cosmosDB':
            return `${space}cosmosDB:${(_c = binding.databaseName) !== null && _c !== void 0 ? _c : ''}:${(_d = binding.collectionName) !== null && _d !== void 0 ? _d : ''}`;
        case 'eventHub':
            return `${space}eventHub:${(_e = binding.eventHubName) !== null && _e !== void 0 ? _e : ''}`;
        case 'serviceBus':
            return `${space}serviceBus:${!binding.queueName ? ((_f = binding.topicName) !== null && _f !== void 0 ? _f : '') : binding.queueName}${!binding.subscriptionName ? '' : ':' + binding.subscriptionName}`;
        case 'queue':
            return `${space}queue:${(_g = binding.queueName) !== null && _g !== void 0 ? _g : ''}`;
        default:
            return `${space}${binding.type}`;
    }
}
// Translates functions and their bindings into a Mermaid Flowchart diagram code
function buildFunctionDiagramCode(functionsMap) {
    var _a, _b;
    const functions = [];
    // Determine what kind of function this one is
    for (const name in functionsMap) {
        const func = functionsMap[name];
        var triggerBinding = undefined, inputBindings = [], outputBindings = [], otherBindings = [];
        var nodeCode = `${name}{{"${space}${name}"}}:::function`;
        for (const binding of func.bindings) {
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
        var hash = (!!((_a = f.isCalledBy) === null || _a === void 0 ? void 0 : _a.length) || !f.triggerBinding || !f.triggerBinding.type) ? '' : f.triggerBinding.type;
        hash += '~' + f.name;
        return hash;
    };
    functions.sort((f1, f2) => {
        var s1 = getFunctionHash(f1);
        var s2 = getFunctionHash(f2);
        return (s1 > s2) ? 1 : ((s2 > s1) ? -1 : 0);
    });
    // Rendering
    var code = '';
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
            code += `${func.name}.${func.triggerBinding.type}>"${getTriggerBindingText(func.triggerBinding)}"]:::${func.triggerBinding.type} --> ${func.name}\n`;
        }
        for (const inputBinding of func.inputBindings) {
            code += `${func.name}.${inputBinding.type}(["${getBindingText(inputBinding)}"]):::${inputBinding.type} -.-> ${func.name}\n`;
        }
        for (const outputBinding of func.outputBindings) {
            code += `${func.name} -.-> ${func.name}.${outputBinding.type}(["${getBindingText(outputBinding)}"]):::${outputBinding.type}\n`;
        }
        for (const otherBinding of func.otherBindings) {
            code += `${func.name} -.- ${func.name}.${otherBinding.type}(["${getBindingText(otherBinding)}"]):::${otherBinding.type}\n`;
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
    return code;
}
exports.buildFunctionDiagramCode = buildFunctionDiagramCode;
//# sourceMappingURL=buildFunctionDiagramCode.js.map