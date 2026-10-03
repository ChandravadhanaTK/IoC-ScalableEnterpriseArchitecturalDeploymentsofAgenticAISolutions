import React from 'react';
import { BookOpen, FileCheck, ExternalLink, ShieldCheck } from 'lucide-react';

export const PolicyEvidenceCard = ({ policies = [] }) => {
  if (!policies || policies.length === 0) {
    return (
      <div className="policy-evidence-card empty">
        <BookOpen size={24} className="text-muted" />
        <p>No policy retrieval queries executed for this transaction type.</p>
      </div>
    );
  }

  return (
    <div className="policy-evidence-card">
      <div className="policy-card-header">
        <div className="policy-card-title">
          <BookOpen size={18} className="text-primary" />
          <h4>Retrieved Corporate Policy Evidence (RAG)</h4>
        </div>
        <span className="badge-count">{policies.length} Clauses Indexed</span>
      </div>

      <p className="policy-card-sub">
        Semantic vector search over <code>data/policies/</code> documents matched the following governing clauses:
      </p>

      <div className="policy-clauses-list">
        {policies.map((p, idx) => (
          <div key={idx} className="policy-clause-item">
            <div className="clause-header">
              <span className="clause-source-badge">
                <FileCheck size={14} />
                {p.source || p.document_name || 'return_and_refund_policy.md'}
              </span>
              {p.relevance_score && (
                <span className="clause-score">
                  Match Confidence: {(p.relevance_score * 100).toFixed(1)}%
                </span>
              )}
            </div>
            <div className="clause-text">
              {p.clause || p.content || p.text || (typeof p === 'string' ? p : JSON.stringify(p))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
