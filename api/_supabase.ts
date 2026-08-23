import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ServerJob, ServerChatMessage, getStore } from './_store';

let adminSupabase: SupabaseClient | null = null;

export function getSupabaseAdminServer(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || key === 'your-service-role-key-here' || url === 'https://your-project.supabase.co') {
    return null;
  }

  if (!adminSupabase) {
    adminSupabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return adminSupabase;
}

export function normalizeRepo(repo: string): 'ifood-style-landing' | 'itasuper-app-nativo' | 'itasuper-entregador' {
  const r = repo.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+$/, '');
  if (r.includes('nativo')) return 'itasuper-app-nativo';
  if (r.includes('entregador')) return 'itasuper-entregador';
  return 'ifood-style-landing';
}

export function mapRepoToUI(repo: string): 'ifood-style-landing' | 'Itasuper-APP-NATIVO' | 'Itasuper-entregador-' {
  if (repo === 'itasuper-app-nativo') return 'Itasuper-APP-NATIVO';
  if (repo === 'itasuper-entregador') return 'Itasuper-entregador-';
  return 'ifood-style-landing';
}

export const dbService = {
  async getJobs(repoFilter?: string, statusFilter?: string): Promise<ServerJob[]> {
    const supabase = getSupabaseAdminServer();
    if (!supabase) {
      let jobs = getStore().jobs;
      if (repoFilter) {
        jobs = jobs.filter(j => j.repositoryId === repoFilter);
      }
      if (statusFilter) {
        jobs = jobs.filter(j => j.status === statusFilter);
      }
      return jobs;
    }

    try {
      let query = supabase
        .from('agent_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (repoFilter) {
        query = query.eq('repo', normalizeRepo(repoFilter));
      }
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        return getStore().jobs;
      }

      return data.map((row: any): ServerJob => ({
        id: row.id,
        repositoryId: mapRepoToUI(row.repo),
        originalMessage: row.user_message,
        status: row.status,
        summary: row.result_summary || undefined,
        branchName: row.branch_name || undefined,
        prUrl: row.pr_url || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        logs: [
          {
            timestamp: row.created_at,
            level: 'info',
            message: `Job registrado no Supabase. Repositório: ${row.repo}`
          },
          ...(row.result_summary ? [{
            timestamp: row.updated_at,
            level: 'success' as const,
            message: row.result_summary
          }] : []),
          ...(row.error_message ? [{
            timestamp: row.updated_at,
            level: 'error' as const,
            message: row.error_message
          }] : [])
        ]
      }));
    } catch (err) {
      console.warn('Erro ao consultar Supabase agent_jobs, usando fallback:', err);
      return getStore().jobs;
    }
  },

  async createJob(data: { repo: string; userMessage: string; branchName?: string }): Promise<ServerJob> {
    const supabase = getSupabaseAdminServer();
    const normalizedRepo = normalizeRepo(data.repo);
    // NUNCA criar branch antecipadamente; apenas o worker cria branch se houver code_change
    const branch = data.branchName || null;

    console.log(`[Supabase:createJob] Criando job para repo="${normalizedRepo}", branch=${branch || 'nenhuma (aguardando worker)'}`);

    if (!supabase) {
      const newJobId = `job-${Math.floor(100 + Math.random() * 900)}`;
      const newJob: ServerJob = {
        id: newJobId,
        repositoryId: mapRepoToUI(normalizedRepo),
        originalMessage: data.userMessage,
        status: 'pending',
        branchName: branch || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        summary: `Solicitação registrada para ${normalizedRepo}`,
        logs: [
          {
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `Job registrado no painel (aguardando análise do worker).`
          }
        ]
      };
      getStore().jobs.unshift(newJob);
      console.log(`[Supabase:createJob] Job ${newJobId} registrado em memória local (fallback).`);
      return newJob;
    }

    const { data: inserted, error } = await supabase
      .from('agent_jobs')
      .insert({
        repo: normalizedRepo,
        user_message: data.userMessage,
        status: 'pending',
        branch_name: branch,
        result_summary: `Job criado pelo Agente para ${normalizedRepo}`
      })
      .select()
      .single();

    if (error) {
      console.error(`[Supabase:createJob] Erro ao inserir job no Supabase:`, error);
      throw error;
    }

    console.log(`[Supabase:createJob] Job ${inserted.id} salvo com sucesso no banco agent_jobs (status: pending).`);

    return {
      id: inserted.id,
      repositoryId: mapRepoToUI(inserted.repo),
      originalMessage: inserted.user_message,
      status: inserted.status,
      summary: inserted.result_summary || undefined,
      branchName: inserted.branch_name || undefined,
      prUrl: inserted.pr_url || undefined,
      createdAt: inserted.created_at,
      updatedAt: inserted.updated_at,
      logs: [
        {
          timestamp: inserted.created_at,
          level: 'info',
          message: `Job ${inserted.id} salvo na tabela agent_jobs do Supabase.`
        }
      ]
    };
  },

  async getJobById(id: string): Promise<ServerJob | null> {
    const supabase = getSupabaseAdminServer();
    if (!supabase) {
      const j = getStore().jobs.find(x => x.id === id);
      return j || null;
    }

    try {
      const { data, error } = await supabase
        .from('agent_jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return getStore().jobs.find(x => x.id === id) || null;
      }

      return {
        id: data.id,
        repositoryId: mapRepoToUI(data.repo),
        originalMessage: data.user_message,
        status: data.status,
        summary: data.result_summary || undefined,
        branchName: data.branch_name || undefined,
        prUrl: data.pr_url || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        logs: [
          {
            timestamp: data.created_at,
            level: 'info',
            message: `Job carregado do Supabase. Repositório: ${data.repo}`
          },
          ...(data.result_summary ? [{
            timestamp: data.updated_at,
            level: 'success' as const,
            message: data.result_summary
          }] : []),
          ...(data.error_message ? [{
            timestamp: data.updated_at,
            level: 'error' as const,
            message: data.error_message
          }] : [])
        ]
      };
    } catch (err) {
      console.warn('Erro ao buscar job por ID:', err);
      return getStore().jobs.find(x => x.id === id) || null;
    }
  },

  async updateJob(id: string, updates: Partial<{ status: string; result_summary: string; pr_url: string; branch_name: string; error_message: string }>): Promise<any> {
    const supabase = getSupabaseAdminServer();
    if (!supabase) {
      const storeJob = getStore().jobs.find(j => j.id === id);
      if (storeJob) {
        if (updates.status) storeJob.status = updates.status as any;
        if (updates.result_summary) storeJob.summary = updates.result_summary;
        if (updates.pr_url) storeJob.prUrl = updates.pr_url;
        storeJob.updatedAt = new Date().toISOString();
        return storeJob;
      }
      return null;
    }

    const { data, error } = await supabase
      .from('agent_jobs')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
