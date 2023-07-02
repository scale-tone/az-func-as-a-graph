import { observable, computed } from 'mobx';
import mermaid from 'mermaid';

import { FunctionsMap, ProxiesMap } from 'az-func-as-a-graph.core/dist/FunctionsMap';
import { buildFunctionDiagramCode } from 'az-func-as-a-graph.core/dist/buildFunctionDiagramCode';

// ID of an embedded SVG element containing Azure service icons. Should be present in index.html
const AllAzureIconsSvgElementId = "all-azure-icons-svg";

// This method is provided by VsCode, when running inside a WebView
declare const acquireVsCodeApi: () => any;

export class AppState {

    @observable
    menuAnchorElement?: Element;

    @computed
    get diagramSvg(): string { return this._diagramSvg; }

    @computed
    get diagramCode(): string { return this._diagramCode; }

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

        // Handling responses from VsCode
        window.addEventListener('message', event => {

            this._traversalResult = event.data;
            this.render();
        });
    }

    render() {

        this._diagramCode = '';
        this._diagramSvg = '';

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
            }, (err) => {

                this._vsCodeApi.postMessage({ kind: 'ShowError', data: err.message ?? err });
                this._inProgress = false;
            });

        } catch (err) {

            this._vsCodeApi.postMessage({ kind: 'ShowError', data: err.message ?? err });
            this._inProgress = false;
        }
    }

    refresh() {

        this._inProgress = true;

        this._vsCodeApi.postMessage({ kind: 'Refresh' });
    }

    gotoFunctionCode(functionName: string): void {

        this._vsCodeApi.postMessage({ kind: 'GotoFunctionCode', data: functionName });
    }

    copyToClipboard(): void {
        this.menuAnchorElement = undefined;

        window.navigator.clipboard.writeText(this.diagramCode);

        this._vsCodeApi.postMessage({ kind: 'ShowMessage', data: 'Diagram code was copied to Clipboard' });
    }

    saveAsSvg(): void {
        this.menuAnchorElement = undefined;

        this._vsCodeApi.postMessage({ kind: 'SaveAs', data: this._diagramSvg });
    }

    saveAsJson(): void {
        this.menuAnchorElement = undefined;

        this._vsCodeApi.postMessage({ kind: 'SaveFunctionGraphAsJson' });
    }

    private applyIcons(svg: string): string {

        const iconsSvgElement = document.getElementById(AllAzureIconsSvgElementId);
        if (!iconsSvgElement) {
            return svg;
        }

        // Placing icons code into a <defs> block at the top
        svg = svg.replace(`><style>`, `>\n<defs>\n${iconsSvgElement.innerHTML}</defs>\n<style>`);

        svg = svg.replace(/<g transform="translate\([0-9,.-\s]+\)" id="[^"]+" class="node default (\w+).*?<g transform="translate\([0-9,.-\s]+\)" style="" class="label">/g,
            `$&<use href="#az-icon-$1" width="20px" height="20px"/>`);

        return svg;
    }

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

    private readonly _vsCodeApi = acquireVsCodeApi();
}
