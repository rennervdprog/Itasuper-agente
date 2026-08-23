import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dbService } from './_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/jobs -> List all jobs from Supabase agent_jobs or store
  if (req.method === 'GET') {
    const { repositoryId, status } = req.query;
    try {
      const jobs = await dbService.getJobs(
        typeof repositoryId === 'string' ? repositoryId : undefined,
        typeof status === 'string' ? status : undefined
      );
      return res.status(200).json(jobs);
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erro ao buscar jobs' });
    }
  }

  // POST /api/jobs -> Create new job in Supabase agent_jobs
  if (req.method === 'POST') {
    const { repositoryId, originalMessage, branchName } = req.body || {};

    if (!repositoryId || !originalMessage) {
      return res.status(400).json({ error: 'repositoryId e originalMessage são obrigatórios' });
    }

    try {
      const slug = originalMessage.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24);
      const generatedBranch = branchName || `feat/${slug || 'task-auto'}`;

      const newJob = await dbService.createJob({
        repo: repositoryId,
        userMessage: originalMessage,
        branchName: generatedBranch
      });

      return res.status(201).json(newJob);
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erro ao criar job no Supabase' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
