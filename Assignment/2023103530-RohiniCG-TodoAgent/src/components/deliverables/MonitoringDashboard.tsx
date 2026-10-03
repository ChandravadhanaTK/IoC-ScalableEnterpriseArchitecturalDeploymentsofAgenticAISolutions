import React, { useState } from 'react';
import { Activity, Zap, ShieldAlert, DollarSign, Award, Clock, ArrowUpRight, ArrowDownRight, Layers, CheckCircle2 } from 'lucide-react';
import { INITIAL_TRACE_SPANS } from '../../data/mockData';
import { TraceSpan } from '../../types';

export const MonitoringDashboard: React.FC = () => {
  const [selectedSpan, setSelectedSpan] = useState<TraceSpan>(INITIAL_TRACE_SPANS[0]);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold tracking-wider uppercase mb-1">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs">5</span>
            Deliverable 5 • Observability & Telemetry
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Enterprise Monitoring & Telemetry Dashboard
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            The 6 core pillars: System Health, Distributed Tracing, Agent Quality, AI Safety, Token Cost & Business Outcomes.
          </p>
        </div>

        {/* Time Filter */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {(['1h', '24h', '7d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                timeRange === r ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {r === '1h' ? 'Last 1 Hour' : r === '24h' ? 'Last 24 Hours' : 'Last 7 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* 6 Metric Pillar Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Pillar 1: Health */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">1. Health</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">99.98%</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            SLO Met (Target: 99.95%)
          </div>
          <div className="text-[10px] text-slate-500 font-mono">p95 Latency: 185ms</div>
        </div>

        {/* Pillar 2: Traces */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">2. Traces</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">42,810</div>
          <div className="text-[11px] text-slate-300">OTel Spans Processed</div>
          <div className="text-[10px] text-blue-400 font-mono">100% Context Propagated</div>
        </div>

        {/* Pillar 3: Quality */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">3. Quality</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">96.8%</div>
          <div className="text-[11px] text-purple-400 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            Task Success Rate
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Hallucination Index: 0.3%</div>
        </div>

        {/* Pillar 4: Safety */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">4. Safety</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">38</div>
          <div className="text-[11px] text-amber-400">Injections Neutralized</div>
          <div className="text-[10px] text-slate-500 font-mono">142 PII Tokens Redacted</div>
        </div>

        {/* Pillar 5: Cost */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">5. Cost</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">$14.82</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <ArrowDownRight className="w-3 h-3" />
            -34% Prompt Caching
          </div>
          <div className="text-[10px] text-slate-500 font-mono">$0.0034 / Task Avg</div>
        </div>

        {/* Pillar 6: Outcomes */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">6. Outcomes</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">-64%</div>
          <div className="text-[11px] text-cyan-400">Cycle Time Reduction</div>
          <div className="text-[10px] text-slate-500 font-mono">4.2x Dev Throughput</div>
        </div>
      </div>

      {/* Distributed Trace Waterfall Explorer */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              OpenTelemetry Distributed Trace Waterfall
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Detailed flame graph showing microservice breakdown, LLM thought latency, tool calls, and HITL gate evaluation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Select Root Span:</span>
            <select
              value={selectedSpan.id}
              onChange={(e) => {
                const found = INITIAL_TRACE_SPANS.find(s => s.id === e.target.value);
                if (found) setSelectedSpan(found);
              }}
              className="bg-slate-800 border border-slate-700 text-white text-xs font-mono rounded-lg px-2.5 py-1"
            >
              {INITIAL_TRACE_SPANS.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.durationMs}ms)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Trace Waterfall Visualization */}
        <div className="space-y-2 pt-2">
          {/* Root Span */}
          <div className="p-3 rounded-lg bg-slate-800/90 border border-cyan-500/40 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-cyan-300">{selectedSpan.name}</span>
              <span className="font-mono text-cyan-400">{selectedSpan.durationMs}ms</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full rounded-full w-full" />
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex gap-4 pt-1">
              <span>Service: {selectedSpan.service}</span>
              <span>Status: {selectedSpan.status.toUpperCase()}</span>
            </div>
          </div>

          {/* Child Spans */}
          {selectedSpan.children?.map((child, idx) => {
            const widthPct = Math.max(10, Math.min(100, Math.round((child.durationMs / selectedSpan.durationMs) * 100)));
            const leftOffset = idx * 12;

            return (
              <div
                key={child.id}
                style={{ marginLeft: `${leftOffset}px` }}
                className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1 transition hover:border-slate-700"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-300 flex items-center gap-1.5">
                    <span className="text-slate-500">↳</span>
                    {child.name}
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {child.service}
                    </span>
                  </span>
                  <span className="font-mono text-slate-400 text-xs">{child.durationMs}ms</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${widthPct}%` }}
                    className={`h-full rounded-full ${
                      child.status === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
