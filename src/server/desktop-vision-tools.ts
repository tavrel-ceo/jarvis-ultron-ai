import { registerTool } from "./tool-engine";
import { screenshot,mousePosition,sendKeys,click,writeText } from "./desktop-vision-agent";
const parse=(q:string)=>{try{return JSON.parse(q)}catch{return{}}};
registerTool({name:"desktop_screenshot",description:"Captura a tela principal do Windows para inspeção visual.",timeoutMs:30000,risk:"low",run:async q=>{const x=parse(q);return{tool:"desktop_screenshot",...(await screenshot(x.path||"./aris-screen.png"))}}});
registerTool({name:"desktop_mouse_position",description:"Obtém a posição atual do cursor.",timeoutMs:10000,risk:"low",run:async()=>({tool:"desktop_mouse_position",...(await mousePosition())})});
registerTool({name:"desktop_click",description:"Clica em uma coordenada da tela. Requer confirmação.",timeoutMs:15000,risk:"high",requiresConfirmation:true,run:async q=>{const x=parse(q);return{tool:"desktop_click",...(await click(Number(x.x),Number(x.y)))}}});
registerTool({name:"desktop_send_keys",description:"Envia teclas para a aplicação em foco. Requer confirmação.",timeoutMs:15000,risk:"high",requiresConfirmation:true,run:async q=>{const x=parse(q);return{tool:"desktop_send_keys",...(await sendKeys(x.keys||""))}}});
registerTool({name:"desktop_write_text",description:"Digita texto na aplicação em foco. Requer confirmação.",timeoutMs:15000,risk:"high",requiresConfirmation:true,run:async q=>{const x=parse(q);return{tool:"desktop_write_text",...(await writeText(x.text||""))}}});
