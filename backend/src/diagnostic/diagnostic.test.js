import test from 'node:test';
import assert from 'node:assert/strict';
import { DIAGNOSTIC_QUESTIONS, evaluateDiagnostic } from './diagnostic-questions.js';

test('Diagnóstico e Avaliação de Competências', async (t) => {
  await t.test('deve conter exatamente 5 questões com 4 opções em cada', () => {
    assert.equal(DIAGNOSTIC_QUESTIONS.length, 5);
    for (const q of DIAGNOSTIC_QUESTIONS) {
      assert.ok(q.id);
      assert.ok(q.categoria);
      assert.ok(q.enunciado.length >= 10);
      assert.equal(q.opcoes.length, 4);
      assert.ok(q.lacunaSeFalhar);
    }
  });

  await t.test('avalia perfil iniciante quando todas as respostas forem de peso mínimo', () => {
    const respostas = DIAGNOSTIC_QUESTIONS.map(q => ({
      question_id: q.id,
      selected_option: 0 // opções de 0 pontos
    }));

    const resultado = evaluateDiagnostic(respostas);
    assert.equal(resultado.pontuacao_total, 0);
    assert.equal(resultado.nivel_sugerido, 'iniciante');
    assert.equal(resultado.resumo_lacunas.length, 5);
  });

  await t.test('avalia perfil avançado quando respostas forem de pontuação máxima', () => {
    // Para q1 a q5, a opção com 3 pontos:
    // q1: opção 2
    // q2: opção 1
    // q3: opção 2
    // q4: opção 2
    // q5: opção 1
    const respostas = [
      { question_id: 'diag-q1', selected_option: 2 },
      { question_id: 'diag-q2', selected_option: 1 },
      { question_id: 'diag-q3', selected_option: 2 },
      { question_id: 'diag-q4', selected_option: 2 },
      { question_id: 'diag-q5', selected_option: 1 }
    ];

    const resultado = evaluateDiagnostic(respostas);
    assert.equal(resultado.pontuacao_total, 100);
    assert.equal(resultado.nivel_sugerido, 'avancado');
  });

  await t.test('avalia perfil intermediário e identifica lacunas específicas', () => {
    const respostas = [
      { question_id: 'diag-q1', selected_option: 2 }, // 3 pontos
      { question_id: 'diag-q2', selected_option: 1 }, // 3 pontos
      { question_id: 'diag-q3', selected_option: 1 }, // 1 ponto (lacuna em priorização)
      { question_id: 'diag-q4', selected_option: 0 }, // 0 pontos (lacuna em débito técnico)
      { question_id: 'diag-q5', selected_option: 3 }  // 1 ponto (lacuna em métricas)
    ];

    const resultado = evaluateDiagnostic(respostas);
    assert.equal(resultado.pontos_brutos, 8); // 8 de 15 = 53%
    assert.equal(resultado.pontuacao_total, 53);
    assert.equal(resultado.nivel_sugerido, 'intermediario');
    assert.ok(resultado.resumo_lacunas.includes('Frameworks de Priorização e Gestão de Backlog'));
    assert.ok(resultado.resumo_lacunas.includes('Engenharia de Software, Qualidade e Débito Técnico'));
    assert.ok(resultado.resumo_lacunas.includes('Métricas de Tração, Unit Economics e OKRs'));
  });

  await t.test('rejeita respostas vazias ou inválidas', () => {
    assert.throws(() => evaluateDiagnostic([]), /devem ser uma lista não vazia/);
    assert.throws(() => evaluateDiagnostic(null), /devem ser uma lista não vazia/);
  });
});
