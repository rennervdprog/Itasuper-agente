import React from 'react';
import { 
  MessageSquare, 
  Layers, 
  GitBranch, 
  Sun, 
  Moon, 
  LogOut, 
  Bot, 
  FolderGit2, 
  FolderTree,
  Globe, 
  Smartphone, 
  Bike,
  Activity,
  Database,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { RepositoryInfo, Job, NavigationTab } from '../../types';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  repositories: RepositoryInfo[];
  activeRepoId: string;
  onSelectRepo: (id: any) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onLogout: () => void;
  jobs: Job[];
  supabaseConfigured: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  repositories,
  activeRepoId,
  onSelectRepo,
  theme,
  onToggleTheme,
  onLogout,
  jobs,
  supabaseConfigured,
  mobileOpen = false,
  onCloseMobile
}) => {
  const activeJobsCount = jobs.filter(j => j.status === 'running' || j.status === 'pending').length;

  const getRepoIcon = (id: string) => {
    if (id === 'ifood-style-landing') return <Globe className="w-4 h-4 text-emerald-500 shrink-0" />;
    if (id === 'Itasuper-APP-NATIVO') return <Smartphone className="w-4 h-4 text-blue-500 shrink-0" />;
    return <Bike className="w-4 h-4 text-amber-500 shrink-0" />;
  };

  const handleTabClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const handleRepoClick = (repoId: string) => {
    onSelectRepo(repoId);
    if (currentTab !== 'chat') {
      onSelectTab('chat');
    }
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 sm:w-80 md:w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between h-screen select-none shrink-0 transition-transform duration-300 ease-in-out',
          'md:translate-x-0 md:sticky md:top-0 md:z-20',
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        {/* Top Section */}
        <div className="flex flex-col h-full overflow-y-auto">
          {/* App Branding & Mobile Close Button */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between min-h-[64px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-zinc-100">Agente ItaSuper</span>
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
                    v1.0
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">Painel de Controle</p>
              </div>
            </div>

            {/* Close button visible only on mobile */}
            <button
              onClick={onCloseMobile}
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Navigation */}
          <div className="p-3 space-y-2 border-b border-zinc-800">
            <button
              onClick={() => handleTabClick('chat')}
              className={cn(
                'w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left group',
                currentTab === 'chat'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
              )}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>Chat com o Agente</span>
              </div>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold",
                currentTab === 'chat' ? "bg-emerald-700 text-emerald-100" : "bg-zinc-800 text-zinc-400"
              )}>
                AI
              </span>
            </button>

            <button
              onClick={() => handleTabClick('jobs')}
              className={cn(
                'w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left group',
                currentTab === 'jobs'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span>Jobs & Histórico</span>
              </div>
              {activeJobsCount > 0 ? (
                <span className="flex items-center gap-1 text-[11px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold animate-pulse">
                  <Activity className="w-3 h-3" />
                  {activeJobsCount}
                </span>
              ) : (
                <span className="text-[11px] text-zinc-500 font-mono">
                  {jobs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabClick('explorer')}
              className={cn(
                'w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left group',
                currentTab === 'explorer'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
              )}
            >
              <div className="flex items-center gap-2.5">
                <FolderTree className="w-4 h-4" />
                <span>Explorador de Arquivos</span>
              </div>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold",
                currentTab === 'explorer' ? "bg-emerald-700 text-emerald-100" : "bg-zinc-800 text-zinc-400"
              )}>
                Git
              </span>
            </button>
          </div>

          {/* Repositories Quick Selector List */}
          <div className="p-3 flex-1">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400 flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-zinc-500" />
                Repositórios Alvo (3)
              </span>
            </div>

            <div className="space-y-2">
              {repositories.map((repo) => {
                const isActive = activeRepoId === repo.id;
                const repoJobsCount = jobs.filter(j => j.repositoryId === repo.id).length;

                return (
                  <button
                    key={repo.id}
                    onClick={() => handleRepoClick(repo.id)}
                    className={cn(
                      'w-full min-h-[50px] text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-1.5',
                      isActive 
                        ? 'bg-zinc-800/90 border-zinc-700 text-zinc-100 shadow-sm ring-1 ring-emerald-500/30' 
                        : 'bg-zinc-950/40 border-zinc-800/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 font-medium truncate">
                        {getRepoIcon(repo.id)}
                        <span className="truncate">{repo.name}</span>
                      </div>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span className="capitalize">{repo.type}</span>
                      <span className="font-mono text-[10px]">{repoJobsCount} jobs</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Database Integration Status Card */}
            <div className="mt-4 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  Supabase DB
                </span>
                <span className={cn(
                  "text-[10px] font-mono px-1.5 py-0.5 rounded",
                  supabaseConfigured ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                )}>
                  {supabaseConfigured ? "Conectado" : "Local / API"}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Serverless Functions em <code className="text-zinc-300">/api/*</code> integradas.
              </p>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-zinc-800 space-y-2 bg-zinc-900/50">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={onToggleTheme}
                className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors"
                title="Alternar Tema Claro/Escuro"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-blue-400" />
                    <span>Escuro</span>
                  </>
                )}
              </button>

              <button
                onClick={onLogout}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
                title="Encerrar Sessão"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>

            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-400 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Agente Online
              </span>
              <span>Uso Pessoal</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
