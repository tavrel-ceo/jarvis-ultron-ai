import { promises as fs } from "node:fs";
import path from "node:path";
import { runCommand } from "./computer-core";
import { writeProjectFile, readProjectFile } from "./development-agent";

export type CapabilityResult={success:boolean;data?:unknown;error?:string};
const root=(r:string)=>path.resolve(r||process.cwd());
const rel=(base:string,p:string)=>{const b=root(base),t=path.resolve(b,p);if(t!==b&&!t.startsWith(b+path.sep))throw new Error("CAMINHO_FORA_DO_PROJETO");return t};
const packageManagers=["npm","pnpm","yarn","bun"] as const;
const managerFor=async(cwd:string)=>{for(const m of packageManagers){try{await fs.access(path.join(cwd,m==="npm"?"package-lock.json":m==="pnpm"?"pnpm-lock.yaml":m==="yarn"?"yarn.lock":"bun.lockb"));return m}catch{}}return "npm"};

export async function createProject(cwd:string,name:string,template?:string):Promise<CapabilityResult>{try{const base=root(cwd),target=rel(base,name);await fs.mkdir(target,{recursive:true});if(template){const src=rel(base,template);await fs.cp(src,target,{recursive:true,errorOnExist:false});}else{await fs.writeFile(path.join(target,"README.md"),`# ${path.basename(target)}\n\nProjeto criado pela A.R.I.S.\n`);await fs.writeFile(path.join(target,".gitignore"),"node_modules/\ndist/\n.env\n" );}return{success:true,data:{projectPath:target,created:true,template:template||null}}}catch(e){return{success:false,error:e instanceof Error?e.message:"Erro ao criar projeto"}}}

export async function installDependencies(cwd:string,packages:string[],dev=false):Promise<CapabilityResult>{try{if(!packages.length)return{success:false,error:"Nenhum pacote informado"};const m=await managerFor(root(cwd));const flag=dev?" -D":"";const cmd=m==="npm"?`npm install${flag} ${packages.join(" ")}`:m==="pnpm"?`pnpm add${dev?" -D":""} ${packages.join(" ")}`:m==="yarn"?`yarn add${dev?" -D":""} ${packages.join(" ")}`:`bun add${dev?" -d":""} ${packages.join(" ")}`;return await runCommand(cmd,root(cwd),180000)}catch(e){return{success:false,error:e instanceof Error?e.message:"Erro ao instalar dependências"}}}

export async function reviewProject(cwd:string):Promise<CapabilityResult>{try{const base=root(cwd),files:string[]=[];async function walk(d:string,depth=0){if(depth>5)return;for(const e of await fs.readdir(d,{withFileTypes:true})){if(["node_modules",".git","dist","build"].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())await walk(p,depth+1);else if(/\.(ts|tsx|js|jsx|py|go|rs|java|cs|cpp|c|sql|html|css)$/.test(e.name))files.push(p)}}await walk(base);const snippets=[];for(const f of files.slice(0,80)){const s=await fs.stat(f);if(s.size<300000)snippets.push({file:path.relative(base,f),content:(await fs.readFile(f,"utf8")).slice(0,12000)})}return{success:true,data:{filesAnalyzed:snippets.length,files:snippets}}}catch(e){return{success:false,error:e instanceof Error?e.message:"Erro no code review"}}}

export async function refactorFile(cwd:string,file:string,content:string):Promise<CapabilityResult>{return writeProjectFile(root(cwd),file,content)}
