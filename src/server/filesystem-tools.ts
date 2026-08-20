import { registerTool } from "./tool-engine";
import { analyzeDirectory,findFiles,planOrganization,applyOrganization } from "./filesystem-agent";

registerTool({name:"filesystem_analyze",description:"Analisa uma pasta local, resume tipos, tamanhos e estrutura sem alterar arquivos.",timeoutMs:20000,risk:"low",run:async query=>({tool:"filesystem_analyze",...(await analyzeDirectory(query))})});
registerTool({name:"filesystem_find",description:"Localiza arquivos em uma árvore de diretórios pelo nome ou extensão.",timeoutMs:20000,risk:"low",run:async query=>({tool:"filesystem_find",...(await findFiles(query))})});
registerTool({name:"filesystem_organize_preview",description:"Cria um plano de organização de uma pasta por categorias sem modificar arquivos.",timeoutMs:30000,risk:"low",run:async query=>({tool:"filesystem_organize_preview",...(await planOrganization(query))})});
registerTool({name:"filesystem_organize_apply",description:"Aplica um plano de organização local movendo arquivos para categorias. Requer autorização.",timeoutMs:120000,risk:"high",requiresConfirmation:true,run:async query=>({tool:"filesystem_organize_apply",...(await applyOrganization(query))})});
