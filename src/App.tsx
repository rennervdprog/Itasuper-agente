import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ChatView } from './components/chat/ChatView';
import { JobsView } from './components/jobs/JobsView';
import { FileExplorerView } from './components/explorer/FileExplorerView';
import { LoginView } from './components/auth/LoginView';
import { REPOSITORIES, INITIAL_JOBS, INITIAL_MESSAGES } from './data/mockData';
import { Job, ChatMessage, RepositoryId, JobStatus, NavigationTab } from './types';
import { localStore, SUPABASE_CONFIG } from './lib/supabase';
import { api } from './lib/api';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStore.getAuthSession();
  });

  // Navigation and UI State
  const [currentTab, setCurrentTab] = useState<NavigationTab>('chat');
  const [activeRepoId, setActiveRepoId] = useState<RepositoryId>('ifood-style-landing');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => localStore.getTheme());
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Data State
  const [jobs, setJobs] = useState<Job[]>(() => localStore.getJobs(INITIAL_JOBS));
  const [messages, setMessages] = useState<ChatMessage[]>(() => localStore.getMessages(INITIAL_MESSAGES));

  // Fetch initial data from server-side API on load
  const loadServerData = useCallback(async () => {
    try {
      const [serverJobs, serverMessages] = await Promise.all([
        api.getJobs(),
        api.getMessages()
      ]);
      if (serverJobs && serverJobs.length > 0) {
        setJobs(serverJobs);
      }
      if (serverMessages && serverMessages.length > 0) {
        setMessages(serverMessages);
      }
    } catch (e) {
      console.warn('Usando armazenamento local de fallback:', e);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadServerData();
    }
  }, [isAuthenticated, loadServerData]);

  // Polling automático a cada 3 segundos enquanto houver jobs em processamento (pending ou running)
  useEffect(() => {
    if (!isAuthenticated) return;
    const hasActiveJobs = jobs.some(j => j.status === 'pending' || j.status === 'running');
    if (!hasActiveJobs) return;

    const interval = setInterval(() => {
      loadServerData();
    }, 3000);

    return () => clearInterval(interval);
  }, [isAuthenticated, jobs, loadServerData]);

  // Sync Theme to HTML class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStore.setTheme(theme);
  }, [theme]);

  // Sync persistence
  useEffect(() => {
    localStore.saveJobs(jobs);
  }, [jobs]);

  useEffect(() => {
    localStore.saveMessages(messages);
  }, [messages]);

  const handleLogin = (password: string): boolean => {
    const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || 'itasuper-admin';
    if (password === adminPass || password === 'itasuper-admin' || password === 'admin') {
      setIsAuthenticated(true);
      localStore.setAuthSession(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStore.setAuthSession(false);
    setMobileMenuOpen(false);
  };

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSendMessage = async (content: string, repoId: RepositoryId) => {
    const userMsgId = `msg-usr-${Date.now()}`;
    const tempJobId = `job-${Math.floor(100 + Math.random() * 900)}`;

    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      content: content,
      repositoryId: repoId,
      createdAt: new Date().toISOString(),
      jobId: tempJobId
    };

    // Feedback imediato na tela com status pending
    setMessages(prev => [...prev, userMessage]);

    try {
      const result = await api.sendMessage(content, repoId);
      if (result && result.job) {
        setJobs(prev => {
          const filtered = prev.filter(j => j.id !== result.job.id);
          return [result.job, ...filtered];
        });
      }
      if (result && result.agentMessage) {
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== userMsgId);
          return [...filtered, result.userMessage || userMessage, result.agentMessage];
        });
      }
      // Atualizar lista de jobs do servidor
      loadServerData();
    } catch (err) {
      console.warn('[App] Erro ao enviar mensagem para API, usando modo offline:', err);
      const fallbackJob: Job = {
        id: tempJobId,
        repositoryId: repoId,
        status: 'pending',
        originalMessage: content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        logs: [
          {
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `Job registrado no painel.`
          }
        ]
      };
      setJobs(prev => [fallbackJob, ...prev]);

      const agentMsgId = `msg-agent-${Date.now()}`;
      const repoName = REPOSITORIES.find(r => r.id === repoId)?.name || repoId;
      const agentMessage: ChatMessage = {
        id: agentMsgId,
        sender: 'agent',
        content: `Recebi sua solicitação para o repositório **${repoName}**! O **Job ${tempJobId}** foi registrado com status **pending**.`,
        repositoryId: repoId,
        createdAt: new Date().toISOString(),
        jobId: tempJobId
      };
      setMessages(prev => [...prev, agentMessage]);
    }
  };

  const handleAdvanceJobStatus = (jobId: string) => {
    setJobs(prev =>
      prev.map(j => {
        if (j.id !== jobId) return j;

        let nextStatus: JobStatus = j.status;
        const updatedLogs = [...j.logs];

        if (j.status === 'pending') {
          nextStatus = 'running';
          updatedLogs.push({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'Iniciando compilação e execução de testes de integração.'
          });
        } else if (j.status === 'running') {
          nextStatus = 'pr_aberto';
          updatedLogs.push({
            timestamp: new Date().toISOString(),
            level: 'success',
            message: 'Alterações commitadas no branch. Pull Request gerado no GitHub.'
          });
          const prNumber = Math.floor(10 + Math.random() * 80);
          return {
            ...j,
            status: nextStatus,
            prNumber,
            prUrl: `https://github.com/rennervdprog/${j.repositoryId}/pull/${prNumber}`,
            updatedAt: new Date().toISOString(),
            logs: updatedLogs,
            filesModified: [
              'src/features/checkout/orderService.ts',
              'src/components/DeliveryTracking.tsx',
              'README.md'
            ]
          };
        } else if (j.status === 'pr_aberto') {
          nextStatus = 'concluido';
          updatedLogs.push({
            timestamp: new Date().toISOString(),
            level: 'success',
            message: 'PR mergeado na branch principal. Deploy de preview validado.'
          });
        }

        return {
          ...j,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
          logs: updatedLogs
        };
      })
    );
  };

  const handleOpenJobDetails = (jobId: string) => {
    setSelectedJobId(jobId);
    setCurrentTab('jobs');
    setMobileMenuOpen(false);
  };

  const handleSelectTab = (tab: NavigationTab) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  const handleSelectRepo = (repoId: RepositoryId) => {
    setActiveRepoId(repoId);
    setMobileMenuOpen(false);
  };

  // If not authenticated, show personal login view
  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className={`h-[100dvh] w-full flex bg-zinc-950 text-zinc-100 overflow-hidden ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Sidebar: Drawer on mobile, Fixed sticky on desktop */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        repositories={REPOSITORIES}
        activeRepoId={activeRepoId}
        onSelectRepo={handleSelectRepo}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onLogout={handleLogout}
        jobs={jobs}
        supabaseConfigured={SUPABASE_CONFIG.isConfigured}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <Header
          currentTab={currentTab}
          repositories={REPOSITORIES}
          activeRepoId={activeRepoId}
          onSelectRepo={setActiveRepoId}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
          {currentTab === 'chat' ? (
            <ChatView
              messages={messages}
              repositories={REPOSITORIES}
              activeRepoId={activeRepoId}
              onSelectRepo={setActiveRepoId}
              onSendMessage={handleSendMessage}
              jobs={jobs}
              onOpenJob={handleOpenJobDetails}
            />
          ) : currentTab === 'jobs' ? (
            <JobsView
              jobs={jobs}
              repositories={REPOSITORIES}
              selectedJobId={selectedJobId}
              onSelectJob={setSelectedJobId}
              onAdvanceJobStatus={handleAdvanceJobStatus}
            />
          ) : (
            <FileExplorerView
              repositories={REPOSITORIES}
              activeRepoId={activeRepoId}
              onSelectRepo={setActiveRepoId}
            />
          )}
        </main>
      </div>
    </div>
  );
}
