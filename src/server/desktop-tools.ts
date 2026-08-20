import { registerTool } from "./tool-engine";
import { listWindows,launchApplication,desktopShell,getSystemInfo } from "./desktop-agent";
const parse=(q:string)=>{try{return JSON.parse(q)}catch{return{command:q}}};
registerTool({name:"desktop_list_windows",description:"Lista aplicações Windows com janelas visíveis.",timeoutMs:30000,risk:"low",run:async()=>({tool:"desktop_list_windows",...(await listWindows())})});
registerTool({name:"desktop_system_info",description:"Consulta informações básicas do Windows.",timeoutMs:30000,risk:"low",run:async()=>({tool:"desktop_system_info",...(await getSystemInfo())})});
registerTool({name:"desktop_launch_application",description:"Abre uma aplicação no Windows. Requer confirmação.",timeoutMs:30000,risk:"high",requiresConfirmation:true,run:async q=>{const x=parse(q);return{tool:"desktop_launch_application",...(await launchApplication(x.command,x.args||[]))}}});
registerTool({name:"desktop_shell",description:"Executa um comando PowerShell no computador. Requer confirmação.",timeoutMs:30000,risk:"high",requiresConfirmation:true,run:async q=>{const x=parse(q);return{tool:"desktop_shell",...(await desktopShell(x.command||""))}}});
