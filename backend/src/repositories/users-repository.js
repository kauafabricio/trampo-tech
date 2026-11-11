import { ObjectId } from 'mongodb';

/**
 * Repositório de Usuários.
 */
export function createUsersRepository(usersCollection) {
  return {
    async findById(id) {
      const objId = typeof id === 'string' ? new ObjectId(id) : id;
      return usersCollection.findOne({ _id: objId });
    },

    async findByEmail(email) {
      return usersCollection.findOne({ email });
    },

    /**
     * Cria novo usuário.
     * Regra 5: Todo novo usuário começa com trail_source: 'default' e custom_trail_id: null,
     * sem criar nenhum registro de trilha no banco.
     */
    async create({ nome, email, passwordHash, termosAceitos }) {
      const doc = {
        nome,
        email,
        passwordHash,
        termosAceitos,
        dataCriacao: new Date(),
        trail_source: 'default',
        custom_trail_id: null
      };
      const result = await usersCollection.insertOne(doc);
      return { ...doc, _id: result.insertedId };
    },

    async updateProfile(id, { nome, email }) {
      const objId = typeof id === 'string' ? new ObjectId(id) : id;
      await usersCollection.updateOne(
        { _id: objId },
        { $set: { nome, email } }
      );
      return this.findById(objId);
    },

    /**
     * Alterna a trilha ativa do usuário.
     */
    async setActiveTrail(id, { trail_source, custom_trail_id = null }) {
      const objId = typeof id === 'string' ? new ObjectId(id) : id;
      const customId = custom_trail_id
        ? (typeof custom_trail_id === 'string' ? new ObjectId(custom_trail_id) : custom_trail_id)
        : null;

      await usersCollection.updateOne(
        { _id: objId },
        {
          $set: {
            trail_source,
            custom_trail_id: customId
          }
        }
      );
      return this.findById(objId);
    }
  };
}
