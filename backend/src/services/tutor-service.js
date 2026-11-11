import { ensureStableIds } from './ai-service.js';
import { validateTrail } from '../trails/trail-schema.js';

/**
 * Prompt de sistema do Tutor IA.
 * Define a persona, missão e comportamento esperado do assistente.
 */
const TUTOR_SYSTEM_PROMPT = `Você é o Tutor TrampoTech — um mentor especializado em Gestão de Projetos, Metodologias Ágeis e Empreendedorismo em Startups e Tecnologia.

SUA MISSÃO:
- Ajudar o usuário a avançar na trilha de aprendizagem de forma prática e contextualizada.
- Recomendar materiais de estudo alinhados ao tópico atual (vídeos do YouTube, livros, artigos, leituras).
- Fazer perguntas para entender as dores, dificuldades e objetivos do usuário.
- Responder SEMPRE em português do Brasil, de forma clara, direta e encorajadora.

REGRAS IMPORTANTES:
1. Adapte suas respostas ao contexto da trilha ativa e ao progresso do usuário.
2. Quando identificar uma dor específica e recorrente do usuário (ex.: "tenho dificuldade em gerir equipes", "não sei como priorizar", "minha startup não tem tração"), sinalize isso CLARAMENTE.
3. Seja proativo em recomendar materiais práticos: indique títulos de livros, canais do YouTube, cursos gratuitos.
4. Não inventar conteúdo falso — prefira indicar boas referências conhecidas.
5. Seja empático e motivador.`;

/**
 * Prompt para detecção estruturada de dor e sugestão de nova trilha.
 */
const PAIN_DETECTION_SYSTEM_PROMPT = `Você é um analisador de conversas de tutoria de aprendizagem. Analise o histórico da conversa e determine:
1. Se há uma dor específica e clara identificada (uma área de dificuldade recorrente e explícita).
2. Se sim, qual é essa dor em poucas palavras.

Responda EXCLUSIVAMENTE com um JSON puro (sem markdown):
{
  "pain_detected": true ou false,
  "pain_description": "descrição curta da dor identificada (ou null se não detectada)",
  "confidence": "low" | "medium" | "high"
}`;

/**
 * Prompt para geração de trilha personalizada a partir de uma dor identificada.
 */
const TRAIL_FROM_PAIN_SYSTEM_PROMPT = `Você é um Arquiteto de Aprendizagem especializado em Gestão de Projetos para Startups e Tecnologia.
Sua missão é gerar trilhas educacionais altamente personalizadas com base em uma dor específica do usuário.

REGRA ESTRITA DE ESTRUTURA (5x5x5):
- A trilha DEVE conter exatamente 5 módulos sequenciais.
- Cada módulo DEVE conter exatamente 5 tópicos de estudo detalhados e práticos.
- Cada módulo DEVE conter exatamente 1 avaliação com exatamente 5 perguntas de múltipla escolha.
- Cada pergunta DEVE conter exatamente 4 alternativas e o índice da resposta correta (0, 1, 2 ou 3).
- O resultado DEVE ser um objeto JSON puro, sem markdown e sem blocos de código adicionais.`;

export class TutorService {
  /**
   * @param {{
   *   geminiClient: { generate: Function },
   *   chatMessagesRepo: ReturnType<import('../repositories/chat-messages-repository.js').createChatMessagesRepository>,
   *   trailService: import('./trail-service.js').TrailService,
   *   customTrailsRepo: ReturnType<import('../repositories/custom-trails-repository.js').createCustomTrailsRepository>,
   *   usersRepo: ReturnType<import('../repositories/users-repository.js').createUsersRepository>
   * }} deps
   */
  constructor({ geminiClient, chatMessagesRepo, trailService, customTrailsRepo, usersRepo }) {
    if (!geminiClient) throw new Error('geminiClient é obrigatório para TutorService.');
    if (!chatMessagesRepo) throw new Error('chatMessagesRepo é obrigatório para TutorService.');
    if (!trailService) throw new Error('trailService é obrigatório para TutorService.');
    if (!customTrailsRepo) throw new Error('customTrailsRepo é obrigatório para TutorService.');
    if (!usersRepo) throw new Error('usersRepo é obrigatório para TutorService.');

    this.geminiClient = geminiClient;
    this.chatMessagesRepo = chatMessagesRepo;
    this.trailService = trailService;
    this.customTrailsRepo = customTrailsRepo;
    this.usersRepo = usersRepo;
  }

  /**
   * Retorna o histórico de mensagens do chat de um usuário.
   * @param {string} userId
   */
  async getChatHistory(userId) {
    const messages = await this.chatMessagesRepo.findAllByUserId(userId);
    return messages.map(m => ({
      id: m._id.toString(),
      role: m.role,
      content: m.content,
      metadata: m.metadata || {},
      criado_em: m.criado_em
    }));
  }

  /**
   * Processa uma mensagem do usuário, gera a resposta do tutor e persiste ambas.
   * Detecta dores específicas e, quando identificada com alta confiança, gera proposta de nova trilha.
   *
   * @param {string} userId
   * @param {string} userMessage — texto da mensagem enviada pelo usuário
   * @returns {Promise<{
   *   user_message: object,
   *   assistant_message: object,
   *   pain_detected: boolean,
   *   pain_description: string | null,
   *   proposed_trail: object | null
   * }>}
   */
  async sendMessage(userId, userMessage) {
    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
      throw new Error('A mensagem não pode estar vazia.');
    }

    const trimmedMessage = userMessage.trim().slice(0, 2000); // Limite de segurança

    // 1. Busca contexto: trilha ativa, progresso e histórico recente
    const [activeTrailResult, recentMessages] = await Promise.all([
      this.trailService.getActiveTrail(userId),
      this.chatMessagesRepo.findRecentByUserId(userId, 10) // Últimas 10 msgs para contexto
    ]);

    const { trail, source: trailSource } = activeTrailResult;

    // 2. Monta o contexto da trilha para o prompt
    const trailContext = this._buildTrailContext(trail, trailSource, activeTrailResult);

    // 3. Monta o histórico de conversa formatado
    const conversationHistory = this._buildConversationHistory(recentMessages);

    // 4. Monta o prompt do usuário com todo o contexto
    const userPromptWithContext = `${trailContext}

HISTÓRICO RECENTE DA CONVERSA:
${conversationHistory}

NOVA MENSAGEM DO USUÁRIO:
${trimmedMessage}

Responda ao usuário de forma prática e personalizada, levando em conta o contexto da trilha e o histórico da conversa.`;

    // 5. Persiste a mensagem do usuário
    const savedUserMsg = await this.chatMessagesRepo.create({
      userId,
      role: 'user',
      content: trimmedMessage
    });

    // 6. Gera resposta do tutor
    let tutorResponseText;
    try {
      tutorResponseText = await this.geminiClient.generate({
        systemPrompt: TUTOR_SYSTEM_PROMPT,
        userPrompt: userPromptWithContext,
        jsonMode: false
      });
    } catch (err) {
      // Em caso de falha da IA, salva mensagem de fallback
      tutorResponseText = 'Desculpe, estou com dificuldades para responder agora. Por favor, tente novamente em instantes.';
      console.error('[TutorService] Erro ao gerar resposta do tutor:', err.message);
    }

    // 7. Detecta dor específica (análise adicional leve)
    let painDetected = false;
    let painDescription = null;
    let proposedTrail = null;

    const painResult = await this._detectPain(recentMessages, trimmedMessage);
    painDetected = Boolean(painResult?.pain_detected);
    painDescription = painResult?.pain_description || null;

    // Se dor identificada com alta confiança, gera proposta de nova trilha
    if (painDetected && painResult?.confidence === 'high' && painDescription) {
      try {
        proposedTrail = await this._generateTrailFromPain(userId, painDescription);

        // Adiciona nota na resposta do tutor sobre a sugestão
        const suggestionNote = `\n\n---\n🎯 **Percebi que você tem uma necessidade específica em: "${painDescription}"**\n\nBaseado nisso, **preparei uma nova trilha personalizada** focada exatamente nessa área. Você pode visualizar e aceitar essa sugestão — ela substituirá sua trilha atual, preservando todo o seu progresso anterior.\n\nO que acha de dar uma olhada?`;
        tutorResponseText += suggestionNote;
      } catch (err) {
        console.error('[TutorService] Erro ao gerar trilha a partir da dor:', err.message);
        // Continua sem proposta de trilha se falhar
      }
    }

    // 8. Persiste a resposta do tutor
    const assistantMetadata = {
      pain_detected: painDetected,
      pain_description: painDescription,
      proposed_trail_id: proposedTrail ? proposedTrail.id : null
    };

    const savedAssistantMsg = await this.chatMessagesRepo.create({
      userId,
      role: 'assistant',
      content: tutorResponseText,
      metadata: assistantMetadata
    });

    return {
      user_message: {
        id: savedUserMsg._id.toString(),
        role: savedUserMsg.role,
        content: savedUserMsg.content,
        criado_em: savedUserMsg.criado_em
      },
      assistant_message: {
        id: savedAssistantMsg._id.toString(),
        role: savedAssistantMsg.role,
        content: savedAssistantMsg.content,
        metadata: assistantMetadata,
        criado_em: savedAssistantMsg.criado_em
      },
      pain_detected: painDetected,
      pain_description: painDescription,
      proposed_trail: proposedTrail
    };
  }

  /**
   * Aceita ou recusa uma proposta de trilha gerada pelo tutor.
   * - Aceitar: a proposta vira 'ativa', a trilha anterior é arquivada (preservando progresso).
   * - Recusar: a proposta é descartada, trilha atual continua.
   *
   * @param {string} userId
   * @param {{ custom_trail_id: string, decision: 'accept' | 'reject' }} param1
   */
  async respondToProposal(userId, { custom_trail_id, decision }) {
    if (!custom_trail_id) {
      throw new Error('custom_trail_id é obrigatório.');
    }
    if (decision !== 'accept' && decision !== 'reject') {
      throw new Error('decision deve ser "accept" ou "reject".');
    }

    // Validação de existência e ownership
    const proposedDoc = await this.customTrailsRepo.findById(custom_trail_id);
    if (!proposedDoc) {
      throw new Error('Proposta de trilha não encontrada.');
    }
    if (proposedDoc.user_id.toString() !== userId.toString()) {
      throw new Error('Esta proposta não pertence ao usuário informado.');
    }
    if (proposedDoc.status !== 'proposta') {
      throw new Error('Esta trilha não está em estado de proposta.');
    }

    if (decision === 'reject') {
      // Descarta a proposta, trilha atual continua
      await this.customTrailsRepo.updateStatus(proposedDoc._id, 'arquivada');
      const activeTrail = await this.trailService.getActiveTrail(userId);
      return {
        decision: 'reject',
        message: 'Proposta recusada. Sua trilha atual continua ativa.',
        active_trail: activeTrail
      };
    }

    // decision === 'accept'
    // 1. Arquiva a trilha ativa anterior (se for custom)
    const user = await this.usersRepo.findById(userId);
    if (user.trail_source === 'custom' && user.custom_trail_id) {
      const prevId = user.custom_trail_id.toString();
      if (prevId !== custom_trail_id) {
        await this.customTrailsRepo.updateStatus(user.custom_trail_id, 'arquivada');
      }
    }
    // Se era trilha padrão (default), apenas deixa de ser a ativa — não há registro no banco para alterar

    // 2. Ativa a nova trilha proposta
    await this.customTrailsRepo.updateStatus(proposedDoc._id, 'ativa');
    await this.usersRepo.setActiveTrail(userId, {
      trail_source: 'custom',
      custom_trail_id: proposedDoc._id
    });

    const activeTrail = await this.trailService.getActiveTrail(userId);
    return {
      decision: 'accept',
      message: 'Nova trilha personalizada ativada com sucesso! Seu progresso anterior foi preservado.',
      active_trail: activeTrail
    };
  }

  // ─── Helpers Privados ─────────────────────────────────────────────────────

  /**
   * Monta o contexto da trilha ativa para ser incluído no prompt do tutor.
   */
  _buildTrailContext(trail, trailSource, activeTrailResult) {
    const modulosSumario = trail.modulos
      .map((m, i) => `  Módulo ${i + 1}: ${m.titulo}\n    Tópicos: ${m.topicos.map(t => t.titulo).join(', ')}`)
      .join('\n');

    return `CONTEXTO DA TRILHA ATIVA DO USUÁRIO:
Fonte: ${trailSource === 'custom' ? 'Personalizada (IA)' : 'Padrão'}
Título: ${trail.titulo}
Descrição: ${trail.descricao}
Estrutura dos Módulos:
${modulosSumario}

PROGRESSO ATUAL: (use para personalizar suas recomendações)`;
  }

  /**
   * Formata o histórico recente de mensagens para inclusão no prompt.
   */
  _buildConversationHistory(messages) {
    if (!messages || messages.length === 0) {
      return '(Início da conversa — não há histórico anterior)';
    }
    return messages
      .map(m => `${m.role === 'user' ? 'Usuário' : 'Tutor'}: ${m.content.slice(0, 500)}`)
      .join('\n\n');
  }

  /**
   * Analisa o histórico + nova mensagem para detectar uma dor específica.
   * Retorna JSON estruturado com pain_detected, pain_description e confidence.
   */
  async _detectPain(recentMessages, latestUserMessage) {
    const historyForAnalysis = [
      ...recentMessages.map(m => `${m.role === 'user' ? 'Usuário' : 'Tutor'}: ${m.content.slice(0, 300)}`),
      `Usuário: ${latestUserMessage}`
    ].join('\n\n');

    const analysisPrompt = `Analise o seguinte histórico de conversa entre um aluno e um tutor de aprendizagem em Gestão de Projetos para Startups:

${historyForAnalysis}

Identifique se há uma dor específica, clara e recorrente mencionada pelo usuário.`;

    try {
      const rawResponse = await this.geminiClient.generate({
        systemPrompt: PAIN_DETECTION_SYSTEM_PROMPT,
        userPrompt: analysisPrompt,
        jsonMode: true
      });

      const parsed = this._parseJsonSafely(rawResponse);
      if (parsed && typeof parsed.pain_detected === 'boolean') {
        return {
          pain_detected: parsed.pain_detected,
          pain_description: parsed.pain_description || null,
          confidence: parsed.confidence || 'low'
        };
      }
    } catch (err) {
      console.warn('[TutorService] Erro ao detectar dor:', err.message);
    }

    return { pain_detected: false, pain_description: null, confidence: 'low' };
  }

  /**
   * Gera uma trilha personalizada com base na dor identificada.
   * Salva no banco com status 'proposta' e origem 'tutor'.
   */
  async _generateTrailFromPain(userId, painDescription) {
    const idPrefix = String(userId).slice(-6);

    const generationPrompt = `Gere uma trilha personalizada de Gestão de Projetos em Startups e Tecnologia focada na seguinte necessidade específica do aluno:

DOR IDENTIFICADA: "${painDescription}"

INSTRUÇÕES DO CONTEÚDO:
1. Os 5 módulos devem endereçar diretamente a dor "${painDescription}", do básico ao avançado.
2. Cada módulo deve ter exatamente 5 tópicos (título prático, descrição detalhada de 10+ caracteres).
3. Cada módulo deve ter 1 avaliação com exatamente 5 perguntas situacionais realistas de startups.
4. Cada pergunta deve ter 4 alternativas plausíveis e o índice (0 a 3) da resposta correta, além de uma breve explicação.

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON):
{
  "titulo": "Nome atraente da trilha focada na dor",
  "descricao": "Resumo do percurso de aprendizagem focado na necessidade identificada.",
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
          { "enunciado": "...", "alternativas": ["...", "...", "...", "..."], "respostaCorreta": 0, "explicacao": "..." },
          { "enunciado": "...", "alternativas": ["...", "...", "...", "..."], "respostaCorreta": 1, "explicacao": "..." },
          { "enunciado": "...", "alternativas": ["...", "...", "...", "..."], "respostaCorreta": 2, "explicacao": "..." },
          { "enunciado": "...", "alternativas": ["...", "...", "...", "..."], "respostaCorreta": 3, "explicacao": "..." },
          { "enunciado": "...", "alternativas": ["...", "...", "...", "..."], "respostaCorreta": 0, "explicacao": "..." }
        ]
      }
    }
  ]
}`;

    let rawResponse = null;
    let parsedData = null;
    let lastError = null;

    // Tentativa 1
    try {
      rawResponse = await this.geminiClient.generate({
        systemPrompt: TRAIL_FROM_PAIN_SYSTEM_PROMPT,
        userPrompt: generationPrompt,
        jsonMode: true
      });
      parsedData = this._parseJsonSafely(rawResponse);
      if (parsedData) {
        const stabilized = ensureStableIds(parsedData, `${idPrefix}p`);
        const validation = validateTrail(stabilized);
        if (validation.valid) {
          return this._saveProposedTrail(userId, stabilized);
        }
        lastError = validation.errors?.join('; ') || 'Falha de validação 5x5x5';
      } else {
        lastError = 'Resposta não é JSON válido';
      }
    } catch (err) {
      lastError = err.message;
    }

    // Retry corretivo
    console.warn(`[TutorService] Retry na geração de trilha por dor: ${lastError}`);
    try {
      rawResponse = await this.geminiClient.generate({
        systemPrompt: TRAIL_FROM_PAIN_SYSTEM_PROMPT,
        userPrompt: `${generationPrompt}\n\nATENÇÃO: A tentativa anterior falhou: ${lastError}\nCorrija e retorne exatamente 5 módulos, cada um com 5 tópicos e 5 perguntas de 4 alternativas.`,
        jsonMode: true
      });
      parsedData = this._parseJsonSafely(rawResponse);
      if (parsedData) {
        const stabilized = ensureStableIds(parsedData, `${idPrefix}p`);
        const validation = validateTrail(stabilized);
        if (validation.valid) {
          return this._saveProposedTrail(userId, stabilized);
        }
      }
    } catch (retryErr) {
      console.error('[TutorService] Retry também falhou:', retryErr.message);
    }

    throw new Error(`Falha ao gerar trilha a partir da dor identificada após retry.`);
  }

  /**
   * Salva a trilha gerada como proposta no banco com origem 'tutor'.
   */
  async _saveProposedTrail(userId, trailData) {
    const doc = await this.customTrailsRepo.create({
      userId,
      trailData,
      origemGatilho: 'tutor',
      status: 'proposta'
    });
    return {
      id: doc._id.toString(),
      status: doc.status,
      origem_gatilho: doc.origem_gatilho,
      trail: doc.trail_data
    };
  }

  /**
   * Parse seguro de JSON — remove marcações ```json``` e extrai objeto delimitado por chaves se houver texto envolvente.
   */
  _parseJsonSafely(text) {
    if (!text || typeof text !== 'string') return null;
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    cleaned = cleaned.trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          const jsonSubstring = cleaned.substring(firstBrace, lastBrace + 1);
          return JSON.parse(jsonSubstring);
        } catch {
          return null;
        }
      }
      return null;
    }
  }
}
