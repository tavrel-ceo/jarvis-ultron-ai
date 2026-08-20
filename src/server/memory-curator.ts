import { saveAdvancedMemory, type MemoryKind } from "./advanced-memory";
export type CuratedMemory={kind:MemoryKind;content:string;importance:number;tags:string[];reason:string};
const rules:Array<{kind:MemoryKind;importance:number;patterns:RegExp[];reason:string}>= [
 {kind:"preference",importance:.8,patterns:[/\b(prefiro|gosto de|não gosto de|nao gosto de|quero que|quero sempre|prefere)\b/i],reason:"preferência explícita do usuário"},
 {kind:"goal",importance:.85,patterns:[/\b(meu objetivo|objetivo é|objetivo e|quero criar|quero construir|preciso criar|preciso conseguir)\b/i],reason:"objetivo explícito"},
 {kind:"decision",importance:.9,patterns:[/\b(decidimos|decidido|vamos usar|fica definido|definimos|a partir de agora|deve usar)\b/i],reason:"decisão ou regra explícita"},
 {kind:"instruction",importance:.9,patterns:[/\b(sempre|nunca|não faça|nao faça|faça assim|use sempre|não use|nao use)\b/i],reason:"instrução persistente"},
 {kind:"project",importance:.75,patterns:[/\b(o projeto|no projeto|nossa aplicação|nosso app|nosso sistema|backend|frontend|arquitetura)\b/i],reason:"informação sobre o projeto"},
 {kind:"fact",importance:.7,patterns:[/\b(meu nome é|tenho \d+ anos|trabalho como|moro em|uso |estou usando )\b/i],reason:"fato potencialmente reutilizável"}
];
function clean(s:string){return s.replace(/\s+/g," ").trim().replace(/^[-•]+\s*/,"")}
export function curateMemories(message:string):CuratedMemory[]{const text=clean(message);if(text.length<12||text.length>500)return[];const matched=rules.filter(r=>r.patterns.some(p=>p.test(text)));if(!matched.length)return[];return matched.slice(0,2).map(r=>({kind:r.kind,content:text,importance:r.importance,tags:[r.kind,"auto-curated"],reason:r.reason}))}
export async function curateAndSaveMemories(sessionId:string,message:string,projectId?:string){const candidates=curateMemories(message);const saved=[];for(const c of candidates)saved.push(await saveAdvancedMemory(sessionId,{kind:c.kind,content:c.content,importance:c.importance,source:"user",projectId,tags:c.tags}));return{candidates,savedCount:saved.length,saved}}
