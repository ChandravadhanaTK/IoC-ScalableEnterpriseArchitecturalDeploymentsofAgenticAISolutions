import React, { useEffect, useState } from "react";
import { api, isDemo, setToken } from "./api.js";
import Approvals from "./pages/Approvals.jsx";
import Audit from "./pages/Audit.jsx";
import Chat from "./pages/Chat.jsx";
import Monitoring from "./pages/Monitoring.jsx";
import Tickets from "./pages/Tickets.jsx";

const ROLE_BLURB = {
  employee: "Raise requests and chat with the assistant",
  technician: "See all tickets, traces and the dashboard",
  approver: "Approve or reject high-risk actions",
  admin: "Everything, plus the audit log",
};

const TABS = [
  { id: "chat", label: "Assistant", perm: "chat" },
  { id: "approvals", label: "Approvals", perm: "approvals:read" },
  { id: "tickets", label: "Tickets", perm: "tickets:read:all" },
  { id: "monitoring", label: "Monitoring", perm: "metrics:read" },
  { id: "audit", label: "Audit", perm: "audit:read" },
];

function Login({ onLogin }) {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(null);
  useEffect(() => { api.demoUsers().then(setUsers).catch((e) => setErr(e.message)); }, []);

  async function pick(u) {
    setBusy(u.username);
    try {
      const r = await api.login(u.username);
      setToken(r.access_token);
      onLogin(await api.me());
    } catch (e) {
      setErr(e.message);
      setBusy(null);
    }
  }

  return (
    <div className="login">
      <div className="login-card">
        <div className="brand-lg"><span className="logo">SD</span> IT Service Desk Agent</div>
        <p className="muted">
          An agentic assistant that triages IT requests, answers from the knowledge base, runs safe actions,
          asks humans to approve risky ones, and escalates with full context.
        </p>
        <div className="eyebrow">Sign in as a demo persona</div>
        {err && <div className="error">{err}</div>}
        <div className="personas">
          {users.map((u) => (
            <button key={u.username} className="persona" onClick={() => pick(u)} disabled={!!busy}>
              <span className="persona-avatar">{u.name.split(" ").map((p) => p[0]).join("")}</span>
              <span className="persona-body">
                <span className="persona-name">{u.name} <span className={`role role-${u.role}`}>{u.role}</span></span>
                <span className="muted small">{ROLE_BLURB[u.role]} · {u.dept}</span>
              </span>
              <span className="persona-go">{busy === u.username ? "…" : "→"}</span>
            </button>
          ))}
        </div>
        <p className="muted small">Production deployments replace this screen with corporate SSO (OIDC).</p>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("chat");

  if (!user) return <Login onLogin={(u) => { setUser(u); setTab("chat"); }} />;

  const tabs = TABS.filter((t) => user.permissions.includes(t.perm));
  const Page = { chat: Chat, approvals: Approvals, tickets: Tickets, monitoring: Monitoring, audit: Audit }[tab];

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand"><span className="logo">SD</span><span>Service Desk Agent</span>
          {isDemo() && <span className="demo-pill" title="Runs entirely in your browser with the rules-based model">browser demo</span>}
        </div>
        <nav className="tabs" aria-label="Main">
          {tabs.map((t) => (
            <button key={t.id} className={tab === t.id ? "on" : ""} aria-current={tab === t.id ? "page" : undefined}
              onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </nav>
        <div className="who">
          <span className="who-name">{user.name}</span>
          <span className={`role role-${user.role}`}>{user.role}</span>
          <button className="ghost small" onClick={() => { setToken(null); setUser(null); }}>Switch user</button>
        </div>
      </header>
      <main className="main"><Page key={`${tab}-${user.username}`} user={user} /></main>
    </div>
  );
}
