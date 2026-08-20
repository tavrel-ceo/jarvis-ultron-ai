import { registerTool } from "./tool-engine";
import { planTask,planAndRunTask } from "./task-planner";
const parse=(q:string)=>{try{return JSON.parse(q)}catch{return{goal:q}}};
registerTool({name:"aris_plan_task",description:"Converte uma instrução em linguagem natural em um plano validado contra as capacidades disponíveis. Não executa.",timeoutMs:90000,risk:"low",run:async q=>{const x=parse(q);return{tool:"aris_plan_task",...(await planTask(x.goal||"",x.context||{}))}}});
registerTool({name:"aris_plan_and_run",description:"Planeja e executa uma tarefa multiagente usando somente capacidades permitidas; ações modificadoras exigem confirmação.",timeoutMs:300000,risk:"critical",requiresConfirmation:true,run:async q=>{const x=parse(q);return{tool:"aris_plan_and_run",...(await planAndRunTask(x.goal||"",x.context||{},async()=>true))}}});
