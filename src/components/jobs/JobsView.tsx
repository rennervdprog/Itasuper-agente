import React, { useState } from 'react';
import { 
  Search, 
  Layers, 
  ArrowUpRight, 
  Globe, 
  Smartphone, 
  Bike,
  Clock,
  CheckCircle2,
  Loader2,
  Sparkles,
  GitBranch,
  ChevronRight
} from 'lucide-react';
import { Job, JobStatus, RepositoryId, RepositoryInfo } from '../../types';
import { StatusBadge } from '../ui/Badge';
import { formatDate, formatTimeAgo, cn } from '../../lib/utils';
import { JobDetailPanel } from './JobDetailPanel';

interface JobsViewProps {
  jobs: Job[];
  repositories: RepositoryInfo[];
  selectedJobId?: string | null;
  onSelectJob: (jobId: string | null) => void;
  onAdvanceJobStatus?: (jobId: string) => void;
}

export const JobsView: React.FC<JobsViewProps> = ({
  jobs,
  repositories,
  selectedJobId,
  onSelectJob,
  onAdvanceJobStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [repoFilter, setRepoFilter] = useState<RepositoryId | 'all'>('all');

  const selectedJob = jobs.find(j => j.id === selectedJobId) || null;

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.originalMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.branchName && job.branchName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesRepo = repoFilter === 'all' || job.repositoryId === repoFilter;

    return matchesSearch && matchesStatus && matchesRepo;
  });

  // Summary counts
  const counts = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    running: jobs.filter(j => j.status === 'running').length,
    pr_aberto: jobs.filter(j => j.status === 'pr_aberto').length,
    concluido: jobs.filter(j => j.status === 'concluido').length,
  };

  const getRepoIcon = (repoId: string) => {
    if (repoId === 'ifood-style-landing') return <Globe className="w-4 h-4 text-emerald-400 shrink-0" />;
    if (repoId === 'Itasuper-APP-NATIVO') return <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />;
    return <Bike className="w-4 h-4 text-amber-400 shrink-0" />;
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-zinc-950 p-3 sm:p-6 space-y-4 sm:space-y-6 text-zinc-100">
      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between shadow-sm">
          <span className="text-[11px] sm:text-xs text-zinc-400 flex items-center justify-between">
            <span>Total Jobs</span>
            <Layers className="w-4 h-4 text-zinc-500" />
          </span>
          <span className="text-xl sm:text-2xl font-bold text-zinc-100 mt-1.5 font-mono">{counts.total}</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between shadow-sm">
          <span className="text-[11px] sm:text-xs text-zinc-400 flex items-center justify-between">
            <span>Em Execução</span>
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          </span>
          <span className="text-xl sm:text-2xl font-bold text-blue-400 mt-1.5 font-mono">{counts.running}</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between shadow-sm">
          <span className="text-[11px] sm:text-xs text-zinc-400 flex items-center justify-between">
            <span>PRs Abertos</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </span>
          <span className="text-xl sm:text-2xl font-bold text-purple-400 mt-1.5 font-mono">{counts.pr_aberto}</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between shadow-sm">
          <span className="text-[11px] sm:text-xs text-zinc-400 flex items-center justify-between">
            <span>Concluídos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1.5 font-mono">{counts.concluido}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 p-3 sm:p-4 rounded-2xl flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por ID, mensagem ou branch..."
            className="w-full bg-zinc-950 border border-zinc-800 pl-10 pr-4 py-2.5 min-h-[44px] rounded-xl text-base sm:text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full md:w-auto min-h-[44px] bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="running">Em Execução</option>
            <option value="pr_aberto">PR Aberto</option>
            <option value="concluido">Concluído</option>
            <option value="erro">Erro</option>
          </select>

          {/* Repo Filter */}
          <select
            value={repoFilter}
            onChange={(e) => setRepoFilter(e.target.value as any)}
            className="w-full md:w-auto min-h-[44px] bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">Todos os Repositórios</option>
            {repositories.map(repo => (
              <option key={repo.id} value={repo.id}>
                {repo.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Jobs Container: Stacked Cards on Mobile / Clean rows on Desktop */}
      <div className="space-y-3 md:space-y-0 md:bg-zinc-900 md:border md:border-zinc-800 md:rounded-2xl md:overflow-hidden">
        {filteredJobs.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-3 bg-zinc-900 border border-zinc-800 rounded-2xl md:border-0">
            <Layers className="w-10 h-10 text-zinc-600 mx-auto" />
            <h4 className="text-sm font-semibold text-zinc-300">Nenhum job encontrado</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Tente ajustar os filtros de busca ou envie uma nova mensagem no chat para iniciar um job.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:gap-0 md:divide-y md:divide-zinc-800/80">
            {filteredJobs.map((job) => {
              const isSelected = selectedJobId === job.id;
              return (
                <div
                  key={job.id}
                  onClick={() => onSelectJob(job.id)}
                  className={cn(
                    // Mobile card styling
                    'bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 transition-all cursor-pointer select-none active:scale-[0.99] active:bg-zinc-850',
                    // Desktop row overrides
                    'md:rounded-none md:border-0 md:p-5 md:flex-row md:items-center md:justify-between md:hover:bg-zinc-800/40',
                    isSelected && 'ring-2 ring-emerald-500/50 bg-zinc-800/70'
                  )}
                >
                  {/* Top / Main info */}
                  <div className="space-y-2 max-w-2xl min-w-0">
                    {/* Header line: ID + Repo + Status */}
                    <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-zinc-100 bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-800">
                          {job.id}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-950/80 px-2 py-0.5 rounded-lg border border-zinc-800/80">
                          {getRepoIcon(job.repositoryId)}
                          <span className="font-mono text-[11px] truncate max-w-[130px] sm:max-w-none">{job.repositoryId}</span>
                        </div>
                      </div>
                      <StatusBadge status={job.status} />
                    </div>

                    {/* Original message text */}
                    <p className="text-xs sm:text-sm text-zinc-200 font-medium line-clamp-2 leading-relaxed">
                      {job.originalMessage}
                    </p>

                    {/* Branch and date info for mobile */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 font-mono pt-1">
                      {job.branchName && (
                        <span className="flex items-center gap-1 text-emerald-400/90 truncate max-w-[200px] sm:max-w-none">
                          <GitBranch className="w-3 h-3 shrink-0" />
                          <span className="truncate">{job.branchName}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{formatTimeAgo(job.createdAt)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Action Button & Desktop Timestamp */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 border-t border-zinc-800/60 md:pt-0 md:border-0 shrink-0">
                    <span className="text-[11px] text-zinc-400 md:hidden font-mono">
                      {formatDate(job.createdAt).split(' ')[0]}
                    </span>

                    <div className="hidden md:block text-right mr-2">
                      <span className="text-xs text-zinc-400 block font-mono">
                        {formatTimeAgo(job.createdAt)}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {formatDate(job.createdAt).split(' ')[0]}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-zinc-800 text-zinc-200 hover:bg-emerald-600 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ml-auto md:ml-0 shadow-sm"
                    >
                      <span>Ver Detalhes</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-out detail drawer on desktop / Fullscreen on mobile */}
      {selectedJob && (
        <JobDetailPanel
          job={selectedJob}
          onClose={() => onSelectJob(null)}
          repository={repositories.find(r => r.id === selectedJob.repositoryId)}
          onAdvanceStatus={onAdvanceJobStatus}
        />
      )}
    </div>
  );
};
