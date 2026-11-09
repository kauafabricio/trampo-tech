import express from 'express';

/**
 * Cria o router /api/ai com as rotas de infraestrutura.
 * @param {{ geminiClient: object, requireAuth: Function }} deps
 */
export function createAiRouter({ geminiClient, requireAuth }) {
  const router = express.Router();

  /**
   * GET /api/ai/ping
   * Verifica se o cliente Gemini está configurado e operacional.
   * Requer autenticação.
   */
  router.get('/ping', requireAuth, async (_req, res, next) => {
    try {
      const healthy = await geminiClient.healthCheck();
      if (!healthy) {
        return res.status(503).json({
          status: 'error',
          message: 'O modelo de IA não respondeu corretamente.'
        });
      }

      return res.json({
        status: 'ok',
        model: geminiClient.modelName
      });
    } catch (err) {
      // Erro de autenticação (chave inválida)
      const status = err?.status ?? err?.httpErrorCode;
      if (status === 401 || status === 403) {
        return res.status(503).json({
          status: 'error',
          message: 'Chave de API do Gemini inválida ou sem permissão.'
        });
      }
      return next(err);
    }
  });

  return router;
}
