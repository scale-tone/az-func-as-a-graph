(this["webpackJsonpaz-function-as-a-graph-ui"]=this["webpackJsonpaz-function-as-a-graph-ui"]||[]).push([[0],{247:function(e,t,n){},492:function(e,t,n){var r={"./locale":218,"./locale.js":218};function a(e){var t=o(e);return n(t)}function o(e){if(!n.o(r,e)){var t=new Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}return r[e]}a.keys=function(){return Object.keys(r)},a.resolve=o,e.exports=a,a.id=492},495:function(e,t,n){"use strict";n.r(t);var r,a=n(0),o=n.n(a),i=n(11),c=n.n(i),s=(n(247),n(98)),l=n(99),u=n(228),d=n(227),g=n(226),p=n(522),h=n(525),b=n(231),f=n(526),m=n(531),v=n(533),y=n(527),j=n(528),O=n(529),x=n(530),_=n(534),w=n(224),P=n.n(w),C=n(225),N=n.n(C),k=n(8),B=Object(g.a)(r=function(e){Object(u.a)(n,e);var t=Object(d.a)(n);function n(){return Object(s.a)(this,n),t.apply(this,arguments)}return Object(l.a)(n,[{key:"componentDidMount",value:function(){if(window.location.search.startsWith("?path=")){var e=this.props.state;e.pathText=decodeURIComponent(window.location.search.substr(6)),e.load()}}},{key:"render",value:function(){var e=this,t=this.props.state;return Object(k.jsxs)(k.Fragment,{children:[Object(k.jsx)(p.a,{position:"static",color:"default",children:Object(k.jsxs)(h.a,{children:[Object(k.jsx)(b.a,{variant:"h5",color:"inherit",className:"title-typography",children:Object(k.jsx)(f.a,{color:"inherit",href:window.location.origin+window.location.pathname,children:"Azure Functions as a Graph"})}),Object(k.jsx)(m.a,{fullWidth:!0,className:"filter-textfield",margin:"dense",label:"GitHub link or local path to Functions project",InputLabelProps:{shrink:!0},placeholder:"e.g. 'https://github.com/scale-tone/repka-durable-func'",disabled:t.inProgress,value:t.pathText,onChange:function(e){return t.pathText=e.target.value},onKeyPress:function(t){return e.handleKeyPress(t)}}),Object(k.jsx)(v.a,{width:30}),Object(k.jsx)(y.a,{className:"filter-button",variant:"outlined",color:"secondary",size:"large",disabled:t.inProgress||!t.pathText,onClick:function(){return t.load()},children:"Visualize"})]})}),!!t.inProgress&&Object(k.jsx)(j.a,{}),!!t.functionsLoaded&&Object(k.jsxs)(O.a,{row:!0,className:"settings-group",children:[Object(k.jsx)(x.a,{control:Object(k.jsx)(_.a,{color:"default",disabled:t.inProgress,checked:t.renderFunctions,onChange:function(e){return t.renderFunctions=e.target.checked}}),label:"Show Functions"}),Object(k.jsx)(x.a,{control:Object(k.jsx)(_.a,{color:"default",disabled:t.inProgress,checked:t.renderProxies,onChange:function(e){return t.renderProxies=e.target.checked}}),label:"Show Proxies"})]}),!!t.error&&Object(k.jsx)(b.a,{className:"error-typography",color:"error",variant:"h5",children:t.error}),!!t.diagramSvg&&Object(k.jsxs)(k.Fragment,{children:[Object(k.jsx)("div",{className:"diagram-div",dangerouslySetInnerHTML:{__html:t.diagramSvg}}),Object(k.jsxs)(h.a,{variant:"dense",className:"bottom-toolbar",children:[Object(k.jsxs)(y.a,{variant:"outlined",color:"default",disabled:t.inProgress,onClick:function(){return window.navigator.clipboard.writeText(t.diagramCode)},children:[Object(k.jsx)(P.a,{}),Object(k.jsx)(v.a,{width:10}),Object(k.jsx)(b.a,{color:"inherit",children:"Copy diagram code to Clipboard"})]}),Object(k.jsx)(v.a,{width:20}),Object(k.jsxs)(y.a,{variant:"outlined",color:"default",disabled:t.inProgress,href:URL.createObjectURL(new Blob([t.diagramSvg],{type:"image/svg+xml"})),download:"functions.svg",children:[Object(k.jsx)(N.a,{}),Object(k.jsx)(v.a,{width:20}),Object(k.jsx)(b.a,{color:"inherit",children:"Save as .SVG"})]}),Object(k.jsx)(v.a,{width:20})]})]}),Object(k.jsx)("a",{className:"github-link",href:"https://github.com/scale-tone/az-func-as-a-graph#az-func-as-a-graph",target:"_blank",rel:"noreferrer",children:Object(k.jsx)("img",{loading:"lazy",width:"149",height:"149",src:"https://github.blog/wp-content/uploads/2008/12/forkme_right_white_ffffff.png?resize=149%2C149",alt:"Fork me on GitHub","data-recalc-dims":"1"})})]})}},{key:"handleKeyPress",value:function(e){"Enter"===e.key&&(e.preventDefault(),this.props.state.load())}}]),n}(o.a.Component))||r,S=n(36),F=(n(253),n(16)),T=n(5),z=n(130),D=n.n(z),R=n(131),L=n.n(R),q=n(229),H=n(104),I="#32;";function U(e){var t,n,r,a,o,i,c;switch(e.type){case"httpTrigger":return"".concat("anonymous"===e.authLevel?"#127760;":"#128274;"," http").concat(e.methods?":["+e.methods.join(",")+"]":"").concat(e.route?":"+e.route:"");case"blobTrigger":return"".concat(I,"blob:").concat(null!==(t=e.path)&&void 0!==t?t:"");case"cosmosDBTrigger":return"".concat(I,"cosmosDB:").concat(null!==(n=e.databaseName)&&void 0!==n?n:"",":").concat(null!==(r=e.collectionName)&&void 0!==r?r:"");case"eventHubTrigger":return"".concat(I,"eventHub:").concat(null!==(a=e.eventHubName)&&void 0!==a?a:"");case"serviceBusTrigger":return"".concat(I,"serviceBus:").concat(e.queueName?e.queueName:null!==(o=e.topicName)&&void 0!==o?o:"").concat(e.subscriptionName?":"+e.subscriptionName:"");case"queueTrigger":return"".concat(I,"queue:").concat(null!==(i=e.queueName)&&void 0!==i?i:"");case"timerTrigger":return"".concat(I,"timer:").concat(null!==(c=e.schedule)&&void 0!==c?c:"");default:return"".concat(I).concat(e.type)}}function E(e){var t,n,r,a,o,i,c;switch(e.type){case"table":return"".concat(I,"table:").concat(null!==(t=e.tableName)&&void 0!==t?t:"");case"blob":return"".concat(I,"blob:").concat(null!==(n=e.path)&&void 0!==n?n:"");case"cosmosDB":return"".concat(I,"cosmosDB:").concat(null!==(r=e.databaseName)&&void 0!==r?r:"",":").concat(null!==(a=e.collectionName)&&void 0!==a?a:"");case"eventHub":return"".concat(I,"eventHub:").concat(null!==(o=e.eventHubName)&&void 0!==o?o:"");case"serviceBus":return"".concat(I,"serviceBus:").concat(e.queueName?e.queueName:null!==(i=e.topicName)&&void 0!==i?i:"").concat(e.subscriptionName?":"+e.subscriptionName:"");case"queue":return"".concat(I,"queue:").concat(null!==(c=e.queueName)&&void 0!==c?c:"");default:return"".concat(I).concat(e.type)}}var G,J,M,W,K,A,V,$,Q,X=150;function Y(e){if(!e)return"--\x3e";var t=JSON.stringify(e).replace(/"/g,"'").replace(/'backend.request./g,"'");return t.length>X&&(t=t.substr(0,X)+"..."),'-- "'.concat(t).concat(I,'" --\x3e')}function Z(e){if(!e)return"--\x3e";e["response.body"]&&(e["response.body"]="...");var t=JSON.stringify(e).replace(/"/g,"'").replace(/'response./g,"'");return t.length>X&&(t=t.substr(0,X)+"..."),'-- "'.concat(t).concat(I,'" --\x3e')}var ee=(G=function(){function e(){Object(s.a)(this,e),Object(S.a)(this,"pathText",J,this),Object(S.a)(this,"_error",M,this),Object(S.a)(this,"_diagramCode",W,this),Object(S.a)(this,"_diagramSvg",K,this),Object(S.a)(this,"_inProgress",A,this),Object(S.a)(this,"_renderFunctions",V,this),Object(S.a)(this,"_renderProxies",$,this),Object(S.a)(this,"_traverseResult",Q,this),this._iconsSvg=void 0,this._iconsSvgPromise=D.a.get("static/icons/all-azure-icons.svg"),L.a.initialize({startOnLoad:!0,flowchart:{curve:"Basis",useMaxWidth:!0,htmlLabels:!1}})}return Object(l.a)(e,[{key:"diagramSvg",get:function(){return this._diagramSvg}},{key:"diagramCode",get:function(){return this._diagramCode}},{key:"error",get:function(){return this._error}},{key:"inProgress",get:function(){return this._inProgress}},{key:"functionsLoaded",get:function(){return!!this._traverseResult}},{key:"renderFunctions",get:function(){return this._renderFunctions},set:function(e){this._renderFunctions=e,this.render()}},{key:"renderProxies",get:function(){return this._renderProxies},set:function(e){this._renderProxies=e,this.render()}},{key:"render",value:function(){var e=this;if(this._diagramCode="",this._diagramSvg="",this._error="",this._traverseResult){this._inProgress=!0;try{var t=function(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},r="";if(!n.doNotRenderFunctions){var a=[];for(var o in e){var i,c=e[o],s=void 0,l=[],u=[],d=[],g="".concat(o,'{{"').concat(I).concat(o,'"}}:::function'),p=Object(H.a)(c.bindings);try{for(p.s();!(i=p.n()).done;){var h=i.value;"orchestrationTrigger"===h.type?g="".concat(o,'[["').concat(I).concat(o,'"]]:::orchestrator'):"activityTrigger"===h.type?g="".concat(o,'[/"').concat(I).concat(o,'"/]:::activity'):"entityTrigger"===h.type&&(g="".concat(o,'[("').concat(I).concat(o,'")]:::entity')),h.type.endsWith("Trigger")?s=h:"in"===h.direction?l.push(h):"out"===h.direction?u.push(h):d.push(h)}}catch(J){p.e(J)}finally{p.f()}a.push(Object(q.a)({name:o,nodeCode:g,triggerBinding:s,inputBindings:l,outputBindings:u,otherBindings:d},c))}var b=function(e){var t;return(!(null===(t=e.isCalledBy)||void 0===t?void 0:t.length)&&e.triggerBinding&&e.triggerBinding.type?e.triggerBinding.type:"")+"~"+e.name};a.sort((function(e,t){var n=b(e),r=b(t);return n>r?1:r>n?-1:0}));for(var f=0,m=a;f<m.length;f++){var v,y,j=m[f];if(r+="".concat(j.nodeCode,"\n"),r+="style ".concat(j.name," fill:#D9D9FF,stroke-width:2px\n"),null===(v=j.isCalledBy)||void 0===v?void 0:v.length){var O,x=Object(H.a)(j.isCalledBy);try{for(x.s();!(O=x.n()).done;){var _=O.value;r+="".concat(_," ---\x3e ").concat(j.name,"\n")}}catch(J){x.e(J)}finally{x.f()}}else j.triggerBinding&&(r+="".concat(j.name,".").concat(j.triggerBinding.type,'>"').concat(U(j.triggerBinding),'"]:::').concat(j.triggerBinding.type," --\x3e ").concat(j.name,"\n"));for(var w=0;w<j.inputBindings.length;w++){var P=j.inputBindings[w];r+="".concat(j.name,".").concat(w,".").concat(P.type,'(["').concat(E(P),'"]):::').concat(P.type," -.-> ").concat(j.name,"\n")}for(w=0;w<j.outputBindings.length;w++){var C=j.outputBindings[w];r+="".concat(j.name," -.-> ").concat(j.name,".").concat(w,".").concat(C.type,'(["').concat(E(C),'"]):::').concat(C.type,"\n")}for(w=0;w<j.otherBindings.length;w++){var N=j.otherBindings[w];r+="".concat(j.name," -.- ").concat(j.name,".").concat(w,".").concat(N.type,'(["').concat(E(N),'"]):::').concat(N.type,"\n")}if(null===(y=j.isSignalledBy)||void 0===y?void 0:y.length){var k,B=Object(H.a)(j.isSignalledBy);try{for(B.s();!(k=B.n()).done;){var S=k.value;r+="".concat(S.name,' -- "#9889; ').concat(S.signalName,'" ---\x3e ').concat(j.name,"\n")}}catch(J){B.e(J)}finally{B.f()}}j.isCalledByItself&&(r+="".concat(j.name,' -- "[ContinueAsNew]" --\x3e ').concat(j.name,"\n"))}}if(!n.doNotRenderProxies){var F="#FFE6C8";for(var T in t){var z=t[T],D="";z.matchCondition&&(z.matchCondition.methods&&z.matchCondition.methods.length&&(D+=(D?":":"")+"[".concat(z.matchCondition.methods.join(","),"]")),z.matchCondition.route&&(D+=(D?":":"")+z.matchCondition.route)),D||(D=T);var R="proxy.".concat(T);if(r+='proxies.json["'.concat(I,'proxies.json"]:::proxy -. "').concat(T,'" .-> ').concat(R,'(["').concat(I).concat(D,'"]):::proxy\n'),r+="style proxies.json fill:".concat(F,"\n"),r+="style ".concat(R," fill:").concat(F,"\n"),z.backendUri){D=z.backendUri.replace(/'response./g,"'");var L="proxy.".concat(T,".backendUri");r+="".concat(R," ").concat(Y(z.requestOverrides)," ").concat(L,'["').concat(I).concat(D,'"]:::http\n'),r+="style ".concat(L," fill:").concat(F,"\n"),R=L}var G="proxy.".concat(T,".response");r+="".concat(R," ").concat(Z(z.responseOverrides)," ").concat(G,'(["').concat(I,'."]):::http\n'),r+="style ".concat(G," fill:").concat(F,"\n")}}return r}(this._traverseResult.functions,this._traverseResult.proxies,{doNotRenderFunctions:!this._renderFunctions,doNotRenderProxies:!this._renderProxies});if(!t)return void(this._inProgress=!1);this._diagramCode="graph LR\n".concat(t),L.a.render("mermaidSvgId",this._diagramCode,(function(t){e._diagramSvg=e.applyIcons(t),e._inProgress=!1}))}catch(n){this._error="Diagram rendering failed: ".concat(n.message),this._inProgress=!1}}}},{key:"load",value:function(){var e=this;if(!this._inProgress&&this.pathText){this._inProgress=!0,this._diagramCode="",this._diagramSvg="",this._error="",this._traverseResult=null;var t=this.pathText;window.history.replaceState(null,null,"?path=".concat(encodeURIComponent(t))),this.pathText="";var n=D.a.post("a/p/i/traverse-func",t);Promise.all([n,this._iconsSvgPromise]).then((function(t){e._traverseResult=t[0].data,e._iconsSvg=t[1].data,e.render()}),(function(t){e._error="Parsing failed: ".concat(t.message,".").concat(t.response?t.response.data:""),e._inProgress=!1}))}}},{key:"applyIcons",value:function(e){return e=(e=e.replace("><style>",">\n<defs>\n".concat(this._iconsSvg,"</defs>\n<style>"))).replace(/<g class="node (\w+).*?<g class="label" transform="translate\([0-9,.-]+\)"><g transform="translate\([0-9,.-]+\)">/g,'$&<use href="#az-icon-$1" width="20px" height="20px"/>')}}]),e}(),Object(F.a)(G.prototype,"diagramSvg",[T.f],Object.getOwnPropertyDescriptor(G.prototype,"diagramSvg"),G.prototype),Object(F.a)(G.prototype,"diagramCode",[T.f],Object.getOwnPropertyDescriptor(G.prototype,"diagramCode"),G.prototype),Object(F.a)(G.prototype,"error",[T.f],Object.getOwnPropertyDescriptor(G.prototype,"error"),G.prototype),J=Object(F.a)(G.prototype,"pathText",[T.m],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return""}}),Object(F.a)(G.prototype,"inProgress",[T.f],Object.getOwnPropertyDescriptor(G.prototype,"inProgress"),G.prototype),Object(F.a)(G.prototype,"functionsLoaded",[T.f],Object.getOwnPropertyDescriptor(G.prototype,"functionsLoaded"),G.prototype),Object(F.a)(G.prototype,"renderFunctions",[T.f],Object.getOwnPropertyDescriptor(G.prototype,"renderFunctions"),G.prototype),Object(F.a)(G.prototype,"renderProxies",[T.f],Object.getOwnPropertyDescriptor(G.prototype,"renderProxies"),G.prototype),M=Object(F.a)(G.prototype,"_error",[T.m],{configurable:!0,enumerable:!0,writable:!0,initializer:null}),W=Object(F.a)(G.prototype,"_diagramCode",[T.m],{configurable:!0,enumerable:!0,writable:!0,initializer:null}),K=Object(F.a)(G.prototype,"_diagramSvg",[T.m],{configurable:!0,enumerable:!0,writable:!0,initializer:null}),A=Object(F.a)(G.prototype,"_inProgress",[T.m],{configurable:!0,enumerable:!0,writable:!0,initializer:null}),V=Object(F.a)(G.prototype,"_renderFunctions",[T.m],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return!0}}),$=Object(F.a)(G.prototype,"_renderProxies",[T.m],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return!0}}),Q=Object(F.a)(G.prototype,"_traverseResult",[T.m],{configurable:!0,enumerable:!0,writable:!0,initializer:null}),G);c.a.render(Object(k.jsx)(B,{state:new ee}),document.getElementById("root"))}},[[495,1,2]]]);
//# sourceMappingURL=main.c2df72b1.chunk.js.map