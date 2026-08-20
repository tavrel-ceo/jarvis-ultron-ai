import { registerTool } from "./tool-engine";
import { developProject } from "./development-pipeline";
const parse=(q:string)=>{try{return JSON.parse(q)}catch{return{root:q}}};
registerTool({name:"dev_develop_project",description:"Executa um ciclo controlado de desenvolvimento: inspeciona, aplica um patch exato, valida, revisa e, se falhar, pode restaurar o arquivo original e gerar diagnóstico.",timeoutMs:600000,risk:"high",requiresConfirmation:true,run:async q=>{const x=parse(q);const result=await developProject(x.root||process.cwd(),x.file,x.search,x.replacement,{validate:x.validate!==false,review:x.review!==false,rollbackOnFailure:x.rollbackOnFailure!==false});return{tool:"dev_develop_project",...result}}});
