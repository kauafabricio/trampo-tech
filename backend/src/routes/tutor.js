import express from 'express';

/**
 * Cria o router do Tutor IA.
 * Endpoints:
 *   GET  /api/tutor/history          — histórico de mensagens do usuário
 *   POST /api/tutor/message          — envia mensagem e recebe resposta do tutor
 *   POST /api/tutor/proposals/:id/respond — aceita ou recusa proposta de trilha
 *
 * @param {{ tutorService: import('../services/tutor-service.js').TutorService, requireAuth: Function }} deps
 */
export function createTutorRouter({ tutorService, requireAuth }) {
  const router = express.Router();

  /**
   * GET /api/tutor/history
   * Retorna todo o histórico de mensagens do chat do usuário autenticado.
   */
  router.get('/history', requireAuth, async (req, res, next) => {
    try {
      const history = await tutorService.getChatHistory(req.authUser._id);
      return res.json({ messages: history });
    } catch (err) {
      return next(err);
    }
  });

  /**
   * POST /api/tutor/message
   * Envia uma mensagem do usuário, recebe resposta do tutor IA.
   * A resposta pode incluir detecção de dor e proposta de nova trilha.
   *
   * Body: { message: string }
   * Response: {
   *   user_message: ChatMessage,
   *   assistant_message: ChatMessage,
   *   pain_detected: boolean,
   *   pain_description: string | null,
   *   proposed_trail: ProposedTrail | null
   * }
   */
  router.post('/message', requireAuth, async (req, res, next) => {
    try {
      const { message } = req.body || {};
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ message: 'O campo "message" é obrigatório e não pode estar vazio.' });
      }

      const result = await tutorService.sendMessage(req.authUser._id, message);
      return res.status(201).json(result);
    } catch (err) {
      if (err.message?.includes('não encontrado') || err.message?.includes('vazia')) {
        return res.status(400).json({ message: err.message });
      }
      return next(err);
    }
  });

  /**
   * POST /api/tutor/proposals/:id/respond
   * Aceita ou recusa uma proposta de trilha gerada pelo tutor.
   *
   * Params: id — ID da trilha proposta (custom_trail_id)
   * Body: { decision: 'accept' | 'reject' }
   * Response: {
   *   decision: 'accept' | 'reject',
   *   message: string,
   *   active_trail: ActiveTrailResult
   * }
   */
  router.post('/proposals/:id/respond', requireAuth, async (req, res, next) => {
    try {
      const { id: custom_trail_id } = req.params;
      const { decision } = req.body || {};

      if (!decision || (decision !== 'accept' && decision !== 'reject')) {
        return res.status(400).json({ message: 'decision é obrigatório e deve ser "accept" ou "reject".' });
      }

      const result = await tutorService.respondToProposal(req.authUser._id, {
        custom_trail_id,
        decision
      });

      return res.json(result);
    } catch (err) {
      if (err.message?.includes('não pertence')) {
        return res.status(403).json({ message: err.message });
      }
      if (err.message?.includes('não encontrada') || err.message?.includes('não está em estado')) {
        return res.status(400).json({ message: err.message });
      }
      return next(err);
    }
  });

  return router;
}
