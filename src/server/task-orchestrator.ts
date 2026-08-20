import { browserNavigate,browserExtract,browserTask } from "./browser-task-agent";
import { executeVisualLoop } from "./desktop-vision-executor";
import { gitStatus,gitDiff,gitAddCommit } from "./github-agent";
import { inspectRepository } from "./github-capabilities";
export type TaskStep={id:string;agent:"browser"|"desktop"|"development"|"github";action:string;input?:any;requiresConfirmation?:boolean};
export type TaskPlan={goal:string;steps:TaskStep[]};
export type TaskRun={success:boolean;goal:string;history:any[];failedStep?:string;error?:string};
const handlers:any={
 browser:{navigate:async(x:any)=>browserNavigate(x.id||"default",x.url),extract:async(x:any)=>browserExtract(x.id||"default",x.selector),task:async(x:any)=>browserTask(x.id||"default",x.steps||[])},
 desktop:{visual_loop:async(x:any)=>executeVisualLoop(x.goal,Math.min(3,Number(x.maxIterations)||3))},
 github:{status:async(x:any)=>gitStatus(x.cwd),diff:async(x:any)=>gitDiff(x.cwd,!!x.staged),inspect_repository:async(x:any)=>inspectRepository(x.owner,x.repo),commit:async(x:any)=>gitAddCommit(x.cwd,x.message)},
 development:{noop:async()=>({success:true,data:{message:"Development action delegated to development agent"}})}
};
export async function runTaskPlan(plan:TaskPlan,confirm:(step:TaskStep)=>Promise<boolean>=async()=>true):Promise<TaskRun>{const history:any[]=[];for(const step of plan.steps){if(!handlers[step.agent]?.[step.action])return{success:false,goal:plan.goal,history,error:`UNSUPPORTED_STEP:${step.agent}.${step.action}`,failedStep:step.id};if(step.requiresConfirmation&&!await confirm(step))return{success:false,goal:plan.goal,history,error:"CONFIRMATION_DECLINED",failedStep:step.id};try{const result=await handlers[step.agent][step.action](step.input||{});history.push({step:step.id,agent:step.agent,action:step.action,result});if(result&&!result.success)return{success:false,goal:plan.goal,history,error:result.error||"STEP_FAILED",failedStep:step.id}}catch(e){return{success:false,goal:plan.goal,history,error:e instanceof Error?e.message:"STEP_EXCEPTION",failedStep:step.id}}}return{success:true,goal:plan.goal,history}}
