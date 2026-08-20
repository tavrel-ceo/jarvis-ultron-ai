import { registerTool } from "./tool-engine";
import { recoverTask } from "./task-recovery";
const parse=(q:string)=>{try{return JSON.parse(q)}catch{return null}};
registerTool({name:"aris_recover_task",description:"Diagnostica uma falha e tenta um plano alternativo limitado. Não permite capacidades fora da allowlist.",timeoutMs:300000,risk:"critical",requiresConfirmation:true,run:async q=>{const x=parse(q);if(!x?.goal||!x?.plan||!x?.failedRun)return{tool:"aris_recover_task",success:false,error:"RECOVERY_INPUT_INVALID"};return{tool:"aris_recover_task",...(await recoverTask(x.goal,x.plan,x.failedRun,Math.min(2,Number(x.maxAttempts)||2)))}}});
