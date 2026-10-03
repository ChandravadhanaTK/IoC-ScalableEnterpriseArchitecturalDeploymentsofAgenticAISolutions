import React, { useState } from 'react';
import {
  FilePlus,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  AlertCircle,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { Profile, RequestInput, AssetRequest } from '../../types';
import { StorageService } from '../../services/storage';
import { AgentOrchestrator, AssetTools } from '../../services/agents';

interface RequestViewProps {
  currentUser: Profile;
  onNavigateToWorkflow: (requestId: string) => void;
  onRefresh: () => void;
}

export const RequestView: React.FC<RequestViewProps> = ({
  currentUser,
  onNavigateToWorkflow,
  onRefresh,
}) => {
  const [assetType, setAssetType] = useState('Laptop');
  const [purpose, setPurpose] = useState('Software Development');
  const [department, setDepartment] = useState(currentUser.department || 'Engineering');
  const [duration, setDuration] = useState('12 months');
  const [minRam, setMinRam] = useState(16);
  const [minStorage, setMinStorage] = useState(512);
  const [cpu, setCpu] = useState('Any');
  const [location, setLocation] = useState(currentUser.location || 'Bengaluru');
  const [justification, setJustification] = useState(
    'Standard equipment required for core sprint feature development and API maintenance.'
  );
  const [submitting, setSubmitting] = useState(false);

  // Preset quick fill for test scenarios
  const applyPreset = (type: 'standard' | 'high' | 'restricted') => {
    if (type === 'standard') {
      setAssetType('Laptop');
      setPurpose('Software Development');
      setMinRam(16);
      setMinStorage(512);
      setCpu('Any');
      setJustification('Standard developer laptop configuration. Fully policy-compliant for sprint work.');
    } else if (type === 'high') {
      setAssetType('Laptop');
      setPurpose('Data Analysis');
      setMinRam(32);
      setMinStorage(1024);
      setCpu('Intel Core i9');
      setJustification('High-performance computing required for machine learning model training and big data processing.');
    } else if (type === 'restricted') {
      setAssetType('Laptop');
      setPurpose('Design');
      setMinRam(128);
      setMinStorage(2048);
      setCpu('Xeon');
      setJustification('Restricted high-memory configuration requested without prior architecture committee approval.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) return;

    setSubmitting(true);
    const code = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRequest: AssetRequest = {
      id: `req-${Date.now()}`,
      code,
      requester_id: currentUser.id,
      asset_type: assetType,
      purpose,
      department,
      duration,
      min_ram: Number(minRam),
      min_storage: Number(minStorage),
      cpu_requirement: cpu,
      preferred_location: location,
      justification,
      status: 'RECEIVED',
      created_at: new Date().toISOString(),
    };

    StorageService.addRequest(newRequest);
    AssetTools.recordAudit(
      currentUser,
      'REQUEST_CREATED',
      'request',
      code,
      `${assetType} requested for ${purpose}`
    );

    // Run deterministic multi-agent simulation workflow
    await AgentOrchestrator.executeRequestWorkflow(newRequest, currentUser);

    setSubmitting(false);
    onRefresh();
    onNavigateToWorkflow(newRequest.id);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Request IT Hardware Asset</h2>
        <p className="text-xs text-gray-500">
          Submit equipment specifications. Autonomous agents will evaluate compliance, score inventory matches, evaluate risk, and determine approval routing.
        </p>
      </div>

      {/* Preset Scenarios Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-2 text-blue-900">
          <Zap className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-wider">Demo Scenario Fast-Fill</span>
        </div>
        <p className="text-xs text-blue-800 mb-3">
          Click a button to instantly load one of the 3 evaluated scenarios:
        </p>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => applyPreset('standard')}
            className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Scenario 1: Standard Laptop (LOW &bull; Auto-Approve)</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('high')}
            className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-600" />
            <span>Scenario 2: High-Value Workstation (MEDIUM &bull; Mgr Review)</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('restricted')}
            className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-800 border border-rose-300 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Scenario 3: Restricted Request (HIGH &bull; Admin Review)</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Asset Type *</label>
            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              required
            >
              <option value="Laptop">Laptop</option>
              <option value="Desktop">Desktop</option>
              <option value="Monitor">Monitor</option>
              <option value="Phone">Phone</option>
              <option value="Tablet">Tablet</option>
              <option value="Dock">Dock</option>
              <option value="Headset">Headset</option>
              <option value="Keyboard">Keyboard</option>
              <option value="Mouse">Mouse</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Operational Purpose *</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              required
            >
              <option value="Software Development">Software Development</option>
              <option value="Data Analysis">Data Analysis</option>
              <option value="General Office Work">General Office Work</option>
              <option value="Design">Design</option>
              <option value="Management">Management</option>
              <option value="Remote Work">Remote Work</option>
              <option value="Temporary Project">Temporary Project</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Department *</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              required
            >
            </input>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Required Duration *</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="3 months">3 months</option>
              <option value="6 months">6 months</option>
              <option value="12 months">12 months</option>
              <option value="Permanent">Permanent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Minimum RAM (GB)</label>
            <input
              type="number"
              min="0"
              step="4"
              value={minRam}
              onChange={(e) => setMinRam(Number(e.target.value))}
              className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
            <span className="text-[10px] text-gray-400">&gt;16 GB flags Above-Standard policy; &ge;128 GB flags Restricted</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Minimum Storage (GB)</label>
            <input
              type="number"
              min="0"
              step="128"
              value={minStorage}
              onChange={(e) => setMinStorage(Number(e.target.value))}
              className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
            <span className="text-[10px] text-gray-400">&gt;512 GB triggers review</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">CPU Requirement</label>
            <select
              value={cpu}
              onChange={(e) => setCpu(e.target.value)}
              className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Any">Any (Standard)</option>
              <option value="Intel Core i5">Intel Core i5</option>
              <option value="Intel Core i7">Intel Core i7</option>
              <option value="Intel Core i9">Intel Core i9 (High-Tier)</option>
              <option value="Apple M-series">Apple M-series</option>
              <option value="AMD Ryzen">AMD Ryzen</option>
              <option value="Xeon">Intel Xeon (Restricted Workstation)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Preferred Location *</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Bengaluru">Bengaluru Hub</option>
              <option value="Hyderabad">Hyderabad Branch</option>
              <option value="Mumbai">Mumbai Branch</option>
              <option value="Pune">Pune Branch</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">Business Justification *</label>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={3}
            placeholder="Explain why this equipment is needed..."
            className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            required
          />
          <span className="text-[10px] text-gray-400">
            Note: keywords like 'restricted', 'unapproved', 'personal use', or 'bypass' will trigger Risk Agent alerts.
          </span>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <span>Orchestrating Agents...</span>
            ) : (
              <>
                <span>Analyze & Submit Request</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
