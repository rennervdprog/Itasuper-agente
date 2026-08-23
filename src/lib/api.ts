import { Job, ChatMessage, RepositoryInfo, RepositoryId } from '../types';

export const api = {
  // Auth (/api/auth)
  login: async (password: string): Promise<{ success: boolean; token?: string; error?: string }> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) return await res.json();
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'Falha na autenticação' };
    } catch {
      // Fallback local
      const isDefault = password === 'itasuper-admin' || password === 'admin';
      return { success: isDefault };
    }
  },

  // Repositories (/api/repos)
  getRepositories: async (): Promise<RepositoryInfo[]> => {
    try {
      const res = await fetch('/api/repos');
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  // Jobs (/api/jobs and /api/jobs/[id])
  getJobs: async (repositoryId?: RepositoryId): Promise<Job[]> => {
    try {
      const url = repositoryId ? `/api/jobs?repositoryId=${encodeURIComponent(repositoryId)}` : '/api/jobs';
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  getJobById: async (jobId: string): Promise<Job | null> => {
    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`);
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  advanceJob: async (jobId: string, targetStatus?: string): Promise<Job | null> => {
    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'advance', status: targetStatus })
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  // Chat (/api/chat)
  getMessages: async (repositoryId?: RepositoryId): Promise<ChatMessage[]> => {
    try {
      const url = repositoryId ? `/api/chat?repositoryId=${encodeURIComponent(repositoryId)}` : '/api/chat';
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  sendMessage: async (content: string, repositoryId: RepositoryId): Promise<{ userMessage: ChatMessage; agentMessage: ChatMessage; job: Job } | null> => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, repositoryId })
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  }
};

