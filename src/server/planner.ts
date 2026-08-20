import { availableTools } from "./tools";
import { callModel } from "./ai";
import type { Step } from "./executor";

export type Plan = { useTools: boolean; toolQuery?: string; objective: string; steps: Step[] };
const fallback=(message:string):Plan=>{const lower=message.toLowerCase();const likely=/\b(quanto|calcule|calcular|resultado|hora|horas|data|hoje|agora|pesquise|pesquisar|procure|busque|atual|notícia|noticias)\b/.test(lower);return {useTools:likely,toolQuery:message,objective:message,steps:likely?[{action:"tool",query:message}]:[]};};
export async function plan(message:string):Promise<Plan>{
 const base=fallback(message);if(!process.env.AI_API_KEY)return base;
 const raw=await callModel(`Você é o planejador interno da A.R.I.S. Transforme a solicitação em um plano curto e seguro. Ferramentas: ${JSON.stringify(availableTools())}. Use no máximo 5 etapas. Cada etapa deve ser {"action":"tool"|"reason","query":"..."}. Só use action=tool quando uma ferramenta disponível for realmente necessária. Responda SOMENTE JSON: {"useTools":boolean,"toolQuery":string,"objective":string,"steps":[...]}.
Solicitação: ${message}`,[{role:"user",content:message}]);
 try{const p=JSON.parse(raw.replace(/^```json\s*|\s*```$/g,""));const steps:Array<Step>=Array.isArray(p.steps)?p.steps.filter((s:any)=>s&&["tool","reason"].includes(s.action)&&typeof s.query==="string").slice(0,5):[];return {useTools:steps.some(s=>s.action==="tool"),toolQuery:String(p.toolQuery||message),objective:String(p.objective||message),steps};}catch{return base;}
}
