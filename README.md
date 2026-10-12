# A.R.I.S. — Advanced Intelligence & Operations

A.R.I.S. é uma assistente pessoal e centro de operações construído com React/Vite + Express/TypeScript. A arquitetura atual combina uma personalidade única, pesquisa web, calculadora, memória por sessão, orquestração com análise/revisão interna e controles básicos de segurança.

## Capacidades atuais
- Chat contextual com histórico.
- Pesquisa web via Brave Search.
- Calculadora integrada para expressões matemáticas.
- Memória de sessão no backend.
- Orquestração interna: análise → revisão → resposta final.
- Rate limiting e limite de payload.
- Endpoint de saúde e endpoints de memória.

## Configuração
1. `npm install`
2. Copie `.env.example` para `.env`.
3. Configure `AI_API_KEY`.
4. Configure `BRAVE_SEARCH_API_KEY` para pesquisa web.
5. `npm run dev`

## Variáveis
- `AI_API_KEY` — chave do provedor compatível com OpenAI Chat Completions.
- `AI_BASE_URL` — endpoint base do provedor.
- `AI_MODEL` — modelo utilizado.
- `AI_TEMPERATURE` — temperatura da geração.
- `BRAVE_SEARCH_API_KEY` — chave de pesquisa web.
- `CORS_ORIGIN` — origem permitida; por padrão o CORS reflete a origem da requisição.
- `PORT` — porta da API, padrão `8787`.

## Próximas expansões
Persistência externa de memória, autenticação, upload e análise de arquivos, sistema de ferramentas extensível, conectores de APIs, observabilidade e implantação de produção.

## Proteção de acesso (etapa mobile)
Em `NODE_ENV=production`, a API **não inicia** sem `ARIS_ACCESS_TOKEN`. Defina um token aleatório longo apenas no ambiente do servidor e informe-o em **Configurar acesso** na interface. O token fica na sessão do navegador; não inclua chaves de modelos no cliente. Em modo autenticado, notificações SSE estão temporariamente indisponíveis (sem enviar tokens pela URL). Este é um bloqueio inicial para uso privado, **não** substitui autenticação individual, isolamento de sessões, TLS e auditoria antes de oferecer o serviço a múltiplos usuários.
