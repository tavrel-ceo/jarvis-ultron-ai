export type ConfirmationStatus="pending"|"approved"|"rejected"|"expired";
export type ConfirmationRequest={id:string;taskId:string;stepId:string;action:string;reason:string;status:ConfirmationStatus;createdAt:number;expiresAt:number};
const requests=new Map<string,ConfirmationRequest>();
const makeId=()=>`confirm-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
export function requestConfirmation(taskId:string,stepId:string,action:string,reason="Ação modificadora requer aprovação",ttlMs=120000){const now=Date.now();const r={id:makeId(),taskId,stepId,action,reason,status:"pending" as ConfirmationStatus,createdAt:now,expiresAt:now+Math.min(600000,Math.max(5000,ttlMs))};requests.set(r.id,r);return r}
export function getConfirmation(id:string){const r=requests.get(id);if(!r)return null;if(r.status==="pending"&&Date.now()>r.expiresAt){r.status="expired";requests.set(id,r)}return r}
export function resolveConfirmation(id:string,approved:boolean){const r=getConfirmation(id);if(!r||r.status!=="pending")return{success:false,error:"CONFIRMATION_NOT_PENDING"};r.status=approved?"approved":"rejected";requests.set(id,r);return{success:true,data:r}}
export function consumeConfirmation(id:string){const r=getConfirmation(id);if(!r||r.status!=="approved")return{success:false,error:"CONFIRMATION_NOT_APPROVED"};requests.delete(id);return{success:true,data:r}}
export function listPendingConfirmations(taskId?:string){return[...requests.values()].filter(r=>r.status==="pending"&&(!taskId||r.taskId===taskId))}
