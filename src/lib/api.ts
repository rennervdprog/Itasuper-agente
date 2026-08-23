import { Job, ChatMessage, RepositoryInfo, RepositoryId } from '../types';

export const api = {
  // Auth
  login: async (password: string): Promise<{ success: boolean; token?: string; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      return await res.json();
    } catch {
      // Fallback local
      const isDefault = password === 'itasuper-admin' || password === 'admin';
      return { success: isDefault };
    }
  },

  // Repositories
  getRepositories: async (): Promise<RepositoryInfo[]> => {
    try {
      const res = await fetch('/api/repos');
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  // Jobs
  getJobs: async (): Promise<Job[]> => {
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  advanceJob: async (jobId: string): Promise<Job | null> => {
    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/advance`, {
        method: 'POST'
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  // Chat
  getMessages: async (): Promise<ChatMessage[]> => {
    try {
      const res = await fetch('/api/chat/messages');
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  sendMessage: async (content: string, repositoryId: RepositoryId): Promise<{ userMessage: ChatMessage; agentMessage: ChatMessage; job: Job } | null> => {
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, repositoryId })
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  }
};
