![logo](https://raw.githubusercontent.com/scale-tone/az-func-as-a-graph/master/screenshot1.png)
# az-func-as-a-graph

Visualizes your Azure Functions project in form of a graph. Accepts links to GitHub public repos or local paths (in which case you'll need to run the tool on your devbox).

UPD: is now also a part of [Durable Functions Monitor VsCode extension](https://marketplace.visualstudio.com/items?itemName=DurableFunctionsMonitor.durablefunctionsmonitor).
**Command Palette -> Visualize Functions as a Graph...**

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

## How to run from command line

This mode allows to programmatically generate diagrams out of your source code, e.g. as part of your build pipeline.

Clone this repo, then type the following from the project root folder:
```
npm install
node dist/az-func-as-a-graph {path-to-my-functions-project-folder} {output-file-name} {html-template-name}
```

This now became possible thanks to [mermaid-cli](https://github.com/mermaid-js/mermaid-cli) NPM package (which will be locally installed by [az-func-as-a-graph](https://github.com/scale-tone/az-func-as-a-graph/blob/main/az-func-as-a-graph.ts) script at its first run).

`npm install` is only needed once, of course.

`{path-to-my-functions-project-folder}` can be either local folder or link to a GitHub repo. If it is a link, then it can as well point to a particular branch or tag and/or include a relative path. E.g. `https://github.com/scale-tone/WhatIfDemo/tree/20190516.1/WhatIfDemo-Functions`.

`{output-file-name}` should be a file name with local path. 
* If its extension is `.svg`, the graph will be written to this file in SVG format.
* If its extension is `.htm`, a static HTML page will be generated. The tool will also try its best to make that page *interactive*, so that e.g. when you click on a graph node, the relevant Function's source code is shown. [Here is an example of such a page](https://scale-tone.github.io/temp/WhatIfDemo-Functions.htm). If the project link contains a branch/tag, the links to sources will be relative to that branch/tag.

`{html-template-name}` is an optional path to an HTML template to be used, when generating those HTML pages. If omitted, [this default one](https://github.com/scale-tone/az-func-as-a-graph/blob/main/graph-template.htm) will be used.

## How to deploy to Azure

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fscale-tone%2Faz-func-as-a-graph%2Fmain%2Farm-template.json)

The above button will deploy *these sources* into *your newly created Function App instance*. Note that it will be in AppService pricing tier. Keep an eye on the cost of it and don't forget to remove it once not needed anymore. 
