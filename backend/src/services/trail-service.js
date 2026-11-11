import { defaultTrail } from '../trails/default-trail.js';
import { validateTrail } from '../trails/trail-schema.js';
import { DIAGNOSTIC_QUESTIONS, evaluateDiagnostic } from '../diagnostic/diagnostic-questions.js';

export class TrailService {
  /**
   * @param {{
   *   usersRepo: ReturnType<import('../repositories/users-repository.js').createUsersRepository>,
   *   customTrailsRepo: ReturnType<import('../repositories/custom-trails-repository.js').createCustomTrailsRepository>,
   *   progressRepo: ReturnType<import('../repositories/user-progress-repository.js').createUserProgressRepository>,
   *   diagnosticResultsRepo?: ReturnType<import('../repositories/diagnostic-results-repository.js').createDiagnosticResultsRepository>,
   *   aiService?: import('./ai-service.js').AIService
   * }} deps
   */
  constructor({ usersRepo, customTrailsRepo, progressRepo, diagnosticResultsRepo, aiService }) {
    this.usersRepo = usersRepo;
    this.customTrailsRepo = customTrailsRepo;
    this.progressRepo = progressRepo;
    this.diagnosticResultsRepo = diagnosticResultsRepo;
    this.aiService = aiService;
  }

  /**
   * Abstração única para obter a trilha ativa de um usuário.
   * Retorna a trilha no mesmo formato estrito (TrailSchema),
   * seja ela originada diretamente do código (defaultTrail) ou do banco (customizada gerada por IA).
   *
   * Regra 5: Todo novo usuário começa com trail_source = 'default' e não possui registro de trilha no banco.
   *
   * @param {string} userId
   * @returns {Promise<{
   *   source: 'default' | 'custom',
   *   custom_trail_id: string | null,
   *   status: string,
   *   origem_gatilho: string,
   *   trail: import('../trails/types.js').Trail
   * }>}
   */
  async getActiveTrail(userId) {
    const user = await this.usersRepo.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    if (user.trail_source === 'custom' && user.custom_trail_id) {
      const customDoc = await this.customTrailsRepo.findById(user.custom_trail_id);
      if (customDoc && customDoc.trail_data) {
        const validation = validateTrail(customDoc.trail_data);
        if (validation.valid) {
          return {
            source: 'custom',
            custom_trail_id: customDoc._id.toString(),
            status: customDoc.status || 'ativa',
            origem_gatilho: customDoc.origem_gatilho || 'diagnostico',
            trail: customDoc.trail_data
          };
        }
      }
      // Se a trilha customizada não for encontrada ou for inválida, fallback seguro para a padrão
    }

    // Trilha padrão vinda exclusivamente do código
    return {
      source: 'default',
      custom_trail_id: null,
      status: 'ativa',
      origem_gatilho: 'padrao',
      trail: defaultTrail
    };
  }

  /**
   * Alterna a trilha ativa do usuário entre 'default' e 'custom'.
   * @param {string} userId
   * @param {{ trail_source: 'default' | 'custom', custom_trail_id?: string | null }} param1
   */
  async setActiveTrail(userId, { trail_source, custom_trail_id = null }) {
    if (trail_source !== 'default' && trail_source !== 'custom') {
      throw new Error('trail_source deve ser "default" ou "custom".');
    }

    if (trail_source === 'custom') {
      if (!custom_trail_id) {
        throw new Error('custom_trail_id é obrigatório para trilha customizada.');
      }
      const customDoc = await this.customTrailsRepo.findById(custom_trail_id);
      if (!customDoc) {
        throw new Error('Trilha customizada não encontrada.');
      }
      if (customDoc.user_id.toString() !== userId.toString()) {
        throw new Error('Esta trilha não pertence ao usuário informado.');
      }
    }

    await this.usersRepo.setActiveTrail(userId, {
      trail_source,
      custom_trail_id: trail_source === 'custom' ? custom_trail_id : null
    });

    return this.getActiveTrail(userId);
  }

  /**
   * Retorna as perguntas do diagnóstico.
   */
  getDiagnosticQuestions() {
    return DIAGNOSTIC_QUESTIONS.map(q => ({
      id: q.id,
      categoria: q.categoria,
      enunciado: q.enunciado,
      opcoes: q.opcoes.map(o => ({ texto: o.texto }))
    }));
  }

  /**
   * Avalia e salva as respostas do diagnóstico no banco de dados.
   * Gera a trilha personalizada pela IA e a salva como "proposta",
   * NUNCA sobrescrevendo a trilha ativa automaticamente.
   *
   * @param {string} userId
   * @param {Array<{ question_id: string, selected_option: number }>} respostas
   */
  async submitDiagnostic(userId, respostas) {
    const user = await this.usersRepo.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    const evaluation = evaluateDiagnostic(respostas);

    let diagnosticDoc = null;
    if (this.diagnosticResultsRepo) {
      diagnosticDoc = await this.diagnosticResultsRepo.create({
        userId,
        respostas,
        pontuacaoTotal: evaluation.pontuacao_total,
        nivelSugerido: evaluation.nivel_sugerido,
        resumoLacunas: evaluation.resumo_lacunas
      });
    }

    let proposedTrailDoc = null;
    if (this.aiService) {
      const generatedTrail = await this.aiService.generateCustomTrail({
        userId: userId.toString(),
        userName: user.nome,
        diagnosticResult: evaluation
      });

      // Salva no banco vinculada ao user_id, com status 'proposta' e origem 'diagnostico'
      proposedTrailDoc = await this.customTrailsRepo.create({
        userId,
        trailData: generatedTrail,
        origemGatilho: 'diagnostico',
        status: 'proposta'
      });
    }

    return {
      diagnostic: diagnosticDoc || {
        ...evaluation,
        realizado_em: new Date()
      },
      proposed_trail: proposedTrailDoc ? {
        id: proposedTrailDoc._id.toString(),
        status: proposedTrailDoc.status,
        origem_gatilho: proposedTrailDoc.origem_gatilho,
        trail: proposedTrailDoc.trail_data
      } : null
    };
  }

  /**
   * Retorna as duas opções lado a lado: a trilha padrão (do código) e a proposta (do banco).
   * @param {string} userId
   */
  async getComparisonOptions(userId) {
    const user = await this.usersRepo.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    // Busca última proposta do usuário no banco
    const proposedDoc = await this.customTrailsRepo.findLatestProposedByUserId(userId);
    const latestDiagnostic = this.diagnosticResultsRepo
      ? await this.diagnosticResultsRepo.findLatestByUserId(userId)
      : null;

    return {
      default_trail: {
        id: defaultTrail.id,
        slug: defaultTrail.slug,
        titulo: defaultTrail.titulo,
        descricao: defaultTrail.descricao,
        modulos: defaultTrail.modulos,
        source: 'default',
        badge: 'Padrão iniciante'
      },
      proposed_trail: proposedDoc ? {
        ...proposedDoc.trail_data,
        id: proposedDoc._id.toString(),
        custom_trail_id: proposedDoc._id.toString(),
        status: proposedDoc.status,
        origem_gatilho: proposedDoc.origem_gatilho,
        source: 'custom',
        badge: 'Recomendada pela IA'
      } : null,
      active_trail_source: user.trail_source || 'default',
      active_custom_trail_id: user.custom_trail_id ? user.custom_trail_id.toString() : null,
      diagnostic: latestDiagnostic
    };
  }

  /**
   * Decisão do usuário: escolhe entre a trilha padrão e a personalizada.
   * Se escolher a padrão: trail_source = 'default' e a proposta é arquivada.
   * Se escolher a personalizada: trail_source = 'custom', custom_trail_id vinculado e status vira 'ativa'.
   * Garante validação estrita de dono.
   *
   * @param {string} userId
   * @param {{ choice: 'default' | 'custom', custom_trail_id?: string }} param1
   */
  async chooseTrail(userId, { choice, custom_trail_id = null }) {
    if (choice !== 'default' && choice !== 'custom') {
      throw new Error('choice deve ser "default" ou "custom".');
    }

    const user = await this.usersRepo.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    if (choice === 'default') {
      // Arquiva proposta se existir
      await this.customTrailsRepo.archiveProposedByUserId(userId);

      await this.usersRepo.setActiveTrail(userId, {
        trail_source: 'default',
        custom_trail_id: null
      });

      return this.getActiveTrail(userId);
    }

    // choice === 'custom'
    let targetDoc = null;
    if (custom_trail_id) {
      targetDoc = await this.customTrailsRepo.findById(custom_trail_id);
    } else {
      targetDoc = await this.customTrailsRepo.findLatestProposedByUserId(userId);
    }

    if (!targetDoc) {
      throw new Error('Nenhuma trilha personalizada proposta encontrada para este usuário.');
    }

    // Validação estrita de dono
    if (targetDoc.user_id.toString() !== userId.toString()) {
      throw new Error('Esta trilha não pertence ao usuário informado.');
    }

    // Ativa a trilha customizada escolhida
    await this.customTrailsRepo.updateStatus(targetDoc._id, 'ativa');

    // Atualiza usuário
    await this.usersRepo.setActiveTrail(userId, {
      trail_source: 'custom',
      custom_trail_id: targetDoc._id
    });

    return this.getActiveTrail(userId);
  }

  /**
   * Consulta o progresso do usuário para sua trilha ativa atual.
   * @param {string} userId
   */
  async getUserProgress(userId) {
    const active = await this.getActiveTrail(userId);
    const progressDoc = await this.progressRepo.getProgress({
      userId,
      trailSource: active.source,
      customTrailId: active.custom_trail_id
    });

    const firstModuleId = active.trail.modulos[0]?.id || 'default-m1';

    const completedTopics = progressDoc?.completed_topics || [];
    const assessmentScores = progressDoc?.assessment_scores || {};
    const currentModuleId = progressDoc?.current_module_id || firstModuleId;

    return {
      user_id: userId,
      trail_source: active.source,
      custom_trail_id: active.custom_trail_id,
      completed_topics: completedTopics,
      completed_topics_count: completedTopics.length,
      total_topics: 25,
      assessment_scores: assessmentScores,
      current_module_id: currentModuleId
    };
  }

  /**
   * Marca um tópico como concluído na trilha ativa.
   * @param {string} userId
   * @param {string} topicId
   */
  async completeTopic(userId, topicId) {
    if (!topicId || typeof topicId !== 'string') {
      throw new Error('topicId é obrigatório.');
    }

    const active = await this.getActiveTrail(userId);

    // Valida se o tópico existe na trilha ativa
    let topicFound = false;
    let topicModuleId = null;
    for (const mod of active.trail.modulos) {
      if (mod.topicos.some(t => t.id === topicId)) {
        topicFound = true;
        topicModuleId = mod.id;
        break;
      }
    }

    if (!topicFound) {
      throw new Error(`Tópico "${topicId}" não pertence à trilha ativa.`);
    }

    const updated = await this.progressRepo.markTopicCompleted({
      userId,
      trailSource: active.source,
      customTrailId: active.custom_trail_id,
      topicId,
      currentModuleId: topicModuleId
    });

    return {
      completed_topics: updated?.completed_topics || [topicId],
      current_module_id: updated?.current_module_id || topicModuleId
    };
  }

  /**
   * Submete e corrige uma avaliação de módulo.
   * @param {string} userId
   * @param {{ moduleId: string, answers: Record<string, number> | Array<{ questionId: string, answer: number }> }} param1
   */
  async submitAssessment(userId, { moduleId, answers }) {
    if (!moduleId) {
      throw new Error('moduleId é obrigatório.');
    }

    const active = await this.getActiveTrail(userId);
    const modIdx = active.trail.modulos.findIndex(m => m.id === moduleId);
    if (modIdx === -1) {
      throw new Error(`Módulo "${moduleId}" não encontrado na trilha ativa.`);
    }

    const moduleObj = active.trail.modulos[modIdx];
    const assessment = moduleObj.avaliacao;

    // Normaliza mapa de respostas
    const answerMap = {};
    if (Array.isArray(answers)) {
      answers.forEach(item => {
        if (item?.questionId !== undefined) {
          answerMap[item.questionId] = Number(item.answer);
        }
      });
    } else if (typeof answers === 'object' && answers !== null) {
      Object.entries(answers).forEach(([k, v]) => {
        answerMap[k] = Number(v);
      });
    }

    let correctCount = 0;
    const details = assessment.perguntas.map(question => {
      const userAnswer = answerMap[question.id];
      const isCorrect = userAnswer === question.respostaCorreta;
      if (isCorrect) correctCount++;
      return {
        questionId: question.id,
        userAnswer: userAnswer !== undefined ? userAnswer : null,
        correctAnswer: question.respostaCorreta,
        isCorrect,
        explicacao: question.explicacao
      };
    });

    const totalQuestions = assessment.perguntas.length; // 5
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 80;

    let nextModuleId = null;
    if (passed && modIdx + 1 < active.trail.modulos.length) {
      nextModuleId = active.trail.modulos[modIdx + 1].id;
    }

    await this.progressRepo.saveAssessmentScore({
      userId,
      trailSource: active.source,
      customTrailId: active.custom_trail_id,
      moduleId,
      score,
      passed,
      nextModuleId
    });

    return {
      moduleId,
      score,
      correctCount,
      totalQuestions,
      passed,
      nextModuleId,
      details
    };
  }
}
