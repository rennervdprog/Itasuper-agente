import React from 'react';
import { ChatMessage, RepositoryInfo, Job } from '../../types';
import { Bot, User, ArrowUpRight } from 'lucide-react';
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

  return (
    <div
      className={cn(
        'flex gap-2.5 sm:gap-3 max-w-4xl w-full mx-auto py-2 sm:py-3 px-1 sm:px-2 transition-all',
        isAgent ? 'items-start' : 'items-start flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 select-none',
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
          'flex flex-col space-y-1 max-w-[88%] sm:max-w-[80%]',
          isAgent ? 'items-start' : 'items-end'
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          <span className="text-[11px] sm:text-xs font-semibold text-zinc-300">
            {isAgent ? 'Agente ItaSuper' : 'Você (Admin)'}
          </span>
          <span className="text-[10px] text-zinc-400">
            {formatTimeAgo(message.createdAt)}
          </span>
          {repository && (
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700/60 font-mono truncate max-w-[120px] sm:max-w-none">
              {repository.name}
            </span>
          )}
        </div>

        {/* Bubble */}
        <div
          className={cn(
            'p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words border shadow-sm w-full',
            isAgent
              ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
              : 'bg-emerald-600 border-emerald-500/40 text-white shadow-emerald-950/20'
          )}
        >
          {message.content}

          {/* Attached Job info chip if generated */}
          {job && (
            <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-950/70 p-2.5 rounded-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono text-zinc-300 font-semibold">Job {job.id}</span>
                <StatusBadge status={job.status} />
              </div>

              {onOpenJob && (
                <button
                  onClick={() => onOpenJob(job.id)}
                  className="min-h-[38px] inline-flex items-center justify-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg transition-colors cursor-pointer"
                >
                  <span>Ver Detalhes do Job</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
