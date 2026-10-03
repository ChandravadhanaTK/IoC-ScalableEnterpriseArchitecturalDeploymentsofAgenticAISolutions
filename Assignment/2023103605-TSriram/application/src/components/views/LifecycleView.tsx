import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  Sparkles,
  HelpCircle,
  TrendingDown,
  RotateCcw,
} from 'lucide-react';
import { StorageData } from '../../services/storage';
import { Asset } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { AssetTools } from '../../services/agents';

interface LifecycleViewProps {
  data: StorageData;
  onRefresh: () => void;
}

export const LifecycleView: React.FC<LifecycleViewProps> = ({ data }) => {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'HEALTHY' | 'MONITOR' | 'REPLACE'>('ALL');

  // Categorize assets
  const healthyAssets = data.assets.filter((a) => a.replacement_score < 40);
  const monitorAssets = data.assets.filter((a) => a.replacement_score >= 40 && a.replacement_score < 70);
  const replaceAssets = data.assets.filter((a) => a.replacement_score >= 70);

  const displayedAssets = data.assets.filter((a) => {
    if (selectedCategory === 'HEALTHY') return a.replacement_score < 40;
    if (selectedCategory === 'MONITOR') return a.replacement_score >= 40 && a.replacement_score < 70;
    if (selectedCategory === 'REPLACE') return a.replacement_score >= 70;
    return true;
  });

  // Calculate recurring repairs
  const recurringRepairs: Array<{
    asset: Asset;
    issue: string;
    count: number;
  }> = [];

  for (const asset of data.assets) {
    const assetRepairs = data.repairs.filter((r) => r.asset_id === asset.id);
    const counts: Record<string, number> = {};
    for (const r of assetRepairs) {
      counts[r.issue] = (counts[r.issue] || 0) + 1;
    }
    for (const [issue, count] of Object.entries(counts)) {
      if (count >= 3) {
        recurringRepairs.push({ asset, issue, count });
      }
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Asset Lifecycle Intelligence</h2>
        <p className="text-xs text-gray-500">
          Predictive maintenance scoring, MTBF degradation tracking, and automated recurring repair alerts.
        </p>
      </div>

      {/* Recurring Repair Alert Banner (Critical Demo Scenario) */}
      {recurringRepairs.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-200 text-amber-900 rounded-xl flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Recurring Repair Alert — Automated Replacement Trigger
                </span>
                <span className="text-[10px] bg-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  Policy Rule &ge; 3 Occurrences
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1">
                The Lifecycle Agent detected identical recurring component failures exceeding enterprise threshold:
              </p>

              <div className="mt-3 space-y-2">
                {recurringRepairs.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white/80 rounded-xl border border-amber-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-blue-600 mr-2">{item.asset.tag}</span>
                      <strong className="text-gray-900">{item.asset.brand} {item.asset.model}</strong>
                      <span className="text-gray-500 mx-2">&bull;</span>
                      <span className="text-rose-700 font-semibold">{item.issue}</span>
                      <span className="text-gray-500 ml-1">({item.count} recorded failures)</span>
                    </div>
                    <div className="text-rose-600 font-bold text-xs flex items-center gap-1">
                      <span>Recommendation: Consider immediate replacement instead of additional repair</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lifecycle Classification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="text-gray-500 text-xs font-medium">All Scored Assets</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{data.assets.length}</div>
          <div className="text-[11px] text-gray-400 mt-1">Continuous monitoring</div>
        </button>

        <button
          onClick={() => setSelectedCategory('HEALTHY')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedCategory === 'HEALTHY'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="text-gray-500 text-xs font-medium">Healthy (0–39)</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{healthyAssets.length}</div>
          <div className="text-[11px] text-emerald-700/80 mt-1">Optimal operating state</div>
        </button>

        <button
          onClick={() => setSelectedCategory('MONITOR')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedCategory === 'MONITOR'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="text-gray-500 text-xs font-medium">Monitor (40–69)</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{monitorAssets.length}</div>
          <div className="text-[11px] text-amber-700/80 mt-1">Nearing warranty expiration</div>
        </button>

        <button
          onClick={() => setSelectedCategory('REPLACE')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedCategory === 'REPLACE'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="text-gray-500 text-xs font-medium">Replace Candidate (70–100)</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{replaceAssets.length}</div>
          <div className="text-[11px] text-rose-700/80 mt-1">High risk / High failure rate</div>
        </button>
      </div>

      {/* Asset Table with Replacement Score breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">Asset Health & Replacement Scoring Index</h3>
          <span className="text-xs text-gray-400">
            Formula: Age (25) + Warranty (20) + Repairs (20) + Health (20) + Performance (15)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Tag</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">Age (Years)</th>
                <th className="py-3 px-4">Warranty Expiry</th>
                <th className="py-3 px-4">Repair Count</th>
                <th className="py-3 px-4">Health Index</th>
                <th className="py-3 px-4">Replacement Score</th>
                <th className="py-3 px-4">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedAssets.map((asset) => {
                const isUrgent = asset.replacement_score >= 70;
                const isMonitor = asset.replacement_score >= 40 && asset.replacement_score < 70;

                return (
                  <tr key={asset.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {asset.tag}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{asset.brand} {asset.model}</div>
                      <div className="text-[11px] text-gray-400">{asset.type} &bull; {asset.department}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-medium">
                      {asset.age_years} yrs
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                      {asset.warranty_until}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-800">{asset.repairs_count}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-gray-800">{asset.health}%</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-xs ${
                            isUrgent
                              ? 'bg-rose-100 text-rose-700'
                              : isMonitor
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {asset.replacement_score}/100
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {isUrgent ? (
                        <span className="font-bold text-rose-600 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Replacement Recommended</span>
                        </span>
                      ) : isMonitor ? (
                        <span className="text-amber-600 font-medium">Monitor Hardware</span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Healthy</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
