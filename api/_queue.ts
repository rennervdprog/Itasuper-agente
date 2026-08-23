import { Client, Receiver } from '@upstash/qstash';

let qstashClient: Client | null = null;
let qstashReceiver: Receiver | null = null;

export function getQStashClient(): Client | null {
  const token = process.env.QSTASH_TOKEN;
  if (!token || token === 'your-qstash-token') {
    return null;
  }
  if (!qstashClient) {
    qstashClient = new Client({ token });
  }
  return qstashClient;
}

export function getQStashReceiver(): Receiver | null {
  const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY || currentKey;

  if (!currentKey || currentKey === 'your-signing-key') {
    return null;
  }

  if (!qstashReceiver) {
    qstashReceiver = new Receiver({
      currentSigningKey: currentKey,
      nextSigningKey: nextKey
    });
  }
  return qstashReceiver;
}

/**
 * Publica um job no QStash para execução assíncrona.
 * Se o QStash não estiver configurado ou a URL for local/inacessível externamente,
 * faz execução imediata via worker assíncrono em background.
 */
export async function enqueueJobExecution(jobId: string, requestHost?: string, protocol = 'https'): Promise<{ enqueued: boolean; messageId?: string; mode: 'qstash' | 'background_fallback' }> {
  console.log(`[Queue:Enqueue:Start] Solicitando processamento assíncrono para o Job ${jobId}...`);
  const client = getQStashClient();

  // Determinar URL de callback para a rota /api/process-job
  let baseUrl = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  if (!baseUrl && requestHost) {
    baseUrl = `${protocol}://${requestHost}`;
  }
  if (!baseUrl) {
    baseUrl = 'http://localhost:3000';
  }
  baseUrl = baseUrl.replace(/\/+$/, '');
  const destinationUrl = `${baseUrl}/api/process-job`;

  const isLocalOrPrivate = destinationUrl.includes('localhost') || 
                           destinationUrl.includes('127.0.0.1') || 
                           !destinationUrl.startsWith('https://');

  if (client && !isLocalOrPrivate) {
    try {
      console.log(`[Queue:QStash:Publishing] Publicando Job ${jobId} na fila Upstash QStash para URL pública: ${destinationUrl}`);
      const res = await client.publishJSON({
        url: destinationUrl,
        body: { jobId, job_id: jobId },
        retries: 2
      });

      console.log(`[Queue:QStash:Success] Job ${jobId} publicado com sucesso no QStash! MessageId: ${res.messageId}`);
      return {
        enqueued: true,
        messageId: res.messageId,
        mode: 'qstash'
      };
    } catch (err: any) {
      console.warn(`[Queue:QStash:Error] Falha ao publicar no QStash (${err.message}). Acionando worker em background local imediatamente...`);
    }
  } else {
    if (!client) {
      console.log(`[Queue:Mode] QSTASH_TOKEN não configurado. Utilizando worker de execução em segundo plano local.`);
    } else if (isLocalOrPrivate) {
      console.log(`[Queue:Mode] Ambiente local/dev detectado (${destinationUrl}). Disparando worker de execução em segundo plano diretamente.`);
    }
  }

  // Execução via background worker (garante que nenhum job fique travado em 'pending')
  console.log(`[Queue:Background:Trigger] Disparando worker assíncrono para o Job ${jobId}...`);
  setTimeout(async () => {
    try {
      console.log(`[Queue:Background:Run] Importando e executando processJobById("${jobId}")...`);
      const { processJobById } = await import('./process-job');
      const outcome = await processJobById(jobId);
      console.log(`[Queue:Background:Done] Job ${jobId} processado pelo worker com sucesso: status="${outcome.status}"`);
    } catch (e: any) {
      console.error(`[Queue:Background:Error] Erro fatal durante a execução em background do Job ${jobId}:`, e);
    }
  }, 50);

  return {
    enqueued: true,
    mode: 'background_fallback'
  };
}
