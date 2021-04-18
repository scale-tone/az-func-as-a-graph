(this["webpackJsonpaz-function-as-a-graph-ui"]=this["webpackJsonpaz-function-as-a-graph-ui"]||[]).push([[0],{241:function(e,t,a){},486:function(e,t,a){var r={"./locale":215,"./locale.js":215};function n(e){var t=i(e);return a(t)}function i(e){if(!a.o(r,e)){var t=new Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}return r[e]}n.keys=function(){return Object.keys(r)},n.resolve=i,e.exports=n,n.id=486},489:function(e,t,a){"use strict";a.r(t);var r,n,i,o,c,s,l,g=a(0),u=a.n(g),d=a(11),p=a.n(d),h=(a(241),a(97)),b=a(98),m=a(226),f=a(225),y=a(224),v=a(518),j=a(521),O=a(492),x=a(522),w=a(524),B=a(526),_=a(527),T=a(523),N=a(221),C=a.n(N),P=a(222),k=a.n(P),S=a(8),z=Object(y.a)(r=function(e){Object(m.a)(a,e);var t=Object(f.a)(a);function a(){return Object(h.a)(this,a),t.apply(this,arguments)}return Object(b.a)(a,[{key:"componentDidMount",value:function(){if(window.location.search.startsWith("?path=")){var e=this.props.state;e.pathText=decodeURIComponent(window.location.search.substr(6)),e.load()}}},{key:"render",value:function(){var e=this,t=this.props.state;return Object(S.jsxs)(S.Fragment,{children:[Object(S.jsx)(v.a,{position:"static",color:"default",children:Object(S.jsxs)(j.a,{children:[Object(S.jsx)(O.a,{variant:"h5",color:"inherit",className:"title-typography",children:Object(S.jsx)(x.a,{color:"inherit",href:window.location.origin+window.location.pathname,children:"Azure Functions as a Graph"})}),Object(S.jsx)(w.a,{fullWidth:!0,className:"filter-textfield",margin:"dense",label:"GitHub link or local path to Functions project",InputLabelProps:{shrink:!0},placeholder:"e.g. 'https://github.com/scale-tone/repka-durable-func'",disabled:t.inProgress,value:t.pathText,onChange:function(e){return t.pathText=e.target.value},onKeyPress:function(t){return e.handleKeyPress(t)}}),Object(S.jsx)(B.a,{width:30}),Object(S.jsx)(_.a,{className:"filter-button",variant:"outlined",color:"secondary",size:"large",disabled:t.inProgress||!t.pathText,onClick:function(){return t.load()},children:"Visualize"})]})}),!!t.inProgress&&Object(S.jsx)(T.a,{}),!!t.error&&Object(S.jsx)(O.a,{className:"error-typography",color:"error",variant:"h5",children:t.error}),!!t.diagramSvg&&Object(S.jsxs)(S.Fragment,{children:[Object(S.jsx)("div",{className:"diagram-div",dangerouslySetInnerHTML:{__html:t.diagramSvg}}),Object(S.jsxs)(j.a,{variant:"dense",className:"bottom-toolbar",children:[Object(S.jsxs)(_.a,{variant:"outlined",color:"default",disabled:t.inProgress,onClick:function(){return window.navigator.clipboard.writeText(t.diagramCode)},children:[Object(S.jsx)(C.a,{}),Object(S.jsx)(B.a,{width:10}),Object(S.jsx)(O.a,{color:"inherit",children:"Copy diagram code to Clipboard"})]}),Object(S.jsx)(B.a,{width:20}),Object(S.jsxs)(_.a,{variant:"outlined",color:"default",disabled:t.inProgress,href:URL.createObjectURL(new Blob([t.diagramSvg],{type:"image/svg+xml"})),download:"functions.svg",children:[Object(S.jsx)(k.a,{}),Object(S.jsx)(B.a,{width:20}),Object(S.jsx)(O.a,{color:"inherit",children:"Save as .SVG"})]}),Object(S.jsx)(B.a,{width:20})]})]}),Object(S.jsx)("a",{className:"github-link",href:"https://github.com/scale-tone/az-func-as-a-graph",target:"_blank",rel:"noreferrer",children:Object(S.jsx)("img",{loading:"lazy",width:"149",height:"149",src:"https://github.blog/wp-content/uploads/2008/12/forkme_right_white_ffffff.png?resize=149%2C149",alt:"Fork me on GitHub","data-recalc-dims":"1"})})]})}},{key:"handleKeyPress",value:function(e){"Enter"===e.key&&(e.preventDefault(),this.props.state.load())}}]),a}(u.a.Component))||r,D=a(227),q=a(64),H=a(63),I=(a(247),a(31)),L=a(5),F=a(223),U=a.n(F),R=a(128),E=a.n(R),G=(n=function(){function e(){Object(h.a)(this,e),Object(H.a)(this,"pathText",i,this),Object(H.a)(this,"_error",o,this),Object(H.a)(this,"_diagramCode",c,this),Object(H.a)(this,"_diagramSvg",s,this),Object(H.a)(this,"_inProgress",l,this),E.a.initialize({startOnLoad:!0})}return Object(b.a)(e,[{key:"diagramSvg",get:function(){return this._diagramSvg}},{key:"diagramCode",get:function(){return this._diagramCode}},{key:"error",get:function(){return this._error}},{key:"inProgress",get:function(){return this._inProgress}},{key:"load",value:function(){var e=this;if(!this._inProgress&&this.pathText){this._inProgress=!0,this._error="",this._diagramCode="",this._diagramSvg="";var t=this.pathText;window.history.replaceState(null,null,"?path=".concat(encodeURIComponent(t))),this.pathText="",U.a.post("a/p/i/traverse-func",t).then((function(t){try{var a=[];for(var r in t.data){var n,i=t.data[r],o=void 0,c=[],s=[],l="".concat(r,'{{"#32;').concat(r,'"}}:::function'),g=Object(q.a)(i.bindings);try{for(g.s();!(n=g.n()).done;){var u=n.value;"orchestrationTrigger"===u.type?l="".concat(r,'[["#32;').concat(r,'"]]:::orchestrator'):"activityTrigger"===u.type?l="".concat(r,'[/"#32;').concat(r,'"/]:::activity'):"entityTrigger"===u.type&&(l="".concat(r,'[("#32;').concat(r,'")]:::entity')),u.type.endsWith("Trigger")?o=u:"in"===u.direction?c.push(u):s.push(u)}}catch(k){g.e(k)}finally{g.f()}a.push(Object(D.a)({name:r,nodeCode:l,triggerBinding:o,inputBindings:c,outputBindings:s},i))}a.sort((function(e,t){var a,r,n=!(null===(a=e.isCalledBy)||void 0===a?void 0:a.length)&&e.triggerBinding&&e.triggerBinding.type?e.triggerBinding.type:"";n+="~"+e.name;var i=!(null===(r=t.isCalledBy)||void 0===r?void 0:r.length)&&t.triggerBinding&&t.triggerBinding.type?t.triggerBinding.type:"";return n>(i+="~"+t.name)?1:i>n?-1:0}));for(var d="",p=0,h=a;p<h.length;p++){var b,m,f=h[p];if(d+="".concat(f.nodeCode,"\n"),null===(b=f.isCalledBy)||void 0===b?void 0:b.length){var y,v=Object(q.a)(f.isCalledBy);try{for(v.s();!(y=v.n()).done;){var j=y.value;d+="".concat(j," --\x3e ").concat(f.name,"\n")}}catch(k){v.e(k)}finally{v.f()}}else f.triggerBinding&&(d+="".concat(f.name,".").concat(f.triggerBinding.type,'>"#32;').concat(e.getTriggerBindingText(f.triggerBinding),'"]:::').concat(f.triggerBinding.type," --\x3e ").concat(f.name,"\n"));var O,x=Object(q.a)(f.inputBindings);try{for(x.s();!(O=x.n()).done;){var w=O.value;d+="".concat(f.name,".").concat(w.type,'(["#32;').concat(e.getBindingText(w),'"]):::').concat(w.type," -.-> ").concat(f.name,"\n")}}catch(k){x.e(k)}finally{x.f()}var B,_=Object(q.a)(f.outputBindings);try{for(_.s();!(B=_.n()).done;){var T=B.value;d+="".concat(f.name," -.-> ").concat(f.name,".").concat(T.type,'(["#32;').concat(e.getBindingText(T),'"]):::').concat(T.type,"\n")}}catch(k){_.e(k)}finally{_.f()}if(null===(m=f.isSignalledBy)||void 0===m?void 0:m.length){var N,C=Object(q.a)(f.isSignalledBy);try{for(C.s();!(N=C.n()).done;){var P=N.value;d+="".concat(P.name,' -. "#9889; ').concat(P.signalName,'" .-> ').concat(f.name,"\n")}}catch(k){C.e(k)}finally{C.f()}}f.isCalledByItself&&(d+="".concat(f.name,' -- "[ContinueAsNew]" --\x3e ').concat(f.name,"\n"))}if(!d)return void(e._inProgress=!1);e._diagramCode="graph LR\n".concat(d),E.a.render("mermaidSvgId",e._diagramCode,(function(t){e._diagramSvg=e.applyIcons(t),e._inProgress=!1}))}catch(k){e._error="Diagram generation failed: ".concat(k.message),e._inProgress=!1}}),(function(t){e._error="Parsing failed: ".concat(t.message,".").concat(t.response?t.response.data:""),e._inProgress=!1}))}}},{key:"getTriggerBindingText",value:function(e){switch(e.type){case"httpTrigger":return"http".concat(e.methods?":["+e.methods.join(",")+"]":"").concat(e.route?":"+e.route:"");case"blobTrigger":return"blob:".concat(e.path);case"cosmosDBTrigger":return"cosmosDB:".concat(e.databaseName,":").concat(e.collectionName);case"eventHubTrigger":return"eventHub:".concat(e.eventHubName);case"serviceBusTrigger":return"serviceBus:".concat(e.queueName?e.queueName:e.topicName).concat(e.subscriptionName?":"+e.subscriptionName:"");case"queueTrigger":return"queue:".concat(e.queueName);case"timerTrigger":return"timer:".concat(e.schedule);default:return e.type}}},{key:"getBindingText",value:function(e){switch(e.type){case"blob":return"blob:".concat(e.path);case"cosmosDB":return"cosmosDB:".concat(e.databaseName,":").concat(e.collectionName);case"eventHub":return"eventHub:".concat(e.eventHubName);case"serviceBus":return"serviceBus:".concat(e.queueName?e.queueName:e.topicName).concat(e.subscriptionName?":"+e.subscriptionName:"");case"queue":return"queue:".concat(e.queueName);default:return e.type}}},{key:"applyIcons",value:function(e){return e=e.replace(/<g class="node (\w+).*?<g class="label" transform="translate\([0-9,.-]+\)"><g transform="translate\([0-9,.-]+\)">/g,'$&<image href="static/icons/$1.svg" width="20px"/>')}}]),e}(),Object(I.a)(n.prototype,"diagramSvg",[L.f],Object.getOwnPropertyDescriptor(n.prototype,"diagramSvg"),n.prototype),Object(I.a)(n.prototype,"diagramCode",[L.f],Object.getOwnPropertyDescriptor(n.prototype,"diagramCode"),n.prototype),Object(I.a)(n.prototype,"error",[L.f],Object.getOwnPropertyDescriptor(n.prototype,"error"),n.prototype),i=Object(I.a)(n.prototype,"pathText",[L.m],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return""}}),Object(I.a)(n.prototype,"inProgress",[L.f],Object.getOwnPropertyDescriptor(n.prototype,"inProgress"),n.prototype),o=Object(I.a)(n.prototype,"_error",[L.m],{configurable:!0,enumerable:!0,writable:!0,initializer:null}),c=Object(I.a)(n.prototype,"_diagramCode",[L.m],{configurable:!0,enumerable:!0,writable:!0,initializer:null}),s=Object(I.a)(n.prototype,"_diagramSvg",[L.m],{configurable:!0,enumerable:!0,writable:!0,initializer:null}),l=Object(I.a)(n.prototype,"_inProgress",[L.m],{configurable:!0,enumerable:!0,writable:!0,initializer:null}),n);p.a.render(Object(S.jsx)(z,{state:new G}),document.getElementById("root"))}},[[489,1,2]]]);
//# sourceMappingURL=main.866bfb04.chunk.js.map