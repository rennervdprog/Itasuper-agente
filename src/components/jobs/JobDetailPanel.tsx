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
  CheckCircle2, 
  AlertCircle, 
  Layers,
  FolderGit2,
  Copy,
  Check
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
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200 text-zinc-100">
      {/* Drawer Header */}
      <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-zinc-100 font-mono">Job {job.id}</h3>
              <button
                onClick={handleCopyId}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                title="Copiar ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Painel de Detalhes da Execução
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={job.status} />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Pipeline Lifecycle Stepper */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-xl">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-3 block">
            Pipeline do Agente
          </span>
          <div className="grid grid-cols-4 gap-2 text-center">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-all ${
                  step.done 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                }`}>
                  {idx + 1}
                </div>
                <span className={`text-[11px] font-medium ${step.done ? 'text-zinc-200' : 'text-zinc-400'}`}>
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
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 leading-relaxed font-sans">
            {job.originalMessage}
          </div>
        </div>

        {/* Repository and Branch Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
            <span className="text-[11px] text-zinc-400 block mb-1 flex items-center gap-1.5">
              <FolderGit2 className="w-3.5 h-3.5 text-zinc-500" />
              Repositório
            </span>
            <span className="text-xs font-semibold text-zinc-200 font-mono break-all">
              {job.repositoryId}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
            <span className="text-[11px] text-zinc-400 block mb-1 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-zinc-500" />
              Branch Gerada
            </span>
            <span className="text-xs font-semibold text-emerald-400 font-mono break-all">
              {job.branchName || 'main (direto)'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
            <span className="text-[11px] text-zinc-400 block mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              Criado em
            </span>
            <span className="text-xs text-zinc-300">
              {formatDate(job.createdAt)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
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
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <GitPullRequest className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-purple-300 block">Pull Request Aberto #{job.prNumber}</span>
                <span className="text-[11px] text-purple-400/80 font-mono truncate max-w-xs block">
                  {job.prUrl}
                </span>
              </div>
            </div>
            <a
              href={job.prUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
            >
              <span>Ver PR</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Affected files */}
        {job.filesModified && job.filesModified.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                <FileCode2 className="w-3.5 h-3.5 text-zinc-400" />
                Arquivos Modificados ({job.filesModified.length})
              </label>
            </div>
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5 font-mono text-xs">
              {job.filesModified.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 text-zinc-300 hover:text-emerald-400 py-0.5">
                  <span className="text-emerald-500">M</span>
                  <span>{file}</span>
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
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-xs text-zinc-300 space-y-2 max-h-56 overflow-y-auto">
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

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-between">
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Fechar
        </button>

        {onAdvanceStatus && job.status !== 'concluido' && (
          <button
            onClick={() => onAdvanceStatus(job.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium shadow-md shadow-emerald-950 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Avançar Etapa do Job</span>
          </button>
        )}
      </div>
    </div>
  );
};
