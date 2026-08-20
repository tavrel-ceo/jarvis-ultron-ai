import { registerTool } from "./tool-engine";
import { addMemory,getMemory,summarizeMemory,clearMemory,type MemoryKind } from "./task-memory";
const parse=(q:string)=>{try{return JSON.parse(q)}catch{return{}}};
registerTool({name:"aris_memory_add",description:"Registra observações, decisões, resultados, erros ou artefatos no contexto de uma tarefa.",timeoutMs:10000,risk:"low",run:async q=>{const x=parse(q);if(!x.taskId||!x.kind||!x.content)return{tool:"aris_memory_add",success:false,error:"MEMORY_INPUT_INVALID"};return{tool:"aris_memory_add",success:true,data:addMemory(x.taskId,x.kind as MemoryKind,x.content,x.source,x.metadata)}}});
registerTool({name:"aris_memory_get",description:"Recupera o contexto recente de uma tarefa.",timeoutMs:10000,risk:"low",run:async q=>{const x=parse(q);return{tool:"aris_memory_get",success:true,data:getMemory(x.taskId,Number(x.limit)||50)}}});
registerTool({name:"aris_memory_summary",description:"Resume o contexto acumulado de uma tarefa por categoria.",timeoutMs:10000,risk:"low",run:async q=>{const x=parse(q);return{tool:"aris_memory_summary",success:true,data:summarizeMemory(x.taskId)}}});
registerTool({name:"aris_memory_clear",description:"Limpa o contexto de uma tarefa específica.",timeoutMs:10000,risk:"medium",requiresConfirmation:true,run:async q=>{const x=parse(q);return{tool:"aris_memory_clear",...(clearMemory(x.taskId))}}});
