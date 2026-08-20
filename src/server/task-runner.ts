import { listTasks,runTask,updateTask,Task } from "./tasks";
let timer:NodeJS.Timeout|undefined;let running=false;
export type RunnerConfig={intervalMs:number;maxPerTick:number;staleMs:number};
const config:RunnerConfig={intervalMs:Number(process.env.TASK_RUNNER_INTERVAL_MS||30000),maxPerTick:Number(process.env.TASK_RUNNER_MAX_PER_TICK||2),staleMs:Number(process.env.TASK_RUNNER_STALE_MS||120000)};
export async function tickTaskRunner(){if(running)return[];running=true;try{const candidates:Task[]=[];const all=await listAllKnownTasks();for(const t of all){if(candidates.length>=config.maxPerTick)break;if(t.status==="pending")candidates.push(t);else if(t.status==="active"&&Date.now()-t.updatedAt>=config.staleMs){await updateTask(t.id,{status:"pending",error:"RECOVERED_STALE_TASK"});candidates.push(await runTask(t.id))}}const results=[];for(const t of candidates)results.push(await runTask(t.id));return results}finally{running=false}}
async function listAllKnownTasks(){const ids=(process.env.TASK_RUNNER_SESSIONS||"default").split(",").map(x=>x.trim()).filter(Boolean);const out:Task[]=[];for(const id of ids)out.push(...await listTasks(id));return out}
export function startTaskRunner(){if(process.env.TASK_RUNNER_ENABLED!=="true")return;stopTaskRunner();timer=setInterval(()=>{void tickTaskRunner()},config.intervalMs);void tickTaskRunner()}
export function stopTaskRunner(){if(timer){clearInterval(timer);timer=undefined}}
