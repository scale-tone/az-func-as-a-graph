# durable-mvc-starter

Basic project setup and scaffolding for creating serverless web applications based on [Azure Durable Entities](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-entities?tabs=javascript), [Azure SignalR Service](https://docs.microsoft.com/en-us/azure/azure-signalr/signalr-overview), React+[MobX](https://mobx.js.org) and TypeScript.

The gist of this architectural approach is to define a strongly-typed state (a TypeScript class with no methods, like [this one](https://github.com/scale-tone/durable-mvc-starter/blob/main/ui/src/shared/CounterState.ts)), then implement your server-side state transformation logic in form of a Durable Entity (like [this one](https://github.com/scale-tone/durable-mvc-starter/blob/main/DurableEntities/CounterEntity.ts)) and then render your state on the client with some [JSX](https://www.typescriptlang.org/docs/handbook/jsx.html) (like [this one](https://github.com/scale-tone/durable-mvc-starter/blob/main/ui/src/App.tsx)). Once the state changes on the server, its changes are incrementally propagated to the client via [SignalR](https://docs.microsoft.com/en-us/azure/azure-signalr/signalr-overview) and automatically re-rendered thanks to [MobX](https://mobx.js.org).

Why is it called 'Durable MVC'? Because it looks like MVC ([Model-View-Controller](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)), but instead of controllers the logic is implemented in form of [Durable Entities](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-entities?tabs=javascript).

The project in this repo is technically a pre-configured [Azure Functions Node.js project](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-node?tabs=v2#typescript) with all code intended to be written in TypeScript. And it includes the following scaffolding:
1. Server-side base classes that allow to define and implement your Durable Entities with a class-based syntax. You derive your Entity class from [DurableEntity\<TState\>](https://github.com/scale-tone/durable-mvc-starter/blob/main/common/DurableEntity.ts) and implement your signal handlers in form of methods. The state is available to you via `this.state` property and it is automatically loaded/persisted and propagated to the client. Then you can send signals to your Entity [via this server-side `DurableEntityProxy<TEntity>` helper](https://github.com/scale-tone/durable-mvc-starter/blob/main/common/DurableEntityProxy.ts) and/or via [this client-side `DurableEntitySet.signalEntity()` method](https://github.com/scale-tone/durable-mvc-starter/blob/main/ui/src/common/DurableEntitySet.ts#L112).
2. Client-side React+MobX+TypeScript project located in [this `/ui` sub-folder](https://github.com/scale-tone/durable-mvc-starter/tree/main/ui). It is automatically (re)built along with the main project, and its output (static HTML/JS/CSS files) is served with [this `serve-statics` Function](https://github.com/scale-tone/durable-mvc-starter/blob/main/serve-statics/index.ts). TypeScript class definitions placed into [this `/ui/src/shared` folder](https://github.com/scale-tone/durable-mvc-starter/tree/main/ui/src/shared) are shared by both server and client projects, so this is where you define your states.
3. Client-side container for your entities - [DurableEntitySet\<TState\>](https://github.com/scale-tone/durable-mvc-starter/blob/main/ui/src/common/DurableEntitySet.ts). Once you defined and implemented your entity, you can then bind to a single particular instance of it with [DurableEntitySet.attachEntity\<TState\>()](https://github.com/scale-tone/durable-mvc-starter/blob/main/ui/src/common/DurableEntitySet.ts#L79) or [DurableEntitySet.createEntity\<TState\>()](https://github.com/scale-tone/durable-mvc-starter/blob/main/ui/src/common/DurableEntitySet.ts#L103) static methods. But much more typical is to bind to an [observable collection](https://mobx.js.org/observable-state.html) of entities of a certain type, and for that you just need to create an *instance* of `DurableEntitySet<TState>` and then bind to its [items](https://github.com/scale-tone/durable-mvc-starter/blob/main/ui/src/common/DurableEntitySet.ts#L18) property, which is an observable array (newly-created entities are automatically added to it and destroyed entities are automatically removed from it). Everything returned by `DurableEntitySet<TState>` is [marked as observable](https://mobx.js.org/observable-state.html#makeautoobservable), so the only thing left to be done is to write some JSX for rendering.
4. [This `negotiate-signalr` function](https://github.com/scale-tone/durable-mvc-starter/blob/main/negotiate-signalr/index.ts), that allows the client to connect to [Azure SignalR](https://docs.microsoft.com/en-us/azure/azure-signalr/signalr-overview).
5. [This `manage-entities` function](https://github.com/scale-tone/durable-mvc-starter/blob/main/manage-entities/index.ts), that exposes Entity states to the client and handles signals sent from it.
6. A basic sample Entity. [Here is its state](https://github.com/scale-tone/durable-mvc-starter/blob/main/ui/src/shared/CounterState.ts), [here is its class](https://github.com/scale-tone/durable-mvc-starter/blob/main/DurableEntities/CounterEntity.ts) and [here is its rendering](https://github.com/scale-tone/durable-mvc-starter/blob/main/ui/src/App.tsx#L26).

More examples you can find in [this separate repo](https://github.com/scale-tone/durable-mvc-samples).
Also check [this blog post](https://scale-tone.github.io/2021/03/15/durable-mvc) for more details.

# Prerequisites
* [Azure Functions Core Tools](https://www.npmjs.com/package/azure-functions-core-tools) **globally** installed on your devbox.
* An instance of Azure SignalR Service [configured in Serverless mode](https://docs.microsoft.com/en-us/azure/azure-signalr/concept-service-mode#serverless-mode).

# How to run locally

* Clone this repo.
* In the main project's root folder (the one that contains host.json) create a **local.settings.json** file, which should look like this:
  ```
  {
      "IsEncrypted": false,
      "Values": {
          "AzureWebJobsStorage": "<connection-string-to-your-azure-storage-account>",
          "AzureSignalRConnectionString": "<connection-string-to-your-azure-signalr-service-instance>",
          "AzureSignalRHubName": "DurableMvcTestHub",
          "FUNCTIONS_WORKER_RUNTIME": "node"
      }
  }
  ```
* In that same root folder run:
  ```
  npm install
  npm run build
  func start
  ```
* Navigate to `http://localhost:7071` with your browser.

In a matter of seconds a new instance of [CounterEntity](https://github.com/scale-tone/durable-mvc-starter/blob/main/DurableEntities/CounterEntity.ts) will be created and rendered in your browser. Try to open that page in multiple browser tabs and observe the state being automatically synchronized across them. Also try to kill/restart the Functions host process (func.exe) and observe the state being preserved.

Once created, you can also monitor your Durable Entities with [Durable Functions Monitor](https://github.com/scale-tone/DurableFunctionsMonitor).

# How to deploy to Azure

You can deploy the contents of this same repo with this
[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fscale-tone%2Fdurable-mvc-starter%2Fmain%2Farm-template.json) button. It will create a Function App instance, an underlying Storage account and an Azure SignalR service instance. *Don't forget to remove those resources once done.*

Once you cloned this repo and added some code to your copy, you then deploy it [in the same way as you would normally deploy an Azure Functions Node.js project](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-node?tabs=v2#deploying-with-dependencies).

# How to define your entities

Anywhere in your codebase (except the `ui` folder) create a class derived from [DurableEntity\<TState\>](https://github.com/scale-tone/durable-mvc-starter/blob/main/common/DurableEntity.ts). Methods of that class, that you intend to make your signal handlers, are expected to take **zero or one** parameter. The state is available to your code via `this.state` property, and it will be loaded/saved automatically. 

The default visibility level for an entity is `VisibilityEnum.ToOwnerOnly` (which means that only the creator will be able to access it from the client and change notifications will only be sent to the creator), to change it override the [DurableEntity.visibility](https://github.com/scale-tone/durable-mvc-starter/blob/main/common/DurableEntity.ts#L41) property. 

To do a custom state initialization for a newly created entity instance override the [DurableEntity.initializeState()](https://github.com/scale-tone/durable-mvc-starter/blob/main/common/DurableEntity.ts#L36) method.

The required boilerplate (`index.ts` and `function.json` files) for exposing your class as a Durable Entity [will then be autogenerated for you](https://github.com/scale-tone/durable-mvc-starter/blob/main/generate-entity-boilerplate.js). Once autogenerated, you will be able to modify those files, e.g. add more bindings, if your entity requires them.

# How to bind to your entities on the client

[DurableEntitySet](https://github.com/scale-tone/durable-mvc-starter/blob/main/ui/src/common/DurableEntitySet.ts) provides static methods, that return a single observable state object: 
* [createEntity()](https://github.com/scale-tone/durable-mvc-starter/blob/main/ui/src/common/DurableEntitySet.ts#L109) - creates an entity with given key, if not created yet.
* [attachEntity()](https://github.com/scale-tone/durable-mvc-starter/blob/main/ui/src/common/DurableEntitySet.ts#L85) - doesn't create anything, just tries to attach to an existing entity.

To get an [observable collection](https://mobx.js.org/observable-state.html) of entities of a certain type create an instance of [DurableEntitySet\<TState\>](https://github.com/scale-tone/durable-mvc-starter/blob/main/ui/src/common/DurableEntitySet.ts) class and then bind to its [items](https://github.com/scale-tone/durable-mvc-starter/blob/main/ui/src/common/DurableEntitySet.ts#L18) property. Newly added entities will automatically appear there and removed (destroyed) entities will automatically be dropped.

To send signals to your entities use: 
* [DurableEntitySet.signalEntity()](https://github.com/scale-tone/durable-mvc-starter/blob/main/ui/src/common/DurableEntitySet.ts#L118) - sends a signal in a fire-and-forget manner. 
* [DurableEntitySet.callEntity()](https://github.com/scale-tone/durable-mvc-starter/blob/main/ui/src/common/DurableEntitySet.ts#L128) - 'calls' an entity aka returns a Promise, that will be resolved once the sent signal actually gets processed.
