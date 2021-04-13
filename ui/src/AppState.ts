import { observable, computed } from 'mobx';
import axios from 'axios';

import mermaid from 'mermaid';

export class AppState {

    @computed
    get diagramSvg(): string { return this._diagramSvg; }

    @computed
    get diagramCode(): string { return this._diagramCode; }

    @computed
    get error(): string { return this._error; }

    @observable
    pathText: string = "";

    @computed
    get inProgress(): boolean { return this._inProgress; };

    constructor() {
        mermaid.initialize({
            startOnLoad: true,
            sequence: {
                noteMargin: 0,
                boxMargin: 5,
                boxTextMargin: 5
            }
        });
    }

    load() {

        if (this._inProgress || !this.pathText) {
            return;
        }
        this._inProgress = true;
        this._error = '';
        this._diagramCode = '';
        this._diagramSvg = '';

        const projectPath = this.pathText;
        window.history.replaceState(null, null, `?path=${encodeURIComponent(projectPath)}`);
        this.pathText = '';

        axios.post(`a/p/i/traverse-func`, projectPath).then(response => {

            try {
                const functions = [];

                // Determine what kind of function this one is
                for (const name in response.data) {
                    const func = response.data[name];

                    var triggerBinding = undefined, inputBindings = [], outputBindings = [];
                    var nodeCode = `${name}{{"#32;${name}"}}:::function`;

                    for (const binding of func.bindings) {

                        if (binding.type === 'orchestrationTrigger') {
                            nodeCode = `${name}[["#32;${name}"]]:::orchestrator`;
                        } else if (binding.type === 'activityTrigger') {
                            nodeCode = `${name}[/"#32;${name}"/]:::activity`;
                        } else if (binding.type === 'entityTrigger') {
                            nodeCode = `${name}[("#32;${name}")]:::entity`;
                        }
                        
                        if (binding.type.endsWith('Trigger')) {
                            triggerBinding = binding;
                        } else if (binding.direction === 'in') {
                            inputBindings.push(binding);
                        } else {
                            outputBindings.push(binding);
                        }
                    }

                    functions.push({ name, nodeCode, triggerBinding, inputBindings, outputBindings, ...func });
                }

                // Sorting by trigger type, then by name
                functions.sort((f1, f2) => {

                    var s1 = (!!f1.isCalledBy || !f1.triggerBinding || !f1.triggerBinding.type) ? '' : f1.triggerBinding.type;
                    s1 += '~' + f1.name;

                    var s2 = (!!f2.isCalledBy || !f2.triggerBinding || !f2.triggerBinding.type) ? '' : f2.triggerBinding.type;
                    s2 += '~' + f2.name;

                    return (s1 > s2) ? 1 : ((s2 > s1) ? -1 : 0);
                });

                // Rendering
                var code = '';
                for (const func of functions) {

                    code += `${func.nodeCode}\n`;

                    if (!!func.isCalledBy) {
                        
                        code += `${func.isCalledBy} --> ${func.name}\n`;

                    } else if (!!func.triggerBinding) {

                        code += `${func.name}.${func.triggerBinding.type}>"#32;${this.getTriggerBindingText(func.triggerBinding)}"]:::${func.triggerBinding.type} --> ${func.name}\n`;
                    }

                    for (const inputBinding of func.inputBindings) {
                        code += `${func.name}.${inputBinding.type}(["#32;${this.getBindingText(inputBinding)}"]):::${inputBinding.type} -.-> ${func.name}\n`;
                    }

                    for (const outputBinding of func.outputBindings) {
                        code += `${func.name} -.-> ${func.name}.${outputBinding.type}(["#32;${this.getBindingText(outputBinding)}"]):::${outputBinding.type}\n`;
                    }
                }

                if (!code) {
                    this._inProgress = false;
                    return;
                }

                this._diagramCode = `graph LR\n${code}`;

                mermaid.render('mermaidSvgId', this._diagramCode, (svg) => {

                    this._diagramSvg = this.applyIcons(svg);

                    this._inProgress = false;
                });

            } catch (err) {
                this._error = `Diagram generation failed: ${err.message}`;
                this._inProgress = false;
            }

        }, err => {
            this._error = `Parsing failed: ${err.message}.${(!!err.response ? err.response.data : '')}`;
            this._inProgress = false;
        });
    }

    private getTriggerBindingText(binding: any): string {

        switch (binding.type) {
            case 'httpTrigger':
                return `http${!binding.methods ? '' : ':[' + binding.methods.join(',') + ']'}${!binding.route ? '' : ':' + binding.route}`;
            case 'blobTrigger':
                return `blob:${binding.path}`;
            case 'cosmosDBTrigger':
                return `cosmosDB:${binding.databaseName}:${binding.collectionName}`;
            case 'eventHubTrigger':
                return `eventHub:${binding.eventHubName}`;
            case 'serviceBusTrigger':
                return `serviceBus:${!binding.queueName ? binding.topicName : binding.queueName}${!binding.subscriptionName ? '' : ':' + binding.subscriptionName}`;
            case 'queueTrigger':
                return `queue:${binding.queueName}`;
            case 'timerTrigger':
                return `timer:${binding.schedule}`;
            default:
                return binding.type;
        }
    }

    private getBindingText(binding: any): string {

        switch (binding.type) {
            case 'blob':
                return `blob:${binding.path}`;
            case 'cosmosDB':
                return `cosmosDB:${binding.databaseName}:${binding.collectionName}`;
            case 'eventHub':
                return `eventHub:${binding.eventHubName}`;
            case 'serviceBus':
                return `serviceBus:${!binding.queueName ? binding.topicName : binding.queueName}${!binding.subscriptionName ? '' : ':' + binding.subscriptionName}`;
            case 'queue':
                return `queue:${binding.queueName}`;
            default:
                return binding.type;
        }
    }

    private applyIcons(svg: string): string {

        svg = svg.replace(/<g class="node (\w+).*?<g class="label" transform="translate\([0-9,.-]+\)"><g transform="translate\([0-9,.-]+\)">/g,
            '$&<image href="static/icons/$1.svg" width="20px"/>');

        return svg;
    }

    @observable
    private _error: string;
    @observable
    private _diagramCode: string;
    @observable
    private _diagramSvg: string;
    @observable
    private _inProgress: boolean;
}