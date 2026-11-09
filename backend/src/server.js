import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { createApp } from './app.js';
import { createGeminiClient } from './ai/gemini-client.js';

const {
  AUTH_JWT_SECRET,
  CLIENT_ORIGIN,
  MONGODB_DB_NAME,
  MONGODB_URI,
  NODE_ENV,
  PORT = '3000',
  GEMINI_API_KEY,
  GEMINI_MODEL = 'gemini-2.0-flash',
  AI_TIMEOUT_MS = '20000',
  AI_MAX_RETRIES = '2'
} = process.env;

if (!AUTH_JWT_SECRET || AUTH_JWT_SECRET.length < 32) {
  throw new Error('AUTH_JWT_SECRET must contain at least 32 characters.');
}
if (!CLIENT_ORIGIN || !MONGODB_URI || !MONGODB_DB_NAME) {
  throw new Error('CLIENT_ORIGIN, MONGODB_URI, and MONGODB_DB_NAME must be configured.');
}
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY must be configured.');
}

const client = new MongoClient(MONGODB_URI);
await client.connect();

const db = client.db(MONGODB_DB_NAME);
await db.collection('users').createIndex({ email: 1 }, { unique: true });

const geminiClient = createGeminiClient({
  apiKey: GEMINI_API_KEY,
  modelName: GEMINI_MODEL,
  timeoutMs: Number(AI_TIMEOUT_MS),
  maxRetries: Number(AI_MAX_RETRIES)
});

const app = createApp({
  users: db.collection('users'),
  jwtSecret: AUTH_JWT_SECRET,
  clientOrigin: CLIENT_ORIGIN,
  geminiClient,
  production: NODE_ENV === 'production'
});

const server = app.listen(Number(PORT), () => {
  console.log(`TrampoTech API listening on port ${PORT}.`);
  console.log(`Gemini model: ${GEMINI_MODEL}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(async () => {
      await client.close();
      process.exit(0);
    });
  });
}
