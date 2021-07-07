import { observable, computed } from 'mobx';
import axios from 'axios';
import mermaid from 'mermaid';

import { buildFunctionDiagramCode } from './buildFunctionDiagramCode';
import { FunctionsMap, ProxiesMap } from './shared/FunctionsMap';

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
    get functionsLoaded(): boolean { return !!this._traverseResult; };

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

        if (!this._traverseResult) {
            return;
        }

        this._inProgress = true;
        try {

            const diagramCode = buildFunctionDiagramCode(this._traverseResult.functions, this._traverseResult.proxies,
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
        this._traverseResult = null;

        const projectPath = this.pathText;
        window.history.replaceState(null, null, `?path=${encodeURIComponent(projectPath)}`);
        this.pathText = '';

        const traversedFunctionsPromise = axios.post(`a/p/i/traverse-func`, projectPath);

        Promise.all([traversedFunctionsPromise, this._iconsSvgPromise]).then(responses => {

            this._traverseResult = responses[0].data
            this._iconsSvg = responses[1].data;

            this.render();

        }, err => {
            this._error = `Parsing failed: ${err.message}.${(!!err.response ? err.response.data : '')}`;
            this._inProgress = false;
        });
    }

    private applyIcons(svg: string): string {

        // Placing icons code into a <defs> block at the top
        svg = svg.replace(`><style>`, `>\n<defs>\n${this._iconsSvg}</defs>\n<style>`);

        // Adding <use> blocks referencing relevant icons
        svg = svg.replace(/<g class="node (\w+).*?<g class="label" transform="translate\([0-9,.-]+\)"><g transform="translate\([0-9,.-]+\)">/g,
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
    private _traverseResult: { functions: FunctionsMap, proxies: ProxiesMap };
    private _iconsSvg: string;

    private _iconsSvgPromise = axios.get('static/icons/all-azure-icons.svg');
}