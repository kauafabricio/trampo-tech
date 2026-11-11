import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { ObjectId } from 'mongodb';
import { createApp } from './app.js';
import { defaultTrail } from './trails/default-trail.js';

const storedUsers = [];
const users = {
  async findOne(query) {
    if (query.email) {
      return storedUsers.find(user =>
        user.email === query.email
        && (!query._id?.$ne || !user._id.equals(query._id.$ne))
      ) ?? null;
    }
    return storedUsers.find(user => user._id.equals(query._id)) ?? null;
  },
  async insertOne(user) {
    if (storedUsers.some(existing => existing.email === user.email)) {
      const error = new Error('Duplicate email.');
      error.code = 11000;
      throw error;
    }
    user._id = new ObjectId();
    storedUsers.push(user);
    return { insertedId: user._id };
  },
  async updateOne({ _id }, { $set }) {
    const user = storedUsers.find(existing => existing._id.equals(_id));
    if (user) Object.assign(user, $set);
    return { matchedCount: user ? 1 : 0 };
  }
};

const app = createApp({
  users,
  jwtSecret: 'test-secret-with-more-than-thirty-two-characters',
  clientOrigin: 'http://localhost:4200'
});
let server;
let origin;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
});

describe('API de Autenticação e Fundação de Trilhas', () => {
  let sessionCookie;
  let userId;

  it('registra usuário com trail_source = "default", autentica e retorna sessão', async () => {
    const registration = await fetch(`${origin}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nome: 'Marina Startup',
        email: 'MARINA@STARTUP.COM',
        senha: 'senha123',
        termosAceitos: true
      })
    });

    assert.equal(registration.status, 201);
    const body = await registration.json();
    assert.equal(body.user.email, 'marina@startup.com');
    assert.equal(body.user.trail_source, 'default', 'Novo usuário deve ter trail_source = "default"');
    assert.equal(body.user.custom_trail_id, null, 'Novo usuário não deve ter custom_trail_id');
    assert.equal('passwordHash' in body.user, false);
    assert.ok(typeof body.token === 'string' && body.token.length > 20, 'Deve retornar o token JWT');

    userId = body.user.id;
    const bearerToken = body.token;
    const setCookie = registration.headers.get('set-cookie');
    assert.match(setCookie, /HttpOnly/i);
    sessionCookie = setCookie.split(';', 1)[0];

    const session = await fetch(`${origin}/api/auth/me`, {
      headers: { cookie: sessionCookie }
    });
    assert.equal(session.status, 200);
    const sessionBody = await session.json();
    assert.equal(sessionBody.user.id, userId);
    assert.equal(sessionBody.user.trail_source, 'default');

    // Valida autenticação alternativa via Authorization: Bearer <token>
    const sessionBearer = await fetch(`${origin}/api/auth/me`, {
      headers: { authorization: `Bearer ${bearerToken}` }
    });
    assert.equal(sessionBearer.status, 200);
    const sessionBearerBody = await sessionBearer.json();
    assert.equal(sessionBearerBody.user.id, userId);
  });

  it('GET /api/trails/active retorna a trilha padrão vinda do código com 5 módulos', async () => {
    const res = await fetch(`${origin}/api/trails/active`, {
      headers: { cookie: sessionCookie }
    });

    assert.equal(res.status, 200);
    const data = await res.json();

    assert.equal(data.source, 'default');
    assert.equal(data.custom_trail_id, null);
    assert.equal(data.status, 'ativa');
    assert.equal(data.trail.id, 'default-trail');
    assert.equal(data.trail.modulos.length, 5);

    // Progresso inicial retornado junto
    assert.equal(data.progress.completed_topics_count, 0);
    assert.equal(data.progress.current_module_id, 'default-m1');
  });

  it('POST /api/trails/progress/topic conclui um tópico na trilha ativa', async () => {
    const res = await fetch(`${origin}/api/trails/progress/topic`, {
      method: 'POST',
      headers: {
        cookie: sessionCookie,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ topicId: 'default-m1-t1' })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.completed_topics.includes('default-m1-t1'));

    // Consulta progresso
    const progressRes = await fetch(`${origin}/api/trails/progress`, {
      headers: { cookie: sessionCookie }
    });
    const progress = await progressRes.json();
    assert.equal(progress.completed_topics_count, 1);
    assert.deepEqual(progress.completed_topics, ['default-m1-t1']);
  });

  it('POST /api/trails/progress/assessment avalia o módulo 1 e desbloqueia o módulo 2', async () => {
    const m1 = defaultTrail.modulos[0];
    const answers = {
      [m1.avaliacao.perguntas[0].id]: m1.avaliacao.perguntas[0].respostaCorreta,
      [m1.avaliacao.perguntas[1].id]: m1.avaliacao.perguntas[1].respostaCorreta,
      [m1.avaliacao.perguntas[2].id]: m1.avaliacao.perguntas[2].respostaCorreta,
      [m1.avaliacao.perguntas[3].id]: m1.avaliacao.perguntas[3].respostaCorreta,
      [m1.avaliacao.perguntas[4].id]: m1.avaliacao.perguntas[4].respostaCorreta
    };

    const res = await fetch(`${origin}/api/trails/progress/assessment`, {
      method: 'POST',
      headers: {
        cookie: sessionCookie,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        moduleId: 'default-m1',
        answers
      })
    });

    assert.equal(res.status, 200);
    const result = await res.json();
    assert.equal(result.score, 100);
    assert.equal(result.passed, true);
    assert.equal(result.nextModuleId, 'default-m2');
  });

  it('atualiza perfil com PATCH /api/auth/me', async () => {
    const profileUpdate = await fetch(`${origin}/api/auth/me`, {
      method: 'PATCH',
      headers: {
        cookie: sessionCookie,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        nome: 'Marina Gestora',
        email: 'marina@startup.com'
      })
    });
    assert.equal(profileUpdate.status, 200);
    assert.equal((await profileUpdate.json()).user.nome, 'Marina Gestora');
  });

  it('faz logout com sucesso', async () => {
    const logout = await fetch(`${origin}/api/auth/logout`, { method: 'POST' });
    assert.equal(logout.status, 200);
  });

  it('rejeita duplicações e credenciais inválidas', async () => {
    const duplicate = await fetch(`${origin}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nome: 'Marina Startup',
        email: 'marina@startup.com',
        senha: 'senha123',
        termosAceitos: true
      })
    });
    assert.equal(duplicate.status, 409);

    const invalidLogin = await fetch(`${origin}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'marina@startup.com', senha: 'errada123' })
    });
    assert.equal(invalidLogin.status, 401);
  });
});
