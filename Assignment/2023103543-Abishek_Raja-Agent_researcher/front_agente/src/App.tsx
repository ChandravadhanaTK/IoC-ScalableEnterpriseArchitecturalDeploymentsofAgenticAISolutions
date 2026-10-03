import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './index.css';

interface ToolCall {
  name: string;
  args: any;
}

interface MessageHistory {
  type: string;
  content: string;
  tool_calls?: ToolCall[];
  name?: string;
}

interface WorkerProgress {
  angle: string;
  findings: string;
  sources: string[];
}

interface Progress {
  angles: string[];
  workers: WorkerProgress[];
}

interface Hecho {
  id: number;
  contenido: string;
  fecha: string;
}

interface PdfChunk {
  texto: string;
  source_url: string;
  page: number;
  chunk_index: number;
  fecha: string;
}

interface Project {
  id: string;
  name: string;
  created_at: string;
}

interface Chat {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
}

interface Document {
  filename: string;
  source_url: string;
  chunks: number;
  downloaded: boolean;
}

type Tab = 'chat' | 'memory' | 'files' | 'docs';

const SUGGESTIONS = [
  '🔬 Resumen de papers recientes sobre seguridad en IA',
  '📊 Comparar arquitecturas de transformers',
  '🧪 Buscar estudios sobre plegamiento de proteínas',
  '📝 Crear un esquema de revisión de literatura',
];

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{
    role: 'user' | 'agent';
    content: string;
    history?: MessageHistory[];
    progress?: Progress;
    streaming?: boolean;
  }[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [hechos, setHechos] = useState<Hecho[]>([]);
  const [hechosLoading, setHechosLoading] = useState(false);
  const [pdfChunks, setPdfChunks] = useState<PdfChunk[]>([]);
  const [pdfChunksLoading, setPdfChunksLoading] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState<PdfChunk | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [memoryPage, setMemoryPage] = useState(0);
  const [filesPage, setFilesPage] = useState(0);
  const PAGE_SIZE = 12;
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load projects on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/projects')
      .then((res) => res.json())
      .then((data: { projects: Project[] }) => {
        setProjects(data.projects);
        if (data.projects.length > 0 && !currentProject) {
          setCurrentProject(data.projects[0]);
        }
      })
      .catch(() => {});
  }, []);

  // Reset chat list & messages when switching projects
  const switchProject = (project: Project) => {
    setCurrentProject(project);
    setMessages([]);
    setChats([]);
    setCurrentChat(null);
    setMemoryPage(0);
    setFilesPage(0);
  };

  const createNewProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const res = await fetch('http://localhost:8000/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName }),
      });
      const project: Project = await res.json();
      setProjects((prev) => [...prev, project]);
      setCurrentProject(project);
      setMessages([]);
      setChats([]);
      setCurrentChat(null);
      setNewProjectName('');
    } catch {}
  };

  // Load chats whenever the project changes
  useEffect(() => {
    if (!currentProject) return;
    fetch(`http://localhost:8000/api/projects/${currentProject.id}/chats`)
      .then((res) => res.json())
      .then((data: { chats: Chat[] }) => {
        setChats(data.chats);
        // auto-select most recent chat (first in list, since backend orders by created_at DESC)
        if (data.chats.length > 0) {
          setCurrentChat(data.chats[0]);
        } else {
          setCurrentChat(null);
          setMessages([]);
        }
      })
      .catch(() => {
        setChats([]);
        setCurrentChat(null);
      });
  }, [currentProject]);

  // Rehydrate messages whenever the chat changes
  useEffect(() => {
    if (!currentChat || !currentProject) {
      setMessages([]);
      return;
    }
    fetch(
      `http://localhost:8000/api/chats/${currentChat.id}/messages?project_id=${currentProject.id}`
    )
      .then((res) => res.json())
      .then((data: { messages: { role: 'user' | 'agent'; content: string }[] }) => {
        setMessages(data.messages.map((m) => ({ role: m.role, content: m.content })));
      })
      .catch(() => setMessages([]));
  }, [currentChat]);

  const createNewChat = async (defaultName?: string): Promise<Chat | null> => {
    if (!currentProject) return null;
    const name = defaultName ?? window.prompt('Nombre del nuevo chat:', 'Nuevo chat');
    if (!name || !name.trim()) return null;
    try {
      const res = await fetch(
        `http://localhost:8000/api/projects/${currentProject.id}/chats`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim() }),
        }
      );
      const chat: Chat = await res.json();
      setChats((prev) => [chat, ...prev]);
      setCurrentChat(chat);
      setMessages([]);
      return chat;
    } catch {
      return null;
    }
  };

  const deleteCurrentChat = async () => {
    if (!currentChat) return;
    if (!window.confirm(`¿Eliminar chat "${currentChat.name}"?`)) return;
    try {
      await fetch(`http://localhost:8000/api/chats/${currentChat.id}`, { method: 'DELETE' });
      const remaining = chats.filter((c) => c.id !== currentChat.id);
      setChats(remaining);
      setCurrentChat(remaining[0] ?? null);
      if (remaining.length === 0) setMessages([]);
    } catch {}
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!currentProject) return;
    if (activeTab === 'memory') {
      setHechosLoading(true);
      fetch(`http://localhost:8000/api/hechos?project_id=${currentProject.id}`)
        .then((res) => res.json())
        .then((data: { hechos: Hecho[] }) => setHechos(data.hechos))
        .catch(() => setHechos([]))
        .finally(() => setHechosLoading(false));
    }
    if (activeTab === 'files') {
      setPdfChunksLoading(true);
      fetch(`http://localhost:8000/api/pdf-chunks?project_id=${currentProject.id}`)
        .then((res) => res.json())
        .then((data: { chunks: PdfChunk[] }) => setPdfChunks(data.chunks))
        .catch(() => setPdfChunks([]))
        .finally(() => setPdfChunksLoading(false));
    }
    if (activeTab === 'docs') {
      setDocsLoading(true);
      fetch(`http://localhost:8000/api/documents?project_id=${currentProject.id}`)
        .then((res) => res.json())
        .then((data: { documents: Document[] }) => setDocuments(data.documents))
        .catch(() => setDocuments([]))
        .finally(() => setDocsLoading(false));
    }
  }, [activeTab, currentProject]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || !currentProject) return;

    // Auto-create a chat on first message if none exists yet — name = first 40 chars
    let chat = currentChat;
    if (!chat) {
      const autoName = text.trim().slice(0, 40) + (text.trim().length > 40 ? '…' : '');
      chat = await createNewChat(autoName);
      if (!chat) return;
    }

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: text },
      { role: 'agent', content: '', streaming: true, progress: { angles: [], workers: [] } },
    ]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(true);

    // Mutate the last (assistant) message in-place via functional updates
    const updateLast = (updater: (m: typeof messages[number]) => typeof messages[number]) => {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = updater(next[next.length - 1]);
        return next;
      });
    };

    try {
      const res = await fetch('http://localhost:8000/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, project_id: currentProject.id, chat_id: chat.id }),
      });
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;

          let evt: any;
          try {
            evt = JSON.parse(payload);
          } catch {
            continue;
          }

          switch (evt.type) {
            case 'planner':
              updateLast((m) => ({ ...m, progress: { angles: evt.angles, workers: m.progress?.workers || [] } }));
              break;
            case 'direct':
              updateLast((m) => ({ ...m, content: evt.content }));
              break;
            case 'worker_done':
              updateLast((m) => ({
                ...m,
                progress: {
                  angles: m.progress?.angles || [],
                  workers: [
                    ...(m.progress?.workers || []),
                    { angle: evt.angle, findings: evt.findings, sources: evt.sources },
                  ],
                },
              }));
              break;
            case 'token':
              updateLast((m) => ({ ...m, content: m.content + evt.text }));
              break;
            case 'done':
              updateLast((m) => ({ ...m, streaming: false }));
              break;
            case 'error':
              updateLast((m) => ({ ...m, content: `Error: ${evt.message}`, streaming: false }));
              break;
          }
        }
      }
    } catch (error) {
      console.error(error);
      updateLast((m) => ({ ...m, content: 'Error connecting to backend.', streaming: false }));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  const isMCPTool = (name: string) => name.startsWith('mcp_') || name.includes('hecho');

  const hasMessages = messages.length > 0;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <div className="logo-dot" />
          <span className="logo-text">RESEARCHER</span>
        </div>
        <div className="project-selector">
          <select
            value={currentProject?.id || ''}
            onChange={(e) => {
              const p = projects.find((pr) => pr.id === e.target.value);
              if (p) switchProject(p);
            }}
          >
            {projects.length === 0 && <option value="">Sin proyectos</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="new-project-row">
            <input
              type="text"
              placeholder="Nuevo proyecto..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createNewProject()}
            />
            <button onClick={createNewProject} disabled={!newProjectName.trim()}>+</button>
          </div>
        </div>
        <div className="chat-selector">
          <select
            value={currentChat?.id || ''}
            onChange={(e) => {
              const c = chats.find((ch) => ch.id === e.target.value);
              if (c) setCurrentChat(c);
            }}
            disabled={!currentProject || chats.length === 0}
          >
            {chats.length === 0 && <option value="">Sin chats</option>}
            {chats.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            className="chat-action-btn"
            onClick={() => createNewChat()}
            disabled={!currentProject}
            title="Nuevo chat"
          >
            +
          </button>
          <button
            className="chat-action-btn danger"
            onClick={deleteCurrentChat}
            disabled={!currentChat}
            title="Eliminar chat actual"
          >
            ×
          </button>
        </div>
        <nav className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            CHAT
          </button>
          <button
            className={`nav-tab ${activeTab === 'memory' ? 'active' : ''}`}
            onClick={() => setActiveTab('memory')}
          >
            MEMORY
          </button>
          <button
            className={`nav-tab ${activeTab === 'docs' ? 'active' : ''}`}
            onClick={() => setActiveTab('docs')}
          >
            DOCS
          </button>
          <button
            className={`nav-tab ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            CHUNKS
          </button>
        </nav>
      </header>

      {/* Main content */}
      {activeTab === 'docs' ? (
        <div className="memory-panel">
          <div className="memory-icon">📑</div>
          <h2 className="memory-heading">Documentos</h2>
          <p className="memory-desc">
            Papers y archivos descargados en este proyecto.
          </p>
          {docsLoading ? (
            <div className="typing" style={{ justifyContent: 'center', padding: '2rem' }}>
              <span /><span /><span />
            </div>
          ) : documents.length === 0 ? (
            <p className="memory-desc">No hay documentos descargados aún.</p>
          ) : (
            <div className="hechos-list">
              {documents.map((doc, i) => (
                <div key={i} className="hecho-card doc-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{doc.downloaded ? '📄' : '⏳'}</span>
                    <strong style={{ fontSize: '14px', wordBreak: 'break-all' }}>{doc.filename}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', wordBreak: 'break-all', marginBottom: '0.5rem' }}>
                    {doc.source_url}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className="tool-badge local" style={{ fontSize: '0.7rem' }}>{doc.chunks} chunks</span>
                    {doc.downloaded && (
                      <a
                        href={`http://localhost:8000/api/documents/download/${encodeURIComponent(doc.filename)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="doc-view-btn"
                      >
                        Abrir
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'files' ? (
        <div className="memory-panel">
          <div className="memory-icon">📄</div>
          <h2 className="memory-heading">Files Chunks</h2>
          <p className="memory-desc">
            Fragmentos de archivos indexados en la base de datos vectorial. Haz clic en una tarjeta para ver el contenido completo.
          </p>
          {pdfChunksLoading ? (
            <div className="typing" style={{ justifyContent: 'center', padding: '2rem' }}>
              <span /><span /><span />
            </div>
          ) : pdfChunks.length === 0 ? (
            <p className="memory-desc">No hay archivos indexados aún.</p>
          ) : (
            <>
              <div className="hechos-list">
                {pdfChunks.slice(filesPage * PAGE_SIZE, (filesPage + 1) * PAGE_SIZE).map((chunk, i) => (
                  <div key={i} className="hecho-card chunk-card" onClick={() => setSelectedChunk(chunk)}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="tool-badge local" style={{ fontSize: '0.7rem' }}>Page {chunk.page}</span>
                      <span className="tool-badge mcp" style={{ fontSize: '0.7rem' }}>Chunk {chunk.chunk_index}</span>
                    </div>
                    <p className="hecho-contenido chunk-preview">{chunk.texto}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                      <span className="hecho-fecha" style={{ fontSize: '0.65rem', opacity: 0.6, wordBreak: 'break-all' }}>{chunk.source_url}</span>
                      <span className="hecho-fecha">{chunk.fecha}</span>
                    </div>
                  </div>
                ))}
              </div>
              {pdfChunks.length > PAGE_SIZE && (
                <div className="pagination">
                  <button disabled={filesPage === 0} onClick={() => setFilesPage((p) => p - 1)}>Anterior</button>
                  <span className="pagination-info">{filesPage + 1} / {Math.ceil(pdfChunks.length / PAGE_SIZE)}</span>
                  <button disabled={(filesPage + 1) * PAGE_SIZE >= pdfChunks.length} onClick={() => setFilesPage((p) => p + 1)}>Siguiente</button>
                </div>
              )}
            </>
          )}

          {selectedChunk && (
            <div className="modal-overlay" onClick={() => setSelectedChunk(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="tool-badge local" style={{ fontSize: '0.7rem' }}>Page {selectedChunk.page}</span>
                    <span className="tool-badge mcp" style={{ fontSize: '0.7rem' }}>Chunk {selectedChunk.chunk_index}</span>
                  </div>
                  <button className="modal-close" onClick={() => setSelectedChunk(null)}>✕</button>
                </div>
                <div className="modal-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedChunk.texto}</ReactMarkdown>
                </div>
                <div className="modal-footer">
                  <span className="hecho-fecha" style={{ wordBreak: 'break-all' }}>{selectedChunk.source_url}</span>
                  <span className="hecho-fecha">{selectedChunk.fecha}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'memory' ? (
        <div className="memory-panel">
          <div className="memory-icon">🧠</div>
          <h2 className="memory-heading">Memory</h2>
          <p className="memory-desc">
            Facts the researcher remembers across conversations.
          </p>
          {hechosLoading ? (
            <div className="typing" style={{ justifyContent: 'center', padding: '2rem' }}>
              <span /><span /><span />
            </div>
          ) : hechos.length === 0 ? (
            <p className="memory-desc">No hay memorias aún.</p>
          ) : (
            <>
              <div className="hechos-list">
                {hechos.slice(memoryPage * PAGE_SIZE, (memoryPage + 1) * PAGE_SIZE).map((h) => (
                  <div key={h.id} className="hecho-card">
                    <p className="hecho-contenido">{h.contenido}</p>
                    <span className="hecho-fecha">{h.fecha}</span>
                  </div>
                ))}
              </div>
              {hechos.length > PAGE_SIZE && (
                <div className="pagination">
                  <button disabled={memoryPage === 0} onClick={() => setMemoryPage((p) => p - 1)}>Anterior</button>
                  <span className="pagination-info">{memoryPage + 1} / {Math.ceil(hechos.length / PAGE_SIZE)}</span>
                  <button disabled={(memoryPage + 1) * PAGE_SIZE >= hechos.length} onClick={() => setMemoryPage((p) => p + 1)}>Siguiente</button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="main-content">
          {!hasMessages ? (
            <div className="welcome">
              <h1 className="welcome-heading">
                Your<br />
                <span className="highlight">Research Agent</span><br />
                is ready.
              </h1>
              <p className="welcome-sub">
                Pregunta lo que sea — desde revisiones de literatura hasta análisis de datos.
                El agente decide qué herramientas usar automáticamente.
              </p>
              <div className="suggestions">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    className="suggestion-btn"
                    onClick={() => sendMessage(s.replace(/^.+?\s/, ''))}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`msg ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                  {msg.role === 'agent' && <span className="msg-label">RESEARCHER</span>}
                  {msg.role === 'agent' && msg.progress && (msg.progress.angles.length > 0 || msg.progress.workers.length > 0) && (
                    <div className="thought-process">
                      {msg.progress.angles.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', opacity: 0.6, alignSelf: 'center' }}>PLAN:</span>
                          {msg.progress.angles.map((a, i) => {
                            const done = i < msg.progress!.workers.length;
                            return (
                              <span key={i} className={`tool-badge ${done ? 'local' : 'mcp'}`} style={{ fontSize: '0.7rem' }}>
                                {done ? '✓' : '…'} {a}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {msg.progress.workers.map((w, i) => (
                        <div key={`w-${i}`} className="tool-result" style={{ marginBottom: '0.4rem' }}>
                          <strong>✓ {w.angle}</strong>
                          {w.sources.length > 0 && (
                            <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '0.25rem' }}>
                              {w.sources.length} source{w.sources.length === 1 ? '' : 's'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.role === 'agent' && msg.history && (
                    <div className="thought-process">
                      {msg.history.map((h, i) => {
                        if (h.tool_calls && h.tool_calls.length > 0) {
                          return h.tool_calls.map((tc, j) => (
                            <div key={`tc-${i}-${j}`} className={`tool-badge ${isMCPTool(tc.name) ? 'mcp' : 'local'}`}>
                              <span>🔌</span>
                              <strong>{isMCPTool(tc.name) ? 'MCP' : 'Local'}:</strong> {tc.name}
                            </div>
                          ));
                        }
                        if (h.type === 'ToolMessage') {
                          return (
                            <div key={`tr-${i}`} className="tool-result">
                              ✓ {h.content}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}
                  {msg.role === 'agent' && msg.streaming && !msg.content && (
                    <div className="typing"><span /><span /><span /></div>
                  )}
                  {(msg.role === 'user' || msg.content) && (
                    <div className="msg-bubble">
                      {msg.role === 'agent' ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      ) : (
                        msg.content
                      )}
                    </div>
                  )}
                  {msg.role === 'user' && <span className="msg-label">YOU</span>}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Input bar — only in chat view */}
          <div className="input-bar">
            <form className="input-box" onSubmit={handleSubmit}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask the researcher anything..."
                disabled={loading}
                rows={1}
              />
              <button type="submit" className="send-btn" disabled={loading || !input.trim()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </form>
            <div className="input-hint">Enter to send · Shift+Enter for new line</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
