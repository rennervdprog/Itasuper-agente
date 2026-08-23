import { GoogleGenAI } from '@google/genai';

export interface AICodeChangePayload {
  type: 'code_change';
  file_path: string;
  new_content: string;
  commit_message: string;
  pr_title: string;
  pr_description: string;
}

export interface AIInfoPayload {
  type: 'info';
  message: string;
}

export type AIPayload = AICodeChangePayload | AIInfoPayload;

export interface AIResult {
  rawText: string;
  parsed: AIPayload;
  provider: 'deepseek' | 'gemini';
  modelUsed: string;
  fallbackTriggered: boolean;
  fallbackReason?: string;
}

/**
 * Utilitário para limpar e extrair JSON de respostas textuais das LLMs
 */
function cleanAndParseJson(text: string): AIPayload {
  let cleaned = text.trim();
  // Remove markdown codeblocks if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('A resposta gerada não é um objeto JSON válido.');
    }
    if (parsed.type !== 'code_change' && parsed.type !== 'info') {
      // Normalização amigável se a LLM omitiu o tipo mas enviou mensagem
      if (parsed.message) {
        parsed.type = 'info';
      } else if (parsed.file_path && parsed.new_content) {
        parsed.type = 'code_change';
      } else {
        parsed.type = 'info';
        parsed.message = JSON.stringify(parsed);
      }
    }
    return parsed as AIPayload;
  } catch (err: any) {
    console.error('[AI Provider] Erro no JSON.parse da resposta:', cleaned, err);
    throw new Error(`Falha ao decodificar JSON retornado pela IA: ${err.message}`);
  }
}

/**
 * 1. Chamada primária ao DeepSeek (compatível com OpenAI REST API)
 */
async function callDeepSeek(prompt: string, systemInstruction?: string): Promise<{ text: string; model: string }> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey || apiKey === 'your-deepseek-api-key') {
    throw new Error('DEEPSEEK_API_KEY não configurada no backend');
  }

  const model = 'deepseek-v4-flash';
  const endpoint = 'https://api.deepseek.com/chat/completions';

  const messages = [
    {
      role: 'system',
      content: systemInstruction || 'Você é o Agente de IA ItaSuper Delivery. Responda estritamente em formato JSON estruturado.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.2
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`DeepSeek API retornou HTTP ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('DeepSeek retornou choices vazias ou sem conteúdo');
    }

    return {
      text: content,
      model
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * 2. Chamada de fallback ao Google Gemini
 */
async function callGemini(prompt: string, systemInstruction?: string): Promise<{ text: string; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your-gemini-api-key') {
    throw new Error('GEMINI_API_KEY não configurada no backend');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  const candidateModels = ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[AI Provider:Gemini] Tentando modelo "${model}" (tentativa ${attempt})...`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction || 'Você é o Agente de IA ItaSuper Delivery. Responda estritamente em formato JSON estruturado.',
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        });

        const text = response.text;
        if (text) {
          console.log(`[AI Provider:Gemini] Sucesso com o modelo "${model}".`);
          return {
            text,
            model
          };
        }
      } catch (err: any) {
        lastError = err;
        const msg = err.message || String(err);
        console.warn(`[AI Provider:Gemini] Modelo "${model}" falhou (${msg}).`);
        if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('429')) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error('Todos os modelos Gemini falharam');
}

/**
 * Função principal com Fallback Automático:
 * 1. Tenta DeepSeek (Principal)
 * 2. Se falhar (rede, cota, 401, 429, timeout), registra log e tenta Gemini (Reserva)
 * 3. Se ambos falharem, lança erro explicativo
 */
export async function callAI(prompt: string, systemInstruction?: string): Promise<AIResult> {
  let deepSeekErrorMsg: string | null = null;

  // Tentativa 1: DeepSeek
  try {
    console.log('[AI Provider] Iniciando chamada com provedor principal: DeepSeek...');
    const result = await callDeepSeek(prompt, systemInstruction);
    const parsed = cleanAndParseJson(result.text);

    console.log('[AI Provider] Resposta do DeepSeek obtida com sucesso.');
    return {
      rawText: result.text,
      parsed,
      provider: 'deepseek',
      modelUsed: result.model,
      fallbackTriggered: false
    };
  } catch (error: any) {
    deepSeekErrorMsg = error.message || String(error);
    console.warn(`[AI Provider] Falha no DeepSeek: "${deepSeekErrorMsg}". Acionando fallback automático para Gemini...`);
  }

  // Tentativa 2: Gemini Fallback
  try {
    console.log('[AI Provider] Executando chamada de contingência com Gemini...');
    const result = await callGemini(prompt, systemInstruction);
    const parsed = cleanAndParseJson(result.text);

    console.log('[AI Provider] Resposta do Gemini (Fallback) obtida com sucesso.');
    return {
      rawText: result.text,
      parsed,
      provider: 'gemini',
      modelUsed: result.model,
      fallbackTriggered: true,
      fallbackReason: deepSeekErrorMsg || 'Falha no provedor principal'
    };
  } catch (geminiError: any) {
    const geminiMsg = geminiError.message || String(geminiError);
    console.error('[AI Provider] Ambos os provedores de IA falharam:', {
      deepSeekError: deepSeekErrorMsg,
      geminiError: geminiMsg
    });

    throw new Error(
      `Falha nos provedores de IA: [DeepSeek: ${deepSeekErrorMsg}] | [Gemini: ${geminiMsg}]`
    );
  }
}
