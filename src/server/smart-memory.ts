import { callModel } from "./ai";
import { remember, recall } from "./memory";

export type MemoryKind = "fact" | "preference" | "project" | "task" | "context";
export type SmartMemory = { id: string; kind: MemoryKind; content: string; confidence: number; createdAt: number };

const MAX_SMART = 100;
const smart = new Map<string, SmartMemory[]>();

function likelyImportant(text: string) {
  return /\b(meu|minha|meus|minhas|eu sou|eu tenho|eu prefiro|gosto|não gosto|quero|preciso|projeto|empresa|trabalho|lembre|lembrar|sempre|nunca)\b/i.test(text);
}

export async function extractSmartMemory(sessionId: string, userMessage: string) {
  if (!likelyImportant(userMessage) || !process.env.AI_API_KEY) return;
  try {
    const raw = await callModel(`Você é o módulo de memória da A.R.I.S. Extraia somente informações estáveis e úteis para conversas futuras. Ignore perguntas triviais, segredos, senhas e informações sensíveis. Responda SOMENTE JSON array com objetos {"kind":"fact|preference|project|task|context","content":"...","confidence":0..1}. Se nada for útil, [].`, [{ role: "user", content: userMessage }]);
    const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ""));
    if (!Array.isArray(parsed)) return;
    const list = smart.get(sessionId) || [];
    for (const item of parsed.slice(0, 5)) {
      if (!item?.content || !["fact","preference","project","task","context"].includes(item.kind)) continue;
      const content = String(item.content).trim().slice(0, 2000);
      const duplicate = list.some(x => x.content.toLowerCase() === content.toLowerCase());
      if (!duplicate) list.push({ id: crypto.randomUUID(), kind: item.kind, content, confidence: Math.max(0, Math.min(1, Number(item.confidence) || .5)), createdAt: Date.now() });
    }
    smart.set(sessionId, list.slice(-MAX_SMART));
    // Also keep the original transcript memory as an audit/context trail.
    await remember(sessionId, "Memória inteligente: " + list.slice(-5).map(x => `[${x.kind}] ${x.content}`).join(" | "));
  } catch { /* Memory extraction must never break the user's request. */ }
}

export function smartMemoryContext(sessionId: string) {
  const list = smart.get(sessionId) || [];
  return list.length ? "\n\nMEMÓRIA INTELIGENTE:\n" + list.map(x => `- [${x.kind}] ${x.content}`).join("\n") : "";
}

export async function smartRecall(sessionId: string, query: string) {
  const list = smart.get(sessionId) || [];
  const terms = query.toLowerCase().split(/\W+/).filter(Boolean);
  return list.filter(x => terms.some(t => x.content.toLowerCase().includes(t))).slice(-20);
}

export async function loadSmartMemory() { return smart.size; }
