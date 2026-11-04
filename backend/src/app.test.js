import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { ObjectId } from 'mongodb';
import { createApp } from './app.js';

const storedUsers = [];
const storedDiagnoses = [];
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
    Object.assign(user, $set);
  }
};
const diagnoses = {
  async findOne({ userId }) {
    return storedDiagnoses.find(diagnostic => diagnostic.userId.equals(userId)) ?? null;
  },
  async updateOne({ userId }, { $set, $setOnInsert }, { upsert }) {
    let diagnostic = storedDiagnoses.find(item => item.userId.equals(userId));
    if (!diagnostic && upsert) {
      diagnostic = { ...$setOnInsert };
      storedDiagnoses.push(diagnostic);
    }
    Object.assign(diagnostic, $set);
  }
};

const app = createApp({
  users,
  diagnoses,
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

describe('authentication API', () => {
  it('registers, authenticates, returns the session user, and logs out', async () => {
    const registration = await fetch(`${origin}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nome: 'Ana Silva',
        email: 'ANA@example.com',
        senha: 'senha123',
        termosAceitos: true
      })
    });

    assert.equal(registration.status, 201);
    const registrationBody = await registration.json();
    assert.equal(registrationBody.user.email, 'ana@example.com');
    assert.equal('passwordHash' in registrationBody.user, false);
    const storedUser = storedUsers.find(user => user._id.toString() === registrationBody.user.id);
    assert.ok(storedUser.passwordHash);
    assert.notEqual(storedUser.passwordHash, 'senha123');
    const setCookie = registration.headers.get('set-cookie');
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /Path=\/api/i);
    const cookie = setCookie.split(';', 1)[0];

    const session = await fetch(`${origin}/api/auth/me`, {
      headers: { cookie }
    });
    assert.equal(session.status, 200);
    assert.equal((await session.json()).user.id, registrationBody.user.id);

    const profileUpdate = await fetch(`${origin}/api/auth/me`, {
      method: 'PATCH',
      headers: {
        cookie,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        nome: 'Ana Costa',
        email: 'ana@example.com',
        trilhaEscolhida: 'fundamentos'
      })
    });
    assert.equal(profileUpdate.status, 200);
    assert.equal((await profileUpdate.json()).user.trilhaEscolhida, 'fundamentos');

    const logout = await fetch(`${origin}/api/auth/logout`, { method: 'POST' });
    assert.equal(logout.status, 200);

    const login = await fetch(`${origin}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ANA@example.com', senha: 'senha123' })
    });
    assert.equal(login.status, 200);
    const loginBody = await login.json();
    assert.equal(loginBody.user.id, registrationBody.user.id);
    assert.equal('passwordHash' in loginBody.user, false);
    assert.match(login.headers.get('set-cookie'), /HttpOnly/i);
  });

  it('rejects duplicate registrations and invalid credentials', async () => {
    const duplicate = await fetch(`${origin}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nome: 'Ana Silva',
        email: 'ana@example.com',
        senha: 'senha123',
        termosAceitos: true
      })
    });
    assert.equal(duplicate.status, 409);

    const invalidLogin = await fetch(`${origin}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ana@example.com', senha: 'errada123' })
    });
    assert.equal(invalidLogin.status, 401);
  });
});

describe('initial diagnosis API', () => {
  it('supports a new account through the first diagnosis lookup, save, and reload', async () => {
    const registration = await fetch(`${origin}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nome: 'Diagnóstico Inicial',
        email: 'diagnostico@example.com',
        senha: 'senha123',
        termosAceitos: true
      })
    });
    assert.equal(registration.status, 201);
    const setCookie = registration.headers.get('set-cookie');
    assert.match(setCookie, /Path=\/api/i);
    const cookie = setCookie.split(';', 1)[0];

    const empty = await fetch(`${origin}/api/diagnostico`, { headers: { cookie } });
    assert.equal(empty.status, 200);
    assert.deepEqual(await empty.json(), { diagnostico: null });

    const respostas = {
      estagio: 'MVP — temos uma versão inicial do produto.',
      tamanhoEquipe: '2 a 5 pessoas.',
      organizacaoProjetos: 'Utilizamos planilhas ou listas de tarefas.',
      objetivos: 'São documentados com metas, prazos e indicadores.',
      distribuicaoTarefas: 'Cada integrante possui responsabilidades definidas.',
      prazos: 'Definimos prazos sem estimativas estruturadas.',
      riscos: 'Não identificamos riscos antecipadamente.',
      acompanhamento: 'Utiliza reuniões, planilhas ou ferramentas.',
      prioridades: 'Utilizamos critérios definidos para priorizar e reorganizar tarefas.',
      registroDecisoes: 'Ficam principalmente em conversas e mensagens.',
      identificacaoAtrasos: 'Acompanhamos as tarefas e seus prazos.',
      processos: 'Os principais processos estão documentados e são revisados.',
      revisaoResultados: 'Somente quando surge um problema.',
      resultadoDesejado: 'Melhorar o planejamento.',
      problemaRecorrente: 'Mudanças frequentes de prioridade.'
    };

    const invalid = await fetch(`${origin}/api/diagnostico`, {
      method: 'POST',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ respostas: { ...respostas, riscos: 'opção inválida' } })
    });
    assert.equal(invalid.status, 400);

    const saved = await fetch(`${origin}/api/diagnostico`, {
      method: 'POST',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ respostas })
    });
    assert.equal(saved.status, 201);
    const savedBody = await saved.json();
    assert.equal(savedBody.diagnostico.respostas.resultadoDesejado, respostas.resultadoDesejado);
    assert.equal(savedBody.diagnostico.respostas.estagio, respostas.estagio);
    assert.equal(savedBody.diagnostico.resultado.pontuacaoGeral, 59);
    assert.equal(savedBody.diagnostico.resultado.nivelMaturidade, 'Estruturado');
    assert.equal(storedDiagnoses.length, 1);

    const loaded = await fetch(`${origin}/api/diagnostico`, { headers: { cookie } });
    assert.equal(loaded.status, 200);
    assert.deepEqual((await loaded.json()).diagnostico, savedBody.diagnostico);
  });

  it('requires an authenticated session to access diagnoses', async () => {
    const response = await fetch(`${origin}/api/diagnostico`);
    assert.equal(response.status, 401);
  });
});
