import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);
const file = path.resolve(process.cwd(), "data", "auth.json");
type User = { id: string; email: string; password: string; createdAt: number };
type Session = { userId: string; expiresAt: number };
type Store = { users: User[]; sessions: Record<string, Session> };
let store: Store = { users: [], sessions: {} };
let loaded = false;

async function load() {
  if (loaded) return;
  loaded = true;
  try { store = JSON.parse(await fs.readFile(file, "utf8")); } catch { store = { users: [], sessions: {} }; }
}
async function persist() {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(store), "utf8");
}
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}
async function verifyPassword(password: string, stored: string) {
  const [salt, hex] = stored.split(":");
  if (!salt || !hex) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hex, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
function cleanEmail(email: string) { return email.trim().toLowerCase().slice(0, 254); }

export async function register(email: string, password: string) {
  await load();
  const normalized = cleanEmail(email);
  if (!/^\S+@\S+\.\S+$/.test(normalized)) throw new Error("E-mail inválido.");
  if (password.length < 10) throw new Error("A senha deve ter pelo menos 10 caracteres.");
  if (store.users.some(u => u.email === normalized)) throw new Error("E-mail já cadastrado.");
  const user: User = { id: randomBytes(16).toString("hex"), email: normalized, password: await hashPassword(password), createdAt: Date.now() };
  store.users.push(user); await persist();
  return { id: user.id, email: user.email };
}

export async function login(email: string, password: string) {
  await load();
  const user = store.users.find(u => u.email === cleanEmail(email));
  if (!user || !(await verifyPassword(password, user.password))) throw new Error("Credenciais inválidas.");
  const token = randomBytes(32).toString("hex");
  store.sessions[token] = { userId: user.id, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  await persist();
  return { token, user: { id: user.id, email: user.email } };
}

export async function authenticate(token?: string) {
  if (!token) return null;
  await load();
  const session = store.sessions[token];
  if (!session) return null;
  if (session.expiresAt <= Date.now()) { delete store.sessions[token]; await persist(); return null; }
  const user = store.users.find(u => u.id === session.userId);
  return user ? { id: user.id, email: user.email } : null;
}

export async function logout(token?: string) {
  if (!token) return;
  await load(); delete store.sessions[token]; await persist();
}

export function authEnabled() { return process.env.AUTH_ENABLED === "true"; }
