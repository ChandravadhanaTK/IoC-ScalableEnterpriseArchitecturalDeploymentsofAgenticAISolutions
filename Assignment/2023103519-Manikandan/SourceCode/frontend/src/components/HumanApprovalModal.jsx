import React from 'react';
import { AlertTriangle, ShieldCheck, XCircle, CheckCircle } from 'lucide-react';

export default function HumanApprovalModal({ payload, onApprove, onReject, isProcessing }) {
  if (!payload) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '540px',
          width: '100%',
          padding: '28px',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          background: 'rgba(15, 23, 42, 0.95)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '12px', borderRadius: '12px' }}>
            <AlertTriangle size={28} color="#f59e0b" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>
              Human-in-the-Loop (HITL) Gate Triggered
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Mandatory Security & Policy Intervention Required</p>
          </div>
        </div>

        <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Action Flagged:</span>
            <span className="font-mono" style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 700 }}>
              {payload.action}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Risk Score Calculated:</span>
            <span className="font-mono" style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: 700 }}>
              {payload.riskScore} / 1.0 (Threshold: 0.65)
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Target Infrastructure:</span>
            <span style={{ fontSize: '0.85rem', color: '#06b6d4', fontWeight: 600 }}>{payload.target}</span>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#e2e8f0', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>
            {payload.description}
          </p>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '24px' }}>
          As part of Deliverable 4 (Security Model), elevated actions modifying storage or executing scripts require manual approval.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn-danger" onClick={onReject} disabled={isProcessing} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <XCircle size={18} /> Deny & Abort Action
          </button>
          <button className="btn-success" onClick={onApprove} disabled={isProcessing} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={18} /> Authorize Execution
          </button>
        </div>
      </div>
    </div>
  );
}
