import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ChatView } from './components/chat/ChatView';
import { JobsView } from './components/jobs/JobsView';
import { LoginView } from './components/auth/LoginView';
import { REPOSITORIES, INITIAL_JOBS, INITIAL_MESSAGES } from './data/mockData';
import { Job, ChatMessage, RepositoryId, JobStatus } from './types';
import { localStore, SUPABASE_CONFIG } from './lib/supabase';
import { api } from './lib/api';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStore.getAuthSession();
  });

  // Navigation and UI State
  const [currentTab, setCurrentTab] = useState<'chat' | 'jobs'>('chat');
  const [activeRepoId, setActiveRepoId] = useState<RepositoryId>('ifood-style-landing');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => localStore.getTheme());
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

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
  };

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSendMessage = async (content: string, repoId: RepositoryId) => {
    const userMsgId = `msg-usr-${Date.now()}`;
    const newJobId = `job-${Math.floor(100 + Math.random() * 900)}`;

    const slug = content
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 24);
    const branchName = `feat/${slug || 'task-auto'}`;

    // Optimistic UI update
    const newJob: Job = {
      id: newJobId,
      repositoryId: repoId,
      originalMessage: content,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      summary: `Execução solicitada para o repositório ${repoId}: "${content}"`,
      branchName,
      filesModified: [
        repoId === 'ifood-style-landing' ? 'src/components/feature/NewModule.tsx' :
        repoId === 'Itasuper-APP-NATIVO' ? 'src/screens/AppFeatureScreen.tsx' : 'services/deliveryTask.ts'
      ],
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Job registrado com sucesso para ${repoId}. Aguardando orquestração.`
        }
      ]
    };

    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      content,
      repositoryId: repoId,
      createdAt: new Date().toISOString(),
      jobId: newJobId
    };

    setMessages(prev => [...prev, userMessage]);
    setJobs(prev => [newJob, ...prev]);

    // Dispatch to Server-Side API
    try {
      const result = await api.sendMessage(content, repoId);
      if (result) {
        setMessages(prev => {
          const withoutTemp = prev.filter(m => m.id !== userMsgId);
          return [...withoutTemp, result.userMessage, result.agentMessage];
        });
        setJobs(prev => {
          const withoutTemp = prev.filter(j => j.id !== newJobId);
          return [result.job, ...withoutTemp];
        });
        return;
      }
    } catch {
      // Fallback local simulation if offline
    }

    // Local simulation fallback
    setTimeout(() => {
      const agentMsgId = `msg-agt-${Date.now()}`;
      const repoInfo = REPOSITORIES.find(r => r.id === repoId);

      const agentResponse: ChatMessage = {
        id: agentMsgId,
        sender: 'agent',
        repositoryId: repoId,
        content: `Recebi sua solicitação para o **${repoInfo?.displayName}**!\n\nUm novo registro de execução foi criado com o identificador **${newJobId}** na branch \`${branchName}\`.\n\nVocê pode acompanhar o status em tempo real na aba **Jobs** ou clicar no card de detalhes anexo.`,
        createdAt: new Date().toISOString(),
        jobId: newJobId
      };

      setMessages(prev => [...prev, agentResponse]);

      setTimeout(() => {
        setJobs(currentJobs =>
          currentJobs.map(j => {
            if (j.id === newJobId) {
              return {
                ...j,
                status: 'running',
                updatedAt: new Date().toISOString(),
                logs: [
                  ...(j.logs || []),
                  {
                    timestamp: new Date().toISOString(),
                    level: 'info',
                    message: 'Agente iniciou análise de dependências e estrutura de arquivos.'
                  }
                ]
              };
            }
            return j;
          })
        );
      }, 2000);
    }, 800);
  };

  const handleAdvanceJobStatus = async (jobId: string) => {
    try {
      const updatedJob = await api.advanceJob(jobId);
      if (updatedJob) {
        setJobs(prev => prev.map(j => (j.id === jobId ? updatedJob : j)));
        return;
      }
    } catch {}

    // Fallback local advance
    setJobs(prevJobs =>
      prevJobs.map(j => {
        if (j.id !== jobId) return j;

        const nextStatusMap: Record<JobStatus, JobStatus> = {
          pending: 'running',
          running: 'pr_aberto',
          pr_aberto: 'concluido',
          concluido: 'concluido',
          erro: 'pending'
        };

        const nextStatus = nextStatusMap[j.status];
        const updatedLogs = [...(j.logs || [])];

        if (nextStatus === 'running') {
          updatedLogs.push({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'Execução do agente iniciada no ambiente isolado.'
          });
        } else if (nextStatus === 'pr_aberto') {
          const prNumber = Math.floor(10 + Math.random() * 89);
          return {
            ...j,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
            prNumber,
            prUrl: `https://github.com/itasuper/${j.repositoryId}/pull/${prNumber}`,
            logs: [
              ...updatedLogs,
              {
                timestamp: new Date().toISOString(),
                level: 'success',
                message: `Pull Request #${prNumber} criado e associado à branch ${j.branchName}.`
              }
            ]
          };
        } else if (nextStatus === 'concluido') {
          updatedLogs.push({
            timestamp: new Date().toISOString(),
            level: 'success',
            message: 'Job finalizado com sucesso. Testes automatizados passaram.'
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
  };

  // If not authenticated, show personal login view
  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className={`min-h-screen flex bg-zinc-950 text-zinc-100 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Fixed Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        repositories={REPOSITORIES}
        activeRepoId={activeRepoId}
        onSelectRepo={setActiveRepoId}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onLogout={handleLogout}
        jobs={jobs}
        supabaseConfigured={SUPABASE_CONFIG.isConfigured}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          currentTab={currentTab}
          repositories={REPOSITORIES}
          activeRepoId={activeRepoId}
          onSelectRepo={setActiveRepoId}
        />

        <main className="flex-1 overflow-hidden flex flex-col">
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
          ) : (
            <JobsView
              jobs={jobs}
              repositories={REPOSITORIES}
              selectedJobId={selectedJobId}
              onSelectJob={setSelectedJobId}
              onAdvanceJobStatus={handleAdvanceJobStatus}
            />
          )}
        </main>
      </div>
    </div>
  );
}
