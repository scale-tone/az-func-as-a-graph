import { observable, computed } from 'mobx';
import axios from 'axios';
import mermaid from 'mermaid';

import { FunctionsMap, ProxiesMap, buildFunctionDiagramCode } from 'az-func-as-a-graph.core';

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

    @computed
    get functionsLoaded(): boolean { return !!this._traversalResult; };

    @computed
    get renderFunctions(): boolean { return this._renderFunctions; };
    set renderFunctions(val: boolean) {
        this._renderFunctions = val;
        this.render();
    };

    @computed
    get renderProxies(): boolean { return this._renderProxies; };
    set renderProxies(val: boolean) {
        this._renderProxies = val;
        this.render();
    };

    constructor() {
        mermaid.initialize({
            startOnLoad: true,

            flowchart: {
                curve: 'Basis',
                useMaxWidth: true,
                htmlLabels: false
            }
        });
    }

    render() {

        this._diagramCode = '';
        this._diagramSvg = '';
        this._error = '';

        if (!this._traversalResult) {
            return;
        }

        this._inProgress = true;
        try {

            const diagramCode = buildFunctionDiagramCode(this._traversalResult.functions, this._traversalResult.proxies,
                {
                    doNotRenderFunctions: !this._renderFunctions,
                    doNotRenderProxies: !this._renderProxies
                });
    
            if (!diagramCode) {
                this._inProgress = false;
                return;
            }
    
            this._diagramCode = `graph LR\n${diagramCode}`;
    
            mermaid.render('mermaidSvgId', this._diagramCode, (svg) => {
    
                this._diagramSvg = this.applyIcons(svg);
    
                this._inProgress = false;
            });    

        } catch (err) {
            this._error = `Diagram rendering failed: ${err.message}`;
            this._inProgress = false;
        }
    }

    load() {

        if (this._inProgress || !this.pathText) {
            return;
        }
        this._inProgress = true;
        this._diagramCode = '';
        this._diagramSvg = '';
        this._error = '';
        this._traversalResult = null;

        const projectPath = this.pathText;
        window.history.replaceState(null, null, `?path=${encodeURIComponent(projectPath)}`);

        const traversedFunctionsPromise = axios.post(`a/p/i/traverse-func`, projectPath);

        Promise.all([traversedFunctionsPromise, this._iconsSvgPromise]).then(responses => {

            this._traversalResult = responses[0].data
            this._iconsSvg = responses[1].data;

            this.render();

        }, err => {
            this._error = `Parsing failed: ${err.message}.${(!!err.response ? err.response.data : '')}`;
            this._inProgress = false;
        });
    }

    gotoFunctionCode(functionName: string): void {

        var functionOrProxy = null;

        if (functionName.startsWith('proxy.')) {
            
            functionOrProxy = this._traversalResult.proxies[functionName.substr(6)];

        } else {

            functionOrProxy = this._traversalResult.functions[functionName];
        }

        if (!!functionOrProxy && !!functionOrProxy.filePath) {
            window.open(functionOrProxy.filePath);
        }
    }

    private applyIcons(svg: string): string {

        // Placing icons code into a <defs> block at the top
        svg = svg.replace(`><style>`, `>\n<defs>\n${this._iconsSvg}</defs>\n<style>`);

        // Adding <use> blocks referencing relevant icons
        svg = svg.replace(/<g style="opacity: [0-9.]+;" transform="translate\([0-9,.-]+\)" id="[^"]+" class="node (\w+).*?<g transform="translate\([0-9,.-]+\)" class="label"><g transform="translate\([0-9,.-]+\)">/g,
            `$&<use href="#az-icon-$1" width="20px" height="20px"/>`);

        // Adding some indent to node labels, so that icons fit in
        svg = svg.replace('</style>',
            '.label > g > text { transform: translateX(25px); }' +
            '</style>'
        );
        
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
    @observable
    private _renderFunctions: boolean = true;
    @observable
    private _renderProxies: boolean = true;
    @observable
    private _traversalResult: { functions: FunctionsMap, proxies: ProxiesMap };
    private _iconsSvg: string;

    private _iconsSvgPromise = axios.get('static/icons/all-azure-icons.svg');
}