import { observable, computed } from 'mobx';
import mermaid from 'mermaid';

// Referencing this code from package doesn't work - results in weird compilation errors.
import { buildFunctionDiagramCode } from './buildFunctionDiagramCode';
import { FunctionsMap, ProxiesMap } from 'func-project-parser/FunctionsMap';

// ID of an embedded SVG element containing Azure service icons. Should be present in index.html
const AllAzureIconsSvgElementId = "all-azure-icons-svg";

// This method is provided by VsCode, when running inside a WebView
declare const acquireVsCodeApi: () => any;

export class AppState {

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

            maxTextSize: 500000,
            
            sequence: {
                noteMargin: 0,
                boxMargin: 5,
                boxTextMargin: 5
            },

            flowchart: {
                curve: 'Basis',
                useMaxWidth: true,
                htmlLabels: false
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
    
                this._diagramSvg = this.getStyledSvg(this.applyIcons(svg));
    
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

    saveAsSvg(): void {

        this._vsCodeApi.postMessage({ kind: 'SaveAs', data: this._diagramSvg });
    }

    saveAsJson(): void {

        this._vsCodeApi.postMessage({ kind: 'SaveFunctionGraphAsJson' });
    }

    showMessage(msg: string): void {

        this._vsCodeApi.postMessage({ kind: 'ShowMessage', data: msg });
    }

    private applyIcons(svg: string): string {

        const iconsSvgElement = document.getElementById(AllAzureIconsSvgElementId);
        if (!iconsSvgElement) {
            return svg;
        }

        // Placing icons code into a <defs> block at the top
        svg = svg.replace(`><style>`, `>\n<defs>\n${iconsSvgElement.innerHTML}</defs>\n<style>`);

        // Adding <use> blocks referencing relevant icons
        svg = svg.replace(/<g style="opacity: [0-9.]+;" transform="translate\([0-9,.-]+\)" id="[^"]+" class="node (\w+).*?<g transform="translate\([0-9,.-]+\)" class="label"><g transform="translate\([0-9,.-]+\)">/g,
            `$&<use href="#az-icon-$1" width="20px" height="20px"/>`);

        return svg;
    }

    // Appends some styling to SVG code, so it can also be saved as file
    private getStyledSvg(svg: string): string {

        return svg.replace('</style>',
            '.note { stroke: none !important; fill: none !important; } ' +
            '.noteText { font-size: 9px !important; } ' +
            '.label > g > text { transform: translateX(25px); }' +
            '</style>'
        );
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
