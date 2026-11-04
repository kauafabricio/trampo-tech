import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeEmail,
  validateDiagnostic,
  validateLogin,
  validateProfile,
  validateRegistration
} from './validation.js';

describe('authentication validation', () => {
  it('normalizes email addresses', () => {
    assert.equal(normalizeEmail('  TEST@Example.com '), 'test@example.com');
  });

  it('requires valid registration details and accepted terms', () => {
    const valid = validateRegistration({
      nome: 'Ana Silva',
      email: ' ANA@EXAMPLE.COM ',
      senha: 'senha123',
      termosAceitos: true
    });

    assert.deepEqual(valid.value, {
      nome: 'Ana Silva',
      email: 'ana@example.com',
      senha: 'senha123',
      termosAceitos: true
    });
    assert.ok(validateRegistration({ nome: 'Ana', email: 'ana@example.com', senha: 'senha123' }).error);
    assert.ok(validateRegistration({ nome: 'Ana', email: 'ana@example.com', senha: '12345678', termosAceitos: true }).error);
  });

  it('requires credentials for login', () => {
    assert.deepEqual(validateLogin({ email: ' USER@example.com ', senha: 'senha123' }).value, {
      email: 'user@example.com',
      senha: 'senha123'
    });
    assert.ok(validateLogin({ email: 'user@example.com' }).error);
  });

  it('validates profile updates without accepting unknown tracks', () => {
    assert.deepEqual(validateProfile({
      nome: 'Ana Silva',
      email: 'ANA@example.com',
      trilhaEscolhida: 'fundamentos'
    }).value, {
      nome: 'Ana Silva',
      email: 'ana@example.com',
      trilhaEscolhida: 'fundamentos'
    });
    assert.ok(validateProfile({
      nome: 'Ana Silva',
      email: 'ana@example.com',
      trilhaEscolhida: 'admin'
    }).error);
  });

  it('validates complete diagnostic answers and calculates maturity scores', () => {
    const respostas = {
      estagio: 'Validação — estamos testando a solução.',
      tamanhoEquipe: '6 a 10 pessoas.',
      organizacaoProjetos: 'Seguimos uma metodologia estruturada.',
      objetivos: 'São documentados com metas, prazos e indicadores.',
      distribuicaoTarefas: 'Utilizamos planejamento e acompanhamento das responsabilidades.',
      prazos: 'Monitoramos os prazos e ajustamos o planejamento quando necessário.',
      riscos: 'Registramos, priorizamos e acompanhamos os riscos.',
      acompanhamento: 'Utiliza indicadores e revisões periódicas.',
      prioridades: 'Utilizamos critérios definidos para priorizar e reorganizar tarefas.',
      registroDecisoes: 'São centralizadas em uma ferramenta acessível à equipe.',
      identificacaoAtrasos: 'Utilizamos indicadores e alertas para antecipar problemas.',
      processos: 'Os principais processos estão documentados e são revisados.',
      revisaoResultados: 'Ao final de cada etapa e também durante a execução.',
      resultadoDesejado: 'Mais previsibilidade.',
      problemaRecorrente: 'Falta de acompanhamento.'
    };

    assert.deepEqual(validateDiagnostic({ respostas }).value.resultado, {
      pontuacaoGeral: 100,
      pontuacoesPorDimensao: {
        planejamento: 100,
        execucaoEAcompanhamento: 100,
        processosEFerramentas: 100
      },
      nivelMaturidade: 'Avançado'
    });
    assert.ok(validateDiagnostic({ respostas: { ...respostas, processos: 'alternativa inválida' } }).error);
    assert.ok(validateDiagnostic({ respostas: { ...respostas, problemaRecorrente: ' ' } }).error);
  });
});
