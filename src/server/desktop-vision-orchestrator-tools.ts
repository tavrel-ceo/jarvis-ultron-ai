import { registerTool } from "./tool-engine";
import { inspectDesktop } from "./desktop-vision-orchestrator";
const parse=(q:string)=>{try{return JSON.parse(q)}catch{return{goal:q}}};
registerTool({name:"desktop_inspect_and_plan",description:"Captura a tela e usa o núcleo de IA para interpretar visualmente o desktop e produzir um plano de ações. Não executa as ações automaticamente.",timeoutMs:90000,risk:"low",run:async q=>{const x=parse(q);return{tool:"desktop_inspect_and_plan",...(await inspectDesktop(x.goal||"Descreva o estado atual da tela",x.screenshotPath||"./aris-screen.png"))}}});
