import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStore, ServerChatMessage } from './_store';
import { dbService } from './_supabase';

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

  // POST /api/chat -> Send message and create Job in Supabase
  if (req.method === 'POST') {
    const { content, repositoryId } = req.body || {};

    if (!content || !repositoryId) {
      return res.status(400).json({ error: 'content e repositoryId são obrigatórios' });
    }

    const userMsgId = `msg-usr-${Date.now()}`;
    const slug = content.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24);
    const branchName = `feat/${slug || 'task-auto'}`;

    try {
      // 1. Criar novo Job no Supabase agent_jobs
      const newJob = await dbService.createJob({
        repo: repositoryId,
        userMessage: content,
        branchName
      });

      // 2. Criar mensagem do usuário
      const userMsg: ServerChatMessage = {
        id: userMsgId,
        sender: 'user',
        content,
        repositoryId,
        createdAt: new Date().toISOString(),
        jobId: newJob.id
      };

      // 3. Criar resposta do agente
      const agentMsgId = `msg-agt-${Date.now()}`;
      const agentMsg: ServerChatMessage = {
        id: agentMsgId,
        sender: 'agent',
        repositoryId,
        content: `Recebi sua solicitação para o **${repositoryId}**!\n\nUm novo registro de execução foi criado com o identificador **${newJob.id}** na branch \`${branchName}\`.\n\nVocê pode acompanhar em tempo real na aba **Jobs** ou no card de detalhes anexo.`,
        createdAt: new Date().toISOString(),
        jobId: newJob.id
      };

      store.messages.push(userMsg);
      store.messages.push(agentMsg);

      return res.status(201).json({
        userMessage: userMsg,
        agentMessage: agentMsg,
        job: newJob
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erro ao processar mensagem do chat' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
