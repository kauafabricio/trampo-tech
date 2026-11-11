import test from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { TutorService } from './tutor-service.js';
import { defaultTrail } from '../trails/default-trail.js';

// ─── Helpers de Mock ────────────────────────────────────────────────────────

function makeUser(overrides = {}) {
  return {
    _id: new ObjectId(),
    nome: 'Usuário Teste',
    email: 'teste@trampotech.com',
    trail_source: 'default',
    custom_trail_id: null,
    ...overrides
  };
}

function createMockRepos(user) {
  const users = [user];
  const customTrails = [];
  const chatMessages = [];

  const usersRepo = {
    async findById(id) {
      return users.find(u => u._id.toString() === id.toString()) || null;
    },
    async setActiveTrail(id, { trail_source, custom_trail_id }) {
      const u = await this.findById(id);
      if (u) {
        u.trail_source = trail_source;
        u.custom_trail_id = custom_trail_id ? new ObjectId(custom_trail_id) : null;
      }
      return u;
    }
  };

  const customTrailsRepo = {
    async findById(id) {
      return customTrails.find(t => t._id.toString() === id.toString()) || null;
    },
    async create({ userId, trailData, origemGatilho, status = 'proposta' }) {
      const doc = {
        _id: new ObjectId(),
        user_id: new ObjectId(userId),
        trail_data: trailData,
        origem_gatilho: origemGatilho,
        status,
        criado_em: new Date(),
        atualizado_em: new Date()
      };
      customTrails.push(doc);
      return doc;
    },
    async updateStatus(id, status) {
      const doc = await this.findById(id);
      if (doc) doc.status = status;
      return doc;
    },
    async findLatestProposedByUserId(userId) {
      return customTrails
        .filter(t => t.user_id.toString() === userId.toString() && t.status === 'proposta')
        .sort((a, b) => b.criado_em - a.criado_em)[0] || null;
    }
  };

  const chatMessagesRepo = {
    async create({ userId, role, content, metadata = {} }) {
      const doc = {
        _id: new ObjectId(),
        user_id: new ObjectId(userId),
        role,
        content,
        metadata,
        criado_em: new Date()
      };
      chatMessages.push(doc);
      return doc;
    },
    async findRecentByUserId(userId, limit = 20) {
      const uid = userId.toString();
      const msgs = chatMessages
        .filter(m => m.user_id.toString() === uid)
        .sort((a, b) => b.criado_em - a.criado_em)
        .slice(0, limit);
      return msgs.reverse();
    },
    async findAllByUserId(userId) {
      const uid = userId.toString();
      return chatMessages
        .filter(m => m.user_id.toString() === uid)
        .sort((a, b) => a.criado_em - b.criado_em);
    }
  };

  return { usersRepo, customTrailsRepo, chatMessagesRepo, users, customTrails, chatMessages };
}

function createMockTrailService(user) {
  return {
    async getActiveTrail(_userId) {
      return {
        source: 'default',
        custom_trail_id: null,
        status: 'ativa',
        origem_gatilho: 'padrao',
        trail: defaultTrail
      };
    }
  };
}

function createMockGeminiClient(responses = {}) {
  return {
    modelName: 'gemini-mock',
    _callCount: 0,
    async generate({ systemPrompt, jsonMode }) {
      this._callCount++;
      // Resposta diferente por tipo de prompt (detecção de dor vs tutor vs geração de trilha)
      if (jsonMode && systemPrompt?.includes('analisador')) {
        return responses.painDetection || JSON.stringify({
          pain_detected: false,
          pain_description: null,
          confidence: 'low'
        });
      }
      if (jsonMode && systemPrompt?.includes('5x5x5')) {
        return responses.trailGeneration || JSON.stringify(defaultTrail);
      }
      // Resposta de texto do tutor
      return responses.tutorResponse || 'Ótima pergunta! Vou te ajudar com isso.';
    }
  };
}

// ─── Testes ────────────────────────────────────────────────────────────────

test('TutorService — Chat do Tutor IA e Ciclo de Adaptação de Trilha', async (t) => {

  await t.test('deve rejeitar mensagem vazia', async () => {
    const user = makeUser();
    const { usersRepo, customTrailsRepo, chatMessagesRepo } = createMockRepos(user);
    const trailService = createMockTrailService(user);
    const geminiClient = createMockGeminiClient();

    const tutorService = new TutorService({
      geminiClient, chatMessagesRepo, trailService, customTrailsRepo, usersRepo
    });

    await assert.rejects(
      () => tutorService.sendMessage(user._id, '   '),
      /não pode estar vazia/
    );
  });

  await t.test('deve persistir mensagem do usuário e resposta do tutor no banco', async () => {
    const user = makeUser();
    const { usersRepo, customTrailsRepo, chatMessagesRepo, chatMessages } = createMockRepos(user);
    const trailService = createMockTrailService(user);
    const geminiClient = createMockGeminiClient({
      tutorResponse: 'Claro! Scrum é um framework ágil...'
    });

    const tutorService = new TutorService({
      geminiClient, chatMessagesRepo, trailService, customTrailsRepo, usersRepo
    });

    const result = await tutorService.sendMessage(user._id, 'O que é Scrum?');

    assert.equal(result.user_message.role, 'user');
    assert.equal(result.user_message.content, 'O que é Scrum?');
    assert.equal(result.assistant_message.role, 'assistant');
    assert.ok(result.assistant_message.content.length > 0);
    // Ambas as mensagens devem estar no banco
    assert.equal(chatMessages.length, 2);
    assert.equal(chatMessages[0].role, 'user');
    assert.equal(chatMessages[1].role, 'assistant');
  });

  await t.test('deve retornar histórico em ordem cronológica', async () => {
    const user = makeUser();
    const { usersRepo, customTrailsRepo, chatMessagesRepo } = createMockRepos(user);
    const trailService = createMockTrailService(user);
    const geminiClient = createMockGeminiClient();

    const tutorService = new TutorService({
      geminiClient, chatMessagesRepo, trailService, customTrailsRepo, usersRepo
    });

    await tutorService.sendMessage(user._id, 'Primeira mensagem');
    await tutorService.sendMessage(user._id, 'Segunda mensagem');

    const history = await tutorService.getChatHistory(user._id);
    assert.ok(history.length >= 4); // 2 user + 2 assistant
    assert.equal(history[0].role, 'user');
    assert.equal(history[0].content, 'Primeira mensagem');
  });

  await t.test('deve detectar dor e gerar proposta de trilha com origem "tutor"', async () => {
    const user = makeUser();
    const { usersRepo, customTrailsRepo, chatMessagesRepo, customTrails } = createMockRepos(user);
    const trailService = createMockTrailService(user);

    // Pré-popula histórico com 2 msgs de usuário para ativar detecção
    await chatMessagesRepo.create({ userId: user._id, role: 'user', content: 'Tenho dificuldade em gerir minha equipe' });
    await chatMessagesRepo.create({ userId: user._id, role: 'assistant', content: 'Entendo. Pode me contar mais?' });

    const geminiClient = createMockGeminiClient({
      painDetection: JSON.stringify({
        pain_detected: true,
        pain_description: 'gestão de equipes em startups',
        confidence: 'high'
      }),
      trailGeneration: JSON.stringify(defaultTrail),
      tutorResponse: 'Baseado no que me contou, sugiro focar em liderança situacional.'
    });

    const tutorService = new TutorService({
      geminiClient, chatMessagesRepo, trailService, customTrailsRepo, usersRepo
    });

    const result = await tutorService.sendMessage(user._id, 'Continuo com dificuldades na gestão de pessoas');

    assert.equal(result.pain_detected, true);
    assert.ok(result.pain_description?.includes('gestão'));
    assert.ok(result.proposed_trail !== null);
    assert.equal(result.proposed_trail.status, 'proposta');
    // A proposta deve estar no banco com origem 'tutor'
    const savedDoc = customTrails.find(t => t.origem_gatilho === 'tutor');
    assert.ok(savedDoc, 'Proposta de trilha deve estar salva no banco com origem "tutor"');
    assert.equal(savedDoc.status, 'proposta');
    assert.equal(savedDoc.user_id.toString(), user._id.toString());
  });

  await t.test('deve aceitar proposta e ativar nova trilha arquivando a anterior', async () => {
    const user = makeUser({ trail_source: 'default', custom_trail_id: null });
    const { usersRepo, customTrailsRepo, chatMessagesRepo, customTrails } = createMockRepos(user);
    const trailService = createMockTrailService(user);
    const geminiClient = createMockGeminiClient();

    // Cria uma proposta de trilha no banco
    const proposedDoc = await customTrailsRepo.create({
      userId: user._id,
      trailData: { ...defaultTrail, id: 'custom-trail-tutor-test', titulo: 'Trilha de Liderança' },
      origemGatilho: 'tutor',
      status: 'proposta'
    });

    const tutorService = new TutorService({
      geminiClient, chatMessagesRepo, trailService, customTrailsRepo, usersRepo
    });

    const result = await tutorService.respondToProposal(user._id, {
      custom_trail_id: proposedDoc._id.toString(),
      decision: 'accept'
    });

    assert.equal(result.decision, 'accept');
    // A proposta deve ter sido ativada
    const updatedDoc = customTrails.find(t => t._id.toString() === proposedDoc._id.toString());
    assert.equal(updatedDoc.status, 'ativa');
    // O usuário deve ter trail_source = 'custom'
    assert.equal(user.trail_source, 'custom');
  });

  await t.test('deve recusar proposta e manter trilha atual', async () => {
    const user = makeUser({ trail_source: 'default', custom_trail_id: null });
    const { usersRepo, customTrailsRepo, chatMessagesRepo, customTrails } = createMockRepos(user);
    const trailService = createMockTrailService(user);
    const geminiClient = createMockGeminiClient();

    const proposedDoc = await customTrailsRepo.create({
      userId: user._id,
      trailData: defaultTrail,
      origemGatilho: 'tutor',
      status: 'proposta'
    });

    const tutorService = new TutorService({
      geminiClient, chatMessagesRepo, trailService, customTrailsRepo, usersRepo
    });

    const result = await tutorService.respondToProposal(user._id, {
      custom_trail_id: proposedDoc._id.toString(),
      decision: 'reject'
    });

    assert.equal(result.decision, 'reject');
    // A proposta deve ser arquivada
    const updatedDoc = customTrails.find(t => t._id.toString() === proposedDoc._id.toString());
    assert.equal(updatedDoc.status, 'arquivada');
    // Usuário ainda na trilha padrão
    assert.equal(user.trail_source, 'default');
  });

  await t.test('deve rejeitar aceitação de proposta de outro usuário com erro de ownership', async () => {
    const user1 = makeUser();
    const user2 = makeUser();
    const { usersRepo, customTrailsRepo, chatMessagesRepo } = createMockRepos(user1);
    // Adiciona user2 ao mesmo repositório
    usersRepo._users = [user1, user2];

    const trailService = createMockTrailService(user1);
    const geminiClient = createMockGeminiClient();

    // Cria proposta vinculada ao user2
    const proposedDoc = await customTrailsRepo.create({
      userId: user2._id, // pertence ao user2!
      trailData: defaultTrail,
      origemGatilho: 'tutor',
      status: 'proposta'
    });

    const tutorService = new TutorService({
      geminiClient, chatMessagesRepo, trailService, customTrailsRepo, usersRepo
    });

    // user1 tenta aceitar proposta do user2 — deve falhar com erro de ownership
    await assert.rejects(
      () => tutorService.respondToProposal(user1._id, {
        custom_trail_id: proposedDoc._id.toString(),
        decision: 'accept'
      }),
      /não pertence ao usuário/
    );
  });

  await t.test('deve rejeitar respondToProposal com decision inválida', async () => {
    const user = makeUser();
    const { usersRepo, customTrailsRepo, chatMessagesRepo } = createMockRepos(user);
    const trailService = createMockTrailService(user);
    const geminiClient = createMockGeminiClient();

    const proposedDoc = await customTrailsRepo.create({
      userId: user._id,
      trailData: defaultTrail,
      origemGatilho: 'tutor',
      status: 'proposta'
    });

    const tutorService = new TutorService({
      geminiClient, chatMessagesRepo, trailService, customTrailsRepo, usersRepo
    });

    await assert.rejects(
      () => tutorService.respondToProposal(user._id, {
        custom_trail_id: proposedDoc._id.toString(),
        decision: 'maybe' // inválido
      }),
      /decision deve ser "accept" ou "reject"/
    );
  });
});
