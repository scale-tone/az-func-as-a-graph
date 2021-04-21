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

## How to deploy to Azure

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fscale-tone%2Faz-func-as-a-graph%2Fmain%2Farm-template.json)

The above button will deploy *these sources* into *your newly created Function App instance*. Note that it will be in AppService pricing tier. Keep an eye on the cost of it and don't forget to remove it once not needed anymore. 
