import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Layers, 
  Calendar, 
  ArrowUpRight, 
  FolderGit2, 
  Globe, 
  Smartphone, 
  Bike,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles
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
    if (repoId === 'ifood-style-landing') return <Globe className="w-4 h-4 text-emerald-400" />;
    if (repoId === 'Itasuper-APP-NATIVO') return <Smartphone className="w-4 h-4 text-blue-400" />;
    return <Bike className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 space-y-6 text-zinc-100">
      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs text-zinc-400 flex items-center justify-between">
            <span>Total de Jobs</span>
            <Layers className="w-4 h-4 text-zinc-500" />
          </span>
          <span className="text-2xl font-bold text-zinc-100 mt-2 font-mono">{counts.total}</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs text-zinc-400 flex items-center justify-between">
            <span>Em Execução</span>
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          </span>
          <span className="text-2xl font-bold text-blue-400 mt-2 font-mono">{counts.running}</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs text-zinc-400 flex items-center justify-between">
            <span>PRs Abertos</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </span>
          <span className="text-2xl font-bold text-purple-400 mt-2 font-mono">{counts.pr_aberto}</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs text-zinc-400 flex items-center justify-between">
            <span>Concluídos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </span>
          <span className="text-2xl font-bold text-emerald-400 mt-2 font-mono">{counts.concluido}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por ID, mensagem ou branch..."
            className="w-full bg-zinc-950 border border-zinc-800 pl-10 pr-4 py-2 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
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
            className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
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

      {/* Jobs List / Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Layers className="w-10 h-10 text-zinc-600 mx-auto" />
            <h4 className="text-sm font-semibold text-zinc-300">Nenhum job encontrado</h4>
            <p className="text-xs text-zinc-400">
              Tente ajustar os filtros de busca ou envie uma nova mensagem no chat para criar um job.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {filteredJobs.map((job) => {
              const isSelected = selectedJobId === job.id;
              return (
                <div
                  key={job.id}
                  onClick={() => onSelectJob(job.id)}
                  className={cn(
                    'p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-800/40 transition-colors cursor-pointer group',
                    isSelected && 'bg-zinc-800/60 ring-1 ring-emerald-500/40'
                  )}
                >
                  {/* Left info */}
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-zinc-200">
                        {job.id}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-800">
                        {getRepoIcon(job.repositoryId)}
                        <span className="font-mono text-[11px]">{job.repositoryId}</span>
                      </div>
                      <StatusBadge status={job.status} />
                    </div>

                    <p className="text-sm text-zinc-200 font-medium line-clamp-2">
                      {job.originalMessage}
                    </p>

                    {job.branchName && (
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                        <span>branch: {job.branchName}</span>
                      </div>
                    )}
                  </div>

                  {/* Right metadata and action button */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-xs text-zinc-400 block">
                        {formatTimeAgo(job.createdAt)}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {formatDate(job.createdAt).split(' ')[0]}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 group-hover:bg-emerald-600 group-hover:text-white text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver Painel</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-out detail drawer */}
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
