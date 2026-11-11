import { ObjectId } from 'mongodb';

/**
 * Repositório de Trilhas Personalizadas (geradas pela IA).
 * Armazena trilhas personalizadas vinculadas a um usuário, com status ("proposta", "ativa", "arquivada")
 * e origem do gatilho ("diagnostico", "tutor").
 */
export function createCustomTrailsRepository(customTrailsCollection) {
  return {
    async findById(id) {
      const objId = typeof id === 'string' ? new ObjectId(id) : id;
      return customTrailsCollection.findOne({ _id: objId });
    },

    async findActiveByUserId(userId) {
      const objId = typeof userId === 'string' ? new ObjectId(userId) : userId;
      return customTrailsCollection.findOne({
        user_id: objId,
        status: 'ativa'
      });
    },

    async findLatestProposedByUserId(userId) {
      const objId = typeof userId === 'string' ? new ObjectId(userId) : userId;
      const trails = await customTrailsCollection
        .find({ user_id: objId, status: 'proposta' })
        .sort({ criado_em: -1 })
        .toArray();
      return trails[0] || null;
    },

    async findByUserId(userId) {
      const objId = typeof userId === 'string' ? new ObjectId(userId) : userId;
      return customTrailsCollection.find({ user_id: objId }).sort({ criado_em: -1 }).toArray();
    },

    /**
     * Cria uma nova trilha personalizada vinculada ao usuário.
     * @param {{ userId: string|ObjectId, trailData: object, origemGatilho: 'diagnostico'|'tutor', status?: 'proposta'|'ativa'|'arquivada' }} param0
     */
    async create({ userId, trailData, origemGatilho, status = 'proposta' }) {
      const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;
      const now = new Date();
      const doc = {
        user_id: userObjId,
        status,
        origem_gatilho: origemGatilho,
        trail_data: trailData,
        criado_em: now,
        atualizado_em: now
      };
      const result = await customTrailsCollection.insertOne(doc);
      return { ...doc, _id: result.insertedId };
    },

    async updateStatus(id, status) {
      const objId = typeof id === 'string' ? new ObjectId(id) : id;
      await customTrailsCollection.updateOne(
        { _id: objId },
        {
          $set: {
            status,
            atualizado_em: new Date()
          }
        }
      );
      return this.findById(objId);
    },

    async archiveProposedByUserId(userId) {
      const objId = typeof userId === 'string' ? new ObjectId(userId) : userId;
      const proposed = await customTrailsCollection.find({ user_id: objId, status: 'proposta' }).toArray();
      for (const t of proposed) {
        await this.updateStatus(t._id, 'arquivada');
      }
    }
  };
}
