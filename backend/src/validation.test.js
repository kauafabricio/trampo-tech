import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeEmail,
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
});
