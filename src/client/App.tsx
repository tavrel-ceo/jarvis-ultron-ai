import { useEffect, useRef, useState } from "react";

type M = { role: "user" | "assistant"; content: string };
type Task = { id: string; objective: string; status: string; progress: number; waitingFor?: string };
type EventItem = { id: string; type: string; taskId: string; message: string; createdAt: number; read: boolean; data?: any };
type Confirmation = { id: string; sessionId: string; tool: string; query: string; risk: string; message: string; status: string; createdAt: number; expiresAt: number };
type ViewMode = "overview" | "architecture" | "activity" | "lab";

const newId = () => crypto.randomUUID();
const getSession = () => localStorage.getItem("aris-session") || (() => { const id = newId(); localStorage.setItem("aris-session", id); return id; })();
const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const apiFetch = (url: string, init: RequestInit = {}) => {
  const token = sessionStorage.getItem("aris-access-token");
  return fetch(url, { ...init, headers: { ...init.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
};

function Hologram({ mode, taskCount, eventCount }: { mode: ViewMode; taskCount: number; eventCount: number }) {
  const nodes = mode === "architecture"
    ? [{x:150,y:46,label:"API",color:"#62d8ff"},{x:66,y:104,label:"IA",color:"#c084fc"},{x:234,y:104,label:"MEMÓRIA",color:"#f472e8"},{x:88,y:166,label:"FERRAMENTAS",color:"#5eead4"},{x:212,y:166,label:"TAREFAS",color:"#a78bfa"}]
    : [{x:150,y:45,label:"NÚCLEO",color:"#c084fc"},{x:65,y:108,label:"CONTEXTO",color:"#62d8ff"},{x:235,y:108,label:"SISTEMAS",color:"#f472e8"},{x:92,y:170,label:"PROJETOS",color:"#5eead4"},{x:208,y:170,label:"OPERAÇÕES",color:"#a78bfa"}];
  return <svg className="hologram-svg" viewBox="0 0 300 220" role="img" aria-label="Projeção holográfica dos sistemas A.R.I.S.">
    <defs><radialGradient id="holoGlow"><stop offset="0%" stopColor="#9b5cff" stopOpacity=".25"/><stop offset="100%" stopColor="#9b5cff" stopOpacity="0"/></radialGradient></defs>
    <circle cx="150" cy="108" r="100" fill="url(#holoGlow)"/>
    {[88,70,53,34].map((r,i)=><circle key={r} cx="150" cy="108" r={r} fill="none" stroke={i%2?"#5d8fff":"#bd5bff"} strokeWidth={i===2?1.4:.8} strokeOpacity={.7-i*.1} strokeDasharray={i===0?"3 8":i===2?"2 5":"none"} className={i===0?"orbit orbit-slow":i===1?"orbit":"orbit orbit-fast"}/>)}
    {nodes.map((n,i)=><g key={n.label}><path d={`M150 108 L${n.x} ${n.y}`} stroke={n.color} strokeOpacity=".55" strokeWidth="1" strokeDasharray="3 4"/><circle cx={n.x} cy={n.y} r="12" fill="#100d20" stroke={n.color} strokeWidth="1.2"/><circle cx={n.x} cy={n.y} r="3" fill={n.color}/><text x={n.x} y={n.y+24} textAnchor="middle" fill="#c9c3df" fontSize="7.5" letterSpacing=".6">{n.label}</text></g>)}
    <ellipse cx="150" cy="108" rx="24" ry="9" fill="none" stroke="#e879f9" strokeWidth="1.2" strokeOpacity=".9" transform="rotate(-35 150 108)"/><ellipse cx="150" cy="108" rx="15" ry="42" fill="none" stroke="#62d8ff" strokeWidth="1" strokeOpacity=".8" transform="rotate(38 150 108)"/><circle cx="150" cy="108" r="8" fill="#b66aff" fillOpacity=".18" stroke="#e879f9" strokeWidth="1" className="core-pulse"/><circle cx="150" cy="108" r="2" fill="#d9f8ff"/>
    <text x="150" y="211" textAnchor="middle" fill="#9b8dbb" fontSize="7.5" letterSpacing="1.5">{mode === "architecture" ? "MAPA DE ARQUITETURA" : mode === "activity" ? `${taskCount} TAREFAS • ${eventCount} EVENTOS` : "PROJEÇÃO DO CENTRO DE OPERAÇÕES"}</text>
  </svg>;
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [sessionId, setSessionId] = useState(getSession);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [taskInput, setTaskInput] = useState("");
  const [respondingTask, setRespondingTask] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<M[]>([{ role: "assistant", content: "Boa noite. Sistemas operacionais. Estou pronta para analisar o próximo objetivo." }]);
  const [docs, setDocs] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [confirmBusy, setConfirmBusy] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("overview");
  const [labRotation, setLabRotation] = useState({ x: -18, y: 28 });
  const [labScale, setLabScale] = useState(100);
  const [labObjects, setLabObjects] = useState([{ id: 1, name: "Objeto holográfico", shape: "cube" }]);
  const [activeLabObject, setActiveLabObject] = useState(1);
  const [showChat, setShowChat] = useState(true);
  const [apiState, setApiState] = useState<"checking" | "online" | "offline">("checking");
  const file = useRef<HTMLInputElement>(null);

  async function refresh(id = sessionId) {
    try {
      const [t,e,d,c] = await Promise.all([apiFetch(`${API}/api/tasks/${id}`), apiFetch(`${API}/api/events/${id}`), apiFetch(`${API}/api/documents/${id}`), apiFetch(`${API}/api/confirmations/${id}`)]);
      const [tj,ej,dj,cj] = await Promise.all([t.json(),e.json(),d.json(),c.json()]);
      setTasks(tj.tasks || []); setEvents(ej.events || []); setDocs((dj.documents || []).map((x: any) => x.name || "documento"));
      setConfirmations((cj.confirmations || []).filter((x: Confirmation) => x.status === "pending" && x.expiresAt > Date.now()));
      setApiState("online");
    } catch { setApiState("offline"); }
  }

  useEffect(() => {
    refresh();
    const token = sessionStorage.getItem("aris-access-token");
    const stream = token || !API ? null : new EventSource(`${API}/api/events/stream/${sessionId}`);
    if (!stream) return;
    stream.onmessage = e => {
      try {
        const event = JSON.parse(e.data) as EventItem;
        setEvents(prev => [event, ...prev.filter(x => x.id !== event.id)].slice(0,50));
        if (event.type === "tool.confirmation_required" || event.type === "confirmation.required") {
          const c = event.data?.confirmation;
          if (c) setConfirmations(prev => prev.some(x => x.id === c.id) ? prev : [c, ...prev]);
          setMsgs(m => [...m, { role: "assistant", content: event.message || c?.message || "Preciso da sua autorização para continuar esta operação." }]);
        }
        if (event.type === "task.waiting_input" && event.taskId) { setMsgs(m => [...m, { role: "assistant", content: `Preciso de uma informação para prosseguir. ${event.message}` }]); setRespondingTask(event.taskId); }
        if (event.type === "task.completed") setMsgs(m => [...m, { role: "assistant", content: `Operação concluída. ${event.message}` }]);
        if (event.type === "task.failed") setMsgs(m => [...m, { role: "assistant", content: `A operação encontrou um obstáculo. ${event.message}` }]);
        refresh();
      } catch {}
    };
    stream.onerror = () => {};
    return () => stream.close();
  }, [sessionId]);

  async function newSession() {
    const id = newId(); localStorage.setItem("aris-session", id); setSessionId(id);
    setMsgs([{ role: "assistant", content: "Nova sessão iniciada. Contexto isolado. Podemos prosseguir." }]);
    setDocs([]); setTasks([]); setEvents([]); setConfirmations([]); setRespondingTask(null); setMenuOpen(false);
  }
  async function send() {
    if (!text.trim() || busy) return;
    const q = text.trim(); setText(""); const history = msgs;
    setMsgs(m => [...m, { role: "user", content: q }]); setBusy(true);
    try {
      const r = await apiFetch(`${API}/api/chat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message:q, history, web:true, sessionId }) });
      const j = await r.json();
      setMsgs(m => [...m, { role: "assistant", content: j.answer || j.error || "Não foi possível obter uma resposta." }]); refresh();
    } catch { setMsgs(m => [...m, { role: "assistant", content: "Não consegui alcançar a API. Verifique a conexão antes de tentar novamente." }]); }
    finally { setBusy(false); }
  }
  async function resolveConfirmation(id: string, approved: boolean) {
    if (confirmBusy) return; setConfirmBusy(id);
    try {
      const r = await apiFetch(`${API}/api/confirmations/${id}/resolve`, { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({approved,sessionId}) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || "Não foi possível resolver a autorização");
      setConfirmations(prev => prev.filter(x => x.id !== id));
      setMsgs(m => [...m, { role:"assistant", content: approved ? (j.result?.success ? `Autorização concedida. ${j.result.tool ? `A ferramenta ${j.result.tool} foi executada com sucesso.` : "A operação foi liberada."}` : `Autorização concedida, mas a execução não foi concluída: ${j.result?.error || "erro desconhecido"}.`) : "Entendido. A operação foi recusada e não será executada." }]); refresh();
    } catch(e) { setMsgs(m => [...m, {role:"assistant",content:e instanceof Error ? e.message : "Não foi possível processar sua decisão."}]); }
    finally { setConfirmBusy(null); }
  }
  async function answerTask() {
    if (!respondingTask || !taskInput.trim()) return; const input = taskInput.trim(); setTaskInput("");
    setMsgs(m => [...m,{role:"user",content:input}]); setBusy(true);
    try {
      const r = await apiFetch(`${API}/api/task/${respondingTask}/input`, {method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({input,sessionId})});
      const j = await r.json(); if (!r.ok) throw new Error(j.error || "Não foi possível retomar a tarefa");
      setMsgs(m => [...m,{role:"assistant",content:"Informação recebida. A tarefa pode prosseguir."}]); setRespondingTask(null); refresh();
    } catch(e) { setMsgs(m => [...m,{role:"assistant",content:e instanceof Error ? e.message : "Não foi possível retomar a tarefa."}]); }
    finally { setBusy(false); }
  }
  async function clear() {
    if (!window.confirm("Apagar a memória e os documentos desta sessão?")) return;
    await apiFetch(`${API}/api/memory/${sessionId}`,{method:"DELETE"});
    setMsgs([{role:"assistant",content:"Memória e documentos desta sessão eliminados."}]); setDocs([]); setTasks([]); setEvents([]); setConfirmations([]); setRespondingTask(null);
  }
  async function upload() {
    const f = file.current?.files?.[0]; if (!f) return;
    const allowed = ["txt","md","csv","json","html"], ext = f.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowed.includes(ext)) { setMsgs(m => [...m,{role:"assistant",content:"Formato não suportado. Atualmente aceito TXT, MD, CSV, JSON e HTML."}]); return; }
    const content = await f.text();
    if (content.length > 40000) { setMsgs(m => [...m,{role:"assistant",content:"Esse documento excede o limite de 40.000 caracteres."}]); return; }
    const r = await apiFetch(`${API}/api/documents/${sessionId}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:f.name,content})});
    setMsgs(m => [...m,{role:"assistant",content:r.ok ? `Documento ${f.name} incorporado à sessão.` : "Não consegui incorporar o documento."}]);
    if (file.current) file.current.value = ""; refresh();
  }
  async function markRead() { await apiFetch(`${API}/api/events/${sessionId}/read`,{method:"POST"}); refresh(); }

  return <div className={`app ${collapsed ? "sidebar-collapsed" : ""}`}>
    <aside className={menuOpen ? "menu-open" : ""}>
      <div className="brand"><div className="brand-mark">A</div><div className="brand-name"><strong>A.R.I.S.</strong><small>INTELLIGENCE SYSTEM</small></div><button className="collapse-btn" onClick={() => setCollapsed(v => !v)} aria-label="Recolher menu">‹</button></div>
      <div className="side-section-label">NAVEGAÇÃO</div>
      <button className="nav-item active" onClick={() => {setView("overview");setMenuOpen(false)}}><span>⌘</span><b>Centro de operações</b></button>
      <button className="nav-item" onClick={() => {setShowChat(true);setMenuOpen(false)}}><span>⌁</span><b>Conversação</b></button>
      <button className="nav-item" onClick={() => {setView("architecture");setMenuOpen(false)}}><span>◇</span><b>Arquitetura</b></button>
      <button className="nav-item" onClick={() => {setView("activity");setMenuOpen(false)}}><span>◷</span><b>Atividade e tarefas</b></button>
      <button className="nav-item" onClick={() => {file.current?.click();setMenuOpen(false)}}><span>▧</span><b>Adicionar documento</b></button>
      <button className="nav-item" onClick={() => {markRead();setMenuOpen(false)}}><span>◉</span><b>Notificações <em>{events.filter(e=>!e.read).length || ""}</em></b></button>
      <div className="side-spacer"/>
      <div className="side-status"><span className={`status-dot ${apiState}`}/><div><b>{apiState === "online" ? "API conectada" : apiState === "checking" ? "Verificando sistema" : "API indisponível"}</b><small>A.R.I.S. • v3.9</small></div></div>
      <button className="nav-item settings" onClick={() => {const token=window.prompt("Token de acesso à API (não é a chave do provedor de IA):",sessionStorage.getItem("aris-access-token")||"");if(token!==null){if(token.trim())sessionStorage.setItem("aris-access-token",token.trim());else sessionStorage.removeItem("aris-access-token");refresh()}}}><span>⚙</span><b>Configurar acesso</b></button>
      <button className="nav-item" onClick={newSession}><span>＋</span><b>Nova sessão</b></button>
      <button className="nav-item danger" onClick={clear}><span>⌫</span><b>Limpar memória</b></button>
      <input ref={file} type="file" accept=".txt,.md,.csv,.json,.html" hidden onChange={upload}/>
    </aside>
    <main>
      <header className="topbar"><button className="mobile-menu" aria-label="Abrir menu" onClick={() => setMenuOpen(v=>!v)}>☰</button><div className="top-title"><small>ADVANCED INTELLIGENCE • OPERATIONAL ENVIRONMENT</small><h1>{view === "overview" ? "Centro de operações" : view === "architecture" ? "Projeção de arquitetura" : view === "activity" ? "Atividade do sistema" : "Laboratório holográfico 3D"}</h1></div><div className="top-meta"><span className={`connection ${apiState}`}>● {apiState === "online" ? "CONECTADA" : apiState === "checking" ? "VERIFICANDO" : "DESCONECTADA"}</span><span className="version-tag">V3.9.0</span></div></header>
      <div className="workspace">
        <section className="projection-panel">
          <div className="panel-head"><div><small>HOLOGRAPHIC INTERFACE / 01</small><h2>{view === "architecture" ? "Mapa de sistemas" : view === "activity" ? "Fluxo operacional" : view === "lab" ? "Laboratório de criação 3D" : "Projeção holográfica"}</h2></div><span className="live-tag"><i/> VISUALIZAÇÃO</span></div>
          <div className="projection-stage"><div className="stage-grid"/><div className="scanline"/>{view === "lab" ? <div className="lab-scene-wrap"><div className="lab-scene" style={{ transform: `rotateX(${labRotation.x}deg) rotateY(${labRotation.y}deg) scale(${labScale/100})` }}>{labObjects.map((o,i)=><button key={o.id} className={`lab-object ${o.shape} ${activeLabObject===o.id?"chosen":""}`} style={{left:`${50 + (i%3-1)*24}%`,top:`${50 + (Math.floor(i/3)%3-1)*20}%`, transform:`translate(-50%,-50%) rotateY(${i*22}deg)`}} onClick={()=>setActiveLabObject(o.id)} aria-label={`Selecionar ${o.name}`}><span/></button>)}</div><div className="lab-axis">X <i/> Y <i/> Z</div><div className="lab-scene-label">HOLOGRAPHIC MODEL SPACE • INTERACTIVE</div></div> : <Hologram mode={view} taskCount={tasks.length} eventCount={events.length}/>}<div className="stage-corner tl"/> <div className="stage-corner tr"/><div className="stage-corner bl"/><div className="stage-corner br"/><div className="stage-coord">ARIS / HOLO-01<br/>VISUALIZAÇÃO CONCEITUAL</div></div>
          <div className="view-switch" role="group" aria-label="Modo de visualização"><button className={view==="overview"?"selected":""} onClick={()=>setView("overview")}>Visão geral</button><button className={view==="architecture"?"selected":""} onClick={()=>setView("architecture")}>Arquitetura</button><button className={view==="activity"?"selected":""} onClick={()=>setView("activity")}>Atividade</button><button className={view==="lab"?"selected":""} onClick={()=>setView("lab")}>Laboratório 3D</button></div>
          <div className="projection-note"><span className="pulse-dot"/> <span>{view==="architecture"?"Representação conceitual dos componentes — não é um mapa de dependências verificado.":view==="activity"?"Eventos e tarefas são carregados da sessão quando a API responde.":view==="lab"?"Espaço 3D experimental: selecione objetos, ajuste rotação e escala ou adicione novas formas.":"Interface holográfica ativa. Selecione um modo para explorar o centro de operações."}</span></div>{view==="lab"&&<div className="lab-controls"><div className="lab-control-row"><label>Rotação X <input type="range" min="-75" max="75" value={labRotation.x} onChange={e=>setLabRotation(v=>({...v,x:Number(e.target.value)}))}/></label><label>Rotação Y <input type="range" min="-180" max="180" value={labRotation.y} onChange={e=>setLabRotation(v=>({...v,y:Number(e.target.value)}))}/></label><label>Escala <input type="range" min="55" max="145" value={labScale} onChange={e=>setLabScale(Number(e.target.value))}/></label></div><div className="lab-control-row actions"><button onClick={()=>setLabObjects(v=>[...v,{id:Date.now(),name:`Objeto ${v.length+1}`,shape:v.length%2?"orb":"cube"}])}>＋ Adicionar objeto</button><button onClick={()=>setLabRotation({x:-18,y:28})}>Recentrar visão</button><button onClick={()=>setLabObjects(v=>v.filter(o=>o.id!==activeLabObject))} disabled={labObjects.length<1}>Remover selecionado</button></div><div className="lab-object-list">{labObjects.map(o=><button key={o.id} className={activeLabObject===o.id?"selected":""} onClick={()=>setActiveLabObject(o.id)}>{o.shape==="cube"?"◇":"◉"} {o.name}</button>)}</div></div>
        </section>
        <section className="metrics-grid">
          <div className="metric-card"><div className="metric-icon violet">◇</div><small>SESSÃO ATUAL</small><strong>Ativa</strong><span>Contexto desta conversa</span></div>
          <div className="metric-card"><div className="metric-icon cyan">⌁</div><small>TAREFAS REGISTRADAS</small><strong>{tasks.length.toString().padStart(2,"0")}</strong><span>{tasks.filter(t=>/run|progress|active|pending/i.test(t.status)).length} em acompanhamento</span></div>
          <div className="metric-card"><div className="metric-icon pink">◉</div><small>DOCUMENTOS</small><strong>{docs.length.toString().padStart(2,"0")}</strong><span>Na sessão atual</span></div>
          <div className="metric-card"><div className="metric-icon mint">⌬</div><small>EVENTOS</small><strong>{events.length.toString().padStart(2,"0")}</strong><span>{events.filter(e=>!e.read).length} não lidos</span></div>
        </section>
        <section className="lower-grid">
          <div className="data-panel"><div className="panel-head"><div><small>EXECUTION MONITOR</small><h2>Tarefas em andamento</h2></div><span className="subtle-count">{tasks.length} REG.</span></div>{tasks.length===0?<div className="empty-state"><span>⌁</span><b>Nenhuma tarefa registrada</b><p>Quando houver tarefas nesta sessão, elas aparecerão aqui com o estado informado pela API.</p></div>:<div className="task-list">{tasks.slice(0,6).map(t=><div className="task-row" key={t.id}><div className="task-symbol">⌬</div><div className="task-copy"><b>{t.objective}</b><small>{t.status.toUpperCase()}{t.waitingFor? ` • ${t.waitingFor}`:""}</small><div className="progress-track"><span style={{width:`${Math.max(0,Math.min(100,t.progress))}%`}}/></div></div><strong>{t.progress}%</strong></div>)}</div>}</div>
          <div className="data-panel"><div className="panel-head"><div><small>SYSTEM LOG</small><h2>Atividade recente</h2></div><button className="text-button" onClick={markRead}>Marcar lidas</button></div>{events.length===0?<div className="empty-state compact"><span>◷</span><b>Sem novos eventos</b><p>As notificações da sessão aparecerão aqui.</p></div>:<div className="event-list">{events.slice(0,5).map(e=><div className="event-row" key={e.id}><span className={`event-marker ${e.read?"read":""}`}/><div><b>{e.message}</b><small>{new Date(e.createdAt).toLocaleString()}</small></div></div>)}</div>}</div>
        </section>
        {confirmations.length>0&&<section className="data-panel authorization-panel"><div className="panel-head"><div><small>REQUIRES OPERATOR APPROVAL</small><h2>Autorizações pendentes</h2></div><span className="warning-tag">{confirmations.length} PENDENTE(S)</span></div>{confirmations.map(c=><div className="confirmation-card" key={c.id}><div><b>{c.tool}</b><p>{c.message||`A.R.I.S. solicita autorização para: ${c.query}`}</p><small>RISCO: {c.risk.toUpperCase()}</small></div><div className="confirmation-actions"><button onClick={()=>resolveConfirmation(c.id,true)} disabled={!!confirmBusy}>Autorizar</button><button onClick={()=>resolveConfirmation(c.id,false)} disabled={!!confirmBusy}>Recusar</button></div></div>)}</section>}
        {docs.length>0&&<section className="data-panel document-panel"><div className="panel-head"><div><small>SESSION CONTEXT</small><h2>Documentos disponíveis</h2></div></div><div className="document-chips">{docs.map((d,i)=><span key={i}>▧ {d}</span>)}</div></section>}
        <section className={`chat-panel ${showChat?"":"chat-minimized"}`}><div className="panel-head chat-head"><div><small>INTERFACE DE COMANDO</small><h2>Conversação com A.R.I.S.</h2></div><button className="text-button" onClick={()=>setShowChat(v=>!v)}>{showChat?"Recolher":"Expandir"}</button></div>{showChat&&<><div className="chat-messages">{msgs.slice(-30).map((m,i)=><article className={`message ${m.role}`} key={i}><div className="message-label"><span className={m.role==="assistant"?"aris-mark":"user-mark"}>{m.role==="assistant"?"A":"U"}</span><b>{m.role==="user"?"OPERADOR":"A.R.I.S."}</b></div><p>{m.content}</p></article>)}{busy&&<div className="processing"><span className="pulse-dot"/> A.R.I.S. está analisando a solicitação…</div>}{respondingTask&&<div className="task-input"><b>Informação necessária</b><p>Forneça o dado abaixo para retomar a operação.</p><textarea value={taskInput} onChange={e=>setTaskInput(e.target.value)} placeholder="Digite a informação necessária…"/><button onClick={answerTask} disabled={busy||!taskInput.trim()}>RESPONDER E RETOMAR ↗</button></div>}</div><div className="composer"><textarea value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}}} placeholder="Informe um objetivo, solicite uma análise ou dê um comando…"/><div className="composer-bottom"><span>ENTER PARA ENVIAR • SHIFT + ENTER PARA NOVA LINHA</span><button onClick={send} disabled={busy||!text.trim()}>{busy?"ANALISANDO…":"TRANSMITIR ↗"}</button></div></div></>}</section>
        <footer className="app-footer"><span>A.R.I.S. / ADVANCED INTELLIGENCE & OPERATIONS</span><span>HOLOGRAPHIC WORKSPACE • V3.9.0</span></footer>
      </div>
    </main>
  </div>;
}
