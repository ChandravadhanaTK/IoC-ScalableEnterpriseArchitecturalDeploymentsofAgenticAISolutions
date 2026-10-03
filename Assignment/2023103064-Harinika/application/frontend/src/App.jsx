import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "https://ioc-wmg2.onrender.com/api";

function App() {
  const [activePage, setActivePage] = useState("employee");
  const [form, setForm] = useState({
    employee: "",
    title: "",
    description: ""
  });

  const [ticket, setTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    open: 0,
    resolved: 0,
    escalated: 0,
    highPriority: 0,
    averageConfidence: 0
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadDashboard = async () => {
    try {
      const [ticketsResponse, metricsResponse] = await Promise.all([
        fetch(`${API_URL}/tickets`),
        fetch(`${API_URL}/metrics`)
      ]);

      const ticketData = await ticketsResponse.json();
      const metricData = await metricsResponse.json();

      setTickets(ticketData);
      setMetrics(metricData);
    } catch (error) {
      console.error("Dashboard loading error:", error);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const submitTicket = async (event) => {
    event.preventDefault();

    if (!form.title || !form.description) {
      setMessage("Please enter the issue title and description.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create ticket");
      }

      setTicket(data);

      setForm({
        employee: "",
        title: "",
        description: ""
      });

      setMessage("Ticket successfully analysed by the AI agents.");

      await loadDashboard();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API_URL}/tickets/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });

      await loadDashboard();
    } catch (error) {
      console.error("Status update error:", error);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>AI IT Helpdesk</h1>
          <p>Agentic AI Support & Incident Resolution Platform</p>
        </div>

        <div className="header-badge">
          ● AI SYSTEM ONLINE
        </div>
      </header>

      <nav className="navigation">
        <button
          className={activePage === "employee" ? "active" : ""}
          onClick={() => setActivePage("employee")}
        >
          Employee Support
        </button>

        <button
          className={activePage === "admin" ? "active" : ""}
          onClick={() => setActivePage("admin")}
        >
          IT Admin Dashboard
        </button>
      </nav>

      <main className="container">

        {activePage === "employee" && (
          <>
            <section className="hero">
              <div>
                <h2>How can we help you?</h2>
                <p>
                  Submit your IT issue and our multi-agent AI system will
                  analyse, classify and recommend a resolution.
                </p>
              </div>

              <div className="agent-flow">
                <span>Triage</span>
                <b>→</b>
                <span>Knowledge</span>
                <b>→</b>
                <span>Resolution</span>
              </div>
            </section>

            <section className="card">
              <div className="card-title">
                <h2>Create Support Ticket</h2>
                <span>AI Powered</span>
              </div>

              <form onSubmit={submitTicket}>

                <label>Employee Name</label>

                <input
                  type="text"
                  name="employee"
                  placeholder="Enter your name"
                  value={form.employee}
                  onChange={handleChange}
                />

                <label>Issue Title</label>

                <input
                  type="text"
                  name="title"
                  placeholder="Example: WiFi is not working"
                  value={form.title}
                  onChange={handleChange}
                  required
                />

                <label>Describe the Problem</label>

                <textarea
                  name="description"
                  placeholder="Describe what happened and any error messages..."
                  value={form.description}
                  onChange={handleChange}
                  rows="6"
                  required
                />

                <button
                  className="submit-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "AI Agents Analysing..." : "Submit Ticket"}
                </button>

              </form>

              {message && (
                <div className="message">
                  {message}
                </div>
              )}
            </section>

            {ticket && (
              <section className="analysis-card">

                <div className="analysis-header">
                  <div>
                    <span className="small-label">TICKET</span>
                    <h2>{ticket.id}</h2>
                  </div>

                  <span className={`status ${ticket.status
                    .toLowerCase()
                    .replaceAll(" ", "-")}`}>
                    {ticket.status}
                  </span>
                </div>

                <div className="analysis-grid">

                  <div className="analysis-item">
                    <span>Category</span>
                    <strong>{ticket.category}</strong>
                  </div>

                  <div className="analysis-item">
                    <span>Priority</span>
                    <strong>{ticket.priority}</strong>
                  </div>

                  <div className="analysis-item">
                    <span>AI Confidence</span>
                    <strong>{ticket.confidence}%</strong>
                  </div>

                  <div className="analysis-item">
                    <span>Knowledge Article</span>
                    <strong>{ticket.knowledgeArticle}</strong>
                  </div>

                </div>

                <div className="recommendation">
                  <h3>Recommended Resolution</h3>

                  <pre>{ticket.recommendation}</pre>
                </div>

                <div className="agent-result">
                  <div>
                    <strong>✓ Triage Agent</strong>
                    <small>Issue classified</small>
                  </div>

                  <div>
                    <strong>✓ Knowledge Agent</strong>
                    <small>Relevant guidance retrieved</small>
                  </div>

                  <div>
                    <strong>✓ Resolution Agent</strong>
                    <small>Resolution generated</small>
                  </div>
                </div>

              </section>
            )}
          </>
        )}

        {activePage === "admin" && (
          <>
            <section className="dashboard-title">
              <div>
                <h2>IT Operations Dashboard</h2>
                <p>
                  Monitor support activity and AI-assisted resolution.
                </p>
              </div>

              <button
                className="refresh-button"
                onClick={loadDashboard}
              >
                ↻ Refresh
              </button>
            </section>

            <section className="metrics">

              <div className="metric">
                <span>Total Tickets</span>
                <strong>{metrics.total}</strong>
              </div>

              <div className="metric">
                <span>Open</span>
                <strong>{metrics.open}</strong>
              </div>

              <div className="metric">
                <span>AI Resolved</span>
                <strong>{metrics.resolved}</strong>
              </div>

              <div className="metric">
                <span>Escalated</span>
                <strong>{metrics.escalated}</strong>
              </div>

              <div className="metric">
                <span>High Priority</span>
                <strong>{metrics.highPriority}</strong>
              </div>

              <div className="metric">
                <span>Avg. AI Confidence</span>
                <strong>{metrics.averageConfidence}%</strong>
              </div>

            </section>

            <section className="card">

              <div className="card-title">
                <h2>Recent Support Tickets</h2>
                <span>{tickets.length} tickets</span>
              </div>

              {tickets.length === 0 ? (
                <div className="empty">
                  No tickets have been created yet.
                </div>
              ) : (
                <div className="table-wrapper">

                  <table>

                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Issue</th>
                        <th>Category</th>
                        <th>Priority</th>
                        <th>Confidence</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>

                      {tickets.map((item) => (
                        <tr key={item.id}>

                          <td>
                            <strong>{item.id}</strong>
                          </td>

                          <td>{item.title}</td>

                          <td>{item.category}</td>

                          <td>
                            <span className={`priority ${item.priority.toLowerCase()}`}>
                              {item.priority}
                            </span>
                          </td>

                          <td>{item.confidence}%</td>

                          <td>
                            <span className="table-status">
                              {item.status}
                            </span>
                          </td>

                          <td>

                            {item.status !== "Resolved" && (
                              <button
                                className="resolve-button"
                                onClick={() =>
                                  updateStatus(item.id, "Resolved")
                                }
                              >
                                Resolve
                              </button>
                            )}

                          </td>

                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>
              )}

            </section>

            <section className="architecture-preview">

              <h2>Agentic Workflow</h2>

              <div className="workflow">

                <div>
                  <strong>Employee</strong>
                  <small>Support Request</small>
                </div>

                <span>→</span>

                <div>
                  <strong>Triage Agent</strong>
                  <small>Classify & Prioritise</small>
                </div>

                <span>→</span>

                <div>
                  <strong>Knowledge Agent</strong>
                  <small>Retrieve Guidance</small>
                </div>

                <span>→</span>

                <div>
                  <strong>Resolution Agent</strong>
                  <small>Recommend Action</small>
                </div>

                <span>→</span>

                <div>
                  <strong>IT Admin</strong>
                  <small>Escalation</small>
                </div>

              </div>

            </section>
          </>
        )}

      </main>

      <footer>
        <p>
          AI IT Helpdesk • Agentic Enterprise Support Prototype
        </p>
      </footer>

    </div>
  );
}

export default App;