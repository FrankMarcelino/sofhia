import { Badge } from './badge';

type StatusType = 
  // Vendas/Leads
  | 'negotiating' | 'interested' | 'qualified' | 'contacted' | 'winning'
  // Transações  
  | 'completed' | 'pending' | 'automated'
  // Experimentos
  | 'running' | 'stopped'
  // Geral
  | 'active' | 'inactive' | 'closed';

const statusMap: Record<StatusType, { variant: 'success' | 'info' | 'warning' | 'error' | 'default', label: string }> = {
  // Vendas/Leads
  negotiating: { variant: 'success', label: 'Negotiating' },
  interested: { variant: 'warning', label: 'Interested' },
  qualified: { variant: 'info', label: 'Qualified' },
  contacted: { variant: 'success', label: 'Contacted' },
  winning: { variant: 'success', label: 'Winning' },
  
  // Transações
  completed: { variant: 'success', label: 'Completed' },
  pending: { variant: 'warning', label: 'Pending' },
  automated: { variant: 'default', label: 'Automated' },
  
  // Experimentos
  running: { variant: 'success', label: 'Running' },
  stopped: { variant: 'error', label: 'Stopped' },
  
  // Geral
  active: { variant: 'success', label: 'Active' },
  inactive: { variant: 'default', label: 'Inactive' },
  closed: { variant: 'default', label: 'Closed' },
};

interface StatusBadgeProps {
  status: StatusType;
  customLabel?: string;
}

export function StatusBadge({ status, customLabel }: StatusBadgeProps) {
  const config = statusMap[status] || { variant: 'default' as const, label: status };
  
  return (
    <Badge variant={config.variant}>
      {customLabel || config.label}
    </Badge>
  );
}
