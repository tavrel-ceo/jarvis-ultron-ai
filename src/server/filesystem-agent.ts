import { promises as fs } from "node:fs";
import path from "node:path";
import { movePath } from "./computer-core";

export type FsEntry={path:string;name:string;type:"file"|"directory"|"symlink";size?:number;extension?:string};
export type FsAnalysis={root:string;files:number;directories:number;totalBytes:number;extensions:Record<string,number>;largest:Array<{path:string;size:number}>;entries:FsEntry[]};

const MAX_DEPTH=8,MAX_ENTRIES=5000,MAX_FILE_SAMPLE=100;
function resolve(input:string){return path.resolve(input||process.cwd())}
function ext(name:string){const e=path.extname(name).toLowerCase();return e||"[sem extensão]"}

async function walk(root:string,depth=0,out:FsEntry[]=[]):Promise<FsEntry[]>{
  if(depth>MAX_DEPTH||out.length>=MAX_ENTRIES)return out;
  let entries:import("node:fs").Dirent[]=[];
  try{entries=await fs.readdir(root,{withFileTypes:true})}catch{return out}
  for(const e of entries){if(out.length>=MAX_ENTRIES)break;if(e.name==="node_modules"||e.name===".git"||e.name==="dist"||e.name==="build")continue;const p=path.join(root,e.name);if(e.isDirectory()){out.push({path:p,name:e.name,type:"directory"});await walk(p,depth+1,out)}else if(e.isFile()){let size=0;try{size=(await fs.stat(p)).size}catch{}out.push({path:p,name:e.name,type:"file",size,extension:ext(e.name)})}else if(e.isSymbolicLink())out.push({path:p,name:e.name,type:"symlink"})}
  return out;
}

export async function analyzeDirectory(input:string):Promise<{success:boolean;data?:FsAnalysis;error?:string}>{
  const root=resolve(input);const stat=await fs.stat(root).catch(()=>null);if(!stat?.isDirectory())return{success:false,error:"O caminho não é um diretório ou não existe."};
  const entries=await walk(root);const files=entries.filter(e=>e.type==="file"),dirs=entries.filter(e=>e.type==="directory");const extensions:Record<string,number>={};for(const f of files)extensions[f.extension||"[sem extensão]"]=(extensions[f.extension||"[sem extensão]"]||0)+1;const largest=files.slice().sort((a,b)=>(b.size||0)-(a.size||0)).slice(0,10).map(f=>({path:f.path,size:f.size||0}));return{success:true,data:{root,files:files.length,directories:dirs.length,totalBytes:files.reduce((n,f)=>n+(f.size||0),0),extensions,largest,entries:entries.slice(0,MAX_FILE_SAMPLE)}};
}

export async function findFiles(input:string):Promise<{success:boolean;data?:unknown;error?:string}>{
  const lines=input.split("\n");const root=resolve(lines[0]?.trim());const pattern=(lines.slice(1).join("\n").trim()||"*").toLowerCase();const stat=await fs.stat(root).catch(()=>null);if(!stat?.isDirectory())return{success:false,error:"Diretório de busca não existe."};const entries=await walk(root);const files=entries.filter(e=>e.type==="file").filter(f=>{const n=f.name.toLowerCase();if(pattern==="*")return true;if(pattern.startsWith("."))return n.endsWith(pattern);return n.includes(pattern)||n.endsWith(pattern)}).slice(0,500);return{success:true,data:{root,pattern,count:files.length,files}};
}

export async function planOrganization(input:string):Promise<{success:boolean;data?:unknown;error?:string}>{
  const root=resolve(input.trim());const stat=await fs.stat(root).catch(()=>null);if(!stat?.isDirectory())return{success:false,error:"Diretório de organização não existe."};const entries=await walk(root);const files=entries.filter(e=>e.type==="file");const categories:Record<string,string[]>={documentos:[".pdf",".doc",".docx",".txt",".md",".rtf"],imagens:[".png",".jpg",".jpeg",".gif",".webp",".svg"],videos:[".mp4",".mkv",".mov",".avi",".webm"],audio:[".mp3",".wav",".flac",".ogg",".m4a"],codigo:[".ts",".tsx",".js",".jsx",".py",".java",".c",".cpp",".cs",".go",".rs",".html",".css",".json"],compactados:[".zip",".rar",".7z",".tar",".gz"]};const actions=files.map(f=>{const e=f.extension||"";const category=Object.entries(categories).find(([,exts])=>exts.includes(e))?.[0]||"outros";return{from:f.path,to:path.join(root,category,f.name),category}}).filter(a=>path.dirname(a.from)!==path.dirname(a.to));return{success:true,data:{root,mode:"preview",actions:actions.slice(0,500),count:actions.length,note:"A prévia não altera arquivos. A aplicação deve ser autorizada separadamente."}};
}

export async function applyOrganization(input:string):Promise<{success:boolean;data?:unknown;error?:string}>{
  const preview=await planOrganization(input);if(!preview.success)return preview;const actions=(preview.data as any).actions||[];const results=[];for(const action of actions){const result=await movePath(action.from,action.to);results.push({from:action.from,to:action.to,success:result.success,error:result.error});}return{success:results.every((r:any)=>r.success),data:{moved:results.filter((r:any)=>r.success).length,failed:results.filter((r:any)=>!r.success).length,results}};
}
