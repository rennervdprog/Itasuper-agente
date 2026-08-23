import React from 'react';
import { JobStatus } from '../../types';
import { cn } from '../../lib/utils';
import { Clock, Loader2, GitPullRequest, CheckCircle2, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: JobStatus;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  className,
  showIcon = true 
}) => {
  const config = {
    pending: {
      label: 'Pendente',
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      icon: Clock
    },
    running: {
      label: 'Em execução',
      bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      icon: Loader2,
      animate: true
    },
    pr_aberto: {
      label: 'PR Aberto',
      bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      icon: GitPullRequest
    },
    concluido: {
      label: 'Concluído',
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: CheckCircle2
    },
    erro: {
      label: 'Erro',
      bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      icon: AlertCircle
    }
  }[status] || {
    label: status,
    bg: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
    icon: Clock
  };

  const Icon = config.icon;

  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        config.bg,
        className
      )}
    >
      {showIcon && (
        <Icon className={cn('w-3.5 h-3.5', config.animate && 'animate-spin')} />
      )}
      {config.label}
    </span>
  );
};
