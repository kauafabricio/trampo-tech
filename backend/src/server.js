import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { createApp } from './app.js';

const {
  AUTH_JWT_SECRET,
  CLIENT_ORIGIN,
  MONGODB_DB_NAME,
  MONGODB_URI,
  NODE_ENV,
  PORT = '3000'
} = process.env;

if (!AUTH_JWT_SECRET || AUTH_JWT_SECRET.length < 32) {
  throw new Error('AUTH_JWT_SECRET must contain at least 32 characters.');
}
if (!CLIENT_ORIGIN || !MONGODB_URI || !MONGODB_DB_NAME) {
  throw new Error('CLIENT_ORIGIN, MONGODB_URI, and MONGODB_DB_NAME must be configured.');
}

const client = new MongoClient(MONGODB_URI);
await client.connect();

const db = client.db(MONGODB_DB_NAME);
await db.collection('users').createIndex({ email: 1 }, { unique: true });
await db.collection('diagnoses').createIndex({ userId: 1 }, { unique: true });

const app = createApp({
  users: db.collection('users'),
  diagnoses: db.collection('diagnoses'),
  jwtSecret: AUTH_JWT_SECRET,
  clientOrigin: CLIENT_ORIGIN,
  production: NODE_ENV === 'production'
});

const server = app.listen(Number(PORT), () => {
  console.log(`TrampoTech API listening on port ${PORT}.`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(async () => {
      await client.close();
      process.exit(0);
    });
  });
}
