(()=>{"use strict";var e={1413:(e,t,s)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.FileSystemWrapper=void 0;const i=s(9496),n=s(9519);class r extends n.FileSystemWrapperBase{joinPath(e,t){return i.Uri.joinPath(i.Uri.parse(e),t).toString()}dirName(e){const t=e.lastIndexOf("/");if(t<0)throw new Error(`Failed to extract parent folder name from path ${e}. The path does not contain a separator.`);return e.substring(0,t)}async readFile(e){const t=i.Uri.parse(e),s=await i.workspace.fs.readFile(t);return(new TextDecoder).decode(s)}async isDirectory(e){const t=i.Uri.parse(e);return(await i.workspace.fs.stat(t)).type===i.FileType.Directory}async readDir(e){const t=i.Uri.parse(e);return(await i.workspace.fs.readDirectory(t)).map((e=>e[0]))}async pathExists(e){const t=i.Uri.parse(e);try{const e=await i.workspace.fs.stat(t);return e.type===i.FileType.File||e.type===i.FileType.Directory}catch(e){return!1}}}t.FileSystemWrapper=r},2083:(e,t,s)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.FunctionGraphView=void 0;const i=s(9496),n=s(5970),r=s(1413);class a{constructor(e,t){this._context=e,this._functionProjectUri=t,this._webViewPanel=null,this._staticsFolder=i.Uri.joinPath(this._context.extensionUri,"HtmlStatics"),this._webViewPanel=this.showWebView()}cleanup(){this._webViewPanel&&this._webViewPanel.dispose()}showWebView(){const e=`Functions Graph (${this._functionProjectUri.fsPath})`,t=i.window.createWebviewPanel(a.viewType,e,i.ViewColumn.One,{retainContextWhenHidden:!0,enableScripts:!0,localResourceRoots:[this._staticsFolder]}),s=i.Uri.joinPath(this._staticsFolder,"index.html");return i.workspace.fs.readFile(s).then((e=>{let s=(new TextDecoder).decode(e);s=this.fixLinksToStatics(s,this._staticsFolder,t.webview),s=this.embedTheme(s),t.webview.html=s}),(e=>{i.window.showErrorMessage(`az-func-as-a-graph failed. ${e.message??e}`)})),t.webview.onDidReceiveMessage((e=>this.handleMessageFromWebView(t.webview,e)),void 0,this._context.subscriptions),t}embedTheme(e){return[2,3].includes(i.window.activeColorTheme.kind)?e.replace("<script>var ClientConfig={}<\/script>","<script>var ClientConfig={'theme':'dark'}<\/script>"):e}handleMessageFromWebView(e,t){switch(t.kind){case"ShowMessage":return void i.window.showInformationMessage(t.data);case"ShowError":return void i.window.showErrorMessage(`az-func-as-a-graph failed. ${t.data}`);case"SaveAs":return this.looksLikeSvg(t.data)?void i.window.showSaveDialog({defaultUri:i.Uri.file("func-map.svg"),filters:{"SVG Images":["svg"]}}).then((e=>{if(!e)return;const s=(new TextEncoder).encode(t.data);i.workspace.fs.writeFile(e,s).then((()=>{i.window.showInformationMessage(`SVG image saved to ${e}`)}),(e=>{i.window.showErrorMessage(`Failed to save. ${e.message??e}`)}))})):void i.window.showErrorMessage("Invalid data format. Save failed.");case"SaveFunctionGraphAsJson":if(!this._traversalResult)return;return void i.window.showSaveDialog({defaultUri:i.Uri.file("func-map.json"),filters:{JSON:["json"]}}).then((e=>{if(!e)return;const t=(new TextEncoder).encode(JSON.stringify(this._traversalResult,null,3));i.workspace.fs.writeFile(e,t).then((()=>{i.window.showInformationMessage(`Diagram JSON saved to ${e}`)}),(e=>{i.window.showErrorMessage(`Failed to save. ${e.message??e}`)}))}));case"GotoFunctionCode":if(!this._traversalResult)return;const a=t.data;var s;return s=a.startsWith("proxy.")?this._traversalResult.proxies[a.substr(6)]:this._traversalResult.functions[a],void i.window.showTextDocument(i.Uri.parse(s.filePath)).then((e=>{const t=e.document.positionAt(s.pos?s.pos:0);e.selection=new i.Selection(t,t),e.revealRange(new i.Range(t,t))}));case"Refresh":return void n.FunctionProjectParser.parseFunctions(this._functionProjectUri.toString(),new r.FileSystemWrapper,console.log).then((t=>{console.log(`>>>>>> ${this._functionProjectUri}: ${Object.keys(t.functions).length} functions`),this._traversalResult=t,e.postMessage(this._traversalResult)})).catch((t=>{this._traversalResult=void 0,e.postMessage(void 0),i.window.showErrorMessage(`az-func-as-a-graph failed. ${t.message??t}`)}))}}fixLinksToStatics(e,t,s){var n=e;const r=/ (href|src)="\/([0-9a-z.\/]+)"/gi;for(var a;a=r.exec(e);){const e=a[2],r=i.Uri.joinPath(t,e),o=s.asWebviewUri(r).toString();n=n.replace(`/${e}`,o)}return n}looksLikeSvg(e){return e.startsWith("<svg")&&e.endsWith("</svg>")&&!e.toLowerCase().includes("<script")}}t.FunctionGraphView=a,a.viewType="az-func-as-a-graph"},9519:(e,t,s)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.FileSystemWrapperBase=void 0;const i=s(8605),n=["node_modules","target","bin","obj",".vs",".vscode",".env",".python_packages",".git",".github"];t.FileSystemWrapperBase=class{async readFunctionsJson(e,t){let s={};const i=(await this.readDir(e)).map((async i=>{const n=this.joinPath(e,i),r=this.joinPath(n,"function.json"),a=await this.isDirectory(n),o=await this.pathExists(r);if(a&&o)try{const e=await this.readFile(r),t=JSON.parse(e);s[i]={bindings:t.bindings,isCalledBy:[],isSignalledBy:[]}}catch(e){t(`>>> Failed to parse ${r}: ${e}`)}}));return await Promise.all(i),s}async readProxiesJson(e,t){const s=this.joinPath(e,"proxies.json");if(!await this.pathExists(s))return{};const n=await this.readFile(s);try{const t=JSON.parse(n).proxies;if(!t)return{};var r=!1;if(await this.isCSharpProjectAsync(e)){const t=await this.findFileRecursivelyAsync(e,".+\\.csproj$",!0),s=new RegExp('\\s*=\\s*"proxies.json"\\s*>');t&&t.code&&!s.exec(t.code)&&(r=!0)}for(var a in t){const e=t[a];e.filePath=s,r&&(e.warningNotAddedToCsProjFile=!0);const o=new RegExp(`"${a}"\\s*:`).exec(n);o&&(e.pos=o.index,e.lineNr=(0,i.posToLineNr)(n,e.pos))}return t}catch(e){return t(`>>> Failed to parse ${s}: ${e}`),{}}}async isCSharpProjectAsync(e){return(await this.readDir(e)).some((e=>(e=e.toLowerCase()).endsWith(".csproj")&&"extensions.csproj"!==e))}async isFSharpProjectAsync(e){return(await this.readDir(e)).some((e=>(e=e.toLowerCase()).endsWith(".fsproj")))}async isJavaProjectAsync(e){return!!await this.findFileRecursivelyAsync(e,".+\\.java$",!1)}async findFileRecursivelyAsync(e,t,s,i){const r="string"==typeof t?new RegExp(t,"i"):t,a=[];for(const t of await this.readDir(e)){const o=this.joinPath(e,t);if(await this.isDirectory(o))n.includes(t.toLowerCase())||a.push(o);else if(r.exec(t)){if(!i)return{filePath:o,code:s?await this.readFile(o):void 0};const e=await this.readFile(o),t=i.exec(e);if(t)return{filePath:o,code:s?e:void 0,pos:t.index,length:t[0].length}}}for(const e of a){const t=await this.findFileRecursivelyAsync(e,r,s,i);if(t)return t}}async*findFilesRecursivelyAsync(e,t){for(const i of await this.readDir(e)){var s=this.joinPath(e,i);if(await this.isDirectory(s)){if(n.includes(i.toLowerCase()))continue;for await(const e of this.findFilesRecursivelyAsync(s,t))yield e}else t.exec(i)&&(yield s)}}async*findFunctionsRecursivelyAsync(e,t,s,n){for await(const a of this.findFilesRecursivelyAsync(e,t)){const e=await this.readFile(a);for(var r;r=s.exec(e);){let t=(0,i.cleanupFunctionName)(r[n]);const s=r.index+r[0].length,o=(0,i.getCodeInBrackets)(e,s,"{","}","\n");if(!(o.openBracketPos>=0&&o.code)){yield{functionName:t,filePath:a,pos:r.index,lineNr:(0,i.posToLineNr)(e,r.index),declarationCode:e.substring(s),bodyCode:e.substring(s)};break}yield{functionName:t,filePath:a,pos:r.index,lineNr:(0,i.posToLineNr)(e,r.index),declarationCode:o.code.substring(0,o.openBracketPos),bodyCode:o.code.substring(o.openBracketPos)}}}}}},5970:(e,t,s)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.FunctionProjectParser=void 0;const i=s(8605);class n{static async parseFunctions(e,t,s){const i=await t.findFileRecursivelyAsync(e,"host.json",!1);if(!i)throw new Error("host.json file not found under the provided project path");s(`>>> Found host.json at ${i.filePath}`);const n=t.dirName(i.filePath);let a;return await t.isCSharpProjectAsync(n)?a=new o(t,s):await t.isFSharpProjectAsync(n)?a=new c(t,s):await t.isJavaProjectAsync(n)?a=new u(t,s):(a=new r(t,s),e=n),{functions:await a.traverseFunctions(e),proxies:await t.readProxiesJson(e,s),projectFolder:e}}constructor(e,t){this._fileSystemWrapper=e,this._log=t}async mapOrchestratorsAndActivitiesAsync(e,t){const s=Object.keys(e),n=s.filter((t=>e[t].bindings.some((e=>"orchestrationTrigger"===e.type)))),r=await this.getFunctionsAndTheirCodesAsync(n,t),a=Object.keys(e).filter((t=>e[t].bindings.some((e=>"activityTrigger"===e.type)))),o=await this.getFunctionsAndTheirCodesAsync(a,t),c=s.filter((t=>e[t].bindings.some((e=>"entityTrigger"===e.type)))),u=await this.getFunctionsAndTheirCodesAsync(c,t),l=s.filter((t=>!e[t].bindings.some((e=>["orchestrationTrigger","activityTrigger","entityTrigger"].includes(e.type))))),g=await this.getFunctionsAndTheirCodesAsync(l,t);for(const t of r){const s=i.TraversalRegexes.getStartNewOrchestrationRegex(t.name);for(const i of g)s.exec(i.code)&&(e[t.name].isCalledBy=e[t.name].isCalledBy??[],e[t.name].isCalledBy.push(i.name));for(const s of r)t.name!==s.name&&i.TraversalRegexes.getCallSubOrchestratorRegex(s.name).exec(t.code)&&(e[s.name].isCalledBy=e[s.name].isCalledBy??[],e[s.name].isCalledBy.push(t.name));(0,i.mapActivitiesToOrchestrator)(e,t,a),i.TraversalRegexes.continueAsNewRegex.exec(t.code)&&(e[t.name].isCalledByItself=!0);const n=(0,i.getEventNames)(t.code);for(const s of n){const n=i.TraversalRegexes.getRaiseEventRegex(s);for(const i of g)n.exec(i.code)&&(e[t.name].isSignalledBy=e[t.name].isSignalledBy??[],e[t.name].isSignalledBy.push({name:i.name,signalName:s}))}}for(const t of u)for(const s of g)i.TraversalRegexes.getSignalEntityRegex(t.name).exec(s.code)&&(e[t.name].isCalledBy=e[t.name].isCalledBy??[],e[t.name].isCalledBy.push(s.name));for(const t of g.concat(r).concat(o).concat(u))e[t.name].filePath=t.filePath,e[t.name].pos=t.pos,e[t.name].lineNr=t.lineNr;return e}}t.FunctionProjectParser=n;class r extends n{async traverseFunctions(e){let t;return t=await this._fileSystemWrapper.readFunctionsJson(e,this._log),t=await this.mapOrchestratorsAndActivitiesAsync(t,e),t}async getFunctionsAndTheirCodesAsync(e,t){const s=e.map((async e=>{let s=await this._fileSystemWrapper.findFileRecursivelyAsync(this._fileSystemWrapper.joinPath(t,e),"(index\\.ts|index\\.js|__init__\\.py)$",!0);if(!s)return;const n=s.pos?s.pos:0,r=(0,i.posToLineNr)(s.code,n);return{name:e,code:s.code,filePath:s.filePath,pos:n,lineNr:r}}));return(await Promise.all(s)).filter((e=>!!e))}}class a extends n{async traverseFunctions(e){let t;return t=await this.traverseProjectCode(e),t=await this.mapOrchestratorsAndActivitiesAsync(t,e),t}}class o extends a{async getFunctionsAndTheirCodesAsync(e,t){const s=e.map((async e=>{const s=await this._fileSystemWrapper.findFileRecursivelyAsync(t,".+\\.cs$",!0,i.TraversalRegexes.getDotNetFunctionNameRegex(e));if(!s)return;const n=s.pos?s.pos:0,r=(0,i.posToLineNr)(s.code,n);return{name:e,code:(0,i.getCodeInBrackets)(s.code,s.pos+s.length,"{","}","\n").code,filePath:s.filePath,pos:n,lineNr:r}}));return(await Promise.all(s)).filter((e=>!!e))}async traverseProjectCode(e){const t={},s=new RegExp(".+\\.cs$","i");for await(const n of this._fileSystemWrapper.findFunctionsRecursivelyAsync(e,s,i.BindingsParser.getFunctionAttributeRegex(),3)){const r=i.BindingsParser.tryExtractBindings(n.declarationCode);r.some((e=>"orchestrationTrigger"===e.type))||r.some((e=>"entityTrigger"===e.type))||r.some((e=>"activityTrigger"===e.type))||r.push(...await this.extractOutputBindings(e,n.declarationCode,s)),t[n.functionName]={filePath:n.filePath,pos:n.pos,lineNr:n.lineNr,bindings:[...r]}}return t}async extractOutputBindings(e,t,s){const n=i.BindingsParser.functionReturnTypeRegex.exec(t);if(!n)return[];const r=(0,i.removeNamespace)(n[3]);if(!r)return[];const a=await this._fileSystemWrapper.findFileRecursivelyAsync(e,s,!0,i.TraversalRegexes.getClassDefinitionRegex(r));if(!a)return[];const o=(0,i.getCodeInBrackets)(a.code,(a.pos??0)+(a.length??0),"{","}");return o.code?i.BindingsParser.tryExtractBindings(o.code):[]}}class c extends a{async getFunctionsAndTheirCodesAsync(e,t){const s=e.map((async e=>{const s=await this._fileSystemWrapper.findFileRecursivelyAsync(t,".+\\.fs$",!0,i.TraversalRegexes.getDotNetFunctionNameRegex(e));if(!s)return;const n=(0,i.getCodeInBrackets)(s.code,s.pos+s.length,"{","}","\n").code,r=s.pos?s.pos:0,a=(0,i.posToLineNr)(s.code,r);return{name:e,code:n,filePath:s.filePath,pos:r,lineNr:a}}));return(await Promise.all(s)).filter((e=>!!e))}async traverseProjectCode(e){const t={};for await(const s of this._fileSystemWrapper.findFunctionsRecursivelyAsync(e,new RegExp(".+\\.fs$","i"),i.BindingsParser.getFSharpFunctionAttributeRegex(),2)){const e=i.BindingsParser.tryExtractBindings(s.declarationCode);t[s.functionName]={filePath:s.filePath,pos:s.pos,lineNr:s.lineNr,bindings:[...e]}}return t}}class u extends a{async getFunctionsAndTheirCodesAsync(e,t){const s=e.map((async e=>{const s=await this._fileSystemWrapper.findFileRecursivelyAsync(t,".+\\.java$",!0,i.TraversalRegexes.getDotNetFunctionNameRegex(e));if(!s)return;const n=(0,i.getCodeInBrackets)(s.code,s.pos+s.length,"{","}","\n").code,r=s.pos?s.pos:0,a=(0,i.posToLineNr)(s.code,r);return{name:e,code:n,filePath:s.filePath,pos:r,lineNr:a}}));return(await Promise.all(s)).filter((e=>!!e))}async traverseProjectCode(e){const t={};for await(const s of this._fileSystemWrapper.findFunctionsRecursivelyAsync(e,new RegExp(".+\\.java$","i"),i.BindingsParser.getJavaFunctionAttributeRegex(),1)){const e=i.BindingsParser.tryExtractBindings(s.declarationCode);t[s.functionName]={filePath:s.filePath,pos:s.pos,lineNr:s.lineNr,bindings:[...e]}}return t}}},8605:(e,t)=>{function s(e){if(!e)return e;const t=e.lastIndexOf(".");return t>=0&&(e=e.substring(t+1)),e.trim()}function i(e,t,s,i,n=""){for(var r=0,a=-1,o=!n,c=t;c<e.length;c++){switch(e[c]){case s:r<=0&&(a=c),r++;break;case i:if(--r<=0&&o)return{code:e.substring(t,c+1),openBracketPos:a-t}}r>0&&n.includes(e[c])&&(o=!0)}return{code:"",openBracketPos:-1}}Object.defineProperty(t,"__esModule",{value:!0}),t.BindingsParser=t.TraversalRegexes=t.getCodeInBracketsReverse=t.getCodeInBrackets=t.posToLineNr=t.mapActivitiesToOrchestrator=t.getEventNames=t.removeNamespace=t.cleanupFunctionName=void 0,t.cleanupFunctionName=function(e){if(!e)return e;const t=new RegExp("nameof\\s*\\(\\s*([\\w\\.]+)\\s*\\)").exec(e);return t?s(t[1]):(e=e.trim()).startsWith('"')?e.replace(/^"/,"").replace(/"$/,""):s(e)},t.removeNamespace=s,t.getEventNames=function(e){const t=[],s=n.waitForExternalEventRegex;for(var i;i=s.exec(e);)t.push(i[4]);return t},t.mapActivitiesToOrchestrator=function(e,t,s){for(const i of s)n.getCallActivityRegex(i).exec(t.code)&&(e[i].isCalledBy=e[i].isCalledBy??[],e[i].isCalledBy.push(t.name))},t.posToLineNr=function(e,t){if(!e)return 0;const s=e.substr(0,t).match(/(\r\n|\r|\n)/g);return s?s.length+1:1},t.getCodeInBrackets=i,t.getCodeInBracketsReverse=function(e,t,s){for(var i=0,n=0,r=e.length-1;r>=0;r--)switch(e[r]){case s:i<=0&&(n=r),i++;break;case t:if(--i<=0)return{code:e.substring(0,n+1),openBracketPos:r}}return{code:"",openBracketPos:-1}};class n{static getStartNewOrchestrationRegex(e){return new RegExp(`(StartNew|StartNewAsync|start_new|scheduleNewOrchestrationInstance)(\\s*<[\\w\\.-\\[\\]\\<\\>,\\s]+>)?\\s*\\(\\s*(["'\`]|nameof\\s*\\(\\s*[\\w\\.-]*|[\\w\\s\\.]+\\.\\s*)${e}\\s*["'\\),]{1}`,"i")}static getCallSubOrchestratorRegex(e){return new RegExp(`(CallSubOrchestrator|CallSubOrchestratorWithRetry|call_sub_orchestrator)(Async)?(\\s*<[\\w\\.-\\[\\]\\<\\>,\\s]+>)?\\s*\\(\\s*(["'\`]|nameof\\s*\\(\\s*[\\w\\.-]*|[\\w\\s\\.]+\\.\\s*)${e}\\s*["'\\),]{1}`,"i")}static getRaiseEventRegex(e){return new RegExp(`(RaiseEvent|raise_event)(Async)?(.|\r|\n)*${e}`,"i")}static getSignalEntityRegex(e){return new RegExp(`${e}\\s*["'>]{1}`)}static getDotNetFunctionNameRegex(e){return new RegExp(`FunctionName(Attribute)?\\s*\\(\\s*(nameof\\s*\\(\\s*|["'\`]|[\\w\\s\\.]+\\.\\s*)${e}\\s*["'\`\\)]{1}`)}static getJavaFunctionNameRegex(e){return new RegExp(`@\\s*FunctionName\\s*\\(["\\s\\w\\.-]*${e}"?\\)`)}static getCallActivityRegex(e){return new RegExp(`(CallActivity|call_activity)[\\s\\w,\\.-<>\\[\\]\\(\\)\\?]*\\([\\s\\w\\.-]*["'\`]?${e}\\s*["'\`\\),]{1}`,"i")}static getClassDefinitionRegex(e){return new RegExp(`class\\s*${e}`)}}t.TraversalRegexes=n,n.continueAsNewRegex=new RegExp("ContinueAsNew\\s*\\(","i"),n.waitForExternalEventRegex=new RegExp("(WaitForExternalEvent|wait_for_external_event)(<[\\s\\w,\\.-\\[\\]\\(\\)\\<\\>]+>)?\\s*\\(\\s*(nameof\\s*\\(\\s*|[\"'`]|[\\w\\s\\.]+\\.\\s*)?([\\s\\w\\.-]+)\\s*[\"'`\\),]{1}","gi");class r{static tryExtractBindings(e){const t=[];if(!e)return t;const s=this.bindingAttributeRegex;for(var n;n=s.exec(e);){const s=!!n[3];let r=n[4];r.endsWith("Attribute")&&(r=r.substring(0,r.length-"Attribute".length));const a=n.index+n[0].length,o=i(e,a,"(",")","").code;this.isOutRegex.lastIndex=a+o.length;const c=!!this.isOutRegex.exec(e);switch(r){case"BlobInput":case"BlobOutput":case"Blob":{const e={type:"blob",direction:"Blob"===r?s||c?"out":"in":"BlobOutput"===r?"out":"in"},i=this.blobParamsRegex.exec(o);i&&(e.path=i[1]),t.push(e);break}case"BlobTrigger":{const e={type:"blobTrigger"},s=this.blobParamsRegex.exec(o);s&&(e.path=s[1]),t.push(e);break}case"TableInput":case"TableOutput":case"Table":{const e={type:"table",direction:"Table"===r?s||c?"out":"in":"TableOutput"===r?"out":"in"},i=this.singleParamRegex.exec(o);i&&(e.tableName=i[2]),t.push(e);break}case"CosmosDBInput":case"CosmosDBOutput":case"CosmosDB":{const e={type:"cosmosDB",direction:"CosmosDB"===r?s||c?"out":"in":"CosmosDBOutput"===r?"out":"in"},i=this.cosmosDbParamsRegex.exec(o);i&&(e.databaseName=i[1],e.collectionName=i[3]),t.push(e);break}case"CosmosDBTrigger":{const e={type:"cosmosDBTrigger"},s=this.singleParamRegex.exec(o);s&&(e.databaseName=s[2]),t.push(e);break}case"EventGrid":case"EventGridOutput":{const e={type:"eventGrid",direction:"out"},s=this.eventGridParamsRegex.exec(o);s&&(e.topicEndpointUri=s[1],e.topicKeySetting=s[3]),t.push(e);break}case"EventGridTrigger":{const e={type:"eventGridTrigger"},s=this.eventGridParamsRegex.exec(o);s&&(e.topicEndpointUri=s[1],e.topicKeySetting=s[3]),t.push(e);break}case"EventHub":case"EventHubOutput":{const e={type:"eventHub",direction:"out"},s=this.eventHubParamsRegex.exec(o);s&&(e.eventHubName=s[1]),t.push(e);break}case"EventHubTrigger":{const e={type:"eventHubTrigger"},s=this.eventHubParamsRegex.exec(o);s&&(e.eventHubName=s[1]),t.push(e);break}case"Kafka":case"KafkaOutput":{const e={type:"kafka",direction:"out"},s=this.singleParamRegex.exec(o);s&&(e.brokerList=s[2]),t.push(e);break}case"KafkaTrigger":{const e={type:"kafkaTrigger"},s=this.singleParamRegex.exec(o);s&&(e.brokerList=s[2]),t.push(e);break}case"Queue":case"QueueOutput":{const e={type:"queue",direction:"out"},s=this.singleParamRegex.exec(o);s&&(e.queueName=s[2]),t.push(e);break}case"QueueTrigger":{const e={type:"queueTrigger"},s=this.singleParamRegex.exec(o);s&&(e.queueName=s[2]),t.push(e);break}case"ServiceBus":case"ServiceBusOutput":{const e={type:"serviceBus",direction:"out"},s=this.singleParamRegex.exec(o);s&&(e.queueName=s[2]),t.push(e);break}case"ServiceBusTrigger":case"ServiceBusQueueTrigger":case"ServiceBusTopicTrigger":{const e={type:"serviceBusTrigger"},s=this.singleParamRegex.exec(o);s&&(e.queueName=s[2]),t.push(e);break}case"SignalRConnectionInfo":case"SignalRConnectionInfoInput":{const e={type:"signalRConnectionInfo",direction:"in"},s=this.signalRConnInfoParamsRegex.exec(o);s&&(e.hubName=s[1]),t.push(e);break}case"SignalR":case"SignalROutput":{const e={type:"signalR",direction:"out"},s=this.signalRParamsRegex.exec(o);s&&(e.hubName=s[1]),t.push(e);break}case"SignalRTrigger":{const e={type:"signalRTrigger"},s=this.signalRParamsRegex.exec(o);s&&(e.hubName=s[1]),t.push(e);break}case"RabbitMQ":case"RabbitMQOutput":{const e={type:"rabbitMQ",direction:"out"},s=this.rabbitMqParamsRegex.exec(o);s&&(e.queueName=s[1]),t.push(e);break}case"RabbitMQTrigger":{const e={type:"rabbitMQTrigger"},s=this.rabbitMqParamsRegex.exec(o);s&&(e.queueName=s[1]),t.push(e);break}case"SendGrid":case"SendGridOutput":t.push({type:"sendGrid",direction:"out"});break;case"TwilioSms":t.push({type:"twilioSms",direction:"out"});break;case"HttpTrigger":{const e={type:"httpTrigger",methods:[]},s=this.httpTriggerRouteRegex.exec(o);s&&(e.route=s[1]);const i=o.toLowerCase();for(const t of this.httpMethods)i.includes(`"${t}"`)&&e.methods.push(t);t.push(e),t.push({type:"http",direction:"out"});break}case"OrchestrationTrigger":case"DurableOrchestrationTrigger":t.push({type:"orchestrationTrigger",direction:"in"});break;case"ActivityTrigger":case"DurableActivityTrigger":t.push({type:"activityTrigger",direction:"in"});break;case"EntityTrigger":case"DurableEntityTrigger":t.push({type:"entityTrigger",direction:"in"});break;default:t.push({type:r,direction:s||c?"out":"in"})}}return t}static getFunctionAttributeRegex(){return new RegExp('\\[\\s*Function(Name)?(Attribute)?\\s*\\((["\\w\\s\\.\\(\\)-]+)\\)\\s*\\]',"g")}static getJavaFunctionAttributeRegex(){return new RegExp('@\\s*FunctionName\\s*\\((["\\w\\s\\.\\(\\)-]+)\\)',"g")}static getFSharpFunctionAttributeRegex(){return new RegExp('\\[<\\s*Function(Name)?\\s*\\((["\\w\\s\\.\\(\\)-]+)\\)',"g")}}t.BindingsParser=r,r.bindingAttributeRegex=new RegExp("(\\[|@)(<)?\\s*(return:)?\\s*(\\w+)","g"),r.singleParamRegex=new RegExp('("|nameof\\s*\\()?([\\w\\.-]+)'),r.eventHubParamsRegex=new RegExp('"([^"]+)"'),r.signalRParamsRegex=new RegExp('"([^"]+)"'),r.rabbitMqParamsRegex=new RegExp('"([^"]+)"'),r.blobParamsRegex=new RegExp('"([^"]+)"'),r.cosmosDbParamsRegex=new RegExp('"([^"]+)"(.|\r|\n)+?"([^"]+)"'),r.signalRConnInfoParamsRegex=new RegExp('"([^"]+)"'),r.eventGridParamsRegex=new RegExp('"([^"]+)"(.|\r|\n)+?"([^"]+)"'),r.isOutRegex=new RegExp("^\\s*\\]\\s*(out |ICollector|IAsyncCollector).*?(,|\\()","g"),r.httpMethods=["get","head","post","put","delete","connect","options","trace","patch"],r.httpTriggerRouteRegex=new RegExp('Route\\s*=\\s*"(.*)"'),r.functionReturnTypeRegex=new RegExp("public\\s*(static\\s*|async\\s*)*(Task\\s*<\\s*)?([\\w\\.]+)")},9496:e=>{e.exports=require("vscode")}},t={};function s(i){var n=t[i];if(void 0!==n)return n.exports;var r=t[i]={exports:{}};return e[i](r,r.exports,s),r.exports}var i={};(()=>{var e=i;Object.defineProperty(e,"__esModule",{value:!0}),e.deactivate=e.activate=void 0;const t=s(9496),n=s(1413),r=s(2083);let a=[];const o=new n.FileSystemWrapper,c=5;async function u(e){if(!t.workspace.workspaceFolders)return;const s=[];try{for(const e of t.workspace.workspaceFolders)for await(const t of o.findFilesRecursivelyAsync(e.uri.toString(),new RegExp("host.json","i")))s.push(o.dirName(t));if(s.length>c&&"Yes"!==await t.window.showWarningMessage(`az-func-as-a-graph found ${s.length} Azure Functions projects in current workspace. Do you want to visualize all of them?`,"Yes","No"))return}catch(e){t.window.showErrorMessage(`az-func-as-a-graph failed. ${e.message??e}`)}for(const i of s)a.push(new r.FunctionGraphView(e,t.Uri.parse(i)))}e.activate=async function(e){e.subscriptions.push(t.commands.registerCommand("az-func-as-a-graph.ShowGraph",(async s=>{if(s){const i=s.toString();i.toLowerCase().endsWith("host.json")&&a.push(new r.FunctionGraphView(e,t.Uri.parse(o.dirName(i))))}else await u(e)}))),t.workspace.workspaceFolders&&t.workspace.getConfiguration("az-func-as-a-graph").get("showGraphAtStartup",!0)&&await u(e)},e.deactivate=function(){for(const e of a)e.cleanup()}})();var n=exports;for(var r in i)n[r]=i[r];i.__esModule&&Object.defineProperty(n,"__esModule",{value:!0})})();