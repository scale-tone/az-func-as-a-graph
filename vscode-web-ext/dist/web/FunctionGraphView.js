"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionGraphView = void 0;
const vscode = require("vscode");
const functionProjectParser_1 = require("az-func-as-a-graph.core/functionProjectParser");
const FileSystemWrapper_1 = require("./FileSystemWrapper");
// Represents the function graph view
class FunctionGraphView {
    constructor(_context, _functionProjectUri) {
        this._context = _context;
        this._functionProjectUri = _functionProjectUri;
        // Reference to the already opened WebView with the main page
        this._webViewPanel = null;
        this._staticsFolder = vscode.Uri.joinPath(this._context.extensionUri, 'HtmlStatics');
        this._webViewPanel = this.showWebView();
    }
    // Closes this web view
    cleanup() {
        if (!!this._webViewPanel) {
            this._webViewPanel.dispose();
        }
    }
    // Opens a WebView with function graph page in it
    showWebView() {
        const title = `Functions Graph (${this._functionProjectUri.fsPath})`;
        const panel = vscode.window.createWebviewPanel(FunctionGraphView.viewType, title, vscode.ViewColumn.One, {
            retainContextWhenHidden: true,
            enableScripts: true,
            localResourceRoots: [this._staticsFolder]
        });
        const fileUri = vscode.Uri.joinPath(this._staticsFolder, 'index.html');
        vscode.workspace.fs.readFile(fileUri).then(htmlBytes => {
            let html = new TextDecoder().decode(htmlBytes);
            html = this.fixLinksToStatics(html, this._staticsFolder, panel.webview);
            html = this.embedTheme(html);
            panel.webview.html = html;
        }, err => {
            vscode.window.showErrorMessage(`az-func-as-a-graph failed. ${err.message ?? err}`);
        });
        // handle events from WebView
        panel.webview.onDidReceiveMessage(request => this.handleMessageFromWebView(panel.webview, request), undefined, this._context.subscriptions);
        return panel;
    }
    // Embeds the current color theme
    embedTheme(html) {
        if ([2, 3].includes(vscode.window.activeColorTheme.kind)) {
            return html.replace('<script>var ClientConfig={}</script>', '<script>var ClientConfig={\'theme\':\'dark\'}</script>');
        }
        return html;
    }
    // Does communication between code in WebView and this class
    handleMessageFromWebView(webView, request) {
        switch (request.kind) {
            case 'ShowMessage':
                vscode.window.showInformationMessage(request.data);
                return;
            case 'ShowError':
                vscode.window.showErrorMessage(`az-func-as-a-graph failed. ${request.data}`);
                return;
            case 'SaveAs':
                // Just to be extra sure...
                if (!this.looksLikeSvg(request.data)) {
                    vscode.window.showErrorMessage(`Invalid data format. Save failed.`);
                    return;
                }
                // Saving some file to local hard drive
                vscode.window.showSaveDialog({ defaultUri: vscode.Uri.file('func-map.svg'), filters: { 'SVG Images': ['svg'] } }).then(filePath => {
                    if (!filePath) {
                        return;
                    }
                    const bytes = new TextEncoder().encode(request.data);
                    vscode.workspace.fs.writeFile(filePath, bytes).then(() => {
                        vscode.window.showInformationMessage(`SVG image saved to ${filePath}`);
                    }, err => {
                        vscode.window.showErrorMessage(`Failed to save. ${err.message ?? err}`);
                    });
                });
                return;
            case 'SaveFunctionGraphAsJson':
                if (!this._traversalResult) {
                    return;
                }
                // Saving some file to local hard drive
                vscode.window.showSaveDialog({ defaultUri: vscode.Uri.file('func-map.json'), filters: { 'JSON': ['json'] } }).then(filePath => {
                    if (!filePath) {
                        return;
                    }
                    const bytes = new TextEncoder().encode(JSON.stringify(this._traversalResult, null, 3));
                    vscode.workspace.fs.writeFile(filePath, bytes).then(() => {
                        vscode.window.showInformationMessage(`Diagram JSON saved to ${filePath}`);
                    }, err => {
                        vscode.window.showErrorMessage(`Failed to save. ${err.message ?? err}`);
                    });
                });
                return;
            case 'GotoFunctionCode':
                if (!this._traversalResult) {
                    return;
                }
                const functionName = request.data;
                var functionOrProxy = null;
                if (functionName.startsWith('proxy.')) {
                    functionOrProxy = this._traversalResult.proxies[functionName.substr(6)];
                }
                else {
                    functionOrProxy = this._traversalResult.functions[functionName];
                }
                vscode.window.showTextDocument(vscode.Uri.parse(functionOrProxy.filePath)).then(ed => {
                    const pos = ed.document.positionAt(!!functionOrProxy.pos ? functionOrProxy.pos : 0);
                    ed.selection = new vscode.Selection(pos, pos);
                    ed.revealRange(new vscode.Range(pos, pos));
                });
                return;
            case 'Refresh':
                functionProjectParser_1.FunctionProjectParser.parseFunctions(this._functionProjectUri.toString(), new FileSystemWrapper_1.FileSystemWrapper(), console.log).then(res => {
                    console.log(`>>>>>> ${this._functionProjectUri}: ${Object.keys(res.functions).length} functions`);
                    this._traversalResult = res;
                    webView.postMessage(this._traversalResult);
                }).catch(err => {
                    this._traversalResult = undefined;
                    webView.postMessage(undefined);
                    vscode.window.showErrorMessage(`az-func-as-a-graph failed. ${err.message ?? err}`);
                });
                return;
        }
    }
    fixLinksToStatics(originalHtml, staticsFolder, webView) {
        var resultHtml = originalHtml;
        const regex = / (href|src)="\/([0-9a-z.\/]+)"/ig;
        var match;
        while (match = regex.exec(originalHtml)) {
            const relativePath = match[2];
            const localPath = vscode.Uri.joinPath(staticsFolder, relativePath);
            const newPath = webView.asWebviewUri(localPath).toString();
            resultHtml = resultHtml.replace(`/${relativePath}`, newPath);
        }
        return resultHtml;
    }
    // Validates incoming SVG, just to be extra sure...
    looksLikeSvg(data) {
        return data.startsWith('<svg') && data.endsWith('</svg>') && !data.toLowerCase().includes('<script');
    }
}
exports.FunctionGraphView = FunctionGraphView;
FunctionGraphView.viewType = 'az-func-as-a-graph';
//# sourceMappingURL=FunctionGraphView.js.map