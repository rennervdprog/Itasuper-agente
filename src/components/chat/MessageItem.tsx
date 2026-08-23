import React from 'react';
import { ChatMessage, RepositoryInfo, Job } from '../../types';
import { Bot, User, Clock, ArrowUpRight, CheckCircle2, Code2, Copy, Check } from 'lucide-react';
import { cn, formatTimeAgo } from '../../lib/utils';
import { StatusBadge } from '../ui/Badge';

interface MessageItemProps {
  message: ChatMessage;
  repository?: RepositoryInfo;
  job?: Job;
  onOpenJob?: (jobId: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  repository,
  job,
  onOpenJob
}) => {
  const isAgent = message.sender === 'agent';
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'flex gap-3 max-w-4xl w-full mx-auto py-3 px-2 transition-all',
        isAgent ? 'items-start' : 'items-start flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5',
          isAgent
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-zinc-800 border-zinc-700 text-zinc-300'
        )}
      >
        {isAgent ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      {/* Message Content Container */}
      <div
        className={cn(
          'flex flex-col space-y-1.5 max-w-[85%]',
          isAgent ? 'items-start' : 'items-end'
        )}
      >
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs font-semibold text-zinc-300">
            {isAgent ? 'Agente ItaSuper' : 'Você (Admin)'}
          </span>
          <span className="text-[10px] text-zinc-400">
            {formatTimeAgo(message.createdAt)}
          </span>
          {repository && (
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded border border-zinc-700/60 font-mono">
              {repository.name}
            </span>
          )}
        </div>

        {/* Bubble */}
        <div
          className={cn(
            'p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words border shadow-sm',
            isAgent
              ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
              : 'bg-emerald-600 border-emerald-500/40 text-white shadow-emerald-950/20'
          )}
        >
          {message.content}

          {/* Attached Job info chip if generated */}
          {job && (
            <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 bg-zinc-950/60 p-2.5 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-400">Job: {job.id}</span>
                <StatusBadge status={job.status} />
              </div>

              {onOpenJob && (
                <button
                  onClick={() => onOpenJob(job.id)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <span>Ver Detalhes</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
