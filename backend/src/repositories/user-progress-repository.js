import { ObjectId } from 'mongodb';

/**
 * Repositório de Progresso do Usuário.
 * Guarda o progresso referenciando a trilha (trail_source: 'default' | 'custom' + custom_trail_id),
 * tópicos concluídos (IDs estáveis), notas das avaliações e módulo atual.
 */
export function createUserProgressRepository(userProgressCollection) {
  function buildQuery(userId, trailSource, customTrailId) {
    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const customObjId = customTrailId
      ? (typeof customTrailId === 'string' ? new ObjectId(customTrailId) : customTrailId)
      : null;

    return {
      user_id: userObjId,
      trail_source: trailSource,
      custom_trail_id: customObjId
    };
  }

  return {
    async getProgress({ userId, trailSource, customTrailId }) {
      const query = buildQuery(userId, trailSource, customTrailId);
      return userProgressCollection.findOne(query);
    },

    async markTopicCompleted({ userId, trailSource, customTrailId, topicId, currentModuleId }) {
      const query = buildQuery(userId, trailSource, customTrailId);
      const now = new Date();

      const update = {
        $addToSet: { completed_topics: topicId },
        $set: { atualizado_em: now }
      };
      if (currentModuleId) {
        update.$set.current_module_id = currentModuleId;
      }

      const options = { upsert: true, returnDocument: 'after' };

      const setOnInsert = {
        ...query,
        assessment_scores: {},
        current_module_id: currentModuleId || 'default-m1',
        criado_em: now
      };

      await userProgressCollection.updateOne(
        query,
        {
          ...update,
          $setOnInsert: setOnInsert
        },
        { upsert: true }
      );

      return userProgressCollection.findOne(query);
    },

    async saveAssessmentScore({ userId, trailSource, customTrailId, moduleId, score, passed, nextModuleId }) {
      const query = buildQuery(userId, trailSource, customTrailId);
      const now = new Date();

      const scoreEntry = {
        score,
        passed,
        completed_at: now
      };

      const update = {
        $set: {
          [`assessment_scores.${moduleId}`]: scoreEntry,
          atualizado_em: now
        },
        $inc: {
          [`assessment_scores.${moduleId}.attempts`]: 1
        }
      };

      if (passed && nextModuleId) {
        update.$set.current_module_id = nextModuleId;
      }

      await userProgressCollection.updateOne(
        query,
        {
          ...update,
          $setOnInsert: {
            ...query,
            completed_topics: [],
            current_module_id: moduleId,
            criado_em: now
          }
        },
        { upsert: true }
      );

      return userProgressCollection.findOne(query);
    }
  };
}
