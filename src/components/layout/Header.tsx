import React from 'react';
import { RepositoryInfo, RepositoryId } from '../../types';
import { 
  Globe, 
  Smartphone, 
  Bike, 
  GitBranch, 
  CheckCircle2, 
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface HeaderProps {
  currentTab: 'chat' | 'jobs';
  repositories: RepositoryInfo[];
  activeRepoId: RepositoryId;
  onSelectRepo: (repoId: RepositoryId) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  repositories,
  activeRepoId,
  onSelectRepo
}) => {
  const activeRepo = repositories.find(r => r.id === activeRepoId) || repositories[0];

  const getRepoIcon = (type: string) => {
    if (type === 'web') return <Globe className="w-4 h-4 text-emerald-400" />;
    if (type === 'app cliente') return <Smartphone className="w-4 h-4 text-blue-400" />;
    return <Bike className="w-4 h-4 text-amber-400" />;
  };

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            {currentTab === 'chat' ? (
              <>
                <span>Chat com o Agente</span>
                <span className="text-xs font-normal text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                  Gerador de Jobs
                </span>
              </>
            ) : (
              <>
                <span>Histórico de Jobs</span>
                <span className="text-xs font-normal text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                  Pipeline & Status
                </span>
              </>
            )}
          </h2>
          <p className="text-xs text-zinc-400">
            {currentTab === 'chat' 
              ? 'Converse diretamente com o agente para solicitar tarefas nos repositórios'
              : 'Acompanhe as execuções, PRs abertos e registros gerados'}
          </p>
        </div>
      </div>

      {/* Target Repository Selector Dropdown / Pill */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-zinc-950 border border-zinc-800 p-1 rounded-xl">
          <span className="text-[11px] font-semibold uppercase text-zinc-400 px-2 flex items-center gap-1">
            <GitBranch className="w-3 h-3 text-emerald-400" />
            Alvo:
          </span>
          <div className="flex items-center gap-1">
            {repositories.map(repo => {
              const isSelected = repo.id === activeRepoId;
              return (
                <button
                  key={repo.id}
                  onClick={() => onSelectRepo(repo.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                    isSelected
                      ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  )}
                >
                  {getRepoIcon(repo.type)}
                  <span>{repo.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Small screen select */}
        <div className="sm:hidden relative">
          <select
            value={activeRepoId}
            onChange={(e) => onSelectRepo(e.target.value as RepositoryId)}
            className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 rounded-lg px-2.5 py-1.5 pr-8 appearance-none focus:outline-none focus:border-emerald-500"
          >
            {repositories.map(repo => (
              <option key={repo.id} value={repo.id}>
                {repo.displayName}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-2.5 pointer-events-none text-zinc-400" />
        </div>
      </div>
    </header>
  );
};
