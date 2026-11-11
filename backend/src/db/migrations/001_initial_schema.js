/**
 * Migration 001: Schema inicial do TrampoTech
 * Cria coleções, define índices essenciais e migra usuários existentes para trail_source: 'default'.
 */
export const migration001 = {
  name: '001_initial_schema',

  /**
   * Aplica a migração.
   * @param {import('mongodb').Db} db
   */
  async up(db) {
    // 1. Coleção users
    const users = db.collection('users');
    await users.createIndex({ email: 1 }, { unique: true, name: 'idx_users_email_unique' });

    // Migração de compatibilidade retroativa para usuários legados
    await users.updateMany(
      { trail_source: { $exists: false } },
      {
        $set: { trail_source: 'default', custom_trail_id: null },
        $unset: { trilhaEscolhida: '' }
      }
    );

    // 2. Coleção custom_trails (trilhas personalizadas geradas pela IA)
    const customTrails = db.collection('custom_trails');
    await customTrails.createIndex(
      { user_id: 1, status: 1 },
      { name: 'idx_custom_trails_user_status' }
    );
    await customTrails.createIndex(
      { user_id: 1, criado_em: -1 },
      { name: 'idx_custom_trails_user_created' }
    );

    // 3. Coleção user_progress (progresso do usuário na trilha ativa)
    const userProgress = db.collection('user_progress');
    await userProgress.createIndex(
      { user_id: 1, trail_source: 1, custom_trail_id: 1 },
      { unique: true, name: 'idx_user_progress_unique_trail' }
    );
    await userProgress.createIndex(
      { user_id: 1 },
      { name: 'idx_user_progress_user' }
    );

    // 4. Coleção diagnostic_results (resultado da avaliação diagnóstica)
    const diagnosticResults = db.collection('diagnostic_results');
    await diagnosticResults.createIndex(
      { user_id: 1, realizado_em: -1 },
      { name: 'idx_diagnostic_results_user_date' }
    );

    // 5. Coleção tutor_messages (histórico do chat com o tutor)
    const tutorMessages = db.collection('tutor_messages');
    await tutorMessages.createIndex(
      { user_id: 1, criado_em: 1 },
      { name: 'idx_tutor_messages_user_date' }
    );
  },

  /**
   * Reverte a migração (se necessário).
   * @param {import('mongodb').Db} db
   */
  async down(db) {
    try {
      await db.collection('custom_trails').drop();
    } catch (_) {}
    try {
      await db.collection('user_progress').drop();
    } catch (_) {}
    try {
      await db.collection('diagnostic_results').drop();
    } catch (_) {}
    try {
      await db.collection('tutor_messages').drop();
    } catch (_) {}
  }
};
