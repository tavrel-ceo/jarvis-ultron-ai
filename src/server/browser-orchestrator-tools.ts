import { registerTool } from "./tool-engine";
import { runBrowserResearch,runBrowserWorkflow } from "./browser-orchestrator";
const parse=(q:string)=>{try{return JSON.parse(q)}catch{return{}}};
registerTool({name:"browser_research_workflow",description:"Pesquisa na web, extrai links e conteúdo e opcionalmente salva o resultado em arquivo local.",timeoutMs:90000,risk:"medium",requiresConfirmation:true,run:async q=>{const x=parse(q);return{tool:"browser_research_workflow",...(await runBrowserResearch(x.id||"default",x.query||"",x.saveTo))}}});
registerTool({name:"browser_orchestrated_workflow",description:"Executa uma sequência web e opcionalmente baixa um arquivo para o filesystem.",timeoutMs:180000,risk:"high",requiresConfirmation:true,run:async q=>{const x=parse(q);return{tool:"browser_orchestrated_workflow",...(await runBrowserWorkflow(x.id||"default",x.steps||[],x.download))}}});
