import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { createApp, createFallbackCollection } from './app.js';
import { createGeminiClient } from './ai/gemini-client.js';
import { runMigrations } from './db/migrator.js';

const {
  AUTH_JWT_SECRET,
  CLIENT_ORIGIN,
  MONGODB_DB_NAME,
  MONGODB_URI,
  NODE_ENV,
  PORT = '3000',
  GEMINI_API_KEY,
  GEMINI_MODEL = 'gemini-flash-lite-latest',
  AI_TIMEOUT_MS = '20000',
  AI_MAX_RETRIES = '2'
} = process.env;

if (!AUTH_JWT_SECRET || AUTH_JWT_SECRET.length < 32) {
  throw new Error('AUTH_JWT_SECRET must contain at least 32 characters.');
}
if (!CLIENT_ORIGIN || !MONGODB_URI || !MONGODB_DB_NAME) {
  throw new Error('CLIENT_ORIGIN, MONGODB_URI, and MONGODB_DB_NAME must be configured.');
}

let client = null;
let collections = null;

try {
  client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const db = client.db(MONGODB_DB_NAME);

  // Executa migrations automáticas para garantir coleções, índices e integridade
  try {
    await runMigrations(db);
  } catch (migErr) {
    console.warn('[Server] Aviso na execução de migrações automáticas:', migErr.message);
  }

  collections = {
    users: db.collection('users'),
    customTrails: db.collection('custom_trails'),
    userProgress: db.collection('user_progress'),
    diagnosticResults: db.collection('diagnostic_results'),
    chatMessages: db.collection('tutor_messages')
  };
  console.log('[Server] Conectado ao MongoDB com sucesso.');
} catch (dbErr) {
  console.warn(`[Server] Não foi possível conectar ao MongoDB (${dbErr.message}). Utilizando coleções in-memory (resiliência ativa).`);
  collections = {
    users: createFallbackCollection(),
    customTrails: createFallbackCollection(),
    userProgress: createFallbackCollection(),
    diagnosticResults: createFallbackCollection(),
    chatMessages: createFallbackCollection()
  };
}

let geminiClient = null;
if (GEMINI_API_KEY) {
  geminiClient = createGeminiClient({
    apiKey: GEMINI_API_KEY,
    modelName: GEMINI_MODEL,
    timeoutMs: Number(AI_TIMEOUT_MS),
    maxRetries: Number(AI_MAX_RETRIES)
  });
} else {
  console.warn('[Server] GEMINI_API_KEY não configurada. Endpoints de IA ficarão desativados até configuração.');
}

const app = createApp({
  users: collections.users,
  customTrails: collections.customTrails,
  userProgress: collections.userProgress,
  diagnosticResults: collections.diagnosticResults,
  chatMessages: collections.chatMessages,
  jwtSecret: AUTH_JWT_SECRET,
  clientOrigin: CLIENT_ORIGIN,
  geminiClient,
  production: NODE_ENV === 'production'
});

const server = app.listen(Number(PORT), () => {
  console.log(`TrampoTech API listening on port ${PORT}.`);
  if (geminiClient) {
    console.log(`Gemini model: ${GEMINI_MODEL}`);
  }
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(async () => {
      if (client) {
        await client.close();
      }
      process.exit(0);
    });
  });
}
