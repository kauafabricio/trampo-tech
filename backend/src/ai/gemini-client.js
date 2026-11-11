import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_500;

/**
 * Aguarda um tempo antes de tentar novamente (backoff simples).
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Cria e retorna o cliente Gemini (singleton).
 * @param {{ apiKey: string, modelName: string, timeoutMs?: number, maxRetries?: number }} options
 */
export function createGeminiClient({ apiKey, modelName, timeoutMs = DEFAULT_TIMEOUT_MS, maxRetries = DEFAULT_MAX_RETRIES }) {
  if (!apiKey) throw new Error('GEMINI_API_KEY é obrigatória.');
  if (!modelName) throw new Error('GEMINI_MODEL é obrigatório.');

  const genAI = new GoogleGenerativeAI(apiKey);

  /**
   * Chama o modelo com retry e timeout.
   * @param {{ systemPrompt: string, userPrompt: string, jsonMode?: boolean }} params
   * @returns {Promise<string>} Texto retornado pelo modelo
   */
  async function generate({ systemPrompt, userPrompt, jsonMode = false }) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
      generationConfig: jsonMode
        ? { responseMimeType: 'application/json' }
        : {},
    });

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        await sleep(RETRY_DELAY_MS * attempt);
      }

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const result = await model.generateContent(userPrompt);
          clearTimeout(timer);
          return result.response.text();
        } finally {
          clearTimeout(timer);
        }
      } catch (err) {
        lastError = err;

        // Não tenta novamente em erros de autenticação ou quota
        const status = err?.status ?? err?.httpErrorCode;
        if (status === 401 || status === 403 || status === 429) {
          break;
        }
      }
    }

    throw lastError;
  }

  /**
   * Verifica se a API Key é válida gerando um conteúdo mínimo.
   * @returns {Promise<boolean>}
   */
  async function healthCheck() {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Responda apenas: ok');
    const text = result.response.text().trim().toLowerCase();
    return text.length > 0;
  }

  return { generate, healthCheck, modelName };
}
