const API_BASE = import.meta.env.VITE_API_URL || '';

export async function fetchIncidents() {
  const res = await fetch(`${API_BASE}/api/incidents`);
  if (!res.ok) throw new Error('Failed to fetch incidents');
  return res.json();
}

export async function ingestAlert(alertData) {
  const res = await fetch(`${API_BASE}/api/incidents/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alertData)
  });
  if (!res.ok) throw new Error('Failed to ingest alert');
  return res.json();
}

export async function submitApproval(incidentId, approvalData) {
  const res = await fetch(`${API_BASE}/api/incidents/${incidentId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(approvalData)
  });
  if (!res.ok) throw new Error('Failed to submit approval');
  return res.json();
}

export async function fetchMetrics() {
  const res = await fetch(`${API_BASE}/api/metrics`);
  if (!res.ok) throw new Error('Failed to fetch metrics');
  return res.json();
}

export async function fetchAuditLogs() {
  const res = await fetch(`${API_BASE}/api/audit-logs`);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export function createWebSocket(onMessage, onOpen, onClose) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = API_BASE ? `${API_BASE.replace(/^http/, 'ws')}/ws/incidents` : `${protocol}//${window.location.host}/ws/incidents`;

  let ws;
  let reconnectTimer;

  function connect() {
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket] Connected to IOC Sentinel Engine');
        if (onOpen) onOpen();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) onMessage(data);
        } catch (e) {
          console.error('[WebSocket] Parse error:', e);
        }
      };

      ws.onclose = () => {
        console.warn('[WebSocket] Closed, attempting reconnect in 3s...');
        if (onClose) onClose();
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('[WebSocket] Error:', err);
        ws.close();
      };
    } catch (e) {
      console.error('[WebSocket] Connection failure:', e);
      reconnectTimer = setTimeout(connect, 3000);
    }
  }

  connect();

  return {
    send: (msg) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
    },
    close: () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    }
  };
}
