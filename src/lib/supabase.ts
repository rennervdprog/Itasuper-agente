import { Job, ChatMessage } from '../types';

/**
 * Supabase client configuration stub.
 * Quando você fornecer as credenciais do Supabase no futuro,
 * este módulo conectará diretamente à tabela `jobs` e `chat_messages`.
 */

export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  isConfigured: Boolean(
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co' &&
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )
};

const STORAGE_KEYS = {
  JOBS: 'itasuper_agent_jobs_v1',
  MESSAGES: 'itasuper_agent_messages_v1',
  AUTH: 'itasuper_agent_auth_session',
  REPO: 'itasuper_agent_active_repo',
  THEME: 'itasuper_agent_theme',
};

// Local storage storage adapters (simulando a camada Supabase)
export const localStore = {
  getJobs: (initialJobs: Job[]): Job[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.JOBS);
      if (!data) return initialJobs;
      return JSON.parse(data);
    } catch {
      return initialJobs;
    }
  },

  saveJobs: (jobs: Job[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
    } catch (e) {
      console.warn('Erro ao salvar jobs no localStorage', e);
    }
  },

  getMessages: (initialMessages: ChatMessage[]): ChatMessage[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (!data) return initialMessages;
      return JSON.parse(data);
    } catch {
      return initialMessages;
    }
  },

  saveMessages: (messages: ChatMessage[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    } catch (e) {
      console.warn('Erro ao salvar mensagens no localStorage', e);
    }
  },

  getTheme: (): 'dark' | 'light' => {
    try {
      return (localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  },

  setTheme: (theme: 'dark' | 'light'): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      console.warn('Erro ao salvar tema', e);
    }
  },

  getAuthSession: (): boolean => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
    } catch {
      return false;
    }
  },

  setAuthSession: (authenticated: boolean): void => {
    try {
      if (authenticated) {
        localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH);
      }
    } catch (e) {
      console.warn('Erro ao atualizar sessão', e);
    }
  }
};
