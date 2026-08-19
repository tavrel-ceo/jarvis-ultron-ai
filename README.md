# JARVIS × ULTRON AI

Aplicação consolidada do conceito desenvolvido nas versões anteriores: chat com duas personas de IA, comparação lado a lado, consenso, histórico local, contexto de sessão e pesquisa web opcional.

## Arquitetura
- React + Vite no frontend.
- Express/TypeScript no backend.
- Provedor de IA compatível com OpenAI Chat Completions.
- Pesquisa web via Brave Search quando `BRAVE_SEARCH_API_KEY` existe; fallback para Wikipedia.
- Segredos somente em `.env`.

## Rodar
```bash
npm install
cp .env.example .env
# configure AI_API_KEY
npm run dev
```
Frontend: http://localhost:5173 — API: http://localhost:8787.

## Próximas extensões
Memória persistente, autenticação, banco de dados, ferramentas/ações, RAG sobre documentos, streaming de tokens, voz e deploy.

## Segurança
Nunca coloque chaves reais no Git. O `.env` está no `.gitignore`.
