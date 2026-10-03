// API client. Two transports share one interface:
//   http  - talks to the FastAPI backend (default)
//   demo  - in-browser engine for backend-free hosted demos (build:demo)
let token = null;
const IS_DEMO = __DEMO__; // compile-time constant from vite.config.js

export const isDemo = () => IS_DEMO;
export const setToken = (t) => { token = t; };

async function request(method, path, body) {
  if (IS_DEMO) {
    // Loaded only in demo builds; dead-code-eliminated from production bundles.
    const { demoRequest } = await import("./demo/engine.js");
    return demoRequest(method, path, body, token);
  }
  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.detail || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  demoUsers: () => request("GET", "/api/auth/demo-users"),
  login: (username) => request("POST", "/api/auth/login", { username }),
  me: () => request("GET", "/api/me"),
  chat: (message, ticket_id) => request("POST", "/api/chat", { message, ticket_id }),
  tickets: (scope = "mine") => request("GET", `/api/tickets?scope=${scope}`),
  ticket: (id) => request("GET", `/api/tickets/${id}`),
  feedback: (id, rating) => request("POST", `/api/tickets/${id}/feedback`, { rating }),
  approvals: (status = "PENDING") => request("GET", `/api/approvals?status=${status}`),
  decide: (id, approve, reason) => request("POST", `/api/approvals/${id}/decision`, { approve, reason }),
  trace: (id) => request("GET", `/api/traces/${id}`),
  metrics: (hours = 24) => request("GET", `/api/metrics/summary?hours=${hours}`),
  audit: () => request("GET", "/api/audit"),
};
