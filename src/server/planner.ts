import { availableTools } from "./tools";
import { callModel } from "./ai";

export type Plan = { useTools: boolean; toolQuery?: string; objective: string };

export async function plan(message: string): Promise<Plan> {
  const lower = message.toLowerCase();
  const likelyTool = /\b(quanto|calcule|calcular|resultado|hora|horas|data|hoje|agora|pesquise|pesquisar|procure|busque|atual|notícia|noticias)\b/.test(lower);
  if (!process.env.AI_API_KEY) return { useTools: likelyTool, toolQuery: message, objective: message };
  const raw = await callModel(`Você é o planejador interno da A.R.I.S. Decida se a solicitação exige uma ferramenta. Ferramentas disponíveis: ${JSON.stringify(availableTools())}. Responda SOMENTE JSON válido no formato {"useTools":boolean,"toolQuery":string,"objective":string}. Não invente ferramentas.`, [{ role: "user", content: message }]);
  try { const p = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, "")); return { useTools: Boolean(p.useTools), toolQuery: String(p.toolQuery || message), objective: String(p.objective || message) }; } catch { return { useTools: likelyTool, toolQuery: message, objective: message }; }
}
