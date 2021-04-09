(this["webpackJsonpdurable-mvc-starter-ui"]=this["webpackJsonpdurable-mvc-starter-ui"]||[]).push([[0],{240:function(e,t,r){},485:function(e,t,r){var a={"./locale":215,"./locale.js":215};function n(e){var t=i(e);return r(t)}function i(e){if(!r.o(a,e)){var t=new Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}return a[e]}n.keys=function(){return Object.keys(a)},n.resolve=i,e.exports=n,n.id=485},488:function(e,t,r){"use strict";r.r(t);var a,n,i,o,c,s,u,g=r(0),l=r.n(g),d=r(10),p=r.n(d),b=(r(240),r(96)),h=r(97),m=r(226),f=r(225),v=r(224),j=r(515),y=r(518),O=r(519),x=r(521),_=r(523),w=r(524),T=r(520),N=r(221),B=r.n(N),P=r(222),k=r.n(P),C=r(8),S=Object(v.a)(a=function(e){Object(m.a)(r,e);var t=Object(f.a)(r);function r(){return Object(b.a)(this,r),t.apply(this,arguments)}return Object(h.a)(r,[{key:"render",value:function(){var e=this,t=this.props.state;return Object(C.jsxs)(C.Fragment,{children:[Object(C.jsx)(j.a,{position:"static",color:"default",children:Object(C.jsxs)(y.a,{children:[Object(C.jsx)(O.a,{variant:"h5",color:"inherit",className:"title-typography",children:"Azure Functions as a Graph"}),Object(C.jsx)(x.a,{fullWidth:!0,className:"filter-textfield",margin:"dense",label:"GitHub link or local path to Functions project",InputLabelProps:{shrink:!0},placeholder:"e.g. 'https://github.com/scale-tone/repka-durable-func'",disabled:t.inProgress,value:t.pathText,onChange:function(e){return t.pathText=e.target.value},onKeyPress:function(t){return e.handleKeyPress(t)}}),Object(C.jsx)(_.a,{width:30}),Object(C.jsx)(w.a,{className:"filter-button",variant:"outlined",color:"secondary",size:"large",disabled:t.inProgress||!t.pathText,onClick:function(){return t.load()},children:"Visualize"})]})}),!!t.inProgress&&Object(C.jsx)(T.a,{}),!!t.error&&Object(C.jsx)(O.a,{className:"error-typography",color:"error",variant:"h5",children:t.error}),!!t.diagramSvg&&Object(C.jsxs)(C.Fragment,{children:[Object(C.jsx)("div",{className:"diagram-div",dangerouslySetInnerHTML:{__html:t.diagramSvg}}),Object(C.jsxs)(y.a,{variant:"dense",className:"bottom-toolbar",children:[Object(C.jsxs)(w.a,{variant:"outlined",color:"default",disabled:t.inProgress,onClick:function(){return window.navigator.clipboard.writeText(t.diagramCode)},children:[Object(C.jsx)(B.a,{}),Object(C.jsx)(_.a,{width:10}),Object(C.jsx)(O.a,{color:"inherit",children:"Copy diagram code to Clipboard"})]}),Object(C.jsx)(_.a,{width:20}),Object(C.jsxs)(w.a,{variant:"outlined",color:"default",disabled:t.inProgress,href:URL.createObjectURL(new Blob([t.diagramSvg],{type:"image/svg+xml"})),download:"functions.svg",children:[Object(C.jsx)(k.a,{}),Object(C.jsx)(_.a,{width:20}),Object(C.jsx)(O.a,{color:"inherit",children:"Save as .SVG"})]}),Object(C.jsx)(_.a,{width:20})]})]}),Object(C.jsx)("a",{className:"github-link",href:"https://github.com/scale-tone/az-func-as-a-graph",target:"_blank",rel:"noreferrer",children:Object(C.jsx)("img",{loading:"lazy",width:"149",height:"149",src:"https://github.blog/wp-content/uploads/2008/12/forkme_right_white_ffffff.png?resize=149%2C149",alt:"Fork me on GitHub","data-recalc-dims":"1"})})]})}},{key:"handleKeyPress",value:function(e){"Enter"===e.key&&(e.preventDefault(),this.props.state.load())}}]),r}(l.a.Component))||a,z=r(102),D=r(62),q=(r(246),r(31)),H=r(5),L=r(223),F=r.n(L),I=r(128),M=r.n(I),E=(n=function(){function e(){Object(b.a)(this,e),Object(D.a)(this,"pathText",i,this),Object(D.a)(this,"_error",o,this),Object(D.a)(this,"_diagramCode",c,this),Object(D.a)(this,"_diagramSvg",s,this),Object(D.a)(this,"_inProgress",u,this),M.a.initialize({startOnLoad:!0,sequence:{noteMargin:0,boxMargin:5,boxTextMargin:5}})}return Object(h.a)(e,[{key:"diagramSvg",get:function(){return this._diagramSvg}},{key:"diagramCode",get:function(){return this._diagramCode}},{key:"error",get:function(){return this._error}},{key:"inProgress",get:function(){return this._inProgress}},{key:"load",value:function(){var e=this;if(!this._inProgress&&this.pathText){this._inProgress=!0,this._error="",this._diagramCode="",this._diagramSvg="";var t=this.pathText;this.pathText="",F.a.post("a/p/i/traverse-func",t).then((function(t){var r=[];for(var a in t.data){var n,i=t.data[a],o=void 0,c=[],s=[],u="".concat(a,'{{"#32;').concat(a,'"}}:::function'),g=Object(z.a)(i.bindings);try{for(g.s();!(n=g.n()).done;){var l=n.value;"orchestrationTrigger"===l.type?u="".concat(a,'[["#32;').concat(a,'"]]:::orchestrator'):"activityTrigger"===l.type?u="".concat(a,'[/"#32;').concat(a,'"/]:::activity'):"entityTrigger"===l.type&&(u="".concat(a,'[("#32;').concat(a,'")]:::entity')),l.type.endsWith("Trigger")?o=l:"in"===l.direction?c.push(l):s.push(l)}}catch(_){g.e(_)}finally{g.f()}r.push({name:a,nodeCode:u,triggerBinding:o,inputBindings:c,outputBindings:s,activities:i.activities})}r.sort((function(e,t){var r,a,n,i,o=(null!==(r=null===(a=e.triggerBinding)||void 0===a?void 0:a.type)&&void 0!==r?r:"")+"~"+e.name,c=(null!==(n=null===(i=t.triggerBinding)||void 0===i?void 0:i.type)&&void 0!==n?n:"")+"~"+t.name;return o>c?1:c>o?-1:0}));for(var d="",p=0,b=r;p<b.length;p++){var h=b[p];d+="".concat(h.nodeCode,"\n"),h.triggerBinding&&(d+="".concat(h.name,".").concat(h.triggerBinding.type,'>"#32;').concat(e.getTriggerBindingText(h.triggerBinding),'"]:::').concat(h.triggerBinding.type," --\x3e ").concat(h.name,"\n"));var m,f=Object(z.a)(h.inputBindings);try{for(f.s();!(m=f.n()).done;){var v=m.value;d+="".concat(h.name,".").concat(v.type,'(["#32;').concat(v.type,'"]):::').concat(e.getBindingText(v)," -.-> ").concat(h.name,"\n")}}catch(_){f.e(_)}finally{f.f()}var j,y=Object(z.a)(h.outputBindings);try{for(y.s();!(j=y.n()).done;){var O=j.value;d+="".concat(h.name," -.-> ").concat(h.name,".").concat(O.type,'(["#32;').concat(e.getBindingText(O),'"]):::').concat(O.type,"\n")}}catch(_){y.e(_)}finally{y.f()}if(h.activities)for(var x in h.activities)d+="".concat(h.name," --\x3e ").concat(h.name,".").concat(x,'[/"#32;').concat(x,'"/]:::activity\n')}if(d){e._diagramCode="graph LR\n".concat(d);try{M.a.render("mermaidSvgId",e._diagramCode,(function(t){e._diagramSvg=e.applyIcons(t),e._inProgress=!1}))}catch(_){e._error="Diagram generation failed: ".concat(_.message),e._inProgress=!1}}else e._inProgress=!1}),(function(t){e._error="Parsing failed: ".concat(t.message,".").concat(t.response?t.response.data:""),e._inProgress=!1}))}}},{key:"getTriggerBindingText",value:function(e){switch(e.type){case"httpTrigger":return"http:[".concat(e.methods.join(","),"]").concat(e.route?":"+e.route:"");case"blobTrigger":return"blob:".concat(e.path);case"cosmosDBTrigger":return"cosmosDB:".concat(e.databaseName,":").concat(e.collectionName);case"eventHubTrigger":return"eventHub:".concat(e.eventHubName);case"serviceBusTrigger":return"serviceBus:".concat(e.queueName?e.queueName:e.topicName).concat(e.subscriptionName?":"+e.subscriptionName:"");case"queueTrigger":return"queue:".concat(e.queueName);case"timerTrigger":return"timer:".concat(e.schedule);default:return e.type}}},{key:"getBindingText",value:function(e){switch(e.type){case"blob":return"blob:".concat(e.path);case"cosmosDB":return"cosmosDB:".concat(e.databaseName,":").concat(e.collectionName);case"eventHub":return"eventHub:".concat(e.eventHubName);case"serviceBus":return"serviceBus:".concat(e.queueName?e.queueName:e.topicName).concat(e.subscriptionName?":"+e.subscriptionName:"");case"queue":return"queue:".concat(e.queueName);default:return e.type}}},{key:"applyIcons",value:function(e){return e=e.replace(/<g class="node (\w+).*?<g class="label" transform="translate\([0-9,.-]+\)"><g transform="translate\([0-9,.-]+\)">/g,'$&<image href="static/icons/$1.svg" width="20px"/>')}}]),e}(),Object(q.a)(n.prototype,"diagramSvg",[H.f],Object.getOwnPropertyDescriptor(n.prototype,"diagramSvg"),n.prototype),Object(q.a)(n.prototype,"diagramCode",[H.f],Object.getOwnPropertyDescriptor(n.prototype,"diagramCode"),n.prototype),Object(q.a)(n.prototype,"error",[H.f],Object.getOwnPropertyDescriptor(n.prototype,"error"),n.prototype),i=Object(q.a)(n.prototype,"pathText",[H.m],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return""}}),Object(q.a)(n.prototype,"inProgress",[H.f],Object.getOwnPropertyDescriptor(n.prototype,"inProgress"),n.prototype),o=Object(q.a)(n.prototype,"_error",[H.m],{configurable:!0,enumerable:!0,writable:!0,initializer:null}),c=Object(q.a)(n.prototype,"_diagramCode",[H.m],{configurable:!0,enumerable:!0,writable:!0,initializer:null}),s=Object(q.a)(n.prototype,"_diagramSvg",[H.m],{configurable:!0,enumerable:!0,writable:!0,initializer:null}),u=Object(q.a)(n.prototype,"_inProgress",[H.m],{configurable:!0,enumerable:!0,writable:!0,initializer:null}),n);p.a.render(Object(C.jsx)(S,{state:new E}),document.getElementById("root"))}},[[488,1,2]]]);
//# sourceMappingURL=main.176148a4.chunk.js.map