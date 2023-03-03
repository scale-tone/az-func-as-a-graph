# az-func-as-a-graph

Visualizes your [Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-overview) project in form of a graph. This gives an instant overview of what the project is doing, which Functions/Orchestrations/Entities it contains and which Triggers/Bindings it uses.
The graph is interactive (clickable). This allows to quickly navigate the project's codebase.

![logo](https://raw.githubusercontent.com/scale-tone/az-func-as-a-graph/master/screenshot1.png)

## How to run

Just install this extension from Marketplace. When a Functions project (project containing a `host.json` file) is being opened, the graph will show up automatically. 

Alternatively click on a `host.json` file and use the `az-func-as-a-graph: Show...` command:

![image](https://user-images.githubusercontent.com/5447190/222739062-498edbc5-1730-442b-98e6-0d52865f59d6.png)

To disable automatic graph generation use this settings flag:

![image](https://user-images.githubusercontent.com/5447190/222739459-80d5822b-9a77-4d58-add4-d18c344a4db0.png)


This is a [web extension](https://code.visualstudio.com/api/extension-guides/web-extensions), so it works even in your browser after just pressing `.` (period key) on any GitHub repo.
