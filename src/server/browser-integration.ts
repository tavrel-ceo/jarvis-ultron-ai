import path from "node:path";
import { promises as fs } from "node:fs";
import { browserNavigate,browserExtract,browserLinks } from "./browser-task-agent";
import { writeProjectFile,runProjectCommand } from "./development-agent";

export type BrowserIntegrationResult={success:boolean;data?:unknown;error?:string};

export async function researchToFile(id:string,url:string,outputFile:string,root=process.cwd()):Promise<BrowserIntegrationResult>{
  const nav=await browserNavigate(id,url); if(!nav.success)return nav;
  const page=await browserExtract(id); if(!page.success)return page;
  const target=path.resolve(root,outputFile); const base=path.resolve(root); if(target!==base&&!target.startsWith(base+path.sep))return{success:false,error:"CAMINHO_FORA_DO_PROJETO"};
  const content=typeof (page.data as any)?.text==="string"?(page.data as any).text:(page.data as any)?.text?.join("\n")||"";
  const write=await writeProjectFile(base,outputFile,`# Conteúdo coletado pela A.R.I.S.\n\nURL: ${url}\n\n${content}`); return{success:write.success,data:{navigation:nav.data,outputFile:target,bytes:Buffer.byteLength(content,"utf8")},error:write.error};
}

export async function inspectForDevelopment(id:string,url:string):Promise<BrowserIntegrationResult>{const nav=await browserNavigate(id,url);if(!nav.success)return nav;const [page,links]=await Promise.all([browserExtract(id),browserLinks(id)]);return{success:page.success&&links.success,data:{page:page.data,links:links.data},error:page.error||links.error}};

export async function browserRunProject(root:string,command:string):Promise<BrowserIntegrationResult>{return runProjectCommand(root,command,120000)};
