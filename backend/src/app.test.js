import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { ObjectId } from 'mongodb';
import { createApp } from './app.js';

const storedUsers = [];
const users = {
  async findOne(query) {
    if (query.email) {
      return storedUsers.find(user =>
        user.email === query.email
        && (!query._id?.$ne || !user._id.equals(query._id.$ne))
      ) ?? null;
    }
    return storedUsers.find(user => user._id.equals(query._id)) ?? null;
  },
  async insertOne(user) {
    if (storedUsers.some(existing => existing.email === user.email)) {
      const error = new Error('Duplicate email.');
      error.code = 11000;
      throw error;
    }
    user._id = new ObjectId();
    storedUsers.push(user);
    return { insertedId: user._id };
  },
  async updateOne({ _id }, { $set }) {
    const user = storedUsers.find(existing => existing._id.equals(_id));
    Object.assign(user, $set);
  }
};

const app = createApp({
  users,
  jwtSecret: 'test-secret-with-more-than-thirty-two-characters',
  clientOrigin: 'http://localhost:4200'
});
let server;
let origin;

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

describe('authentication API', () => {
  it('registers, authenticates, returns the session user, and logs out', async () => {
    const registration = await fetch(`${origin}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nome: 'Ana Silva',
        email: 'ANA@example.com',
        senha: 'senha123',
        termosAceitos: true
      })
    });

    assert.equal(registration.status, 201);
    const registrationBody = await registration.json();
    assert.equal(registrationBody.user.email, 'ana@example.com');
    assert.equal('passwordHash' in registrationBody.user, false);
    const storedUser = storedUsers.find(user => user._id.toString() === registrationBody.user.id);
    assert.ok(storedUser.passwordHash);
    assert.notEqual(storedUser.passwordHash, 'senha123');
    const setCookie = registration.headers.get('set-cookie');
    assert.match(setCookie, /HttpOnly/i);
    const cookie = setCookie.split(';', 1)[0];

    const session = await fetch(`${origin}/api/auth/me`, {
      headers: { cookie }
    });
    assert.equal(session.status, 200);
    assert.equal((await session.json()).user.id, registrationBody.user.id);

    const profileUpdate = await fetch(`${origin}/api/auth/me`, {
      method: 'PATCH',
      headers: {
        cookie,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        nome: 'Ana Costa',
        email: 'ana@example.com',
        trilhaEscolhida: 'fundamentos'
      })
    });
    assert.equal(profileUpdate.status, 200);
    assert.equal((await profileUpdate.json()).user.trilhaEscolhida, 'fundamentos');

    const logout = await fetch(`${origin}/api/auth/logout`, { method: 'POST' });
    assert.equal(logout.status, 200);

    const login = await fetch(`${origin}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ANA@example.com', senha: 'senha123' })
    });
    assert.equal(login.status, 200);
    const loginBody = await login.json();
    assert.equal(loginBody.user.id, registrationBody.user.id);
    assert.equal('passwordHash' in loginBody.user, false);
    assert.match(login.headers.get('set-cookie'), /HttpOnly/i);
  });

  it('rejects duplicate registrations and invalid credentials', async () => {
    const duplicate = await fetch(`${origin}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nome: 'Ana Silva',
        email: 'ana@example.com',
        senha: 'senha123',
        termosAceitos: true
      })
    });
    assert.equal(duplicate.status, 409);

    const invalidLogin = await fetch(`${origin}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ana@example.com', senha: 'errada123' })
    });
    assert.equal(invalidLogin.status, 401);
  });
});
