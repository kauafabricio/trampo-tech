import { migration001 } from './migrations/001_initial_schema.js';

export const allMigrations = [
  migration001
];

/**
 * Executa as migrações pendentes no banco de dados.
 * @param {import('mongodb').Db} db
 * @returns {Promise<{ executed: string[], alreadyApplied: string[] }>}
 */
export async function runMigrations(db) {
  const migrationsCol = db.collection('_migrations');
  await migrationsCol.createIndex({ name: 1 }, { unique: true, name: 'idx_migrations_name_unique' });

  const existingDocs = await migrationsCol.find({}).toArray();
  const appliedNames = new Set(existingDocs.map(doc => doc.name));

  const executed = [];
  const alreadyApplied = [];

  for (const migration of allMigrations) {
    if (appliedNames.has(migration.name)) {
      alreadyApplied.push(migration.name);
      continue;
    }

    console.log(`[Migrations] Executando migration: ${migration.name}...`);
    await migration.up(db);
    await migrationsCol.insertOne({
      name: migration.name,
      executed_at: new Date()
    });
    executed.push(migration.name);
    console.log(`[Migrations] Migration concluída com sucesso: ${migration.name}`);
  }

  return { executed, alreadyApplied };
}
