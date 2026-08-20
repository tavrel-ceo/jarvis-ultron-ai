import fs from "node:fs/promises";
import path from "node:path";
export type MemoryKind="observation"|"decision"|"result"|"error"|"artifact";
export type TaskMemoryEntry={id:string;taskId:string;kind:MemoryKind;content:string;source?:string;metadata?:Record<string,unknown>;createdAt:string};
const dir=path.resolve(process.env.DATA_DIR||"data"),file=path.join(dir,"task-memory.json");
const store=new Map<string,TaskMemoryEntry[]>();
let loaded=false;
const now=()=>new Date().toISOString();
const id=()=>`${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
async function load(){if(loaded)return;try{const raw=JSON.parse(await fs.readFile(file,"utf8")) as Record<string,TaskMemoryEntry[]>;for(const [taskId,entries] of Object.entries(raw))store.set(taskId,entries)}catch{}loaded=true}
async function save(){await fs.mkdir(dir,{recursive:true});const data=Object.fromEntries(store.entries());await fs.writeFile(file,JSON.stringify(data,null,2),"utf8")}
export async function addMemory(taskId:string,kind:MemoryKind,content:string,source?:string,metadata?:Record<string,unknown>){await load();const e={id:id(),taskId,kind,content:content.slice(0,20000),source,metadata,createdAt:now()};const list=store.get(taskId)||[];list.push(e);if(list.length>200)list.splice(0,list.length-200);store.set(taskId,list);await save();return e}
export async function getMemory(taskId:string,limit=50){await load();return(store.get(taskId)||[]).slice(-Math.min(200,Math.max(1,limit)))}
export async function summarizeMemory(taskId:string){const entries=await getMemory(taskId,200);return{taskId,count:entries.length,observations:entries.filter(e=>e.kind==="observation").map(e=>e.content),decisions:entries.filter(e=>e.kind==="decision").map(e=>e.content),results:entries.filter(e=>e.kind==="result").map(e=>e.content),errors:entries.filter(e=>e.kind==="error").map(e=>e.content),artifacts:entries.filter(e=>e.kind==="artifact").map(e=>e.content)}}
export async function clearMemory(taskId:string){await load();store.delete(taskId);await save();return{success:true,taskId}}
