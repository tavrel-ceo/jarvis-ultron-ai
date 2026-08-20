import { registerTool } from "./tool-engine";
import { browserNavigate,browserExtract,browserLinks,browserSearch,browserTask,browserClose } from "./browser-task-agent";
const parse=(q:string)=>{try{return JSON.parse(q)}catch{return{value:q}}};
registerTool({name:"browser_navigate_smart",description:"Abre uma URL em uma sessão persistente do navegador.",timeoutMs:40000,risk:"low",run:async q=>{const x=parse(q);return{tool:"browser_navigate_smart",...(await browserNavigate(x.id||"default",x.url))}}});
registerTool({name:"browser_extract",description:"Extrai texto de uma página ou seletor CSS.",timeoutMs:30000,risk:"low",run:async q=>{const x=parse(q);return{tool:"browser_extract",...(await browserExtract(x.id||"default",x.selector))}}});
registerTool({name:"browser_links",description:"Extrai links relevantes da página atual.",timeoutMs:30000,risk:"low",run:async q=>{const x=parse(q);return{tool:"browser_links",...(await browserLinks(x.id||"default"))}}});
registerTool({name:"browser_search_web",description:"Realiza uma pesquisa web em uma sessão do navegador.",timeoutMs:40000,risk:"low",run:async q=>{const x=parse(q);return{tool:"browser_search_web",...(await browserSearch(x.id||"default",x.query||x.value||""))}}});
registerTool({name:"browser_task",description:"Executa uma sequência de navegação, clique, preenchimento e extração. Ações externas exigem confirmação.",timeoutMs:180000,risk:"high",requiresConfirmation:true,run:async q=>{const x=parse(q);return{tool:"browser_task",...(await browserTask(x.id||"default",x.steps||[]))}}});
registerTool({name:"browser_close",description:"Fecha uma sessão de navegador.",timeoutMs:10000,risk:"low",run:async q=>{const x=parse(q);return{tool:"browser_close",...(await browserClose(x.id||"default"))}}});
