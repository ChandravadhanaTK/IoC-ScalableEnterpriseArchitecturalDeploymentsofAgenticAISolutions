import React, { useState, useEffect, useRef } from 'react';
import { Document } from '../types';
import { api } from '../api';
import '../styles/DocumentPanel.css';

type InputMode = 'file' | 'url';

const DocumentPanel: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGlobal, setIsGlobal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<InputMode>('file');
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded) loadDocuments();
  }, [isExpanded]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch {
      setError('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const doc = await api.uploadDocument(file, isGlobal);
      setDocuments(prev => [doc, ...prev]);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = urlInput.trim();
    if (!url) return;

    setIsUploading(true);
    setError(null);
    try {
      const doc = await api.addUrlDocument(url, isGlobal);
      setDocuments(prev => [doc, ...prev]);
      setUrlInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to ingest URL');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: number) => {
    try {
      await api.deleteDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    }
  };

  const displayName = (doc: Document) => {
    if (doc.file_type === 'url') {
      try {
        const { hostname, pathname } = new URL(doc.filename);
        const path = pathname.length > 1 ? pathname.slice(0, 16) + (pathname.length > 16 ? '…' : '') : '';
        return hostname + path;
      } catch {
        return doc.filename.length > 28 ? doc.filename.slice(0, 25) + '…' : doc.filename;
      }
    }
    return doc.filename.length > 24 ? doc.filename.slice(0, 21) + '…' : doc.filename;
  };

  return (
    <div className="document-panel">
      <button
        className="document-panel-toggle"
        onClick={() => setIsExpanded(prev => !prev)}
      >
        <span>📄 Documents</span>
        <span className={`toggle-arrow ${isExpanded ? 'open' : ''}`}>▾</span>
      </button>

      {isExpanded && (
        <div className="document-panel-body">
          {/* Mode tabs */}
          <div className="doc-mode-tabs">
            <button
              className={`doc-mode-tab ${mode === 'file' ? 'active' : ''}`}
              onClick={() => setMode('file')}
            >
              File
            </button>
            <button
              className={`doc-mode-tab ${mode === 'url' ? 'active' : ''}`}
              onClick={() => setMode('url')}
            >
              URL
            </button>
          </div>

          {/* Upload controls */}
          <div className="doc-upload-row">
            <label className="scope-toggle">
              <input
                type="checkbox"
                checked={isGlobal}
                onChange={e => setIsGlobal(e.target.checked)}
              />
              <span>Global</span>
            </label>

            {mode === 'file' ? (
              <>
                <button
                  className="doc-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  title="Upload PDF or TXT"
                >
                  {isUploading ? '⏳' : '+ Upload'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </>
            ) : (
              <form className="doc-url-form" onSubmit={handleUrlSubmit}>
                <input
                  className="doc-url-input"
                  type="url"
                  placeholder="https://example.com"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  disabled={isUploading}
                  required
                />
                <button
                  className="doc-upload-btn"
                  type="submit"
                  disabled={isUploading || !urlInput.trim()}
                >
                  {isUploading ? '⏳' : '+ Add'}
                </button>
              </form>
            )}
          </div>

          {error && <div className="doc-error">{error}</div>}

          {isLoading ? (
            <div className="doc-loading">Loading…</div>
          ) : documents.length === 0 ? (
            <div className="doc-empty">No documents yet</div>
          ) : (
            <ul className="doc-list">
              {documents.map(doc => (
                <li key={doc.id} className="doc-item">
                  <div className="doc-info">
                    <span className="doc-name" title={doc.filename}>
                      {doc.file_type === 'url' ? '🔗 ' : ''}{displayName(doc)}
                    </span>
                    <span className="doc-meta">
                      {doc.chunk_count} chunks
                      {doc.is_global ? ' · 🌐' : ' · 🔒'}
                    </span>
                  </div>
                  <button
                    className="doc-delete-btn"
                    onClick={() => handleDelete(doc.id)}
                    title="Delete document"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentPanel;
