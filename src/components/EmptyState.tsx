import React from 'react';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  text?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ emoji = '☕', title, text, action }) => (
  <div className="empty">
    <div className="empty-icon">{emoji}</div>
    <h3>{title}</h3>
    {text && <p>{text}</p>}
    {action && <div style={{ marginTop: 14 }}>{action}</div>}
  </div>
);
