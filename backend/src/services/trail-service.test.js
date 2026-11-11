import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ObjectId } from 'mongodb';
import { TrailService } from './trail-service.js';
import { defaultTrail } from '../trails/default-trail.js';
import { validateTrail } from '../trails/trail-schema.js';

function createMockRepositories() {
  const users = [];
  const customTrails = [];
  const progresses = [];

  const usersRepo = {
    async findById(id) {
      const strId = id.toString();
      return users.find(u => u._id.toString() === strId) || null;
    },
    async findByEmail(email) {
      return users.find(u => u.email === email) || null;
    },
    async create(userData) {
      const doc = {
        _id: new ObjectId(),
        ...userData,
        trail_source: 'default',
        custom_trail_id: null,
        dataCriacao: new Date()
      };
      users.push(doc);
      return doc;
    },
    async setActiveTrail(id, { trail_source, custom_trail_id }) {
      const user = await this.findById(id);
      if (user) {
        user.trail_source = trail_source;
        user.custom_trail_id = custom_trail_id ? new ObjectId(custom_trail_id) : null;
      }
      return user;
    }
  };

  const customTrailsRepo = {
    async findById(id) {
      const strId = id.toString();
      return customTrails.find(t => t._id.toString() === strId) || null;
    },
    async findActiveByUserId(userId) {
      const strId = userId.toString();
      return customTrails.find(t => t.user_id.toString() === strId && t.status === 'ativa') || null;
    },
    async create({ userId, trailData, origemGatilho, status = 'ativa' }) {
      const doc = {
        _id: new ObjectId(),
        user_id: new ObjectId(userId),
        status,
        origem_gatilho: origemGatilho,
        trail_data: trailData,
        criado_em: new Date(),
        atualizado_em: new Date()
      };
      customTrails.push(doc);
      return doc;
    }
  };

  const progressRepo = {
    async getProgress({ userId, trailSource, customTrailId }) {
      const uId = userId.toString();
      const cId = customTrailId ? customTrailId.toString() : null;
      return progresses.find(p =>
        p.user_id.toString() === uId &&
        p.trail_source === trailSource &&
        (p.custom_trail_id ? p.custom_trail_id.toString() : null) === cId
      ) || null;
    },
    async markTopicCompleted({ userId, trailSource, customTrailId, topicId, currentModuleId }) {
      let doc = await this.getProgress({ userId, trailSource, customTrailId });
      if (!doc) {
        doc = {
          _id: new ObjectId(),
          user_id: new ObjectId(userId),
          trail_source: trailSource,
          custom_trail_id: customTrailId ? new ObjectId(customTrailId) : null,
          completed_topics: [],
          assessment_scores: {},
          current_module_id: currentModuleId || 'default-m1',
          criado_em: new Date()
        };
        progresses.push(doc);
      }
      if (!doc.completed_topics.includes(topicId)) {
        doc.completed_topics.push(topicId);
      }
      if (currentModuleId) {
        doc.current_module_id = currentModuleId;
      }
      doc.atualizado_em = new Date();
      return doc;
    },
    async saveAssessmentScore({ userId, trailSource, customTrailId, moduleId, score, passed, nextModuleId }) {
      let doc = await this.getProgress({ userId, trailSource, customTrailId });
      if (!doc) {
        doc = {
          _id: new ObjectId(),
          user_id: new ObjectId(userId),
          trail_source: trailSource,
          custom_trail_id: customTrailId ? new ObjectId(customTrailId) : null,
          completed_topics: [],
          assessment_scores: {},
          current_module_id: moduleId,
          criado_em: new Date()
        };
        progresses.push(doc);
      }
      doc.assessment_scores[moduleId] = {
        score,
        passed,
        completed_at: new Date(),
        attempts: (doc.assessment_scores[moduleId]?.attempts || 0) + 1
      };
      if (passed && nextModuleId) {
        doc.current_module_id = nextModuleId;
      }
      doc.atualizado_em = new Date();
      return doc;
    }
  };

  return { users, customTrails, progresses, usersRepo, customTrailsRepo, progressRepo };
}

describe('TrailService e Abstração getActiveTrail', () => {
  it('novo usuário começa com trail_source = "default" e obtém a trilha padrão vinda do código sem criar registro no banco', async () => {
    const { usersRepo, customTrailsRepo, progressRepo, customTrails } = createMockRepositories();
    const service = new TrailService({ usersRepo, customTrailsRepo, progressRepo });

    const newUser = await usersRepo.create({
      nome: 'Carlos Eduardo',
      email: 'carlos@startup.com',
      passwordHash: 'hash123',
      termosAceitos: true
    });

    assert.equal(newUser.trail_source, 'default');
    assert.equal(newUser.custom_trail_id, null);
    // Nenhuma trilha criada no banco!
    assert.equal(customTrails.length, 0);

    const activeResult = await service.getActiveTrail(newUser._id);
    assert.equal(activeResult.source, 'default');
    assert.equal(activeResult.custom_trail_id, null);
    assert.equal(activeResult.status, 'ativa');
    assert.equal(activeResult.trail.id, 'default-trail');
    assert.equal(activeResult.trail.modulos.length, 5);

    // O banco de trilhas personalizadas permanece VAZIO
    assert.equal(customTrails.length, 0);
  });

  it('deve consultar progresso inicial e marcar tópicos concluídos', async () => {
    const { usersRepo, customTrailsRepo, progressRepo } = createMockRepositories();
    const service = new TrailService({ usersRepo, customTrailsRepo, progressRepo });

    const user = await usersRepo.create({
      nome: 'Fernanda Lima',
      email: 'fernanda@exemplo.com',
      passwordHash: 'hash123',
      termosAceitos: true
    });

    const initialProgress = await service.getUserProgress(user._id);
    assert.equal(initialProgress.completed_topics_count, 0);
    assert.equal(initialProgress.current_module_id, 'default-m1');

    // Conclui tópico válido
    const updateResult = await service.completeTopic(user._id, 'default-m1-t1');
    assert.ok(updateResult.completed_topics.includes('default-m1-t1'));

    const updatedProgress = await service.getUserProgress(user._id);
    assert.equal(updatedProgress.completed_topics_count, 1);
    assert.deepEqual(updatedProgress.completed_topics, ['default-m1-t1']);
  });

  it('deve rejeitar conclusão de tópico inexistente', async () => {
    const { usersRepo, customTrailsRepo, progressRepo } = createMockRepositories();
    const service = new TrailService({ usersRepo, customTrailsRepo, progressRepo });

    const user = await usersRepo.create({
      nome: 'Roberto',
      email: 'roberto@exemplo.com',
      passwordHash: 'hash123',
      termosAceitos: true
    });

    await assert.rejects(
      () => service.completeTopic(user._id, 'topico-fantasma-999'),
      /não pertence à trilha ativa/
    );
  });

  it('deve submeter e corrigir avaliação do módulo, desbloqueando o próximo quando aprovado', async () => {
    const { usersRepo, customTrailsRepo, progressRepo } = createMockRepositories();
    const service = new TrailService({ usersRepo, customTrailsRepo, progressRepo });

    const user = await usersRepo.create({
      nome: 'Julia Silva',
      email: 'julia@exemplo.com',
      passwordHash: 'hash123',
      termosAceitos: true
    });

    // Submete todas as respostas corretas do módulo 1
    const correctAnswers = {
      'default-m1-q1': defaultTrail.modulos[0].avaliacao.perguntas[0].respostaCorreta,
      'default-m1-q2': defaultTrail.modulos[0].avaliacao.perguntas[1].respostaCorreta,
      'default-m1-q3': defaultTrail.modulos[0].avaliacao.perguntas[2].respostaCorreta,
      'default-m1-q4': defaultTrail.modulos[0].avaliacao.perguntas[3].respostaCorreta,
      'default-m1-q5': defaultTrail.modulos[0].avaliacao.perguntas[4].respostaCorreta
    };

    const result = await service.submitAssessment(user._id, {
      moduleId: 'default-m1',
      answers: correctAnswers
    });

    assert.equal(result.score, 100);
    assert.equal(result.correctCount, 5);
    assert.equal(result.passed, true);
    assert.equal(result.nextModuleId, 'default-m2');

    // Verifica se o progresso gravou a nota e avançou para default-m2
    const progress = await service.getUserProgress(user._id);
    assert.equal(progress.current_module_id, 'default-m2');
    assert.equal(progress.assessment_scores['default-m1'].passed, true);
    assert.equal(progress.assessment_scores['default-m1'].score, 100);
  });

  it('deve suportar troca para trilha customizada com EXATAMENTE o mesmo formato de resposta', async () => {
    const { usersRepo, customTrailsRepo, progressRepo } = createMockRepositories();
    const service = new TrailService({ usersRepo, customTrailsRepo, progressRepo });

    const user = await usersRepo.create({
      nome: 'Lucas Tech',
      email: 'lucas@tech.io',
      passwordHash: 'hash123',
      termosAceitos: true
    });

    // Cria uma trilha customizada fictícia com a mesma estrutura válida 5x5x5
    const customTrailData = JSON.parse(JSON.stringify(defaultTrail));
    customTrailData.id = 'custom-trail-lucas';
    customTrailData.titulo = 'Trilha Personalizada: Aceleração de MVP em Fintechs';
    customTrailData.modulos[0].id = 'custom-m1';
    customTrailData.modulos[0].topicos[0].id = 'custom-m1-t1';
    customTrailData.modulos[0].avaliacao.id = 'custom-m1-assessment';
    customTrailData.modulos[0].avaliacao.perguntas[0].id = 'custom-m1-q1';

    const customDoc = await customTrailsRepo.create({
      userId: user._id,
      trailData: customTrailData,
      origemGatilho: 'diagnostico',
      status: 'ativa'
    });

    // Troca para a trilha customizada
    await service.setActiveTrail(user._id, {
      trail_source: 'custom',
      custom_trail_id: customDoc._id.toString()
    });

    // Consulta ativa
    const activeCustom = await service.getActiveTrail(user._id);
    assert.equal(activeCustom.source, 'custom');
    assert.equal(activeCustom.custom_trail_id, customDoc._id.toString());
    assert.equal(activeCustom.origem_gatilho, 'diagnostico');
    assert.equal(activeCustom.trail.id, 'custom-trail-lucas');
    assert.equal(activeCustom.trail.titulo, 'Trilha Personalizada: Aceleração de MVP em Fintechs');

    // Validação estrita do schema sobre a trilha customizada
    const validation = validateTrail(activeCustom.trail);
    assert.equal(validation.valid, true);

    // Estrutura de campos é 100% idêntica à padrão
    assert.deepEqual(Object.keys(activeCustom.trail), Object.keys(defaultTrail));

    // Volta para trilha padrão
    await service.setActiveTrail(user._id, {
      trail_source: 'default'
    });
    const backToDefault = await service.getActiveTrail(user._id);
    assert.equal(backToDefault.source, 'default');
    assert.equal(backToDefault.trail.id, 'default-trail');
  });
});
