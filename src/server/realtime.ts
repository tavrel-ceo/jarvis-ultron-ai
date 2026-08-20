import type { Response } from "express";
const clients=new Map<string,Set<Response>>();
export function subscribe(sessionId:string,res:Response){let set=clients.get(sessionId);if(!set){set=new Set();clients.set(sessionId,set)}set.add(res);res.on("close",()=>{set!.delete(res);if(!set!.size)clients.delete(sessionId)})}
export function publishRealtime(sessionId:string,event:unknown){const set=clients.get(sessionId);if(!set)return;const payload=`data: ${JSON.stringify(event)}\n\n`;for(const res of set){try{res.write(payload)}catch{set.delete(res)}}}
export function realtimeStats(){let connections=0;for(const set of clients.values())connections+=set.size;return{sessions:clients.size,connections}}
