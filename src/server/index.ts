import "dotenv/config";
import express from "express";
import cors from "cors";
import { ask } from "./ai";
import { remember, recall, clearMemory } from "./memory";
import { runTools, availableTools } from "./tools";
import { saveDocument, listDocuments, clearDocuments } from "./files";
import { authEnabled, register, login, authenticate, logout } from "./auth";

const app = express();
const hits = new Map<string, { count: number; reset: number }>();
const WINDOW = 60000;
const LIMIT = 30;
const clean = (s: unknown) => String(s || "default").slice(0, 100).replace(/[^a-zA-Z0-9_-]/g, "") || "default";
const bearer = (req: express.Request) => req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : undefined;

app.disable("x-powered-by");
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  if (req.path === "/api/health" || req.path === "/api/auth/register" || req.path === "/api/auth/login") return next();
  const key = req.ip || "unknown", now = Date.now(), h = hits.get(key);
  if (!h || now > h.reset) { hits.set(key, { count: 1, reset: now + WINDOW }); return next(); }
  if (h.count >= LIMIT) return res.status(429).json({ error: "Limite temporário de requisições atingido. Tente novamente em instantes." });
  h.count++; next();
});

async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!authEnabled()) return next();
  const user = await authenticate(bearer(req));
  if (!user) return res.status(401).json({ error: "Autenticação necessária." });
  (req as any).user = user;
  next();
}

app.get("/api/health", (_, r) => r.json({ ok: true, name: "A.R.I.S.", version: "2.4.0", authEnabled: authEnabled(), capabilities: ["chat", "web", "calculator", "clock", "persistent-memory", "documents", "orchestration", "rate-limit", "authentication"], tools: availableTools() }));

app.post("/api/auth/register", async (req, res) => { try { const { email, password } = req.body; res.status(201).json(await register(String(email || ""), String(password || ""))); } catch (e) { res.status(400).json({ error: e instanceof Error ? e.message : "Não foi possível cadastrar." }); } });
app.post("/api/auth/login", async (req, res) => { try { const { email, password } = req.body; res.json(await login(String(email || ""), String(password || ""))); } catch (e) { res.status(401).json({ error: e instanceof Error ? e.message : "Credenciais inválidas." }); } });
app.post("/api/auth/logout", async (req, res) => { await logout(bearer(req)); res.json({ ok: true }); });
app.get("/api/auth/me", async (req, res) => { const user = await authenticate(bearer(req)); if (!user) return res.status(401).json({ error: "Não autenticado." }); res.json({ user }); });

app.get("/api/memory/:sessionId", requireAuth, async (req, res) => res.json({ memory: (await recall(clean(req.params.sessionId))).map(x => x.content) }));
app.delete("/api/memory/:sessionId", requireAuth, async (req, res) => { const id = clean(req.params.sessionId); await clearMemory(id); await clearDocuments(id); res.json({ ok: true }); });
app.get("/api/documents/:sessionId", requireAuth, async (req, res) => res.json({ documents: await listDocuments(clean(req.params.sessionId)) }));
app.post("/api/documents/:sessionId", requireAuth, async (req, res) => { const { name, content } = req.body; if (typeof content !== "string" || !content.trim()) return res.status(400).json({ error: "content é obrigatório" }); if (content.length > 40000) return res.status(413).json({ error: "Documento excede 40.000 caracteres" }); await saveDocument(clean(req.params.sessionId), typeof name === "string" ? name : "document.txt", content); res.json({ ok: true }); });
app.post("/api/chat", requireAuth, async (req, res) => { try { const { message, history = [], web = true, sessionId = "default" } = req.body; if (typeof message !== "string" || !message.trim()) return res.status(400).json({ error: "message é obrigatório" }); const id = clean(sessionId), tool = web ? await runTools(message) : null, sources = tool?.tool === "web_search" ? tool.sources || [] : [], answer = await ask(message, Array.isArray(history) ? history : [], sources, id, tool); await remember(id, "Usuário: " + message); await remember(id, "A.R.I.S.: " + answer); res.json({ answer, sources, tool: tool?.tool || null, sessionId: id }); } catch (e) { res.status(500).json({ error: e instanceof Error ? e.message : "erro interno" }); } });

app.listen(Number(process.env.PORT || 8787), () => console.log("A.R.I.S. online"));
