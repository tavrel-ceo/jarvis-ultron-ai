import { registerTool } from "./tool-engine";
import { createIssue,inspectPullRequest,inspectRepository,inspectRemoteFile } from "./github-capabilities";
const parse=(q:string)=>{try{return JSON.parse(q)}catch{return{}}};
registerTool({name:"github_inspect_repository",description:"Inspeciona metadados, branches, issues e pull requests de um repositório.",timeoutMs:30000,risk:"low",run:async q=>{const x=parse(q);return{tool:"github_inspect_repository",...(await inspectRepository(x.owner,x.repo))}}});
registerTool({name:"github_create_issue",description:"Cria uma issue no GitHub. Requer confirmação.",timeoutMs:30000,risk:"medium",requiresConfirmation:true,run:async q=>{const x=parse(q);return{tool:"github_create_issue",...(await createIssue(x.owner,x.repo,x.title,x.body))}}});
registerTool({name:"github_inspect_pr",description:"Inspeciona um Pull Request e prepara análise técnica das alterações.",timeoutMs:60000,risk:"low",run:async q=>{const x=parse(q);return{tool:"github_inspect_pr",...(await inspectPullRequest(x.owner,x.repo,Number(x.number)))}}});
registerTool({name:"github_read_file",description:"Lê arquivo remoto de um repositório GitHub.",timeoutMs:30000,risk:"low",run:async q=>{const x=parse(q);return{tool:"github_read_file",...(await inspectRemoteFile(x.owner,x.repo,x.file,x.ref||"main"))}}});
