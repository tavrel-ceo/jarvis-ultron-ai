import fs from "node:fs/promises";import path from "node:path";
export type TaskEventType="task.completed"|"task.waiting_input"|"task.failed"|"task.paused"|"task.cancelled"|"task.started";
export type TaskEvent={id:string;type:TaskEventType;taskId:string;sessionId:string;message:string;createdAt:number;read:boolean;data?:unknown};
const dir=path.resolve(process.env.DATA_DIR||"data"),file=path.join(dir,"task-events.json");let events:TaskEvent[]|null=null;async function load(){if(events)return;try{events=JSON.parse(await fs.readFile(file,"utf8"))}catch{events=[]}}async function save(){await fs.mkdir(dir,{recursive:true});await fs.writeFile(file,JSON.stringify(events!.slice(-1000),null,2),"utf8")}
export async function emitTaskEvent(type:TaskEventType,taskId:string,sessionId:string,message:string,data?:unknown){await load();const event={id:crypto.randomUUID(),type,taskId,sessionId,message,createdAt:Date.now(),read:false,data};events!.push(event);await save();return event}
export async function listTaskEvents(sessionId:string,unreadOnly=false){await load();return events!.filter(e=>e.sessionId===sessionId&&(!unreadOnly||!e.read)).sort((a,b)=>b.createdAt-a.createdAt)}
export async function markTaskEventsRead(sessionId:string){await load();for(const e of events!)if(e.sessionId===sessionId)e.read=true;await save()}
export async function clearTaskEvents(sessionId:string){await load();events=events!.filter(e=>e.sessionId!==sessionId);await save()}
