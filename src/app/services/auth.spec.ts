import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService, Usuario } from './auth';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('registers with the API and keeps only the public account in memory', async () => {
    const user: Usuario = {
      id: 'user-id',
      nome: 'Ana Silva',
      email: 'ana@example.com',
      termosAceitos: true,
      dataCriacao: '2026-01-01T00:00:00.000Z',
      trilhaEscolhida: 'execucao'
    };

    const registration = service.registrar({
      nome: user.nome,
      email: user.email,
      senha: 'senha123',
      termosAceitos: true
    });
    const request = httpTesting.expectOne('http://localhost:3000/api/auth/register');

    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ user });

    expect(await registration).toEqual(user);
    expect(service.getUsuarioLogado()).toEqual(user);
  });

  it('logs in with the API and sends cookies for the session', async () => {
    const user: Usuario = {
      id: 'user-id',
      nome: 'Ana Silva',
      email: 'ana@example.com',
      termosAceitos: true,
      dataCriacao: '2026-01-01T00:00:00.000Z',
      trilhaEscolhida: 'execucao'
    };

    const login = service.login('ana@example.com', 'senha123');
    const request = httpTesting.expectOne('http://localhost:3000/api/auth/login');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'ana@example.com', senha: 'senha123' });
    expect(request.request.withCredentials).toBe(true);
    request.flush({ user });

    expect(await login).toEqual(user);
    expect(service.getUsuarioLogado()).toEqual(user);
  });
});
