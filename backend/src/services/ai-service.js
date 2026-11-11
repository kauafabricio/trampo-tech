import { validateTrail } from '../trails/trail-schema.js';

const SYSTEM_PROMPT = `Você é um Arquiteto de Aprendizagem e Especialista em Gestão de Projetos para Startups e Tecnologia.
Sua missão é gerar trilhas educacionais altamente personalizadas e práticas com base no diagnóstico de competências do usuário.

REGRA ESTRITA DE ESTRUTURA (5x5x5):
- A trilha DEVE conter exatamente 5 módulos sequenciais.
- Cada módulo DEVE conter exatamente 5 tópicos de estudo detalhados e práticos.
- Cada módulo DEVE conter exatamente 1 avaliação com exatamente 5 perguntas de múltipla escolha.
- Cada pergunta DEVE conter exatamente 4 alternativas e o índice da resposta correta (0, 1, 2 ou 3).
- O resultado DEVE ser um objeto JSON puro, sem markdown e sem blocos de código adicionais.`;

/**
 * Normaliza e assegura IDs estáveis e únicos em toda a árvore da trilha gerada.
 * Garante compatibilidade total com o UserProgress e com o TrailSchema.
 * @param {any} trailData
 * @param {string} prefix
 */
export function ensureStableIds(trailData, prefix = 'custom') {
  if (!trailData || typeof trailData !== 'object') return trailData;

  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(-8) || 'c';
  const trailId = `custom-trail-${cleanPrefix}`;

  const normalized = {
    ...trailData,
    id: trailId,
    slug: trailData.slug || `trilha-personalizada-${cleanPrefix}`,
    titulo: trailData.titulo || 'Trilha Personalizada em Gestão de Projetos e Startups',
    descricao: trailData.descricao || 'Trilha estruturada sob medida com base nas suas necessidades e lacunas identificadas no diagnóstico.'
  };

  if (Array.isArray(normalized.modulos)) {
    normalized.modulos = normalized.modulos.map((mod, mIdx) => {
      const modNum = mIdx + 1;
      const modId = `custom-${cleanPrefix}-m${modNum}`;

      const topicos = Array.isArray(mod.topicos)
        ? mod.topicos.map((top, tIdx) => {
            const topNum = tIdx + 1;
            return {
              id: `custom-${cleanPrefix}-m${modNum}-t${topNum}`,
              titulo: top.titulo || `Tópico ${topNum}: Conceito e Prática`,
              descricao: top.descricao && top.descricao.length >= 10
                ? top.descricao
                : `Estudo aprofundado e diretrizes práticas para aplicação deste tópico no dia a dia.`,
              ordem: topNum,
              conteudo: top.conteudo || top.descricao || ''
            };
          })
        : [];

      let avaliacao = mod.avaliacao || {};
      const assessmentId = `custom-${cleanPrefix}-m${modNum}-assessment`;
      const perguntas = Array.isArray(avaliacao.perguntas)
        ? avaliacao.perguntas.map((q, qIdx) => {
            const qNum = qIdx + 1;
            const alts = Array.isArray(q.alternativas) && q.alternativas.length === 4
              ? q.alternativas
              : ['Alternativa A', 'Alternativa B', 'Alternativa C', 'Alternativa D'];
            let cor = Number(q.respostaCorreta);
            if (isNaN(cor) || cor < 0 || cor > 3) cor = 0;

            return {
              id: `custom-${cleanPrefix}-m${modNum}-q${qNum}`,
              enunciado: q.enunciado && q.enunciado.length >= 10
                ? q.enunciado
                : `Pergunta prática contextualizada sobre o Módulo ${modNum}: qual é a melhor decisão a ser tomada?`,
              alternativas: alts,
              respostaCorreta: cor,
              explicacao: q.explicacao || 'Explicação detalhada sobre a resposta correta e boas práticas recomendadas.'
            };
          })
        : [];

      return {
        id: modId,
        titulo: mod.titulo || `Módulo ${modNum}`,
        descricao: mod.descricao && mod.descricao.length >= 10
          ? mod.descricao
          : `Fundamentos e práticas essenciais para dominar este módulo com excelência.`,
        ordem: modNum,
        topicos,
        avaliacao: {
          id: assessmentId,
          titulo: avaliacao.titulo || `Avaliação do Módulo ${modNum}`,
          perguntas
        }
      };
    });
  }

  return normalized;
}

export class AIService {
  /**
   * @param {{
   *   geminiClient: { generate: Function, modelName?: string }
   * }} deps
   */
  constructor({ geminiClient }) {
    if (!geminiClient) {
      throw new Error('geminiClient é obrigatório para AIService.');
    }
    this.geminiClient = geminiClient;
  }

  /**
   * Constrói o prompt para geração da trilha personalizada.
   */
  buildGenerationPrompt({ userName, diagnosticResult }) {
    const lacunas = diagnosticResult?.resumo_lacunas?.join('; ') || 'Estratégia ágil e gestão de produtos';
    const nivel = diagnosticResult?.nivel_sugerido || 'intermediario';
    const pontuacao = diagnosticResult?.pontuacao_total ?? 50;

    return `Gere uma trilha personalizada de Gestão de Projetos em Startups e Tecnologia para o aluno "${userName || 'Aluno'}".
Diagnóstico do Aluno:
- Nível identificado: ${nivel}
- Pontuação no teste: ${pontuacao}%
- Principais lacunas identificadas a serem superadas com prioridade: ${lacunas}

INSTRUÇÕES DO CONTEÚDO:
1. Adapte os 5 módulos para suprir as lacunas acima, começando pelo diagnóstico até governança avançada.
2. Cada módulo deve ter exatamente 5 tópicos (título prático, descrição detalhada de 10+ caracteres).
3. Cada módulo deve ter 1 avaliação com exatamente 5 perguntas situacionais realistas de startups.
4. Cada pergunta deve ter 4 alternativas plausíveis e o índice (0 a 3) da resposta correta, além de uma breve explicação.

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON):
{
  "titulo": "Nome atraente da trilha personalizada",
  "descricao": "Resumo do percurso de aprendizagem focado nas lacunas do aluno.",
  "modulos": [
    {
      "titulo": "Título do Módulo 1",
      "descricao": "Descrição do que será abordado no módulo 1.",
      "ordem": 1,
      "topicos": [
        { "titulo": "Tópico 1.1", "descricao": "Descrição prática detalhada...", "ordem": 1 },
        { "titulo": "Tópico 1.2", "descricao": "Descrição prática detalhada...", "ordem": 2 },
        { "titulo": "Tópico 1.3", "descricao": "Descrição prática detalhada...", "ordem": 3 },
        { "titulo": "Tópico 1.4", "descricao": "Descrição prática detalhada...", "ordem": 4 },
        { "titulo": "Tópico 1.5", "descricao": "Descrição prática detalhada...", "ordem": 5 }
      ],
      "avaliacao": {
        "titulo": "Avaliação do Módulo 1",
        "perguntas": [
          {
            "enunciado": "Cenário de startup com pergunta clara...",
            "alternativas": ["Opção A", "Opção B", "Opção C", "Opção D"],
            "respostaCorreta": 0,
            "explicacao": "Justificativa da resposta correta."
          },
          { "enunciado": "...", "alternativas": ["...","...","...","..."], "respostaCorreta": 1, "explicacao": "..." },
          { "enunciado": "...", "alternativas": ["...","...","...","..."], "respostaCorreta": 2, "explicacao": "..." },
          { "enunciado": "...", "alternativas": ["...","...","...","..."], "respostaCorreta": 3, "explicacao": "..." },
          { "enunciado": "...", "alternativas": ["...","...","...","..."], "respostaCorreta": 0, "explicacao": "..." }
        ]
      }
    }
  ]
}`;
  }

  /**
   * Gera uma trilha personalizada completa e validada com a regra 5x5x5.
   * Se a IA retornar algo fora do formato, tenta novamente uma vez antes de falhar.
   *
   * @param {{
   *   userId: string,
   *   userName?: string,
   *   diagnosticResult: object
   * }} params
   * @returns {Promise<import('../trails/types.js').Trail>}
   */
  async generateCustomTrail({ userId, userName, diagnosticResult }) {
    const idPrefix = String(userId || 'user').slice(-6);
    const basePrompt = this.buildGenerationPrompt({ userName, diagnosticResult });

    let rawResponseText = null;
    let parsedData = null;
    let lastValidationError = null;

    // Tentativa 1
    try {
      rawResponseText = await this.geminiClient.generate({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: basePrompt,
        jsonMode: true
      });

      parsedData = this.parseJsonSafely(rawResponseText);
      if (parsedData) {
        const stabilized = ensureStableIds(parsedData, idPrefix);
        const validation = validateTrail(stabilized);
        if (validation.valid) {
          return stabilized;
        }
        lastValidationError = validation.errors?.join('; ') || 'Falha de validação estrutural 5x5x5';
      } else {
        lastValidationError = 'Resposta não é um JSON válido';
      }
    } catch (err) {
      lastValidationError = err.message;
    }

    // Tentativa 2 (Retry simples corretivo, como especificado na regra de negócio)
    console.warn(`[AIService] Tentativa 1 de geração falhou (${lastValidationError}). Executando retry corretivo com a IA...`);

    const retryPrompt = rawResponseText
      ? `${basePrompt}

ATENÇÃO: A tentativa anterior falhou com os seguintes erros de formato:
${lastValidationError}

Por favor, corrija rigorosamente. Lembre-se:
- Devem ser EXATAMENTE 5 módulos.
- Cada módulo deve conter EXATAMENTE 5 tópicos.
- Cada módulo deve conter EXATAMENTE 1 avaliação com EXATAMENTE 5 perguntas.
- Cada pergunta deve ter EXATAMENTE 4 alternativas.
Retorne exclusivamente o objeto JSON válido.`
      : basePrompt;

    try {
      rawResponseText = await this.geminiClient.generate({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: retryPrompt,
        jsonMode: true
      });

      parsedData = this.parseJsonSafely(rawResponseText);
      if (parsedData) {
        const stabilized = ensureStableIds(parsedData, idPrefix);
        const validation = validateTrail(stabilized);
        if (validation.valid) {
          return stabilized;
        }
        lastValidationError = validation.errors?.join('; ') || 'Falha de validação no retry';
      } else {
        lastValidationError = 'Resposta no retry não é um JSON válido';
      }
    } catch (retryErr) {
      lastValidationError = retryErr.message;
    }

    // Se após o retry a IA ainda falhou, lança erro tratado
    throw new Error(`Falha na geração de trilha personalizada pela IA após tentativa de recuperação: ${lastValidationError}`);
  }

  /**
   * Faz o parse de JSON de forma segura, removendo marcações eventuais ```json ... ```.
   * @param {string} text
   */
  parseJsonSafely(text) {
    if (!text || typeof text !== 'string') return null;
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    try {
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}
