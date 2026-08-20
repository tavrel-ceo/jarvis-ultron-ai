import { registerTool } from "./tool-engine";
import { executeVisualLoop } from "./desktop-vision-executor";
const parse=(q:string)=>{try{return JSON.parse(q)}catch{return{goal:q}}};
registerTool({name:"desktop_visual_loop",description:"Executa um ciclo limitado de percepção visual, ação e verificação no desktop. Requer confirmação explícita.",timeoutMs:180000,risk:"critical",requiresConfirmation:true,run:async q=>{const x=parse(q);return{tool:"desktop_visual_loop",...(await executeVisualLoop(x.goal||"",Math.min(3,Number(x.maxIterations)||3)))}}});
