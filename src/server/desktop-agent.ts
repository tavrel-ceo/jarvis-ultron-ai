import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec=promisify(execFile);
export type DesktopResult={success:boolean;data?:unknown;error?:string};
function ps(script:string){return exec("powershell.exe",["-NoProfile","-NonInteractive","-ExecutionPolicy","Bypass","-Command",script],{timeout:30000,maxBuffer:5_000_000}).then(r=>({success:true,data:r.stdout.trim()})).catch(e=>({success:false,error:e?.stderr?.trim()||e?.message||"POWERSHELL_FAILED"}));}
export async function listWindows():Promise<DesktopResult>{return ps("Get-Process | Where-Object {$_.MainWindowTitle} | Select-Object Id,ProcessName,MainWindowTitle | ConvertTo-Json -Compress")}
export async function launchApplication(command:string,args:string[]=[]):Promise<DesktopResult>{if(!/^[a-zA-Z0-9_.\\/: -]+$/.test(command))return{success:false,error:"APPLICATION_COMMAND_INVALID"};try{const child=exec(command,args,{windowsHide:false});return{success:true,data:{pid:(await child).pid}}}catch(e){return{success:false,error:e instanceof Error?e.message:"LAUNCH_FAILED"}}}
export async function desktopShell(command:string):Promise<DesktopResult>{if(!command.trim())return{success:false,error:"COMMAND_REQUIRED"};return ps(`& ${command}`)}
export async function getSystemInfo():Promise<DesktopResult>{return ps("Get-CimInstance Win32_OperatingSystem | Select-Object Caption,Version,OSArchitecture,LastBootUpTime | ConvertTo-Json -Compress")}
