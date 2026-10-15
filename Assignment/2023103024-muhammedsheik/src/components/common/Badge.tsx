import React from 'react';

interface BadgeProps {
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'cyan' | 'red' | 'gray';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ color = 'blue', children, icon, className = '' }) => {
  return (
    <span className={`badge badge-${color} ${className}`}>
      {icon}
      {children}
    </span>
  );
};
