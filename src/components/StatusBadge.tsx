import React from 'react';

import type { OrderStatus } from '../types';

interface StatusBadgeProps {
  status: OrderStatus;
  label: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => (
  <span className={`status-pill status-${status} status-anim`} key={status}>
    {label}
  </span>
);
