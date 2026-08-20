import { registerTool } from "./tool-engine";
import { researchToFile,inspectForDevelopment,browserRunProject } from "./browser-integration";
const parse=(q:string)=>{try{return JSON.parse(q)}catch{return{}}};
registerTool({name:"browser_save_research",description:"Abre uma página, extrai o conteúdo e salva o resultado dentro de um projeto local.",timeoutMs:60000,risk:"medium",requiresConfirmation:true,run:async q=>{const x=parse(q);return{tool:"browser_save_research",...(await researchToFile(x.id||"default",x.url,x.outputFile,x.root||process.cwd()))}}});
registerTool({name:"browser_inspect_for_development",description:"Analisa uma página e seus links para alimentar tarefas de desenvolvimento.",timeoutMs:60000,risk:"low",run:async q=>{const x=parse(q);return{tool:"browser_inspect_for_development",...(await inspectForDevelopment(x.id||"default",x.url))}}});
registerTool({name:"browser_run_project",description:"Executa um comando de desenvolvimento depois de uma tarefa web. Requer confirmação.",timeoutMs:130000,risk:"high",requiresConfirmation:true,run:async q=>{const x=parse(q);return{tool:"browser_run_project",...(await browserRunProject(x.root||process.cwd(),x.command||""))}}});
