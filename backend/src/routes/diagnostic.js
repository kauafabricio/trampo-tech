import express from 'express';

/**
 * Cria o router de avaliação diagnóstica.
 * @param {{ trailService: import('../services/trail-service.js').TrailService, requireAuth: Function }} deps
 */
export function createDiagnosticRouter({ trailService, requireAuth }) {
  const router = express.Router();

  /**
   * GET /api/diagnostic/questions
   * Retorna as perguntas do diagnóstico.
   * Não requer autenticação obrigatória para garantir que as perguntas sempre carreguem para o aluno.
   */
  router.get('/questions', (_req, res) => {
    const questions = trailService.getDiagnosticQuestions();
    return res.json({ questions });
  });

  /**
   * POST /api/diagnostic/submit
   * Envia as respostas do diagnóstico, calcula lacunas, salva no banco e gera a trilha personalizada pela IA.
   * A trilha gerada é salva com status "proposta" e não sobrescreve a trilha ativa automaticamente.
   */
  router.post('/submit', requireAuth, async (req, res, next) => {
    try {
      const { respostas } = req.body || {};
      if (!Array.isArray(respostas) || respostas.length === 0) {
        return res.status(400).json({
          message: 'respostas é obrigatório e deve ser um array com as respostas do diagnóstico.'
        });
      }

      const result = await trailService.submitDiagnostic(req.authUser._id, respostas);
      return res.status(201).json(result);
    } catch (err) {
      if (err.message?.includes('não encontrado')) {
        return res.status(404).json({ message: err.message });
      }
      console.error('[Diagnostic Submit Error]:', err.message);
      return res.status(503).json({
        message: 'A IA está com alta demanda momentânea nos servidores do Google. Por favor, tente novamente em alguns segundos.'
      });
    }
  });

  return router;
}
