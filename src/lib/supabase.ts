import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Job, ChatMessage, RepositoryId } from '../types';

/**
 * Types representing the real Supabase database schema (supabase/migrations/001_init.sql)
 */
export interface AgentJobRow {
  id: string;
  repo: 'ifood-style-landing' | 'itasuper-app-nativo' | 'itasuper-entregador';
  user_message: string;
  status: 'pending' | 'running' | 'pr_aberto' | 'concluido' | 'erro';
  result_summary: string | null;
  pr_url: string | null;
  branch_name: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentMemoryRow {
  id: string;
  repo: string;
  content: string;
  memory_type: 'decisao' | 'convencao' | 'bug_resolvido' | 'preferencia' | 'contexto_geral';
  embedding: number[] | null;
  created_at: string;
}

/**
 * Configuration & Credentials (Frontend Client)
 */
const viteSupabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const viteSupabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const SUPABASE_CONFIG = {
  url: viteSupabaseUrl,
  anonKey: viteSupabaseAnonKey,
  isConfigured: Boolean(
    viteSupabaseUrl && 
    viteSupabaseUrl !== 'https://your-project.supabase.co' &&
    viteSupabaseAnonKey &&
    viteSupabaseAnonKey !== 'your-anon-key-here'
  )
};

/**
 * 1. Public Client (Anon Key)
 * For frontend usage: uses import.meta.env.VITE_SUPABASE_URL and import.meta.env.VITE_SUPABASE_ANON_KEY
 */
let publicClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_CONFIG.isConfigured) {
    return null;
  }
  if (!publicClient) {
    publicClient = createClient(viteSupabaseUrl, viteSupabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  }
  return publicClient;
}

export const supabase = SUPABASE_CONFIG.isConfigured ? getSupabaseClient() : null;

/**
 * 2. Admin Client (Service Role Key)
 * Exclusive for server-side API routes (/api/*).
 * Uses process.env.SUPABASE_URL and process.env.SUPABASE_SERVICE_ROLE_KEY.
 * NEVER expose the service role key to the browser client.
 */
let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  // Guard against browser execution
  if (typeof window !== 'undefined') {
    throw new Error('Supabase Admin Client (service_role) cannot be accessed from the browser.');
  }

  if (adminClient) {
    return adminClient;
  }

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey || serviceRoleKey === 'your-service-role-key-here') {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required for Admin operations.');
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return adminClient;
}

/**
 * Normalization helpers between UI casing and Supabase database constraints
 */
export function normalizeRepoForDb(repoId: string): 'ifood-style-landing' | 'itasuper-app-nativo' | 'itasuper-entregador' {
  const clean = repoId.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+$/, '');
  if (clean.includes('nativo')) return 'itasuper-app-nativo';
  if (clean.includes('entregador')) return 'itasuper-entregador';
  return 'ifood-style-landing';
}

export function mapDbJobToUI(dbJob: AgentJobRow): Job {
  let uiRepo: RepositoryId = 'ifood-style-landing';
  if (dbJob.repo === 'itasuper-app-nativo') uiRepo = 'Itasuper-APP-NATIVO';
  else if (dbJob.repo === 'itasuper-entregador') uiRepo = 'Itasuper-entregador-';

  return {
    id: dbJob.id,
    repositoryId: uiRepo,
    originalMessage: dbJob.user_message,
    status: dbJob.status,
    summary: dbJob.result_summary || undefined,
    branchName: dbJob.branch_name || undefined,
    prUrl: dbJob.pr_url || undefined,
    errorMessage: dbJob.error_message || undefined,
    createdAt: dbJob.created_at,
    updatedAt: dbJob.updated_at,
    logs: [
      {
        timestamp: dbJob.created_at,
        level: 'info',
        message: `Job registrado no Supabase (ID: ${dbJob.id}). Repositório: ${dbJob.repo}`
      },
      ...(dbJob.result_summary ? [{
        timestamp: dbJob.updated_at,
        level: 'success' as const,
        message: dbJob.result_summary
      }] : []),
      ...(dbJob.error_message ? [{
        timestamp: dbJob.updated_at,
        level: 'error' as const,
        message: dbJob.error_message
      }] : [])
    ]
  };
}

/**
 * Storage keys and client-side fallback store
 */
const STORAGE_KEYS = {
  JOBS: 'itasuper_agent_jobs_v1',
  MESSAGES: 'itasuper_agent_messages_v1',
  AUTH: 'itasuper_agent_auth_session',
  REPO: 'itasuper_agent_active_repo',
  THEME: 'itasuper_agent_theme',
};

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
