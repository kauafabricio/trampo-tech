import { ObjectId } from 'mongodb';

/**
 * Repositório de Resultados do Diagnóstico.
 * Armazena as respostas, pontuação e lacunas detectadas para cada usuário.
 */
export function createDiagnosticResultsRepository(diagnosticResultsCollection) {
  return {
    async findById(id) {
      const objId = typeof id === 'string' ? new ObjectId(id) : id;
      return diagnosticResultsCollection.findOne({ _id: objId });
    },

    async findLatestByUserId(userId) {
      const objId = typeof userId === 'string' ? new ObjectId(userId) : userId;
      const results = await diagnosticResultsCollection
        .find({ user_id: objId })
        .sort({ realizado_em: -1 })
        .toArray();
      return results[0] || null;
    },

    async findByUserId(userId) {
      const objId = typeof userId === 'string' ? new ObjectId(userId) : userId;
      return diagnosticResultsCollection
        .find({ user_id: objId })
        .sort({ realizado_em: -1 })
        .toArray();
    },

    async create({ userId, respostas, pontuacaoTotal, nivelSugerido, resumoLacunas }) {
      const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;
      const doc = {
        user_id: userObjId,
        respostas,
        pontuacao_total: pontuacaoTotal,
        nivel_sugerido: nivelSugerido,
        resumo_lacunas: resumoLacunas,
        realizado_em: new Date()
      };
      const result = await diagnosticResultsCollection.insertOne(doc);
      return { ...doc, _id: result.insertedId };
    }
  };
}
