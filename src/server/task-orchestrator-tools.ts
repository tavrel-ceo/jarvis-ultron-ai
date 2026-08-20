import { registerTool } from "./tool-engine";
import { runTaskPlan,type TaskPlan } from "./task-orchestrator";
const parse=(q:string)=>{try{return JSON.parse(q)}catch{return null}};
registerTool({name:"aris_run_task_plan",description:"Executa um plano composto por Browser, Desktop, Development e GitHub em sequência, interrompendo no primeiro erro.",timeoutMs:300000,risk:"critical",requiresConfirmation:true,run:async q=>{const plan=parse(q) as TaskPlan|null;if(!plan?.goal||!Array.isArray(plan.steps))return{tool:"aris_run_task_plan",success:false,error:"TASK_PLAN_INVALID"};return{tool:"aris_run_task_plan",...(await runTaskPlan(plan,async()=>true))}}});
