export type MemoryKind="observation"|"decision"|"result"|"error"|"artifact";
export type TaskMemoryEntry={id:string;taskId:string;kind:MemoryKind;content:string;source?:string;metadata?:Record<string,unknown>;createdAt:string};
const store=new Map<string,TaskMemoryEntry[]>();
const now=()=>new Date().toISOString();
const id=()=>`${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
export function addMemory(taskId:string,kind:MemoryKind,content:string,source?:string,metadata?:Record<string,unknown>){const e={id:id(),taskId,kind,content:content.slice(0,20000),source,metadata,createdAt:now()};const list=store.get(taskId)||[];list.push(e);if(list.length>200)list.splice(0,list.length-200);store.set(taskId,list);return e}
export function getMemory(taskId:string,limit=50){return(store.get(taskId)||[]).slice(-Math.min(200,Math.max(1,limit)))}
export function summarizeMemory(taskId:string){const entries=getMemory(taskId,200);return{taskId,count:entries.length,observations:entries.filter(e=>e.kind==="observation").map(e=>e.content),decisions:entries.filter(e=>e.kind==="decision").map(e=>e.content),results:entries.filter(e=>e.kind==="result").map(e=>e.content),errors:entries.filter(e=>e.kind==="error").map(e=>e.content),artifacts:entries.filter(e=>e.kind==="artifact").map(e=>e.content)}}
export function clearMemory(taskId:string){store.delete(taskId);return{success:true,taskId}}
