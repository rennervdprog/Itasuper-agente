import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dbService, normalizeRepo } from './_supabase';
import { getQStashReceiver } from './_queue';
import { callAI, AIPayload } from './_ai-provider';
import { createBranch, commitFile, createPullRequest, resolveRepoTarget } from './_github';

/**
 * Função central de execução de um Job de forma assíncrona
 */
export async function processJobById(jobId: string): Promise<{ success: boolean; status: string; result?: any; error?: string }> {
  console.log(`[Worker:Start] ========================================`);
  console.log(`[Worker:Start] Iniciando processamento do Job ID: ${jobId}`);

  // 1. Atualizar status inicial para "running"
  try {
    console.log(`[Worker:StatusChange] Atualizando Job ${jobId}: status "pending" -> "running"...`);
    await dbService.updateJob(jobId, {
      status: 'running',
      result_summary: 'Job em execução pelo Agente ItaSuper...'
    });
    console.log(`[Worker:StatusChange] Job ${jobId} agora está com status="running".`);
  } catch (err) {
    console.warn(`[Worker:StatusChange] Aviso ao atualizar status para running do job ${jobId}:`, err);
  }

  // 2. Buscar os dados completos do Job
  const job = await dbService.getJobById(jobId);
  if (!job) {
    const errMsg = `Job com ID ${jobId} não foi encontrado na base de dados.`;
    console.error(`[Worker:Error] ${errMsg}`);
    return { success: false, status: 'erro', error: errMsg };
  }

  const normalizedRepo = normalizeRepo(job.repositoryId);
  const userMessage = job.originalMessage;

  console.log(`[Worker:Context] Repositório alvo: "${normalizedRepo}" | Mensagem do usuário: "${userMessage}"`);

  // 3. Montar prompt para o provedor de IA com formato estrito
  const systemInstruction = `Você é o Agente de IA sênior do ecossistema ItaSuper Delivery.
Você opera nos seguintes repositórios:
1. "ifood-style-landing": Landing page institucional, cardápio web e PDV (React, Vite, Tailwind CSS, TypeScript).
2. "itasuper-app-nativo": Aplicativo mobile nativo para clientes realizarem pedidos (React Native / Expo / TypeScript).
3. "itasuper-entregador": Aplicativo de entregadores e motoristas para gestão de entregas (React Native / TypeScript).

O repositório alvo desta tarefa é: "${normalizedRepo}".

Você DEVE responder EXCLUSIVAMENTE em formato JSON com uma das duas estruturas:

OPÇÃO 1 - Resposta informativa / Dúvida / Pergunta simples / Planejamento sem alteração de código:
{
  "type": "info",
  "message": "Explicação detalhada, resposta técnica ou esclarecimento para o usuário em Markdown."
}

OPÇÃO 2 - Alteração ou criação de código / feature / bugfix:
{
  "type": "code_change",
  "file_path": "caminho/do/arquivo.ext",
  "new_content": "CONTEÚDO COMPLETO DO ARQUIVO ATUALIZADO (sem diffs parciais, o arquivo inteiro pronto para uso)",
  "commit_message": "feat(modulo): mensagem descritiva do commit",
  "pr_title": "feat: Título descritivo do Pull Request",
  "pr_description": "## Descrição das Alterações\\n\\n- Detalhe 1\\n- Detalhe 2"
}

Importante: Retorne APENAS o JSON válido, sem texto adicional fora do bloco JSON.`;

  const userPrompt = `Repositório Alvo: ${normalizedRepo}
Solicitação do Usuário: "${userMessage}"

Analise a solicitação e decida se deve gerar uma alteração de código ("code_change") ou uma resposta informativa ("info"). Gere o JSON correspondente.`;

  try {
    // 4. Executar chamada à IA (DeepSeek com fallback automático para Gemini)
    console.log(`[Worker:AI:Start] Enviando prompt para a IA...`);
    const aiResult = await callAI(userPrompt, systemInstruction);
    const parsed = aiResult.parsed;

    console.log(`[Worker:AI:Done] Provedor: ${aiResult.provider} (${aiResult.modelUsed}) | Tipo classificado: "${parsed.type}"`);

    const providerTag = aiResult.fallbackTriggered
      ? `[IA: ${aiResult.provider.toUpperCase()} (Fallback - Motivo: ${aiResult.fallbackReason})]`
      : `[IA: ${aiResult.provider.toUpperCase()}]`;

    // 5. Tratamento de Resposta Informativa ("info") - NENHUMA BRANCH É CRIADA
    if (parsed.type === 'info' || !('file_path' in parsed)) {
      console.log(`[Worker:Info] Resposta classificada como "info" (pergunta/consulta). NENHUMA branch ou PR será criado no GitHub.`);
      const summaryText = `${providerTag}\n\n${parsed.message || 'Solicitação analisada com sucesso.'}`;

      console.log(`[Worker:StatusChange] Atualizando Job ${jobId}: status "running" -> "concluido"...`);
      await dbService.updateJob(jobId, {
        status: 'concluido',
        result_summary: summaryText
      });

      console.log(`[Worker:Done] Job ${jobId} finalizado com status "concluido".`);
      console.log(`[Worker:End] ========================================`);
      return {
        success: true,
        status: 'concluido',
        result: { type: 'info', summary: summaryText, provider: aiResult.provider }
      };
    }

    // 6. Tratamento de Alteração de Código ("code_change") - BRANCH/COMMIT/PR EXCLUSIVO AQUI
    console.log(`[Worker:CodeChange] Tarefa classificada como alteração de código. Arquivo="${parsed.file_path}", PR="${parsed.pr_title}"`);

    // Criar branch baseada no ID do job
    const cleanId = jobId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 18);
    const branchName = `agent/job-${cleanId}-${Date.now().toString(36).slice(-4)}`;

    console.log(`[Worker:GitHub:Branch] Criando branch "${branchName}" a partir de "main" em "${normalizedRepo}"...`);
    await createBranch(normalizedRepo, branchName, 'main');
    console.log(`[Worker:GitHub:Branch] Branch "${branchName}" criada com sucesso!`);

    console.log(`[Worker:GitHub:Commit] Commitando alterações no arquivo "${parsed.file_path}" na branch "${branchName}"...`);
    await commitFile(
      normalizedRepo,
      branchName,
      parsed.file_path,
      parsed.new_content,
      parsed.commit_message || `feat: atualização automática via Agente ItaSuper (${jobId})`
    );
    console.log(`[Worker:GitHub:Commit] Commit realizado com sucesso!`);

    const prBody = `${parsed.pr_description || 'Pull Request gerado automaticamente pelo Agente ItaSuper.'}\n\n---\n*Execução do Job:* \`${jobId}\`\n*Provedor de IA Utilizado:* ${aiResult.provider.toUpperCase()}${aiResult.fallbackTriggered ? ` (Fallback do DeepSeek)` : ''}`;

    console.log(`[Worker:GitHub:PR] Abrindo Pull Request no GitHub para "${normalizedRepo}" (branch "${branchName}" -> "main")...`);
    const pr = await createPullRequest(
      normalizedRepo,
      branchName,
      parsed.pr_title || `feat: ${userMessage.slice(0, 50)}`,
      prBody,
      'main'
    );
    console.log(`[Worker:GitHub:PR] Pull Request criado com sucesso: ${pr.html_url}`);

    const resultSummary = `${providerTag} Pull Request criado com sucesso: ${pr.html_url}\n\nArquivo modificado: \`${parsed.file_path}\`\nBranch: \`${branchName}\``;

    console.log(`[Worker:StatusChange] Atualizando Job ${jobId}: status "running" -> "pr_aberto"...`);
    await dbService.updateJob(jobId, {
      status: 'pr_aberto',
      branch_name: branchName,
      pr_url: pr.html_url,
      result_summary: resultSummary
    });

    console.log(`[Worker:Done] Job ${jobId} finalizado com status "pr_aberto" (PR: ${pr.html_url})`);
    console.log(`[Worker:End] ========================================`);
    return {
      success: true,
      status: 'pr_aberto',
      result: {
        type: 'code_change',
        prUrl: pr.html_url,
        branch: branchName,
        filePath: parsed.file_path,
        provider: aiResult.provider
      }
    };
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    console.error(`[Worker:Error] Erro durante o processamento do Job ${jobId}:`, error);

    // Salvar erro no banco para nunca ficar travado em "running"
    try {
      console.log(`[Worker:StatusChange] Atualizando Job ${jobId}: status -> "erro"...`);
      await dbService.updateJob(jobId, {
        status: 'erro',
        error_message: errorMsg,
        result_summary: `Falha na execução do Job: ${errorMsg}`
      });
      console.log(`[Worker:StatusChange] Job ${jobId} atualizado para status="erro".`);
    } catch (dbErr) {
      console.error(`[Worker:Error] Falha crítica ao gravar status de erro no banco:`, dbErr);
    }

    console.log(`[Worker:End] ========================================`);
    return {
      success: false,
      status: 'erro',
      error: errorMsg
    };
  }
}

/**
 * Endpoint HTTP /api/process-job chamado pelo QStash ou disparos assíncronos
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Upstash-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET informativo para status da rota
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      endpoint: '/api/process-job',
      description: 'Worker assíncrono para processamento de jobs do Agente ItaSuper via Upstash QStash.'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Validação de assinatura QStash se configurado
  const receiver = getQStashReceiver();
  const signature = req.headers['upstash-signature'] as string | undefined;

  if (receiver && signature) {
    try {
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const isValid = await receiver.verify({
        signature,
        body: rawBody
      });

      if (!isValid) {
        console.warn('[ProcessJob] Assinatura do QStash inválida!');
        return res.status(401).json({ error: 'Assinatura QStash inválida.' });
      }
    } catch (err: any) {
      console.warn('[ProcessJob] Erro ao validar assinatura QStash:', err.message);
      return res.status(401).json({ error: 'Falha na validação da assinatura QStash.' });
    }
  }

  // 2. Extrair jobId do corpo da requisição
  const body = req.body || {};
  const jobId = body.jobId || body.job_id || body.id;

  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({
      error: 'jobId obrigatório no corpo da requisição',
      received: body
    });
  }

  try {
    const outcome = await processJobById(jobId);
    return res.status(outcome.success ? 200 : 500).json(outcome);
  } catch (fatalError: any) {
    console.error('[ProcessJob Fatal Error]', fatalError);
    return res.status(500).json({
      success: false,
      status: 'erro',
      error: fatalError.message || 'Erro inesperado no processamento do job'
    });
  }
}
