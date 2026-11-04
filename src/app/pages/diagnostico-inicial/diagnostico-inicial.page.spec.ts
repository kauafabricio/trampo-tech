import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { vi } from 'vitest';
import { DiagnosticoInicialPage } from './diagnostico-inicial.page';
import { AuthService } from '../../services/auth';
import { DiagnosticoService } from '../../services/diagnostico';

describe('DiagnosticoInicialPage', () => {
  let component: DiagnosticoInicialPage;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiagnosticoInicialPage],
      providers: [
        { provide: AuthService, useValue: { restaurarSessao: vi.fn() } },
        { provide: DiagnosticoService, useValue: { obter: vi.fn(), salvar: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: ToastController,
          useValue: { create: vi.fn().mockResolvedValue({ present: vi.fn() }) }
        }
      ]
    }).compileComponents();
    component = TestBed.createComponent(DiagnosticoInicialPage).componentInstance;
  });

  it('presents the questionnaire and advances only after answering', async () => {
    expect(component.totalQuestoes).toBe(15);
    expect(component.questaoAtual.pergunta).toBe('Qual é o estágio atual da sua startup?');

    await component.avancar();
    expect(component.indiceAtual).toBe(0);

    component.form.controls.estagio.setValue('MVP — temos uma versão inicial do produto.');
    await component.avancar();
    expect(component.indiceAtual).toBe(1);
    expect(component.questaoAtual.pergunta).toBe('Quantas pessoas fazem parte da equipe?');
  });
});
