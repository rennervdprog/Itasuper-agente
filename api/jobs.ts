import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStore, ServerJob } from './_store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const store = getStore();

  // GET /api/jobs -> List all jobs
  if (req.method === 'GET') {
    const { repositoryId, status } = req.query;
    let result = store.jobs;

    if (repositoryId && typeof repositoryId === 'string') {
      result = result.filter(j => j.repositoryId === repositoryId);
    }

    if (status && typeof status === 'string') {
      result = result.filter(j => j.status === status);
    }

    return res.status(200).json(result);
  }

  // POST /api/jobs -> Create new job manually
  if (req.method === 'POST') {
    const { repositoryId, originalMessage, branchName } = req.body || {};

    if (!repositoryId || !originalMessage) {
      return res.status(400).json({ error: 'repositoryId e originalMessage são obrigatórios' });
    }

    const newJobId = `job-${Math.floor(100 + Math.random() * 900)}`;
    const slug = originalMessage.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24);
    const generatedBranch = branchName || `feat/${slug || 'task-auto'}`;

    const newJob: ServerJob = {
      id: newJobId,
      repositoryId,
      originalMessage,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      summary: `Execução solicitada para ${repositoryId}: "${originalMessage}"`,
      branchName: generatedBranch,
      filesModified: [
        repositoryId === 'ifood-style-landing' ? 'src/components/feature/NewModule.tsx' :
        repositoryId === 'Itasuper-APP-NATIVO' ? 'src/screens/AppFeatureScreen.tsx' : 'services/deliveryTask.ts'
      ],
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Job registrado com sucesso para ${repositoryId}.`
        }
      ]
    };

    store.jobs.unshift(newJob);

    return res.status(201).json(newJob);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
