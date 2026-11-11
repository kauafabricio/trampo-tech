import express from 'express';

/**
 * Cria o router de trilhas e progresso.
 * @param {{ trailService: import('../services/trail-service.js').TrailService, requireAuth: Function }} deps
 */
export function createTrailsRouter({ trailService, requireAuth }) {
  const router = express.Router();

  /**
   * GET /api/trails/active
   * Devolve a trilha ativa e o progresso do usuário no mesmo formato unificado.
   */
  router.get('/active', requireAuth, async (req, res, next) => {
    try {
      const userId = req.authUser._id;
      const [activeTrail, progress] = await Promise.all([
        trailService.getActiveTrail(userId),
        trailService.getUserProgress(userId)
      ]);
      return res.json({
        ...activeTrail,
        progress
      });
    } catch (err) {
      return next(err);
    }
  });

  /**
   * POST /api/trails/active
   * Alterna a trilha ativa do usuário (default ou custom).
   */
  router.post('/active', requireAuth, async (req, res, next) => {
    try {
      const { trail_source, custom_trail_id } = req.body || {};
      if (!trail_source) {
        return res.status(400).json({ message: 'trail_source é obrigatório ("default" ou "custom").' });
      }

      const activeTrail = await trailService.setActiveTrail(req.authUser._id, {
        trail_source,
        custom_trail_id
      });

      return res.json(activeTrail);
    } catch (err) {
      if (err.message?.includes('não encontrado') || err.message?.includes('não pertence')) {
        return res.status(400).json({ message: err.message });
      }
      return next(err);
    }
  });

  /**
   * GET /api/trails/options (e alias /api/trails/comparison)
   * Retorna as duas opções lado a lado: a trilha padrão (do código) e a proposta de IA (do banco).
   */
  const handleGetOptions = async (req, res, next) => {
    try {
      const options = await trailService.getComparisonOptions(req.authUser._id);
      return res.json(options);
    } catch (err) {
      return next(err);
    }
  };
  router.get('/options', requireAuth, handleGetOptions);
  router.get('/comparison', requireAuth, handleGetOptions);

  /**
   * POST /api/trails/choose
   * Decisão do usuário: escolhe a trilha padrão ou a personalizada proposta.
   * - default: trail_source = 'default' e proposta é arquivada.
   * - custom: trail_source = 'custom', custom_trail_id salvo e status vira 'ativa'.
   * Garante validação estrita de dono.
   */
  router.post('/choose', requireAuth, async (req, res, next) => {
    try {
      const { choice, custom_trail_id } = req.body || {};
      if (!choice || (choice !== 'default' && choice !== 'custom')) {
        return res.status(400).json({ message: 'choice é obrigatório e deve ser "default" ou "custom".' });
      }

      const activeTrail = await trailService.chooseTrail(req.authUser._id, {
        choice,
        custom_trail_id
      });

      return res.json({
        message: choice === 'default'
          ? 'Trilha padrão selecionada com sucesso.'
          : 'Trilha personalizada ativada com sucesso.',
        ...activeTrail
      });
    } catch (err) {
      if (err.message?.includes('não pertence')) {
        return res.status(403).json({ message: err.message });
      }
      if (err.message?.includes('não encontrada') || err.message?.includes('Nenhuma trilha')) {
        return res.status(400).json({ message: err.message });
      }
      return next(err);
    }
  });

  /**
   * GET /api/trails/progress
   * Consulta o progresso do usuário na trilha ativa.
   */
  router.get('/progress', requireAuth, async (req, res, next) => {
    try {
      const progress = await trailService.getUserProgress(req.authUser._id);
      return res.json(progress);
    } catch (err) {
      return next(err);
    }
  });

  /**
   * POST /api/trails/progress/topic
   * Marca um tópico como concluído na trilha ativa.
   */
  router.post('/progress/topic', requireAuth, async (req, res, next) => {
    try {
      const { topicId } = req.body || {};
      if (!topicId) {
        return res.status(400).json({ message: 'topicId é obrigatório.' });
      }

      const result = await trailService.completeTopic(req.authUser._id, topicId);
      return res.json(result);
    } catch (err) {
      if (err.message?.includes('não pertence')) {
        return res.status(400).json({ message: err.message });
      }
      return next(err);
    }
  });

  /**
   * POST /api/trails/progress/assessment
   * Submete respostas e corrige avaliação do módulo.
   */
  router.post('/progress/assessment', requireAuth, async (req, res, next) => {
    try {
      const { moduleId, answers } = req.body || {};
      if (!moduleId || !answers) {
        return res.status(400).json({ message: 'moduleId e answers são obrigatórios.' });
      }

      const result = await trailService.submitAssessment(req.authUser._id, { moduleId, answers });
      return res.json(result);
    } catch (err) {
      if (err.message?.includes('não encontrado')) {
        return res.status(400).json({ message: err.message });
      }
      return next(err);
    }
  });

  return router;
}
