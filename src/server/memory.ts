type Memory={id:string;content:string;createdAt:number};
const store=new Map<string,Memory[]>();
const MAX=30;
export function remember(sessionId:string,content:string){if(!content?.trim())return;const list=store.get(sessionId)||[];list.push({id:crypto.randomUUID(),content:content.trim(),createdAt:Date.now()});store.set(sessionId,list.slice(-MAX))}
export function recall(sessionId:string){return(store.get(sessionId)||[]).slice(-MAX)}
export function clearMemory(sessionId:string){store.delete(sessionId)}
export function memoryContext(sessionId:string){const list=recall(sessionId);return list.length?"\n\nMEMÓRIA DA SESSÃO:\n"+list.map(x=>"- "+x.content).join("\n"):""}
