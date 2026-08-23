import React from 'react';
import { RepositoryInfo, RepositoryId, NavigationTab } from '../../types';
import { 
  Globe, 
  Smartphone, 
  Bike, 
  GitBranch, 
  ChevronDown,
  Menu,
  FolderTree
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface HeaderProps {
  currentTab: NavigationTab;
  repositories: RepositoryInfo[];
  activeRepoId: RepositoryId;
  onSelectRepo: (repoId: RepositoryId) => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  repositories,
  activeRepoId,
  onSelectRepo,
  onOpenMobileMenu
}) => {
  const activeRepo = repositories.find(r => r.id === activeRepoId) || repositories[0];

  const getRepoIcon = (type: string) => {
    if (type === 'web') return <Globe className="w-4 h-4 text-emerald-400 shrink-0" />;
    if (type === 'app cliente') return <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />;
    return <Bike className="w-4 h-4 text-amber-400 shrink-0" />;
  };

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors shrink-0">
      {/* Left Area: Mobile Hamburger + Title */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors border border-zinc-700/60 shrink-0 cursor-pointer"
          aria-label="Abrir menu lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-semibold text-zinc-100 flex items-center gap-2 truncate">
            {currentTab === 'chat' ? (
              <>
                <span className="truncate">Chat com o Agente</span>
                <span className="hidden sm:inline text-xs font-normal text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full shrink-0">
                  Gerador de Jobs
                </span>
              </>
            ) : currentTab === 'jobs' ? (
              <>
                <span className="truncate">Histórico de Jobs</span>
                <span className="hidden sm:inline text-xs font-normal text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full shrink-0">
                  Pipeline & Status
                </span>
              </>
            ) : (
              <>
                <span className="truncate">Explorador de Arquivos</span>
                <span className="hidden sm:inline text-xs font-normal text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
                  GitHub Tree
                </span>
              </>
            )}
          </h2>
          <p className="text-xs text-zinc-400 hidden sm:block truncate">
            {currentTab === 'chat' 
              ? 'Converse diretamente com o agente para solicitar tarefas nos repositórios'
              : currentTab === 'jobs'
              ? 'Acompanhe as execuções, PRs abertos e registros gerados'
              : `Navegue na estrutura de pastas e leia o código de ${activeRepo.name}`}
          </p>
        </div>
      </div>

      {/* Right Area: Target Repository Selector */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Desktop pill selector (hidden on small screens) */}
        <div className="hidden md:flex items-center gap-2 bg-zinc-950 border border-zinc-800 p-1 rounded-xl">
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
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px]',
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

        {/* Compact Mobile Selector Dropdown (< md) */}
        <div className="md:hidden relative flex items-center">
          <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl px-2.5 py-1 min-h-[44px] relative">
            <div className="shrink-0 pointer-events-none">
              {getRepoIcon(activeRepo.type)}
            </div>
            <select
              value={activeRepoId}
              onChange={(e) => onSelectRepo(e.target.value as RepositoryId)}
              className="bg-transparent text-xs font-medium text-zinc-200 pr-5 appearance-none focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[180px] truncate"
              aria-label="Selecionar repositório alvo"
            >
              {repositories.map(repo => (
                <option key={repo.id} value={repo.id} className="bg-zinc-900 text-zinc-100">
                  {repo.name} ({repo.type})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
          </div>
        </div>
      </div>
    </header>
  );
};
