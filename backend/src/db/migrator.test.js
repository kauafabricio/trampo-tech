import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { runMigrations } from './migrator.js';

function createMockDb() {
  const collections = new Map();

  function getCol(name) {
    if (!collections.has(name)) {
      collections.set(name, {
        name,
        indexes: [],
        docs: [],
        async createIndex(keys, options) {
          this.indexes.push({ keys, options });
          return 'ok';
        },
        async insertOne(doc) {
          this.docs.push({ ...doc, _id: doc._id || Math.random().toString() });
          return { insertedId: doc._id };
        },
        async updateMany(filter, update) {
          let modified = 0;
          for (const doc of this.docs) {
            let matches = true;
            if (filter.trail_source?.$exists === false && 'trail_source' in doc) {
              matches = false;
            }
            if (matches) {
              if (update.$set) Object.assign(doc, update.$set);
              if (update.$unset) {
                for (const k of Object.keys(update.$unset)) {
                  delete doc[k];
                }
              }
              modified++;
            }
          }
          return { modifiedCount: modified };
        },
        find() {
          return {
            toArray: async () => [...this.docs]
          };
        }
      });
    }
    return collections.get(name);
  }

  return {
    collection: (name) => getCol(name),
    _collections: collections
  };
}

describe('Sistema de Migrations do Banco de Dados', () => {
  it('deve aplicar as migrações em um banco novo e registrar em _migrations', async () => {
    const mockDb = createMockDb();

    // Insere um usuário legado para testar migração de dados
    const usersCol = mockDb.collection('users');
    await usersCol.insertOne({
      nome: 'Usuário Legado',
      email: 'legado@exemplo.com',
      trilhaEscolhida: 'execucao'
    });

    const result = await runMigrations(mockDb);

    assert.equal(result.executed.length, 1);
    assert.equal(result.executed[0], '001_initial_schema');
    assert.equal(result.alreadyApplied.length, 0);

    // Verifica se _migrations registrou a execução
    const migrationsCol = mockDb.collection('_migrations');
    assert.equal(migrationsCol.docs.length, 1);
    assert.equal(migrationsCol.docs[0].name, '001_initial_schema');

    // Verifica se os índices foram solicitados nas coleções
    const customTrailsCol = mockDb.collection('custom_trails');
    assert.ok(customTrailsCol.indexes.some(i => i.options?.name === 'idx_custom_trails_user_status'));

    const userProgressCol = mockDb.collection('user_progress');
    assert.ok(userProgressCol.indexes.some(i => i.options?.name === 'idx_user_progress_unique_trail'));

    const diagnosticCol = mockDb.collection('diagnostic_results');
    assert.ok(diagnosticCol.indexes.some(i => i.options?.name === 'idx_diagnostic_results_user_date'));

    const tutorCol = mockDb.collection('tutor_messages');
    assert.ok(tutorCol.indexes.some(i => i.options?.name === 'idx_tutor_messages_user_date'));

    // Verifica se o usuário legado foi migrado
    assert.equal(usersCol.docs[0].trail_source, 'default');
    assert.equal(usersCol.docs[0].custom_trail_id, null);
    assert.equal('trilhaEscolhida' in usersCol.docs[0], false);
  });

  it('deve ser idempotente e não reexecutar migrações já aplicadas', async () => {
    const mockDb = createMockDb();

    // Primeira execução
    const firstRun = await runMigrations(mockDb);
    assert.equal(firstRun.executed.length, 1);

    // Segunda execução
    const secondRun = await runMigrations(mockDb);
    assert.equal(secondRun.executed.length, 0);
    assert.equal(secondRun.alreadyApplied.length, 1);
    assert.equal(secondRun.alreadyApplied[0], '001_initial_schema');
  });
});
