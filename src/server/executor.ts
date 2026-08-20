import { runTools, ToolResult } from "./tools";

export type Step = { action: "tool" | "reason"; query: string };
export type Execution = { steps: Step[]; results: ToolResult[] };

export async function executePlan(steps: Step[], sessionId: string): Promise<Execution> {
  const results: ToolResult[] = [];
  const safe = steps.slice(0, 5);
  for (const step of safe) {
    if (step.action !== "tool") continue;
    const result = await runTools(step.query, { sessionId });
    if (result) results.push(result);
  }
  return { steps: safe, results };
}
