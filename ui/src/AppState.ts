import { observable, computed } from 'mobx';
import axios from 'axios';
import mermaid from 'mermaid';

import { FunctionsMap, ProxiesMap } from 'az-func-as-a-graph.core/dist/FunctionsMap';
import { buildFunctionDiagramCode } from 'az-func-as-a-graph.core/dist/buildFunctionDiagramCode';

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
                htmlLabels: true
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

            let diagramCode = buildFunctionDiagramCode(this._traversalResult.functions, this._traversalResult.proxies,
                {
                    doNotRenderFunctions: !this._renderFunctions,
                    doNotRenderProxies: !this._renderProxies
                });
    
            if (!diagramCode) {
                this._inProgress = false;
                return;
            }

            diagramCode = `graph LR\n${diagramCode}`;
            this._diagramCode = diagramCode;

            // Adding space for icons before rendering
            const spaces = `#8194;#8194;#8194;`;
            diagramCode = diagramCode.replace(/#32;/g, spaces);
            diagramCode = diagramCode.replace(/#127760;/g, `${spaces}🌐`);
            diagramCode = diagramCode.replace(/#128274;/g, `${spaces}🔒`);
    
            mermaid.render('mermaidSvgId', diagramCode).then((result) => {
    
                this._diagramSvg = this.applyIcons(result.svg);
    
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

        const traversedFunctionsPromise = axios.post(`http://localhost:7071/a/p/i/traverse-func`, projectPath);

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

        svg = svg.replace(/<g transform="translate\([0-9,.-\s]+\)" id="[^"]+" class="node default (\w+).*?<g transform="translate\([0-9,.-\s]+\)" style="" class="label">/g,
            `$&<use href="#az-icon-$1" width="20px" height="20px"/>`);
                
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

    private _iconsSvgPromise = axios.get('http://localhost:7071/static/icons/all-azure-icons.svg');
}