import { webSearch } from "./search";

type ToolContext = { sessionId?: string };
type ToolResult = { tool: string; success: boolean; data?: unknown; error?: string };
type Tool = { name: string; description: string; run: (query: string, ctx: ToolContext) => Promise<ToolResult> };

function arithmetic(input: string) {
  const s = input.replace(/,/g, ".").replace(/[^0-9+\-*/().%\s]/g, "").trim();
  if (!s || !/^[0-9+\-*/().%\s]+$/.test(s)) return null;
  try {
    const tokens = s.match(/\d+(?:\.\d+)?|[()+\-*/%]/g) || [];
    if (tokens.join("") !== s.replace(/\s+/g, "")) return null;
    const values: number[] = [], ops: string[] = [];
    const prec = (o: string) => o === "+" || o === "-" ? 1 : o === "*" || o === "/" || o === "%" ? 2 : 0;
    const apply = () => {
      const o = ops.pop(), b = values.pop(), a = values.pop();
      if (!o || a === undefined || b === undefined) throw Error();
      if (o === "+") values.push(a + b); else if (o === "-") values.push(a - b); else if (o === "*") values.push(a * b);
      else if (o === "/") { if (b === 0) throw Error(); values.push(a / b); } else values.push(a % b);
    };
    let prev = "op";
    for (const t of tokens) {
      if (/^\d/.test(t)) { values.push(Number(t)); prev = "num"; }
      else if (t === "(") { ops.push(t); prev = "op"; }
      else if (t === ")") { while (ops.at(-1) !== "(" && ops.length) apply(); if (ops.pop() !== "(") throw Error(); prev = "num"; }
      else { if (t === "-" && prev === "op") values.push(0); while (ops.length && ops.at(-1) !== "(" && prec(ops.at(-1)!) >= prec(t)) apply(); ops.push(t); prev = "op"; }
    }
    while (ops.length) apply();
    return values.length === 1 && Number.isFinite(values[0]) ? values[0] : null;
  } catch { return null; }
}

const tools: Tool[] = [
  { name: "calculator", description: "Resolve expressões matemáticas com segurança.", run: async query => { const result = arithmetic(query); return result === null ? { tool: "calculator", success: false, error: "Não foi possível interpretar a expressão." } : { tool: "calculator", success: true, data: { result } }; } },
  { name: "clock", description: "Consulta data e hora atuais no fuso configurado.", run: async () => { const now = new Date(); return { tool: "clock", success: true, data: { iso: now.toISOString(), local: new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeStyle: "long", timeZone: process.env.TZ || "America/Sao_Paulo" }).format(now) } }; } },
  { name: "web_search", description: "Pesquisa informações atuais na web.", run: async query => ({ tool: "web_search", success: true, data: { sources: await webSearch(query) } }) },
];

export function availableTools() { return tools.map(t => ({ name: t.name, description: t.description })); }

function looksLikeMath(query: string) { return /^[\s\d()+\-*/%.,]+$/.test(query.trim()); }
function asksTime(query: string) { return /\b(horas?|hora|data|dia|agora|hoje|today|time)\b/i.test(query); }

export async function runTools(query: string, ctx: ToolContext = {}): Promise<ToolResult | null> {
  if (looksLikeMath(query)) return tools[0].run(query, ctx);
  if (asksTime(query)) return tools[1].run(query, ctx);
  if (process.env.BRAVE_SEARCH_API_KEY) return tools[2].run(query, ctx);
  return null;
}
