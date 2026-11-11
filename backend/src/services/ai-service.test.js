import test from 'node:test';
import assert from 'node:assert/strict';
import { AIService, ensureStableIds } from './ai-service.js';
import { defaultTrail } from '../trails/default-trail.js';

test('AIService e Normalização de Trilha com IA', async (t) => {
  await t.test('ensureStableIds gera IDs estáveis e únicos em toda a estrutura 5x5x5', () => {
    // Cria uma cópia da trilha padrão com IDs vazios para verificar a estabilização
    const rawTrail = JSON.parse(JSON.stringify(defaultTrail));
    rawTrail.id = '';
    rawTrail.modulos[0].id = 'temp-id';
    rawTrail.modulos[0].topicos[0].id = '';
    rawTrail.modulos[0].avaliacao.perguntas[0].id = '';

    const stabilized = ensureStableIds(rawTrail, 'user123');

    assert.equal(stabilized.id, 'custom-trail-user123');
    assert.equal(stabilized.modulos.length, 5);
    assert.equal(stabilized.modulos[0].id, 'custom-user123-m1');
    assert.equal(stabilized.modulos[0].topicos[0].id, 'custom-user123-m1-t1');
    assert.equal(stabilized.modulos[0].avaliacao.id, 'custom-user123-m1-assessment');
    assert.equal(stabilized.modulos[0].avaliacao.perguntas[0].id, 'custom-user123-m1-q1');
  });

  await t.test('AIService gera trilha personalizada válida na primeira tentativa', async () => {
    const mockTrail = JSON.parse(JSON.stringify(defaultTrail));
    mockTrail.titulo = 'Trilha Personalizada de Alta Performance';

    const mockGeminiClient = {
      modelName: 'gemini-mock',
      callCount: 0,
      async generate() {
        this.callCount++;
        return JSON.stringify(mockTrail);
      }
    };

    const aiService = new AIService({ geminiClient: mockGeminiClient });
    const result = await aiService.generateCustomTrail({
      userId: '65f0123456789abcdef01234',
      userName: 'Carlos Silva',
      diagnosticResult: {
        pontuacao_total: 40,
        nivel_sugerido: 'iniciante',
        resumo_lacunas: ['Product Discovery', 'Débito Técnico']
      }
    });

    assert.equal(mockGeminiClient.callCount, 1);
    assert.equal(result.modulos.length, 5);
    assert.equal(result.id, 'custom-trail-f01234');
    assert.equal(result.modulos[0].topicos.length, 5);
    assert.equal(result.modulos[0].avaliacao.perguntas.length, 5);
  });

  await t.test('AIService tenta novamente (retry simples) quando a primeira tentativa retorna JSON inválido ou incompleto', async () => {
    const validTrail = JSON.parse(JSON.stringify(defaultTrail));

    let attempts = 0;
    const mockGeminiClient = {
      modelName: 'gemini-mock',
      async generate({ userPrompt }) {
        attempts++;
        if (attempts === 1) {
          // Primeira tentativa retorna apenas 2 módulos (viola regra 5x5x5)
          const invalid = JSON.parse(JSON.stringify(defaultTrail));
          invalid.modulos = invalid.modulos.slice(0, 2);
          return JSON.stringify(invalid);
        }
        // Segunda tentativa retorna trilha completa válida corrigida
        assert.match(userPrompt, /ATENÇÃO: A tentativa anterior falhou/);
        return JSON.stringify(validTrail);
      }
    };

    const aiService = new AIService({ geminiClient: mockGeminiClient });
    const result = await aiService.generateCustomTrail({
      userId: '65f0123456789abcdef09999',
      userName: 'Ana Beatriz',
      diagnosticResult: {
        pontuacao_total: 60,
        nivel_sugerido: 'intermediario',
        resumo_lacunas: ['Arquitetura e TI']
      }
    });

    assert.equal(attempts, 2, 'Deve ter tentado exatamente 2 vezes (1 falha + 1 retry)');
    assert.equal(result.modulos.length, 5);
  });

  await t.test('AIService lança erro tratado quando a IA falha mesmo após o retry', async () => {
    let attempts = 0;
    const mockGeminiClient = {
      modelName: 'gemini-mock',
      async generate() {
        attempts++;
        return 'isto não é um json { quebrado';
      }
    };

    const aiService = new AIService({ geminiClient: mockGeminiClient });

    await assert.rejects(
      async () => {
        await aiService.generateCustomTrail({
          userId: '65f0123456789abcdef01111',
          userName: 'Lucas',
          diagnosticResult: {
            pontuacao_total: 20,
            nivel_sugerido: 'iniciante',
            resumo_lacunas: ['Geral']
          }
        });
      },
      /Falha na geração de trilha personalizada pela IA após tentativa de recuperação/
    );

    assert.equal(attempts, 2, 'Deve ter esgotado o retry antes de lançar o erro');
  });
});
