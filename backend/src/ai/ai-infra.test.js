/**
 * Teste de integração da Etapa 1 — Infraestrutura de IA
 * Valida: imports, criação do cliente, montagem do router, rota /ping
 * Não depende de MongoDB nem de chave real do Gemini.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { createGeminiClient } from './gemini-client.js';
import { createAiRouter } from '../routes/ai.js';

// --- helpers ---
function makeRequest(app, method, path, { headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, async () => {
      const { port } = server.address();
      const url = `http://localhost:${port}${path}`;
      try {
        const opts = {
          method,
          headers: { 'Content-Type': 'application/json', ...headers }
        };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(url, opts);
        const json = await res.json().catch(() => null);
        resolve({ status: res.status, body: json });
      } catch (err) {
        reject(err);
      } finally {
        server.close();
      }
    });
  });
}

// --- testes ---

test('1. createGeminiClient — cria cliente com interface correta', () => {
  const client = createGeminiClient({ apiKey: 'fake', modelName: 'gemini-2.0-flash' });
  assert.equal(typeof client.generate, 'function', 'generate deve ser função');
  assert.equal(typeof client.healthCheck, 'function', 'healthCheck deve ser função');
  assert.equal(client.modelName, 'gemini-2.0-flash', 'modelName deve ser preservado');
});

test('2. createGeminiClient — lança erro sem apiKey', () => {
  assert.throws(
    () => createGeminiClient({ apiKey: '', modelName: 'gemini-2.0-flash' }),
    /GEMINI_API_KEY/
  );
});

test('3. createGeminiClient — lança erro sem modelName', () => {
  assert.throws(
    () => createGeminiClient({ apiKey: 'fake', modelName: '' }),
    /GEMINI_MODEL/
  );
});

test('4. createAiRouter — retorna um router Express', () => {
  const fakeClient = { generate: async () => 'ok', healthCheck: async () => true, modelName: 'test' };
  const fakeAuth = (_req, _res, next) => next();
  const router = createAiRouter({ geminiClient: fakeClient, requireAuth: fakeAuth });
  assert.equal(typeof router, 'function', 'router deve ser função Express');
});

test('5. GET /ping — retorna 200 com status ok quando healthCheck passa', async () => {
  const fakeClient = {
    healthCheck: async () => true,
    modelName: 'gemini-2.0-flash'
  };
  const fakeAuth = (_req, _res, next) => next();

  const app = express();
  app.use('/api/ai', createAiRouter({ geminiClient: fakeClient, requireAuth: fakeAuth }));

  const { status, body } = await makeRequest(app, 'GET', '/api/ai/ping');
  assert.equal(status, 200);
  assert.equal(body.status, 'ok');
  assert.equal(body.model, 'gemini-2.0-flash');
});

test('6. GET /ping — retorna 503 quando healthCheck retorna false', async () => {
  const fakeClient = {
    healthCheck: async () => false,
    modelName: 'gemini-2.0-flash'
  };
  const fakeAuth = (_req, _res, next) => next();

  const app = express();
  app.use('/api/ai', createAiRouter({ geminiClient: fakeClient, requireAuth: fakeAuth }));

  const { status, body } = await makeRequest(app, 'GET', '/api/ai/ping');
  assert.equal(status, 503);
  assert.equal(body.status, 'error');
});

test('7. GET /ping — retorna 401 quando requireAuth recusa', async () => {
  const fakeClient = { healthCheck: async () => true, modelName: 'test' };
  const strictAuth = (_req, res) => res.status(401).json({ message: 'Autenticação necessária.' });

  const app = express();
  app.use('/api/ai', createAiRouter({ geminiClient: fakeClient, requireAuth: strictAuth }));

  const { status } = await makeRequest(app, 'GET', '/api/ai/ping');
  assert.equal(status, 401);
});

test('8. GET /ping — retorna 503 quando healthCheck lança erro de auth Gemini', async () => {
  const fakeClient = {
    healthCheck: async () => { const e = new Error('Unauthorized'); e.status = 401; throw e; },
    modelName: 'test'
  };
  const fakeAuth = (_req, _res, next) => next();

  const app = express();
  app.use('/api/ai', createAiRouter({ geminiClient: fakeClient, requireAuth: fakeAuth }));

  const { status, body } = await makeRequest(app, 'GET', '/api/ai/ping');
  assert.equal(status, 503);
  assert.match(body.message, /Chave de API/);
});
