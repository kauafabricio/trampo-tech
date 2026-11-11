import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defaultTrail } from './default-trail.js';
import { TrailSchema, validateTrail } from './trail-schema.js';

describe('Trilha Padrão (defaultTrail) e Validação 5x5x5', () => {
  it('deve validar com sucesso a trilha padrão com o TrailSchema', () => {
    const validation = validateTrail(defaultTrail);
    assert.equal(validation.valid, true, `Erros de validação: ${JSON.stringify(validation.errors)}`);
  });

  it('deve possuir exatamente 5 módulos com IDs estáveis e únicos', () => {
    assert.equal(defaultTrail.modulos.length, 5, 'Deve conter exatamente 5 módulos');

    const expectedModuleIds = ['default-m1', 'default-m2', 'default-m3', 'default-m4', 'default-m5'];
    const actualModuleIds = defaultTrail.modulos.map(m => m.id);
    assert.deepEqual(actualModuleIds, expectedModuleIds, 'IDs dos módulos devem ser fixos e seguir o padrão default-m{1..5}');

    // Unicidade de IDs
    const uniqueIds = new Set(actualModuleIds);
    assert.equal(uniqueIds.size, 5, 'Todos os IDs de módulo devem ser únicos');
  });

  it('cada módulo deve possuir exatamente 5 tópicos (totalizando 25 tópicos)', () => {
    let totalTopics = 0;
    const allTopicIds = [];

    defaultTrail.modulos.forEach((modulo, modIdx) => {
      const modNumber = modIdx + 1;
      assert.equal(
        modulo.topicos.length,
        5,
        `Módulo ${modulo.id} deve conter exatamente 5 tópicos`
      );

      modulo.topicos.forEach((topico, topIdx) => {
        const topNumber = topIdx + 1;
        const expectedId = `default-m${modNumber}-t${topNumber}`;
        assert.equal(topico.id, expectedId, `ID do tópico deve ser estável: esperado ${expectedId}, recebido ${topico.id}`);
        assert.ok(topico.titulo.length >= 3, `Título do tópico ${topico.id} deve ter >= 3 caracteres`);
        assert.ok(topico.descricao.length >= 10, `Descrição do tópico ${topico.id} deve ter >= 10 caracteres`);
        assert.equal(topico.ordem, topNumber, `Ordem do tópico deve ser ${topNumber}`);
        allTopicIds.push(topico.id);
        totalTopics++;
      });
    });

    assert.equal(totalTopics, 25, 'A trilha padrão deve totalizar 25 tópicos');
    const uniqueTopicIds = new Set(allTopicIds);
    assert.equal(uniqueTopicIds.size, 25, 'Não pode haver IDs de tópicos duplicados');
  });

  it('cada módulo deve possuir 1 avaliação com exatamente 5 perguntas (totalizando 25 perguntas)', () => {
    let totalQuestions = 0;
    const allQuestionIds = [];

    defaultTrail.modulos.forEach((modulo, modIdx) => {
      const modNumber = modIdx + 1;
      const expectedAssessmentId = `default-m${modNumber}-assessment`;
      assert.equal(modulo.avaliacao.id, expectedAssessmentId, 'ID da avaliação deve ser estável');
      assert.equal(
        modulo.avaliacao.perguntas.length,
        5,
        `Avaliação do módulo ${modulo.id} deve conter exatamente 5 perguntas`
      );

      modulo.avaliacao.perguntas.forEach((pergunta, qIdx) => {
        const qNumber = qIdx + 1;
        const expectedId = `default-m${modNumber}-q${qNumber}`;
        assert.equal(pergunta.id, expectedId, `ID da pergunta deve ser estável: esperado ${expectedId}`);
        assert.ok(pergunta.enunciado.length >= 10, 'Enunciado deve ser claro e suficiente');
        assert.equal(pergunta.alternativas.length, 4, 'Cada pergunta deve conter 4 alternativas');
        assert.ok(pergunta.respostaCorreta >= 0 && pergunta.respostaCorreta <= 3, 'respostaCorreta deve ser índice 0..3');
        allQuestionIds.push(pergunta.id);
        totalQuestions++;
      });
    });

    assert.equal(totalQuestions, 25, 'A trilha padrão deve totalizar 25 perguntas');
    const uniqueQuestionIds = new Set(allQuestionIds);
    assert.equal(uniqueQuestionIds.size, 25, 'Não pode haver IDs de perguntas duplicados');
  });

  describe('Rejeição estrita a violações da regra 5x5x5', () => {
    it('deve falhar se a trilha tiver menos de 5 módulos', () => {
      const invalidTrail = {
        ...defaultTrail,
        modulos: defaultTrail.modulos.slice(0, 4) // apenas 4 módulos
      };
      const result = validateTrail(invalidTrail);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some(err => err.includes('A trilha deve conter exatamente 5 módulos')));
    });

    it('deve falhar se algum módulo tiver menos de 5 tópicos', () => {
      const invalidTrail = {
        ...defaultTrail,
        modulos: defaultTrail.modulos.map((m, idx) => {
          if (idx === 0) {
            return { ...m, topicos: m.topicos.slice(0, 4) }; // apenas 4 tópicos
          }
          return m;
        })
      };
      const result = validateTrail(invalidTrail);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some(err => err.includes('Cada módulo deve conter exatamente 5 tópicos')));
    });

    it('deve falhar se alguma avaliação tiver quantidade diferente de 5 perguntas', () => {
      const invalidTrail = {
        ...defaultTrail,
        modulos: defaultTrail.modulos.map((m, idx) => {
          if (idx === 1) {
            return {
              ...m,
              avaliacao: {
                ...m.avaliacao,
                perguntas: m.avaliacao.perguntas.slice(0, 3) // apenas 3 perguntas
              }
            };
          }
          return m;
        })
      };
      const result = validateTrail(invalidTrail);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some(err => err.includes('A avaliação deve conter exatamente 5 perguntas')));
    });

    it('deve falhar se houver ID de tópico duplicado', () => {
      const duplicatedTrail = {
        ...defaultTrail,
        modulos: defaultTrail.modulos.map((m, idx) => {
          if (idx === 0) {
            const topicos = [...m.topicos];
            topicos[1] = { ...topicos[1], id: topicos[0].id }; // ID duplicado
            return { ...m, topicos };
          }
          return m;
        })
      };
      const result = validateTrail(duplicatedTrail);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some(err => err.includes('ID de tópico duplicado')));
    });
  });
});
