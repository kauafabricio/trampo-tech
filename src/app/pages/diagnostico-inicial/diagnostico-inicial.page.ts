import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonSpinner,
  MenuController,
  ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  checkmarkCircle,
  checkmarkOutline,
  compassOutline,
  helpCircleOutline,
  searchOutline,
  sparklesOutline
} from 'ionicons/icons';
import { AuthService, Usuario } from '../../services/auth';
import { TrailService } from '../../services/trail.service';
import { DiagnosticAnswer, DiagnosticQuestion } from '../../models/trail';
import { FALLBACK_DIAGNOSTIC_QUESTIONS } from '../../data/fallback-diagnostic';

@Component({
  selector: 'app-diagnostico-inicial',
  templateUrl: './diagnostico-inicial.page.html',
  styleUrls: ['./diagnostico-inicial.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon,
    IonSpinner
  ]
})
export class DiagnosticoInicialPage implements OnInit {
  usuarioLogado: Usuario | null = null;
  perguntas: DiagnosticQuestion[] = [];
  respostas: Record<string, number> = {};
  carregandoPerguntas = true;
  gerandoTrilha = false;

  private carregamentoEmAndamento = false;

  private readonly authService = inject(AuthService);
  private readonly trailService = inject(TrailService);
  private readonly router = inject(Router);
  private readonly menuCtrl = inject(MenuController);
  private readonly toastCtrl = inject(ToastController);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    addIcons({
      checkmarkOutline,
      checkmarkCircle,
      compassOutline,
      searchOutline,
      sparklesOutline,
      arrowForwardOutline,
      helpCircleOutline
    });
  }

  async ngOnInit(): Promise<void> {
    await this.carregarDados();
  }

  async ionViewWillEnter(): Promise<void> {
    this.menuCtrl.enable(false);
    if (this.perguntas.length === 0 && !this.carregamentoEmAndamento) {
      await this.carregarDados();
    }
  }

  ionViewWillLeave(): void {
    this.menuCtrl.enable(true);
  }

  get iniciaisUsuario(): string {
    const nome = this.usuarioLogado?.nome || 'Usuário';
    const partes = nome.trim().split(' ');
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  get totalRespondidas(): number {
    return Object.keys(this.respostas).length;
  }

  get percentualConcluido(): number {
    if (this.perguntas.length === 0) return 0;
    return Math.round((this.totalRespondidas / this.perguntas.length) * 100);
  }

  async carregarDados(): Promise<void> {
    if (this.carregamentoEmAndamento) return;

    this.carregamentoEmAndamento = true;
    this.carregandoPerguntas = true;
    this.cdr.markForCheck();

    try {
      const [perguntasResult] = await Promise.allSettled([
        this.trailService.getDiagnosticQuestions(),
        this.authService.restaurarSessao()
          .then(u => { this.usuarioLogado = u; })
          .catch(() => {})
      ]);

      if (perguntasResult.status === 'fulfilled' && Array.isArray(perguntasResult.value) && perguntasResult.value.length > 0) {
        this.perguntas = perguntasResult.value;
      } else {
        // Fallback resiliente imediato se o backend ou rede falhar
        console.warn('Carregando perguntas diagnósticas via contingência local.');
        this.perguntas = FALLBACK_DIAGNOSTIC_QUESTIONS;
      }
    } catch (err) {
      console.warn('Erro ao carregar perguntas diagnósticas, acionando contingência:', err);
      this.perguntas = FALLBACK_DIAGNOSTIC_QUESTIONS;
    } finally {
      this.carregandoPerguntas = false;
      this.carregamentoEmAndamento = false;
      this.cdr.markForCheck();
      try {
        this.cdr.detectChanges();
      } catch {}
    }
  }

  selecionarOpcao(questionId: string, opcaoIndex: number): void {
    this.respostas[questionId] = opcaoIndex;
    this.cdr.markForCheck();
  }

  async submeterDiagnostico(): Promise<void> {
    if (this.totalRespondidas < this.perguntas.length) {
      await this.mostrarToast('Por favor, responda a todas as 5 perguntas antes de continuar.', 'warning');
      return;
    }

    const payload: DiagnosticAnswer[] = Object.entries(this.respostas).map(([question_id, selected_option]) => ({
      question_id,
      selected_option
    }));

    try {
      this.gerandoTrilha = true;
      this.cdr.markForCheck();
      try { this.cdr.detectChanges(); } catch {}

      const result = await this.trailService.submitDiagnostic(payload);
      await this.mostrarToast('Diagnóstico concluído! Sua trilha personalizada foi gerada com sucesso.', 'success');
      // Passa a trilha proposta via Router state para evitar re-fetch desnecessário
      await this.router.navigate(['/sua-trilha'], {
        state: { proposedTrail: result?.proposed_trail ?? null }
      });
    } catch (err) {
      console.error('Erro na submissão do diagnóstico com IA:', err);
      if (err instanceof HttpErrorResponse && err.status === 401) {
        await this.mostrarToast('Sua sessão expirou ou não foi reconhecida. Faça login para continuar.', 'danger');
        await this.router.navigate(['/cadastro']);
        return;
      }
      const mensagemErro = err instanceof HttpErrorResponse && err.error?.message
        ? err.error.message
        : 'Não foi possível gerar a trilha personalizada com IA no momento. Tente novamente ou avance para a trilha padrão.';
      await this.mostrarToast(mensagemErro, 'warning');
    } finally {
      this.gerandoTrilha = false;
      this.cdr.markForCheck();
      try { this.cdr.detectChanges(); } catch {}
    }
  }

  pularParaTrilhaPadrao(): void {
    this.router.navigate(['/sua-trilha']);
  }

  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
