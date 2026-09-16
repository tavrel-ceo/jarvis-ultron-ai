# A.R.I.S. v4 — Sincronização e Integração

Esta versão existe para transformar em código as decisões arquiteturais tomadas para a A.R.I.S. depois da v3.9, preservando as capacidades já implementadas.

## Princípios do núcleo Multi-IA

1. Todos os modelos habilitados participam das solicitações encaminhadas ao orquestrador.
2. Modelos pequenos não substituem modelos maiores apenas porque a pergunta é simples.
3. As chamadas são paralelas e possuem limite de tempo individual.
4. Uma falha ou lentidão de um modelo não deve bloquear os demais.
5. O orçamento de trabalho varia conforme a complexidade da solicitação.
6. Modelos podem exercer papéis diferentes: análise, crítica, verificação, alternativa e síntese.
7. A otimização ocorre no trabalho, orçamento e tempo de espera de cada modelo, não simplesmente removendo modelos da execução.
8. A configuração deve permitir priorizar provedores/modelos gratuitos sem acoplar o núcleo a um fornecedor específico.

## Fluxo alvo

Entrada → Contexto → Memória/Projeto → Orquestrador Multi-IA → Agregação → Planejamento → Ferramentas → Executor → Confirmação quando necessária → Verificação → Síntese → Memória → Resposta.

## Capacidades existentes que devem ser preservadas e integradas

- projetos e contexto de projeto;
- memória de sessão, memória inteligente e memória avançada;
- documentos;
- tarefas persistentes e execução em segundo plano;
- eventos em tempo real;
- planner/replanner;
- registro central de ferramentas;
- pesquisa web;
- filesystem e terminal;
- navegador;
- desenvolvimento e correção de projetos;
- GitHub;
- capacidades de computador/desktop existentes;
- broker de confirmação para operações de risco.

## Regra de segurança operacional

O orquestrador de modelos produz raciocínio e propostas. Ele não contorna o motor de ferramentas. Toda ação externa continua passando pelo registro de ferramentas, classificação de risco, executor e confirmação quando exigida.

## Olho de Deus

O conceito entra como uma camada futura de correlação de informações autorizadas. A implementação deve trabalhar apenas com fontes e integrações às quais a A.R.I.S. tenha acesso legítimo, mantendo proveniência, permissões e rastreabilidade. Não é uma justificativa para contornar autenticação, privacidade ou controles de acesso.

## Etapas da v4

### 4.0-alpha.1 — Fundação
- registro de múltiplos modelos;
- execução paralela;
- timeout individual;
- tolerância a falhas;
- papéis por modelo;
- orçamento adaptativo;
- compatibilidade com configuração de modelo único da v3.9.

### 4.0-alpha.2 — Agregação
- agregador de respostas;
- detecção de divergências;
- seleção de evidências;
- síntese final baseada no conjunto de modelos;
- telemetria de duração/falhas por modelo.

### 4.0-alpha.3 — Integração
- conectar Multi-IA ao chat principal;
- conectar planner/replanner;
- integrar memória e contexto sem duplicação;
- preservar confirmation broker e permissões das ferramentas.

### 4.0-beta — Confiabilidade
- testes unitários;
- testes de integração;
- testes do fluxo de confirmação;
- testes de falha/timeout de provedores;
- CI executando testes, typecheck e build;
- documentação atualizada.

## Critério para v4.0 estável

A v4 só deve ser considerada estável quando o fluxo completo puder ser demonstrado e testado: pergunta → múltiplos modelos → agregação → ferramentas quando necessárias → confirmação de ações de risco → síntese → persistência de contexto/memória.
