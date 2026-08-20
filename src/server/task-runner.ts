import { listTasks,runTask,Task } from "./tasks";
let timer:NodeJS.Timeout|undefined;let running=false;
export type RunnerConfig={intervalMs:number;maxPerTick:number};
const config:RunnerConfig={intervalMs:Number(process.env.TASK_RUNNER_INTERVAL_MS||30000),maxPerTick:Number(process.env.TASK_RUNNER_MAX_PER_TICK||2)};
export async function tickTaskRunner(){if(running)return[];running=true;try{const sessions=new Set<string>();const candidates:Task[]=[];for(const s of sessions){};const all=await listAllKnownTasks();for(const t of all){if(candidates.length>=config.maxPerTick)break;if(t.status==="pending"||t.status==="active")candidates.push(t)}const results=[];for(const t of candidates)results.push(await runTask(t.id));return results}finally{running=false}}
async function listAllKnownTasks(){const ids=(process.env.TASK_RUNNER_SESSIONS||"default").split(",").map(x=>x.trim()).filter(Boolean);const out:Task[]=[];for(const id of ids)out.push(...await listTasks(id));return out}
export function startTaskRunner(){if(process.env.TASK_RUNNER_ENABLED!=="true")return;stopTaskRunner();timer=setInterval(()=>{void tickTaskRunner()},config.intervalMs);void tickTaskRunner()}
export function stopTaskRunner(){if(timer){clearInterval(timer);timer=undefined}}
