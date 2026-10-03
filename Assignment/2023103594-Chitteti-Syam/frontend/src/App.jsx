import { useEffect, useRef, useState } from "react";

const suggestions = [
  "Show upcoming events",
  "Latest announcements",
  "Find AI events",
];

function getConversationId() {
  const storageKey = "student-agentic-assistant-conversation-id";
  let conversationId = sessionStorage.getItem(storageKey);

  if (!conversationId) {
    conversationId = crypto.randomUUID();
    sessionStorage.setItem(storageKey, conversationId);
  }

  return conversationId;
}

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [conversationId] = useState(getConversationId);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isSending]);

  async function sendMessage(text) {
    const trimmedMessage = text.trim();
    if (!trimmedMessage || isSending) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      { sender: "You", text: trimmedMessage },
    ]);
    setMessage("");
    setIsSending(true);

    try {
      const response = await fetch("https://ioc-2aft.onrender.com/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedMessage, conversationId }),
      });
      const data = await response.json();

      if (!response.ok || typeof data.reply !== "string") {
        throw new Error("The chat request failed.");
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        { sender: "Assistant", text: data.reply },
      ]);
    } catch {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          sender: "Assistant",
          text: "Sorry, I couldn't process your request. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    void sendMessage(message);
  }

  return (
    <main className="app-shell">
      <section className="assistant-panel" aria-labelledby="app-title">
        <header className="app-header">
          <div className="brand-mark" aria-hidden="true">S</div>
          <div className="brand-copy">
            <h1 id="app-title">Student Agentic Assistant</h1>
            <p>AI-powered college assistant</p>
          </div>
          <span className="status-badge">
            <span className="status-dot" aria-hidden="true" />
            Ready to help
          </span>
        </header>

        <div className="chat-area" aria-label="Chat conversation">
          {messages.length === 0 ? (
            <div className="welcome-card">
              <div className="welcome-icon" aria-hidden="true">✦</div>
              <p className="welcome-kicker">Welcome</p>
              <h2>How can I help you today?</h2>
              <p className="welcome-description">
                I can help you find college events, announcements, and register
                for events.
              </p>
            </div>
          ) : (
            <div className="message-list" aria-live="polite" aria-relevant="additions">
              {messages.map((item, index) => (
                <article
                  className={`message-row ${item.sender === "You" ? "user-row" : "assistant-row"}`}
                  key={`${index}-${item.sender}`}
                >
                  {item.sender === "Assistant" && (
                    <span className="avatar assistant-avatar" aria-hidden="true">S</span>
                  )}
                  <div
                    className={`message-bubble ${item.sender === "You" ? "user-bubble" : "assistant-bubble"}${item.isError ? " error-bubble" : ""}`}
                  >
                    <span className="message-sender">{item.sender}</span>
                    <p>{item.text}</p>
                  </div>
                  {item.sender === "You" && (
                    <span className="avatar user-avatar" aria-hidden="true">Y</span>
                  )}
                </article>
              ))}
              {isSending && (
                <div className="message-row assistant-row" role="status">
                  <span className="avatar assistant-avatar" aria-hidden="true">S</span>
                  <div className="thinking-indicator">
                    <span className="thinking-dot" aria-hidden="true" />
                    Agent is thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <footer className="composer">
          <div className="suggestions" aria-label="Suggested messages">
            {suggestions.map((suggestion) => (
              <button
                className="suggestion-button"
                key={suggestion}
                type="button"
                disabled={isSending}
                onClick={() => void sendMessage(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <form className="message-form" onSubmit={handleSubmit}>
            <label className="visually-hidden" htmlFor="message-input">
              Type your message
            </label>
            <input
              id="message-input"
              type="text"
              placeholder="Ask about events or announcements..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={isSending}
              autoComplete="off"
            />
            <button
              className="send-button"
              type="submit"
              disabled={isSending || !message.trim()}
            >
              <span>{isSending ? "Sending..." : "Send"}</span>
              {!isSending && <span aria-hidden="true">↑</span>}
            </button>
          </form>
          <p className="composer-note">
            Student Agentic Assistant can make mistakes. Check important details.
          </p>
        </footer>
      </section>
    </main>
  );
}

export default App;
