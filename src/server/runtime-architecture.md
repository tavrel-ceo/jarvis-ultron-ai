# A.R.I.S. Runtime Architecture

The production task path is unified through `tasks.ts` -> `executor.ts` -> `tool-engine.ts`.

- `tasks.ts` owns persistent task lifecycle, subtasks, progress and task memory.
- `executor.ts` owns adaptive plan execution and tool confirmation checkpoints.
- `tool-engine.ts` is the single tool execution gate.
- `tool-confirmation.ts` owns approval state and one-shot approved executions.
- `confirmation-api.ts` resolves approvals and resumes the associated task.
- `task-memory.ts` records task decisions, results and errors.

`task-orchestrator.ts` remains a compatibility layer for direct agent-style orchestration and is not the HTTP task runtime. New production task features must enter through `tasks.ts` so there is one authoritative execution path.
