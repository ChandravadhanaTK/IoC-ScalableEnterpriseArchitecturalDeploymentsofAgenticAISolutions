import React, { useState } from 'react';
import { 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Wrench, 
  Database, 
  Activity, 
  Lock, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Server
} from 'lucide-react';
import { ARCHITECTURE_LAYERS } from '../../services/mockData';
import { ArchitectureLayer } from '../../types/agent';
import { Badge } from '../common/Badge';

export const ArchitectureView: React.FC = () => {
  const [selectedLayerId, setSelectedLayerId] = useState<string>(ARCHITECTURE_LAYERS[0].id);
  const [filterMode, setFilterMode] = useState<'all' | 'security' | 'protocols'>('all');

  const selectedLayer = ARCHITECTURE_LAYERS.find((l) => l.id === selectedLayerId) || ARCHITECTURE_LAYERS[0];

  const getLayerIcon = (layerId: string) => {
    switch (layerId) {
      case 'layer-presentation': return <Layers size={18} />;
      case 'layer-orchestration': return <Cpu size={18} />;
      case 'layer-reasoning': return <Sparkles size={18} />;
      case 'layer-tool': return <Wrench size={18} />;
      case 'layer-data': return <Database size={18} />;
      case 'layer-monitoring': return <Activity size={18} />;
      case 'layer-security': return <ShieldCheck size={18} />;
      default: return <Server size={18} />;
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner */}
      <div className="enterprise-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge color="cyan">System Blueprint</Badge>
            <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>Enterprise Specification RFC-402</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em', marginTop: '4px' }}>
            Enterprise Multi-Agent System Architecture
          </h2>
          <p style={{ fontSize: '13px', color: '#94A3B8' }}>
            7-Layer architectural model with decoupled orchestration, isolated microVM tool sandboxing, and defense-in-depth security enclaves.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={filterMode === 'all' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setFilterMode('all')}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            All Layers
          </button>
          <button 
            className={filterMode === 'security' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setFilterMode('security')}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            Security Boundaries
          </button>
          <button 
            className={filterMode === 'protocols' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setFilterMode('protocols')}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            Protocols & IPC
          </button>
        </div>
      </div>

      {/* Main Grid: Left Layer Stack, Right Layer Inspector */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '24px'
      }}>
        {/* Left: 7 Architecture Layers Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {ARCHITECTURE_LAYERS.map((layer) => {
            const isSelected = selectedLayerId === layer.id;

            return (
              <div
                key={layer.id}
                onClick={() => setSelectedLayerId(layer.id)}
                style={{
                  background: isSelected ? '#111827' : '#0B0F19',
                  border: '1px solid',
                  borderColor: isSelected ? '#3B82F6' : '#1E293B',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 0 16px rgba(59, 130, 246, 0.25)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = '#334155';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = '#1E293B';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: layer.color === 'blue' ? 'rgba(59, 130, 246, 0.15)' :
                                  layer.color === 'purple' ? 'rgba(139, 92, 246, 0.15)' :
                                  layer.color === 'cyan' ? 'rgba(6, 182, 212, 0.15)' :
                                  layer.color === 'orange' ? 'rgba(245, 158, 11, 0.15)' :
                                  'rgba(16, 185, 129, 0.15)',
                      color: layer.color === 'blue' ? '#60A5FA' :
                             layer.color === 'purple' ? '#A78BFA' :
                             layer.color === 'cyan' ? '#22D3EE' :
                             layer.color === 'orange' ? '#FBBF24' :
                             '#34D399'
                    }}>
                      {getLayerIcon(layer.id)}
                    </div>

                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
                        {layer.name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                        {layer.description}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Badge color={layer.color}>
                      {layer.components.length} Services
                    </Badge>
                    <ChevronRight size={16} color={isSelected ? '#3B82F6' : '#64748B'} />
                  </div>
                </div>

                {/* If Security Filter Active */}
                {filterMode === 'security' && (
                  <div style={{
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid #1E293B',
                    fontSize: '11px',
                    color: '#FBBF24',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Lock size={12} />
                    <span>Boundary: {layer.securityLevel}</span>
                  </div>
                )}

                {/* If Protocols Filter Active */}
                {filterMode === 'protocols' && (
                  <div style={{
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid #1E293B',
                    fontSize: '11px',
                    color: '#60A5FA',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    {layer.components.map((c, i) => (
                      <span key={i} style={{ background: '#1E293B', padding: '1px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                        {c.protocol}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Selected Layer Component Deep Dive */}
        <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px', height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Layer Breakdown & Specifications
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#F8FAFC', marginTop: '2px' }}>
                {selectedLayer.name}
              </h3>
            </div>
            <Badge color={selectedLayer.color}>{selectedLayer.securityLevel}</Badge>
          </div>

          <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.6 }}>
            {selectedLayer.description}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Contained Subsystems & Microservices
            </span>

            {selectedLayer.components.map((comp, idx) => (
              <div 
                key={idx}
                style={{
                  background: '#0B0F19',
                  border: '1px solid #1E293B',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9' }}>
                    {comp.name}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', background: 'rgba(59, 130, 246, 0.1)', color: '#60A5FA', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      {comp.protocol}
                    </span>
                    <Badge color="purple">{comp.type}</Badge>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
                  {comp.description}
                </p>
              </div>
            ))}
          </div>

          {/* Architectural Notes */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '12px',
            color: '#93C5FD'
          }}>
            <strong>Integration Contract:</strong> All cross-layer communications are strictly mediated via mTLS with distributed trace context propagation (W3C TraceContext headers).
          </div>
        </div>
      </div>

    </div>
  );
};
