import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'cyan';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  subtitle,
  icon,
  color = 'blue'
}) => {
  const glowClass = `enterprise-card-glow-${color}`;

  const iconColors = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    orange: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
  };

  return (
    <div className={`enterprise-card ${glowClass}`} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{title}</span>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: color === 'blue' ? 'rgba(59, 130, 246, 0.15)' :
                      color === 'purple' ? 'rgba(139, 92, 246, 0.15)' :
                      color === 'green' ? 'rgba(16, 185, 129, 0.15)' :
                      color === 'orange' ? 'rgba(245, 158, 11, 0.15)' :
                      'rgba(6, 182, 212, 0.15)',
          color: color === 'blue' ? '#60A5FA' :
                 color === 'purple' ? '#A78BFA' :
                 color === 'green' ? '#34D399' :
                 color === 'orange' ? '#FBBF24' :
                 '#22D3EE',
          border: `1px solid ${
            color === 'blue' ? 'rgba(59, 130, 246, 0.3)' :
            color === 'purple' ? 'rgba(139, 92, 246, 0.3)' :
            color === 'green' ? 'rgba(16, 185, 129, 0.3)' :
            color === 'orange' ? 'rgba(245, 158, 11, 0.3)' :
            'rgba(6, 182, 212, 0.3)'
          }`
        }}>
          {icon}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {value}
        </span>
        {change && (
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            color: isPositive ? '#34D399' : '#F87171',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}>
            {isPositive ? '↑' : '↓'} {change}
          </span>
        )}
      </div>

      {subtitle && (
        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
};
