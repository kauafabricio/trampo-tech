import { ObjectId } from 'mongodb';

/**
 * Repositório do histórico de mensagens do chat com o Tutor IA.
 * Cada documento representa uma única mensagem (user ou assistant).
 * Indexado por user_id + criado_em para recuperação eficiente de histórico recente.
 */
export function createChatMessagesRepository(chatMessagesCollection) {
  return {
    /**
     * Persiste uma mensagem no histórico do chat.
     * @param {{ userId: string|ObjectId, role: 'user'|'assistant', content: string, metadata?: object }} param0
     */
    async create({ userId, role, content, metadata = {} }) {
      const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;
      const now = new Date();
      const doc = {
        user_id: userObjId,
        role,          // 'user' ou 'assistant'
        content,       // texto da mensagem
        metadata,      // dados extras (ex: { pain_detected, proposed_trail_id })
        criado_em: now
      };
      const result = await chatMessagesCollection.insertOne(doc);
      return { ...doc, _id: result.insertedId };
    },

    /**
     * Retorna as N mensagens mais recentes do chat de um usuário,
     * em ordem cronológica (mais antigas primeiro).
     * @param {string|ObjectId} userId
     * @param {number} limit — número de mensagens a recuperar (padrão: 20)
     */
    async findRecentByUserId(userId, limit = 20) {
      const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;
      const messages = await chatMessagesCollection
        .find({ user_id: userObjId })
        .sort({ criado_em: -1 })
        .limit(limit)
        .toArray();
      // Inverte para retornar em ordem cronológica (mais antigas primeiro)
      return messages.reverse();
    },

    /**
     * Retorna todo o histórico de mensagens de um usuário para exibição no frontend.
     * @param {string|ObjectId} userId
     */
    async findAllByUserId(userId) {
      const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;
      return chatMessagesCollection
        .find({ user_id: userObjId })
        .sort({ criado_em: 1 })
        .toArray();
    }
  };
}
