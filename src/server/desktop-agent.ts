import { execFile,spawn } from "node:child_process";
import { promisify } from "node:util";
import { promises as fs } from "node:fs";
import path from "node:path";
const exec=promisify(execFile);
export type DesktopResult={success:boolean;data?:unknown;error?:string};
function ps(script:string){return exec("powershell.exe",["-NoProfile","-NonInteractive","-ExecutionPolicy","Bypass","-Command",script],{timeout:30000,maxBuffer:5_000_000}).then(r=>({success:true,data:r.stdout.trim()})).catch(e=>({success:false,error:e?.stderr?.trim()||e?.message||"POWERSHELL_FAILED"}));}
export async function listWindows():Promise<DesktopResult>{return ps("Get-Process | Where-Object {$_.MainWindowTitle} | Select-Object Id,ProcessName,MainWindowTitle | ConvertTo-Json -Compress")}
export async function launchApplication(command:string,args:string[]=[]):Promise<DesktopResult>{if(!/^[a-zA-Z0-9_.\\/: -]+$/.test(command))return{success:false,error:"APPLICATION_COMMAND_INVALID"};try{const child=exec(command,args,{windowsHide:false});return{success:true,data:{pid:child.child.pid}}}catch(e){return{success:false,error:e instanceof Error?e.message:"LAUNCH_FAILED"}}}
export async function desktopShell(command:string):Promise<DesktopResult>{if(!command.trim())return{success:false,error:"COMMAND_REQUIRED"};return ps(`& ${command}`)}
export async function getSystemInfo():Promise<DesktopResult>{return ps("Get-CimInstance Win32_OperatingSystem | Select-Object Caption,Version,OSArchitecture,LastBootUpTime | ConvertTo-Json -Compress")}
export async function listDirectory(dir=process.cwd()):Promise<DesktopResult>{try{const target=path.resolve(dir);const entries=await fs.readdir(target,{withFileTypes:true});return{success:true,data:entries.map(e=>({name:e.name,type:e.isDirectory()?"directory":"file"}))}}catch(e){return{success:false,error:e instanceof Error?e.message:"DIRECTORY_LIST_FAILED"}}}
export async function openTarget(target:string):Promise<DesktopResult>{if(!target.trim())return{success:false,error:"TARGET_REQUIRED"};return ps(`Start-Process -FilePath ${JSON.stringify(target)}`)}
export async function runProcess(program:string,args:string[]=[]):Promise<DesktopResult>{return new Promise(resolve=>{const child=spawn(program,args,{stdio:["ignore","pipe","pipe"],shell:false});let stdout="",stderr="";child.stdout.on("data",d=>stdout+=d);child.stderr.on("data",d=>stderr+=d);const timer=setTimeout(()=>{child.kill();resolve({success:false,error:"PROCESS_TIMEOUT",data:{stdout,stderr}})},60000);child.on("error",e=>{clearTimeout(timer);resolve({success:false,error:e.message,data:{stdout,stderr}})});child.on("close",code=>{clearTimeout(timer);resolve({success:code===0,data:{code,stdout,stderr},error:code===0?undefined:`PROCESS_EXIT_${code}`})})})}
