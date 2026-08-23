import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStore, ServerChatMessage } from './_store';
import { dbService } from './_supabase';
import { enqueueJobExecution } from './_queue';

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
    try {
      console.log(`[Chat:POST] Recebida mensagem para repo="${repositoryId}": "${content.slice(0, 60)}..."`);

      // 1. Criar novo Job no Supabase agent_jobs (sem criar branch antecipadamente)
      const newJob = await dbService.createJob({
        repo: repositoryId,
        userMessage: content
      });

      console.log(`[Chat:POST] Job ${newJob.id} criado com status="${newJob.status}". Enfileirando processamento...`);

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
        content: `Recebi sua solicitação para o repositório **${repositoryId}**!\n\nO **Job ${newJob.id}** foi registrado com status **pending** e está sendo processado.\n\nSe a tarefa exigir alterações de código, uma branch e um Pull Request serão gerados no GitHub. Caso seja uma dúvida ou análise, responderei com o parecer técnico.\n\nAcompanhe a evolução na aba **Jobs** ou no card anexo.`,
        createdAt: new Date().toISOString(),
        jobId: newJob.id
      };

      store.messages.push(userMsg);
      store.messages.push(agentMsg);

      // 4. Enfileirar execução assíncrona do Job no Upstash QStash / Background
      const proto = (req.headers['x-forwarded-proto'] as string) || 'http';
      enqueueJobExecution(newJob.id, req.headers.host, proto).catch(err => {
        console.error(`[Chat:POST] Erro ao enfileirar job ${newJob.id}:`, err);
      });

      return res.status(201).json({
        userMessage: userMsg,
        agentMessage: agentMsg,
        job: newJob
      });
    } catch (e: any) {
      console.error(`[Chat:POST] Erro fatal:`, e);
      return res.status(500).json({ error: e.message || 'Erro ao processar mensagem do chat' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
