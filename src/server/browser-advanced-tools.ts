import { registerTool } from "./tool-engine";
import { listTabs,newTab,downloadFile,closeBrowser } from "./browser-advanced-agent";
const parse=(q:string)=>{try{return JSON.parse(q)}catch{return{}}};
registerTool({name:"browser_list_tabs",description:"Lista abas abertas em uma sessão do navegador.",timeoutMs:10000,risk:"low",run:async q=>{const x=parse(q);return{tool:"browser_list_tabs",...(await listTabs(x.id||"default"))}}});
registerTool({name:"browser_new_tab",description:"Abre uma nova aba do navegador.",timeoutMs:40000,risk:"medium",requiresConfirmation:true,run:async q=>{const x=parse(q);return{tool:"browser_new_tab",...(await newTab(x.id||"default",x.url))}}});
registerTool({name:"browser_download",description:"Baixa um arquivo para um caminho local informado.",timeoutMs:60000,risk:"high",requiresConfirmation:true,run:async q=>{const x=parse(q);return{tool:"browser_download",...(await downloadFile(x.id||"default",x.url,x.destination))}}});
registerTool({name:"browser_close_session",description:"Fecha uma sessão de navegador.",timeoutMs:10000,risk:"low",run:async q=>{const x=parse(q);return{tool:"browser_close_session",...(await closeBrowser(x.id||"default"))}}});
