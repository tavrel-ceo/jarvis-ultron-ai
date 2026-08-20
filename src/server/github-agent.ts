import { runCommand } from "./computer-core";
export type GitResult={success:boolean;data?:unknown;error?:string};
const runGit=(cwd:string,args:string)=>runCommand(`git ${args}`,cwd,60000);
export async function gitStatus(cwd:string):Promise<GitResult>{return runGit(cwd,"status --short --branch")}
export async function gitDiff(cwd:string,staged=false):Promise<GitResult>{return runGit(cwd,staged?"diff --cached":"diff")}
export async function gitLog(cwd:string,count=10):Promise<GitResult>{return runGit(cwd,`log -${Math.min(50,Math.max(1,count))} --oneline --decorate`)}
export async function gitBranches(cwd:string):Promise<GitResult>{return runGit(cwd,"branch --all --no-color")}
export async function gitCreateBranch(cwd:string,name:string):Promise<GitResult>{if(!/^[A-Za-z0-9._/-]+$/.test(name))return{success:false,error:"BRANCH_NAME_INVALID"};return runGit(cwd,`switch -c ${JSON.stringify(name)}`)}
export async function gitAddCommit(cwd:string,message:string):Promise<GitResult>{if(!message.trim())return{success:false,error:"COMMIT_MESSAGE_REQUIRED"};const add=await runGit(cwd,"add -A");if(!add.success)return add;return runGit(cwd,`commit -m ${JSON.stringify(message)}`)}
export async function gitPull(cwd:string):Promise<GitResult>{return runGit(cwd,"pull --ff-only")}
export async function gitPush(cwd:string):Promise<GitResult>{return runGit(cwd,"push")}
export async function gitCreatePrBranch(cwd:string,name:string):Promise<GitResult>{return gitCreateBranch(cwd,name)}
