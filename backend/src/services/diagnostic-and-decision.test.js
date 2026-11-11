import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { ObjectId } from 'mongodb';
import { createApp, createFallbackCollection } from '../app.js';
import { defaultTrail } from '../trails/default-trail.js';

describe('Fluxo Completo de Diagnóstico, Geração de Trilha por IA e Decisão do Usuário', () => {
  let server;
  let origin;
  let userACookie;
  let userBCookie;
  let userAId;
  let userBId;
  let customTrailId;

  const usersCollection = createFallbackCollection();
  const customTrailsCollection = createFallbackCollection();
  const userProgressCollection = createFallbackCollection();
  const diagnosticResultsCollection = createFallbackCollection();

  // Mock do cliente Gemini que gera uma trilha válida no formato 5x5x5
  const mockGeminiClient = {
    modelName: 'gemini-mock',
    async generate() {
      const generated = JSON.parse(JSON.stringify(defaultTrail));
      generated.titulo = 'Trilha de Gestão Especializada em IA e Escala';
      generated.descricao = 'Trilha customizada para sanar lacunas de débito técnico e metodologias ágeis.';
      return JSON.stringify(generated);
    }
  };

  const app = createApp({
    users: usersCollection,
    customTrails: customTrailsCollection,
    userProgress: userProgressCollection,
    diagnosticResults: diagnosticResultsCollection,
    jwtSecret: 'test-secret-with-more-than-thirty-two-characters-long',
    clientOrigin: 'http://localhost:4200',
    geminiClient: mockGeminiClient
  });

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

  it('1. Registra Usuário A e Usuário B com trail_source = "default"', async () => {
    const regA = await fetch(`${origin}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Usuario A',
        email: 'userA@trampotech.com',
        senha: 'Password123',
        termosAceitos: true
      })
    });
    assert.equal(regA.status, 201);
    userACookie = regA.headers.get('set-cookie')?.split(';')[0];
    const dataA = await regA.json();
    userAId = dataA.user.id;
    assert.equal(dataA.user.trail_source, 'default');
    assert.equal(dataA.user.custom_trail_id, null);

    const regB = await fetch(`${origin}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Usuario B',
        email: 'userB@trampotech.com',
        senha: 'Password123',
        termosAceitos: true
      })
    });
    assert.equal(regB.status, 201);
    userBCookie = regB.headers.get('set-cookie')?.split(';')[0];
    const dataB = await regB.json();
    userBId = dataB.user.id;
    assert.equal(dataB.user.trail_source, 'default');
  });

  it('2. Obtém perguntas do diagnóstico via GET /api/diagnostic/questions', async () => {
    const res = await fetch(`${origin}/api/diagnostic/questions`, {
      headers: { Cookie: userACookie }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.questions));
    assert.equal(body.questions.length, 5);
    assert.equal(body.questions[0].opcoes.length, 4);
  });

  it('3. Envia respostas do diagnóstico, salva no banco e gera trilha com status "proposta"', async () => {
    const submitRes = await fetch(`${origin}/api/diagnostic/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: userACookie
      },
      body: JSON.stringify({
        respostas: [
          { question_id: 'diag-q1', selected_option: 2 },
          { question_id: 'diag-q2', selected_option: 1 },
          { question_id: 'diag-q3', selected_option: 0 },
          { question_id: 'diag-q4', selected_option: 0 },
          { question_id: 'diag-q5', selected_option: 1 }
        ]
      })
    });

    assert.equal(submitRes.status, 201);
    const body = await submitRes.json();

    // Diagnóstico salvo
    assert.ok(body.diagnostic);
    assert.equal(typeof body.diagnostic.pontuacao_total, 'number');
    assert.ok(Array.isArray(body.diagnostic.resumo_lacunas));

    // Trilha personalizada gerada e proposta
    assert.ok(body.proposed_trail);
    assert.equal(body.proposed_trail.status, 'proposta');
    assert.equal(body.proposed_trail.origem_gatilho, 'diagnostico');
    assert.ok(body.proposed_trail.id);
    customTrailId = body.proposed_trail.id;

    // Regra central: a trilha ativa NÃO foi alterada automaticamente!
    const activeRes = await fetch(`${origin}/api/trails/active`, {
      headers: { Cookie: userACookie }
    });
    assert.equal(activeRes.status, 200);
    const activeBody = await activeRes.json();
    assert.equal(activeBody.source, 'default', 'A trilha ativa ainda deve ser default');
    assert.equal(activeBody.custom_trail_id, null);
    assert.equal(activeBody.trail.id, 'default-trail');
  });

  it('4. Retorna as duas opções lado a lado em GET /api/trails/options', async () => {
    const res = await fetch(`${origin}/api/trails/options`, {
      headers: { Cookie: userACookie }
    });
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.ok(body.default_trail);
    assert.equal(body.default_trail.id, 'default-trail');
    assert.equal(body.default_trail.modulos.length, 5);

    assert.ok(body.proposed_trail);
    assert.equal(body.proposed_trail.id, customTrailId);
    assert.equal(body.proposed_trail.status, 'proposta');
    assert.equal(body.proposed_trail.modulos.length, 5);

    assert.ok(body.diagnostic);
    assert.equal(body.active_trail_source, 'default');
  });

  it('5. Validação de dono: Usuário B não pode ativar a trilha personalizada do Usuário A', async () => {
    const res = await fetch(`${origin}/api/trails/choose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: userBCookie
      },
      body: JSON.stringify({
        choice: 'custom',
        custom_trail_id: customTrailId
      })
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.message, /não pertence ao usuário/);
  });

  it('6. Usuário A escolhe a trilha personalizada: vira "ativa" e getActiveTrail passa a devolvê-la', async () => {
    const chooseRes = await fetch(`${origin}/api/trails/choose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: userACookie
      },
      body: JSON.stringify({
        choice: 'custom',
        custom_trail_id: customTrailId
      })
    });

    assert.equal(chooseRes.status, 200);
    const chooseBody = await chooseRes.json();
    assert.equal(chooseBody.source, 'custom');
    assert.equal(chooseBody.status, 'ativa');
    assert.equal(chooseBody.custom_trail_id, customTrailId);

    // Consulta trilha ativa
    const activeRes = await fetch(`${origin}/api/trails/active`, {
      headers: { Cookie: userACookie }
    });
    const activeData = await activeRes.json();
    assert.equal(activeData.source, 'custom');
    assert.equal(activeData.custom_trail_id, customTrailId);
    assert.equal(activeData.status, 'ativa');
    assert.equal(activeData.trail.modulos.length, 5);
  });

  it('7. Usuário A decide voltar para a padrão: proposta é arquivada e trail_source vira "default"', async () => {
    const chooseDefaultRes = await fetch(`${origin}/api/trails/choose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: userACookie
      },
      body: JSON.stringify({
        choice: 'default'
      })
    });

    assert.equal(chooseDefaultRes.status, 200);
    const body = await chooseDefaultRes.json();
    assert.equal(body.source, 'default');
    assert.equal(body.custom_trail_id, null);

    const activeRes = await fetch(`${origin}/api/trails/active`, {
      headers: { Cookie: userACookie }
    });
    const activeData = await activeRes.json();
    assert.equal(activeData.source, 'default');
    assert.equal(activeData.custom_trail_id, null);
    assert.equal(activeData.trail.id, 'default-trail');
  });
});
