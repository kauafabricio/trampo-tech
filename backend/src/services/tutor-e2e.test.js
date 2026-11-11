import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { ObjectId } from 'mongodb';
import { createApp, createFallbackCollection } from '../app.js';
import { defaultTrail } from '../trails/default-trail.js';

describe('Ciclo Completo E2E do Tutor IA e Adaptação de Trilha (Prompt 3)', () => {
  let server;
  let origin;
  let userCookie;
  let otherUserCookie;
  let userId;
  let otherUserId;
  let tutorProposedTrailId;

  const usersCollection = createFallbackCollection();
  const customTrailsCollection = createFallbackCollection();
  const userProgressCollection = createFallbackCollection();
  const diagnosticResultsCollection = createFallbackCollection();
  const tutorMessagesCollection = createFallbackCollection();

  // Mock do Gemini Client para o fluxo E2E
  const mockGeminiClient = {
    modelName: 'gemini-mock',
    async generate({ systemPrompt, jsonMode }) {
      if (jsonMode && systemPrompt?.includes('analisador')) {
        return JSON.stringify({
          pain_detected: true,
          pain_description: 'gestão de conflitos e liderança de times remotos',
          confidence: 'high'
        });
      }
      if (jsonMode && systemPrompt?.includes('5x5x5')) {
        const generated = JSON.parse(JSON.stringify(defaultTrail));
        generated.titulo = 'Trilha Especializada em Liderança e Gestão de Conflitos';
        generated.descricao = 'Trilha desenvolvida pelo Tutor IA para capacitação em gestão de equipes remotas.';
        return JSON.stringify(generated);
      }
      return 'Olá! Como seu tutor, recomendo a leitura do livro "High Output Management" do Andy Grove e focar no tópico atual da sua trilha.';
    }
  };

  const app = createApp({
    users: usersCollection,
    customTrails: customTrailsCollection,
    userProgress: userProgressCollection,
    diagnosticResults: diagnosticResultsCollection,
    chatMessages: tutorMessagesCollection,
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

  it('1. Registra usuário e valida que inicia com trilha padrão do código', async () => {
    const reg = await fetch(`${origin}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Aluno Tutor Teste',
        email: 'alunotutor@trampotech.com',
        senha: 'Password123',
        termosAceitos: true
      })
    });
    assert.equal(reg.status, 201);
    userCookie = reg.headers.get('set-cookie')?.split(';')[0];
    const data = await reg.json();
    userId = data.user.id;
    assert.equal(data.user.trail_source, 'default');
    assert.equal(data.user.custom_trail_id, null);

    // Registra segundo usuário para teste de ownership
    const regOther = await fetch(`${origin}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Outro Aluno',
        email: 'outroaluno@trampotech.com',
        senha: 'Password123',
        termosAceitos: true
      })
    });
    otherUserCookie = regOther.headers.get('set-cookie')?.split(';')[0];
    const dataOther = await regOther.json();
    otherUserId = dataOther.user.id;
  });

  it('2. Envia mensagem ao Tutor IA e recebe resposta com materiais contextualizados', async () => {
    const res = await fetch(`${origin}/api/tutor/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: userCookie
      },
      body: JSON.stringify({
        message: 'Estou com muita dificuldade em alinhar as expectativas da minha equipe remota e gerir conflitos.'
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.user_message.role, 'user');
    assert.equal(body.assistant_message.role, 'assistant');
    assert.ok(body.assistant_message.content.includes('Andy Grove') || body.assistant_message.content.includes('tutor'));
    assert.equal(body.pain_detected, true);
    assert.ok(body.proposed_trail !== null);
    assert.equal(body.proposed_trail.status, 'proposta');
    assert.equal(body.proposed_trail.origem_gatilho, 'tutor');

    tutorProposedTrailId = body.proposed_trail.id;
  });

  it('3. Histórico do chat é recuperado em ordem cronológica via GET /api/tutor/history', async () => {
    const res = await fetch(`${origin}/api/tutor/history`, {
      headers: { Cookie: userCookie }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.messages));
    assert.ok(body.messages.length >= 2);
    assert.equal(body.messages[0].role, 'user');
    assert.equal(body.messages[1].role, 'assistant');
  });

  it('4. Validação de Ownership: Outro usuário não pode aceitar a proposta gerada para o primeiro', async () => {
    const res = await fetch(`${origin}/api/tutor/proposals/${tutorProposedTrailId}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: otherUserCookie
      },
      body: JSON.stringify({ decision: 'accept' })
    });

    assert.equal(res.status, 403, 'Deve retornar 403 Forbidden quando a proposta não pertencer ao usuário');
    const body = await res.json();
    assert.match(body.message, /não pertence ao usuário/);
  });

  it('5. Usuário aceita a proposta: vira ativa, trail_source vira "custom" e trilha padrão é desativada sem alterar o código', async () => {
    const res = await fetch(`${origin}/api/tutor/proposals/${tutorProposedTrailId}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: userCookie
      },
      body: JSON.stringify({ decision: 'accept' })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.decision, 'accept');

    // Verifica se getActiveTrail agora entrega a nova trilha personalizada
    const activeRes = await fetch(`${origin}/api/trails/active`, {
      headers: { Cookie: userCookie }
    });
    assert.equal(activeRes.status, 200);
    const activeBody = await activeRes.json();
    assert.equal(activeBody.source, 'custom');
    assert.equal(activeBody.custom_trail_id, tutorProposedTrailId);
    assert.equal(activeBody.origem_gatilho, 'tutor');
    assert.equal(activeBody.trail.titulo, 'Trilha Especializada em Liderança e Gestão de Conflitos');
    assert.equal(activeBody.trail.modulos.length, 5);
  });
});
