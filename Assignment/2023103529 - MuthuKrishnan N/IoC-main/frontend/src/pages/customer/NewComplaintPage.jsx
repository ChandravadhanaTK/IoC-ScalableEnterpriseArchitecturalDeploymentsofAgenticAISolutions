import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { complaintsApi } from '../../api/complaintsApi';
import {
  PlusCircle,
  Sparkles,
  ArrowLeft,
  Bot,
  AlertCircle,
  HelpCircle,
  Send,
  Zap,
  Package
} from 'lucide-react';

const PRESET_SCENARIOS = {
  DAMAGED_REPLACEMENT: {
    title: 'Speaker arrived damaged in box',
    description: 'My order arrived damaged yesterday. The speaker cone is cracked and produces distorted sound. I want a replacement unit.',
    order_id: 'ORD-1001',
    category: 'DAMAGED_PRODUCT',
    note: 'Automatic Replacement flow (Eligible within 7 days, under ₹5,000 threshold)'
  },
  HIGH_VALUE_REFUND: {
    title: 'Refund request for 55" OLED Smart TV',
    description: 'I would like a full refund for my order ORD-1002. The television display does not turn on even after testing different power outlets. It was delivered 2 days ago.',
    order_id: 'ORD-1002',
    category: 'REFUND_REQUEST',
    note: 'Human-in-the-Loop Approval gate (Amount ₹25,000 exceeds ₹5,000 threshold)'
  },
  ORDER_TRACKING: {
    title: 'Status inquiry for gaming headset',
    description: 'Where is my order ORD-1005? The delivery was expected yesterday and tracking has not updated.',
    order_id: 'ORD-1005',
    category: 'ORDER_TRACKING',
    note: 'Tool Calling & Status Response (In-Transit query)'
  },
  MISSING_ORDER_ID: {
    title: 'Replacement request for broken item',
    description: 'I received a defective item and would like a replacement sent immediately.',
    order_id: '',
    category: 'DAMAGED_PRODUCT',
    note: 'Missing Information flow (IntentAgent flags missing Order ID)'
  }
};

export const NewComplaintPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [orderId, setOrderId] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orchestratingStep, setOrchestratingStep] = useState('');

  // Check URL param scenario
  useEffect(() => {
    const scenarioKey = searchParams.get('scenario');
    if (scenarioKey && PRESET_SCENARIOS[scenarioKey]) {
      loadScenario(scenarioKey);
    }
  }, [searchParams]);

  const loadScenario = (key) => {
    const s = PRESET_SCENARIOS[key];
    if (s) {
      setTitle(s.title);
      setDescription(s.description);
      setOrderId(s.order_id);
      setCategory(s.category);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setOrchestratingStep('Initializing Supervisor Agent orchestration...');

    try {
      const payload = {
        title,
        description,
        order_id: orderId.trim() || undefined,
        category: category || undefined,
      };

      setOrchestratingStep('Running Multi-Agent pipeline (Intent -> Order -> Policy RAG -> Resolution)...');
      const complaint = await complaintsApi.createComplaint(payload);

      setOrchestratingStep('Workflow complete! Redirecting to live inspection trace...');
      setTimeout(() => {
        navigate(`/customer/complaints/${complaint.id}`);
      }, 500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit complaint. Please check fields.');
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="page-header-row">
        <Link to="/customer/complaints" className="btn-back">
          <ArrowLeft size={16} />
          Back to Complaints
        </Link>
      </div>

      <div className="form-card-container">
        <div className="form-card-header">
          <div className="form-title-box">
            <PlusCircle size={22} className="text-primary" />
            <div>
              <h2>Submit Complaint or Support Request</h2>
              <p className="form-subtitle">
                Autonomous AI agents will classify your intent, verify order history, and apply company policy rules.
              </p>
            </div>
          </div>
        </div>

        {/* 1-Click Scenario Preset Selector */}
        <div className="preset-selector-box">
          <div className="preset-header">
            <Sparkles size={16} className="text-accent" />
            <span>Select Evaluation Scenario (Pre-fills Form):</span>
          </div>
          <div className="preset-pill-group">
            <button
              type="button"
              onClick={() => loadScenario('DAMAGED_REPLACEMENT')}
              className="preset-btn"
            >
              <Zap size={14} /> Damaged Replacement (ORD-1001)
            </button>
            <button
              type="button"
              onClick={() => loadScenario('HIGH_VALUE_REFUND')}
              className="preset-btn"
            >
              <Bot size={14} /> High-Value Refund Gate (ORD-1002)
            </button>
            <button
              type="button"
              onClick={() => loadScenario('ORDER_TRACKING')}
              className="preset-btn"
            >
              <Package size={14} /> Order Tracking Query (ORD-1005)
            </button>
            <button
              type="button"
              onClick={() => loadScenario('MISSING_ORDER_ID')}
              className="preset-btn"
            >
              <HelpCircle size={14} /> Missing Order ID
            </button>
          </div>
        </div>

        {error && (
          <div className="alert-box alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="complaint-submission-form">
          <div className="form-group">
            <label htmlFor="title">Complaint Title *</label>
            <input
              id="title"
              type="text"
              required
              placeholder="e.g. Package arrived damaged"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Detailed Description *</label>
            <textarea
              id="description"
              required
              rows={4}
              placeholder="Describe what occurred, delivery condition, or requested outcome..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input form-textarea"
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="orderId">Associated Order ID (Optional)</label>
              <input
                id="orderId"
                type="text"
                placeholder="e.g. ORD-1001"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="form-input font-mono"
              />
              <span className="field-hint">
                Seeded demo orders: ORD-1001 (₹2,499), ORD-1002 (₹25,000), ORD-1005 (In-Transit)
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="category">Category (Optional)</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-input"
              >
                <option value="">Let AI Classify Automatically</option>
                <option value="DAMAGED_PRODUCT">Damaged / Defective Product</option>
                <option value="REFUND_REQUEST">Refund Request</option>
                <option value="ORDER_TRACKING">Order Tracking / Status</option>
                <option value="LATE_DELIVERY">Late Delivery</option>
                <option value="WRONG_ITEM">Wrong Item Received</option>
                <option value="GENERAL_INQUIRY">General Customer Support</option>
              </select>
              <span className="field-hint">
                If left blank, IntentAgent will categorize using zero-shot NLP.
              </span>
            </div>
          </div>

          {loading ? (
            <div className="orchestration-status-card">
              <div className="orchestration-spinner">
                <Bot size={28} className="animate-spin text-primary" />
              </div>
              <div className="orchestration-text">
                <h4>Agentic Multi-Agent Pipeline Active</h4>
                <p>{orchestratingStep}</p>
              </div>
            </div>
          ) : (
            <button type="submit" className="btn-primary btn-submit-complaint">
              <Send size={18} />
              Submit to Autonomous AI Agent
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
