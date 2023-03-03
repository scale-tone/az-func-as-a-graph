![logo](https://raw.githubusercontent.com/scale-tone/az-func-as-a-graph/master/screenshot1.png)
# az-func-as-a-graph

Visualizes your Azure Functions project in form of a graph. Accepts links to git repos (GitHub, Azure DevOps) or local paths.

UPD1: is now also a part of [Durable Functions Monitor VsCode extension](https://marketplace.visualstudio.com/items?itemName=DurableFunctionsMonitor.durablefunctionsmonitor).
**Command Palette -> Visualize Functions as a Graph...**

UPD2: is now also [available as a VsCode web extension](https://marketplace.visualstudio.com/items?itemName=DurableFunctionsMonitor.az-func-as-a-graph). Install it in your browser once - and it will then automatically visualize Functions in every GitHub repo you're observing with [VsCode for the Web](https://code.visualstudio.com/docs/editor/vscode-web) (by pressing `.` on a GitHub repo).

## How to run as a VsCode Web Extension

Just [install it from the Marketplace](https://marketplace.visualstudio.com/items?itemName=DurableFunctionsMonitor.az-func-as-a-graph). Then every time you open a Functions project (a project with 'host.json' file in it) the graph will appear automatically. Alternatively click on a `host.json` file and use the `az-func-as-a-graph: Show...` command.

Because it is a **web** extension, you only need to install it once. Then it will live in your browser and work on every Azure Functions project you open.

## How to run as a GitHub Codespace

For this to work you'll need to have [GitHub Codespaces](https://github.com/features/codespaces) enabled for your org.

* Click on this button:

  <img src="https://user-images.githubusercontent.com/5447190/185810992-a8b131fa-0d50-4adf-bc80-426b33ef8cdd.png" width="500px"/>

    (If you don't see it, it means that [GitHub Codespaces](https://github.com/features/codespaces) are not enabled)

* Once a Codespace instance is started, type `func start` in Terminal window.
* Click on this button:

  <img src="https://user-images.githubusercontent.com/5447190/185811296-383cd0e7-bdec-4886-bac6-3c048c9095da.png" width="300px"/>

    az-func-as-a-graph's UI will be opened in a separate browser tab. 

* Enter a link to any Azure Functions project (e.g. `https://github.com/scale-tone/az-func-as-a-graph`) into there and press 'Visualize'.

## How to run locally

This tool is itself an Azure Function (written in TypeScript), so to run it you'll need:
- [Azure Functions Core Tools](https://github.com/Azure/azure-functions-core-tools#installing) package installed **globally** (`npm i -g azure-functions-core-tools`).

Clone this repo to your devbox, then type the following from the project root folder:
```
npm install
npm run build
func start
```

Then navigate to `http://localhost:7071` with your browser, specify either local path or link to a github repo and press 'Visualize'.

## How to run as part of Azure DevOps build pipeline

Install [this Azure DevOps extension](https://marketplace.visualstudio.com/items?itemName=DurableFunctionsMonitor.az-func-as-a-graph-do-extension) into your org and then add `az-func-as-a-graph` task into your pipeline:

<img src="https://user-images.githubusercontent.com/5447190/126083277-89e4e9d2-6b13-4d2c-af4c-e2a0a12932c0.png" width="500px"/>

## How to run from command line

This mode allows to programmatically generate diagrams out of your source code, e.g. as part of your build pipeline.

Clone this repo, then type the following from the project root folder:
```
npm install
node az-func-as-a-graph {path-to-my-functions-project-folder} {output-file-name} {json-file-with-settings}
```

This now became possible thanks to [mermaid-cli](https://github.com/mermaid-js/mermaid-cli) NPM package (which will be locally installed by [az-func-as-a-graph](https://github.com/scale-tone/az-func-as-a-graph/blob/main/az-func-as-a-graph.js) script at its first run).

`npm install` is only needed once, of course.

`{path-to-my-functions-project-folder}` can be either local folder or link to a GitHub repo. If it is a link, then it can as well point to a particular branch or tag and/or include a relative path. E.g. `https://github.com/scale-tone/WhatIfDemo/tree/20190516.1/WhatIfDemo-Functions`.

`{output-file-name}` should be a file name with local path. 
* If its extension is `.svg`, the graph will be written to this file in SVG format.
* If its extension is `.htm`, a static HTML page will be generated. The tool will also try its best to make that page *interactive*, so that e.g. when you click on a graph node, the relevant Function's source code is shown. [Here is an example of such a page](https://scale-tone.github.io/temp/WhatIfDemo-Functions.htm). If the project link contains a branch/tag, the links to sources will be relative to that branch/tag.
* If its extension is `.json`, a Functions Map file will be generated and saved as JSON. Then you can upload this file to your [Durable Functions Monitor](https://github.com/scale-tone/DurableFunctionsMonitor) standalone/injected instance, to make it show you an interactive animated Functions Graph.
* If its extension is `.md`, a [Markdown file with embedded graph](https://github.blog/2022-02-14-include-diagrams-markdown-files-mermaid/) will be generated.


`{json-file-with-settings}` is an optional path to an optional JSON file with optional settings. Like this one:
```
{
    "templateFile": "path-to-my-custom-template-file",
    "repoInfo": {
        "originUrl": "e.g. https://github.com/scale-tone/repeating-map-reduce-sample",
        "repoName": "e.g. repeating-map-reduce-sample",
        "branchName": "e.g. main",
        "tagName": "e.g. v1.2.3"
    },
    "doNotRenderFunctions": true,
    "doNotRenderProxies": true
}
```

   `templateFile` specifies a custom HTML or Markdown template to be used, when generating HTML pages or Markdown files. If omitted, [this default one](https://github.com/scale-tone/az-func-as-a-graph/blob/main/cli/graph-template.htm) will be used for HTML and [this default one](https://github.com/scale-tone/az-func-as-a-graph/blob/main/cli/graph-template.md) will be used for Markdown.

   `repoInfo` setting provides a way to customize source code repo information, when needed. It is only used for mapping and rendering links to source code. If omitted, this data will be retrieved automatically with relevant git commands. E.g. you might want to explicitly specify `repoInfo.originUrl` to point source code links to GitHub CodeSpaces (https://github.dev) instead of https://github.com.

   `doNotRenderFunctions` hides functions from the graph.
    
   `doNotRenderProxies` hides proxies from the graph.

## How to deploy to Azure

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fscale-tone%2Faz-func-as-a-graph%2Fmain%2Farm-template.json)

The above button will deploy *these sources* into *your newly created Function App instance*. Note that it will be in AppService pricing tier. Keep an eye on the cost of it and don't forget to remove it once not needed anymore. 
