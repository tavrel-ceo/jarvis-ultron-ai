import { registerTool } from "./tool-engine";
import { runDevelopmentLoop,diagnoseProjectError } from "./development-loop";
const parse=(q:string)=>{try{return JSON.parse(q)}catch{return {root:q}}};
registerTool({name:"dev_verify_project",description:"Executa o comando de teste/build detectado e verifica o resultado do projeto.",timeoutMs:130000,risk:"high",requiresConfirmation:true,run:async q=>{const x=parse(q);return{tool:"dev_verify_project",...(await runDevelopmentLoop(x.root||process.cwd(),x.command,Number(x.maxIterations)||3))}}});
registerTool({name:"dev_diagnose_file",description:"Lê um arquivo indicado para diagnóstico de um erro de desenvolvimento.",timeoutMs:20000,risk:"low",run:async q=>{const x=parse(q);return{tool:"dev_diagnose_file",...(await diagnoseProjectError(x.root||process.cwd(),x.file))}}});
