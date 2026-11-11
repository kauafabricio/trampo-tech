import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { runMigrations } from './migrator.js';

const { MONGODB_URI, MONGODB_DB_NAME } = process.env;

if (!MONGODB_URI || !MONGODB_DB_NAME) {
  console.error('[Migrations] MONGODB_URI e MONGODB_DB_NAME precisam estar configurados no .env.');
  process.exit(1);
}

const client = new MongoClient(MONGODB_URI);

try {
  await client.connect();
  const db = client.db(MONGODB_DB_NAME);
  console.log(`[Migrations] Conectado ao MongoDB: ${MONGODB_DB_NAME}`);
  const result = await runMigrations(db);
  console.log(`[Migrations] Finalizado. Executadas: ${result.executed.length}. Já aplicadas anteriormente: ${result.alreadyApplied.length}.`);
} catch (error) {
  console.error('[Migrations] Falha ao executar migrações:', error);
  process.exit(1);
} finally {
  await client.close();
}
