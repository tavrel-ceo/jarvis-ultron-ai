import fs from "node:fs/promises";
import path from "node:path";
import { replan, Plan } from "./planner";
import { executeAdaptive } from "./executor";

export type TaskStatus="pending"|"active"|"waiting_input"|"paused"|"completed"|"failed"|"cancelled";
export type Task={id:string;sessionId:string;objective:string;status:TaskStatus;plan?:Plan;progress:number;result?:unknown;error?:string;createdAt:number;updatedAt:number;startedAt?:number;completedAt?:number;metadata:Record<string,unknown>};
const dir=path.resolve(process.env.DATA_DIR||"data"),file=path.join(dir,"tasks.json");let db:Record<string,Task>|null=null;
async function load(){if(db)return;try{db=JSON.parse(await fs.readFile(file,"utf8"))}catch{db={}}}
async function save(){await fs.mkdir(dir,{recursive:true});await fs.writeFile(file,JSON.stringify(db,null,2),"utf8")}
export async function createTask(sessionId:string,objective:string,plan?:Plan){await load();const id=crypto.randomUUID(),now=Date.now();db![id]={id,sessionId,objective,status:"pending",plan,progress:0,createdAt:now,updatedAt:now,metadata:{}};await save();return db![id]}
export async function getTask(id:string){await load();return db![id]}
export async function listTasks(sessionId:string,status?:TaskStatus){await load();return Object.values(db!).filter(t=>t.sessionId===sessionId&&(!status||t.status===status)).sort((a,b)=>b.updatedAt-a.updatedAt)}
export async function updateTask(id:string,patch:Partial<Task>){await load();if(!db![id])throw new Error("Tarefa não encontrada");db![id]={...db![id],...patch,updatedAt:Date.now()};await save();return db![id]}
export async function cancelTask(id:string){return updateTask(id,{status:"cancelled"})}
export async function runTask(id:string){const task=await getTask(id);if(!task)throw new Error("Tarefa não encontrada");if(["completed","cancelled"].includes(task.status))return task;await updateTask(id,{status:"active",startedAt:task.startedAt||Date.now(),progress:5});try{let current=task.plan;if(!current)throw new Error("Tarefa sem plano");const execution=await executeAdaptive(current,task.sessionId,async(previous,results)=>{await updateTask(id,{plan:previous,progress:Math.min(90,20+results.length*15),metadata:{lastResults:results}});return replan(task.objective,previous,results)});const done=execution.rounds>0&&execution.steps.length>0;return updateTask(id,{status:done?"completed":"waiting_input",progress:done?100:90,result:execution,completedAt:done?Date.now():undefined,metadata:{rounds:execution.rounds}})}catch(e){return updateTask(id,{status:"failed",error:e instanceof Error?e.message:"erro interno"})}}
export async function deleteSessionTasks(sessionId:string){await load();for(const id of Object.keys(db!))if(db![id].sessionId===sessionId)delete db![id];await save()}
