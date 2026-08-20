import { getConfirmation,resolveConfirmation,listPendingConfirmations } from "./confirmation-broker";
export function confirmationApi(){return{pending:(taskId?:string)=>listPendingConfirmations(taskId),status:(id:string)=>getConfirmation(id),resolve:(id:string,approved:boolean)=>resolveConfirmation(id,approved)}}
