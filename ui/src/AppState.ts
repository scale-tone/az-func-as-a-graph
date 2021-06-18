import { observable, computed } from 'mobx';
import axios from 'axios';
import mermaid from 'mermaid';

import { buildFunctionDiagramCode } from './buildFunctionDiagramCode';

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

            flowchart: {
                curve: 'Basis',
                useMaxWidth: true,
                htmlLabels: false
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

        const traversedFunctionsPromise = axios.post(`a/p/i/traverse-func`, projectPath);

        Promise.all([traversedFunctionsPromise, this._iconsSvgPromise]).then(responses => {

            try {
                const diagramCode = buildFunctionDiagramCode(responses[0].data);
                const iconsSvg = responses[1].data;

                if (!diagramCode) {
                    this._inProgress = false;
                    return;
                }

                this._diagramCode = `graph LR\n${diagramCode}`;

                mermaid.render('mermaidSvgId', this._diagramCode, (svg) => {

                    this._diagramSvg = this.applyIcons(svg, iconsSvg);

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

    private applyIcons(svg: string, iconsSvg: string): string {

        // Placing icons code into a <defs> block at the top
        svg = svg.replace(`><style>`, `>\n<defs>\n${iconsSvg}</defs>\n<style>`);

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

    private _iconsSvgPromise = axios.get('static/icons/all-azure-icons.svg');
}