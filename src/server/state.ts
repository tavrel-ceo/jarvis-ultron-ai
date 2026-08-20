import fs from "node:fs/promises";
import path from "node:path";
export type TaskStatus="idle"|"active"|"waiting"|"done";
export type ARISState={sessionId:string;status:TaskStatus;objective:string;currentStep?:string;startedAt?:number;updatedAt:number;metadata:Record<string,unknown>};
const dir=path.resolve(process.env.DATA_DIR||"data"),file=path.join(dir,"state.json");
let states:Record<string,ARISState>|null=null;
async function load(){if(states)return;try{states=JSON.parse(await fs.readFile(file,"utf8"))}catch{states={}}}
async function save(){await fs.mkdir(dir,{recursive:true});await fs.writeFile(file,JSON.stringify(states,null,2),"utf8")}
export async function getState(sessionId:string){await load();return states![sessionId]||{sessionId,status:"idle",objective:"",updatedAt:Date.now(),metadata:{}}}
export async function setState(sessionId:string,patch:Partial<ARISState>){await load();const old=await getState(sessionId);states![sessionId]={...old,...patch,sessionId,updatedAt:Date.now()};await save();return states![sessionId]}
export async function clearState(sessionId:string){await load();delete states![sessionId];await save()}
