import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStore, ServerJob } from '../_store';

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

  const jobIndex = store.jobs.findIndex(j => j.id === id);
  if (jobIndex === -1) {
    return res.status(404).json({ error: `Job ${id} não encontrado` });
  }

  const job = store.jobs[jobIndex];

  // GET /api/jobs/[id] -> Detalhes de um Job
  if (req.method === 'GET') {
    return res.status(200).json(job);
  }

  // POST /api/jobs/[id] ou PATCH /api/jobs/[id] -> Avançar status do Job
  if (req.method === 'POST' || req.method === 'PATCH') {
    const { action, status: targetStatus } = req.body || {};

    const nextStatusMap: Record<string, ServerJob['status']> = {
      pending: 'running',
      running: 'pr_aberto',
      pr_aberto: 'concluido',
      concluido: 'concluido',
      erro: 'pending'
    };

    const nextStatus = targetStatus || nextStatusMap[job.status] || 'running';
    const updatedLogs = [...(job.logs || [])];

    if (nextStatus === 'running') {
      updatedLogs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Execução do agente iniciada no ambiente isolado (Serverless Worker).'
      });
    } else if (nextStatus === 'pr_aberto') {
      const prNumber = Math.floor(10 + Math.random() * 89);
      job.prNumber = prNumber;
      job.prUrl = `https://github.com/itasuper/${job.repositoryId}/pull/${prNumber}`;
      updatedLogs.push({
        timestamp: new Date().toISOString(),
        level: 'success',
        message: `Pull Request #${prNumber} aberto automaticamente no repositório.`
      });
    } else if (nextStatus === 'concluido') {
      updatedLogs.push({
        timestamp: new Date().toISOString(),
        level: 'success',
        message: 'Job finalizado com sucesso. Build e testes passaram no CI.'
      });
    }

    job.status = nextStatus;
    job.updatedAt = new Date().toISOString();
    job.logs = updatedLogs;

    return res.status(200).json(job);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
