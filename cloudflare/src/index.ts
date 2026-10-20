/**
 * A.R.I.S. Cloudflare Worker — isolated proof of concept.
 * Does not import Node/Express code or expose local execution tools.
 * Required secret: ARIS_ACCESS_TOKEN. Optional: AI_API_KEY, AI_MODEL, AI_BASE_URL.
 */
export interface Env { ARIS_ACCESS_TOKEN: string; AI_API_KEY?: string; AI_MODEL?: string; AI_BASE_URL?: string; }
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
export default {
 async fetch(req:Request,env:Env):Promise<Response>{
  const url=new URL(req.url);
  if(url.pathname==="/api/health"&&req.method==="GET")return json({ok:true,name:"A.R.I.S.",runtime:"cloudflare-worker",capabilities:["health","chat-basic"]});
  if(!env.ARIS_ACCESS_TOKEN)return json({error:"Servidor sem configuração de autenticação"},503);
  const auth=req.headers.get("authorization")||"";
  if(auth!==`Bearer ${env.ARIS_ACCESS_TOKEN}`)return json({error:"Não autorizado"},401);
  if(url.pathname!=="/api/chat"||req.method!=="POST")return json({error:"Rota não disponível neste protótipo"},404);
  if(!env.AI_API_KEY)return json({error:"Provedor de IA não configurado"},503);
  const raw=await req.text();
  if(raw.length>16000)return json({error:"Mensagem muito grande"},413);
  let body:{message?:unknown;history?:unknown};
  try{body=JSON.parse(raw)}catch{return json({error:"JSON inválido"},400)}
  if(typeof body.message!=="string"||!body.message.trim()||body.message.length>6000)return json({error:"Mensagem inválida"},400);
  const history=Array.isArray(body.history)?body.history.slice(-12).filter((m:unknown)=>!!m&&typeof m==="object"&&["user","assistant"].includes((m as {role?:string}).role||"")&&typeof (m as {content?:unknown}).content==="string").map((m:{role:string;content:string})=>({role:m.role,content:m.content.slice(0,6000)})):[];
  const base=(env.AI_BASE_URL||"https://api.openai.com/v1").replace(/\/$/,"");
  try{
   const upstream=await fetch(base+"/chat/completions",{method:"POST",headers:{"authorization":"Bearer "+env.AI_API_KEY,"content-type":"application/json"},body:JSON.stringify({model:env.AI_MODEL||"gpt-4o-mini",messages:[{role:"system",content:"Você é A.R.I.S., assistente pessoal. Responda em português brasileiro."},...history,{role:"user",content:body.message}] }),signal:AbortSignal.timeout(20000)});
   if(!upstream.ok)return json({error:"Provedor de IA indisponível",status:upstream.status},502);
   const data=await upstream.json() as {choices?:Array<{message?:{content?:string}}>};
   return json({answer:data.choices?.[0]?.message?.content||"Sem resposta."});
  }catch{return json({error:"Falha ao consultar o provedor"},502)}
 }
} satisfies ExportedHandler<Env>;
