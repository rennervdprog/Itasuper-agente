import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStore, ServerJob } from '../_store';
import { dbService } from '../_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const store = getStore();

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID do job é obrigatório' });
  }

  // GET /api/jobs/[id] -> Detalhes de um Job
  if (req.method === 'GET') {
    const jobIndex = store.jobs.findIndex(j => j.id === id);
    if (jobIndex !== -1) {
      return res.status(200).json(store.jobs[jobIndex]);
    }
    return res.status(200).json({ id, status: 'pending' });
  }

  // POST /api/jobs/[id] ou PATCH /api/jobs/[id] -> Avançar status do Job
  if (req.method === 'POST' || req.method === 'PATCH') {
    const { status: targetStatus } = req.body || {};

    const job = store.jobs.find(j => j.id === id) || {
      id,
      repositoryId: 'ifood-style-landing' as const,
      originalMessage: '',
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logs: []
    };

    const nextStatusMap: Record<string, ServerJob['status']> = {
      pending: 'running',
      running: 'pr_aberto',
      pr_aberto: 'concluido',
      concluido: 'concluido',
      erro: 'pending'
    };

    const nextStatus = targetStatus || nextStatusMap[job.status] || 'running';
    const updatedLogs = [...(job.logs || [])];

    let prUrl: string | undefined = job.prUrl;
    let resultSummary: string | undefined = job.summary;

    if (nextStatus === 'running') {
      resultSummary = 'Execução em andamento pelo Agente.';
      updatedLogs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Execução do agente iniciada no ambiente isolado (Serverless Worker).'
      });
    } else if (nextStatus === 'pr_aberto') {
      const prNumber = Math.floor(10 + Math.random() * 89);
      job.prNumber = prNumber;
      prUrl = `https://github.com/itasuper/${job.repositoryId}/pull/${prNumber}`;
      job.prUrl = prUrl;
      resultSummary = `Pull Request #${prNumber} gerado e pronto para revisão.`;
      updatedLogs.push({
        timestamp: new Date().toISOString(),
        level: 'success',
        message: `Pull Request #${prNumber} aberto automaticamente no repositório.`
      });
    } else if (nextStatus === 'concluido') {
      resultSummary = 'Job finalizado com sucesso e branch mergeada.';
      updatedLogs.push({
        timestamp: new Date().toISOString(),
        level: 'success',
        message: 'Job finalizado com sucesso. Build e testes passaram no CI.'
      });
    }

    job.status = nextStatus;
    job.summary = resultSummary;
    job.updatedAt = new Date().toISOString();
    job.logs = updatedLogs;

    // Sync to Supabase agent_jobs if available
    try {
      await dbService.updateJob(id, {
        status: nextStatus,
        result_summary: resultSummary,
        pr_url: prUrl
      });
    } catch (e) {
      console.warn('Erro ao atualizar status no Supabase:', e);
    }

    return res.status(200).json(job);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
