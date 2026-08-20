import { promises as fs } from "node:fs";import path from "node:path";
export type Project={id:string;sessionId:string;name:string;description:string;createdAt:number;updatedAt:number;active:boolean};
const file=path.resolve(process.env.DATA_DIR||"data","projects.json");let projects:Project[]|null=null;
async function load(){if(projects)return;try{projects=JSON.parse(await fs.readFile(file,"utf8"))}catch{projects=[]}}
async function save(){await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,JSON.stringify(projects,null,2),"utf8")}
export async function listProjects(sessionId:string){await load();return projects!.filter(p=>p.sessionId===sessionId).sort((a,b)=>Number(b.active)-Number(a.active)||b.updatedAt-a.updatedAt)}
export async function createProject(sessionId:string,name:string,description=""){await load();const now=Date.now();for(const p of projects!)if(p.sessionId===sessionId)p.active=false;const p={id:crypto.randomUUID(),sessionId,name:name.trim().slice(0,120),description:description.slice(0,1000),createdAt:now,updatedAt:now,active:true};projects!.push(p);await save();return p}
export async function getProject(id:string){await load();return projects!.find(p=>p.id===id)}
export async function updateProject(id:string,patch:Partial<Pick<Project,"name"|"description"|"active">>){await load();const p=projects!.find(x=>x.id===id);if(!p)return null;if(patch.active===true)for(const x of projects!)if(x.sessionId===p.sessionId)x.active=false;Object.assign(p,patch,{updatedAt:Date.now()});await save();return p}
export async function deleteProject(id:string){await load();const p=projects!.find(x=>x.id===id);projects=projects!.filter(x=>x.id!==id);if(p?.active){const next=projects!.find(x=>x.sessionId===p.sessionId);if(next)next.active=true}await save()}
