import { registerTool } from "./tool-engine";
import { autofixProject } from "./development-autofix";
const parse=(q:string)=>{try{return JSON.parse(q)}catch{return{root:q}}};
registerTool({name:"dev_autofix_project",description:"Analisa falhas de um projeto, propõe correções com o núcleo de raciocínio da A.R.I.S., aplica patches e verifica novamente. Requer autorização.",timeoutMs:600000,risk:"high",requiresConfirmation:true,run:async q=>{const x=parse(q);return{tool:"dev_autofix_project",success:true,data:await autofixProject(x.root||process.cwd(),x.objective||"Corrigir os erros do projeto e deixá-lo compilando/testando corretamente.",x.command,Number(x.maxIterations)||3)}}});
