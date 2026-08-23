import React from 'react';
import { 
  X, 
  GitBranch, 
  GitPullRequest, 
  Clock, 
  Calendar, 
  Terminal, 
  FileCode2, 
  ExternalLink, 
  Play, 
  Layers,
  FolderGit2,
  Copy,
  Check,
  ChevronLeft
} from 'lucide-react';
import { Job, RepositoryInfo } from '../../types';
import { StatusBadge } from '../ui/Badge';
import { formatDate } from '../../lib/utils';

interface JobDetailPanelProps {
  job: Job | null;
  onClose: () => void;
  repository?: RepositoryInfo;
  onAdvanceStatus?: (jobId: string) => void;
}

export const JobDetailPanel: React.FC<JobDetailPanelProps> = ({
  job,
  onClose,
  repository,
  onAdvanceStatus
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!job) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(job.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    { label: 'Pendente', status: 'pending', done: true },
    { label: 'Em execução', status: 'running', done: job.status !== 'pending' },
    { label: 'PR Aberto', status: 'pr_aberto', done: job.status === 'pr_aberto' || job.status === 'concluido' },
    { label: 'Concluído', status: 'concluido', done: job.status === 'concluido' }
  ];

  return (
    <>
      {/* Backdrop overlay for desktop drawer */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 hidden md:block"
        aria-hidden="true"
      />

      {/* Drawer: Fullscreen on mobile, Slide-over panel on desktop */}
      <div className="fixed inset-0 md:inset-y-0 md:right-0 md:left-auto z-50 w-full md:max-w-xl bg-zinc-900 md:border-l md:border-zinc-800 shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-right duration-200 text-zinc-100">
        {/* Header (with mobile back/close button) */}
        <div className="px-4 py-3.5 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Back button on mobile */}
            <button
              onClick={onClose}
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 hover:text-white transition-colors mr-1 cursor-pointer"
              aria-label="Voltar para a lista de jobs"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hidden sm:flex items-center justify-center text-emerald-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-zinc-100 font-mono truncate">Job {job.id}</h3>
                <button
                  onClick={handleCopyId}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors p-1"
                  title="Copiar ID"
                  aria-label="Copiar ID do job"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 truncate">
                Detalhes da Execução
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={job.status} />
            
            {/* Desktop close button */}
            <button
              onClick={onClose}
              className="hidden md:flex min-w-[44px] min-h-[44px] items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Fechar painel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Pipeline Lifecycle Stepper */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 p-3.5 sm:p-4 rounded-2xl">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-3 block">
              Pipeline do Agente
            </span>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center">
              {steps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-all ${
                    step.done 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className={`text-[10px] sm:text-[11px] font-medium leading-tight ${step.done ? 'text-zinc-200' : 'text-zinc-400'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Original Prompt */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">
              Mensagem Original Solicitada
            </label>
            <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans break-words">
              {job.originalMessage}
            </div>
          </div>

          {/* Result Summary if available */}
          {job.summary && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                Resultado / Resposta da IA
              </label>
              <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-950 border border-zinc-800/90 text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap break-words border-l-4 border-l-emerald-500">
                {job.summary}
              </div>
            </div>
          )}

          {/* Repository and Branch Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <span className="text-[11px] text-zinc-400 block mb-1 flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-zinc-500" />
                Repositório
              </span>
              <span className="text-xs font-semibold text-zinc-200 font-mono break-all">
                {job.repositoryId}
              </span>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <span className="text-[11px] text-zinc-400 block mb-1 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-zinc-500" />
                Branch Gerada
              </span>
              <span className="text-xs font-semibold text-emerald-400 font-mono break-all">
                {job.branchName || 'main'}
              </span>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <span className="text-[11px] text-zinc-400 block mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                Criado em
              </span>
              <span className="text-xs text-zinc-300">
                {formatDate(job.createdAt)}
              </span>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <span className="text-[11px] text-zinc-400 block mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                Última atualização
              </span>
              <span className="text-xs text-zinc-300">
                {formatDate(job.updatedAt)}
              </span>
            </div>
          </div>

          {/* PR Link if available */}
          {job.prUrl && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <GitPullRequest className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-purple-300 block">Pull Request #{job.prNumber}</span>
                  <span className="text-[11px] text-purple-400/80 font-mono truncate block max-w-xs">
                    {job.prUrl}
                  </span>
                </div>
              </div>
              <a
                href={job.prUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Abrir no GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Affected files */}
          {job.filesModified && job.filesModified.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                <FileCode2 className="w-3.5 h-3.5 text-zinc-400" />
                Arquivos Modificados ({job.filesModified.length})
              </label>
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5 font-mono text-xs overflow-x-auto">
                {job.filesModified.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-zinc-300 py-0.5">
                    <span className="text-emerald-500 font-bold shrink-0">M</span>
                    <span className="break-all">{file}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Execution Logs */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              Logs de Execução do Agente
            </label>
            <div className="p-3.5 sm:p-4 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-xs text-zinc-300 space-y-2 max-h-56 overflow-y-auto">
              {job.logs && job.logs.length > 0 ? (
                job.logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-zinc-500 shrink-0 select-none">
                      [{new Date(log.timestamp).toLocaleTimeString('pt-BR')}]
                    </span>
                    <span className={
                      log.level === 'success' ? 'text-emerald-400' :
                      log.level === 'error' ? 'text-rose-400' :
                      log.level === 'warn' ? 'text-amber-400' : 'text-zinc-300'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-zinc-500 italic">Nenhum log registrado para este job ainda.</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions (Sticky on Mobile) */}
        <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-900/95 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>

          {onAdvanceStatus && job.status !== 'concluido' && (
            <button
              onClick={() => onAdvanceStatus(job.id)}
              className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Avançar Etapa</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};
