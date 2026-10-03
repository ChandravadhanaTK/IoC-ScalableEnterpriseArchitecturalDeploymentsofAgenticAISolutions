import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { Badge, ago } from "../components/ui.jsx";

export default function Audit() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { api.audit().then(setD).catch((e) => setErr(e.message)); }, []);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Audit log</h1>
          <p className="muted">Append-only and hash-chained: each entry includes the SHA-256 of the previous one, so edits are detectable.</p>
        </div>
        {d && (d.integrity.valid
          ? <Badge tone="ok">chain verified · {d.integrity.checked} entries</Badge>
          : <Badge tone="bad">chain broken at #{d.integrity.broken_at_seq}</Badge>)}
      </div>
      {err && <div className="error">{err}</div>}
      {d && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>When</th><th>Actor</th><th>Action</th><th>Target</th><th>Detail</th><th>Hash</th></tr></thead>
            <tbody>
              {d.entries.map((e) => (
                <tr key={e.seq}>
                  <td>{e.seq}</td>
                  <td className="muted">{ago(e.ts)}</td>
                  <td>{e.actor}</td>
                  <td><code>{e.action}</code></td>
                  <td><code>{e.target || "-"}</code></td>
                  <td className="detail-cell">{Object.entries(e.detail).filter(([k]) => k !== "trace_id").map(([k, v]) =>
                    <span key={k}>{k}: <b>{typeof v === "object" ? JSON.stringify(v) : String(v)}</b> </span>)}</td>
                  <td><code className="hash">{e.hash.slice(0, 10)}…</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
