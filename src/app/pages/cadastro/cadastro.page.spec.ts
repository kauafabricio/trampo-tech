import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { vi } from 'vitest';
import { CadastroPage } from './cadastro.page';

describe('CadastroPage', () => {
  let component: CadastroPage;
  let fixture: ComponentFixture<CadastroPage>;
  let httpTesting: HttpTestingController;
  let popupMessage: string;
  let popupDuration: number;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    navigate = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate } },
        {
          provide: ToastController,
          useValue: {
            create: async (options: { message: string; duration: number }) => {
              popupMessage = options.message;
              popupDuration = options.duration;
              return { present: async () => undefined };
            }
          }
        }
      ]
    });
    fixture = TestBed.createComponent(CadastroPage);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navigates a newly registered account to the initial diagnosis', async () => {
    component.form.patchValue({
      nome: 'Ana Silva',
      email: 'ana@example.com',
      senha: 'senha123',
      termos: true
    });

    const submission = component.submeter();
    const request = httpTesting.expectOne('/api/auth/register');
    expect(request.request.method).toBe('POST');
    request.flush({ user: {} });
    await submission;

    expect(navigate).toHaveBeenCalledWith(['/diagnostico-inicial']);
    expect(popupMessage).toBe('Conta criada com sucesso!');
  });

  it('explains connection problems in the error popup', async () => {
    component.form.patchValue({
      nome: 'Ana Silva',
      email: 'ana@example.com',
      senha: 'senha123',
      termos: true
    });

    const submission = component.submeter();
    const request = httpTesting.expectOne('/api/auth/register');
    request.error(new ProgressEvent('error'));
    await submission;

    expect(popupMessage).toContain('conectar ao serviço de contas');
    expect(popupMessage).toContain('Confira sua conexão com a internet');
    expect(popupMessage).not.toContain('Failed to fetch');
    expect(popupDuration).toBe(6000);
  });
});
