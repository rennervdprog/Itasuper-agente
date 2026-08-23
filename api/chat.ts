import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStore, ServerChatMessage, ServerJob } from './_store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const store = getStore();

  // GET /api/chat -> List chat messages
  if (req.method === 'GET') {
    const { repositoryId } = req.query;
    let list = store.messages;
    if (repositoryId && typeof repositoryId === 'string') {
      list = list.filter(m => m.repositoryId === repositoryId || m.id === 'msg-init-1');
    }
    return res.status(200).json(list);
  }

  // POST /api/chat -> Send message and create Job
  if (req.method === 'POST') {
    const { content, repositoryId } = req.body || {};

    if (!content || !repositoryId) {
      return res.status(400).json({ error: 'content e repositoryId são obrigatórios' });
    }

    const userMsgId = `msg-usr-${Date.now()}`;
    const newJobId = `job-${Math.floor(100 + Math.random() * 900)}`;

    const slug = content.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24);
    const branchName = `feat/${slug || 'task-auto'}`;

    // 1. Criar novo Job
    const newJob: ServerJob = {
      id: newJobId,
      repositoryId,
      originalMessage: content,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      summary: `Execução solicitada para ${repositoryId}: "${content}"`,
      branchName,
      filesModified: [
        repositoryId === 'ifood-style-landing' ? 'src/components/feature/NewModule.tsx' :
        repositoryId === 'Itasuper-APP-NATIVO' ? 'src/screens/AppFeatureScreen.tsx' : 'services/deliveryTask.ts'
      ],
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Job registrado com sucesso para ${repositoryId}. Alocando worker de execução.`
        }
      ]
    };

    // 2. Criar mensagem do usuário
    const userMsg: ServerChatMessage = {
      id: userMsgId,
      sender: 'user',
      content,
      repositoryId,
      createdAt: new Date().toISOString(),
      jobId: newJobId
    };

    // 3. Criar resposta do agente
    const agentMsgId = `msg-agt-${Date.now()}`;
    const agentMsg: ServerChatMessage = {
      id: agentMsgId,
      sender: 'agent',
      repositoryId,
      content: `Recebi sua solicitação para o **${repositoryId}**!\n\nUm novo registro de execução foi criado com o identificador **${newJobId}** na branch \`${branchName}\`.\n\nVocê pode acompanhar em tempo real na aba **Jobs** ou no card de detalhes anexo.`,
      createdAt: new Date().toISOString(),
      jobId: newJobId
    };

    store.jobs.unshift(newJob);
    store.messages.push(userMsg);
    store.messages.push(agentMsg);

    return res.status(201).json({
      userMessage: userMsg,
      agentMessage: agentMsg,
      job: newJob
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
