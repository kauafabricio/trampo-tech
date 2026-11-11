import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
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

  private readonly authService = inject(AuthService);
  private readonly trailService = inject(TrailService);
  private readonly router = inject(Router);
  private readonly menuCtrl = inject(MenuController);
  private readonly toastCtrl = inject(ToastController);

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
    if (!this.usuarioLogado) {
      this.usuarioLogado = await this.authService.restaurarSessao();
      if (!this.usuarioLogado) {
        await this.router.navigate(['/cadastro']);
      }
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
    try {
      this.carregandoPerguntas = true;
      this.usuarioLogado = await this.authService.restaurarSessao();
      if (!this.usuarioLogado) {
        await this.router.navigate(['/cadastro']);
        return;
      }
      this.perguntas = await this.trailService.getDiagnosticQuestions();
    } catch {
      await this.mostrarToast('Não foi possível carregar as perguntas do diagnóstico.', 'danger');
    } finally {
      this.carregandoPerguntas = false;
    }
  }

  selecionarOpcao(questionId: string, opcaoIndex: number): void {
    this.respostas[questionId] = opcaoIndex;
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
      await this.trailService.submitDiagnostic(payload);
      await this.mostrarToast('Diagnóstico concluído! Sua trilha personalizada foi gerada com sucesso.', 'success');
      await this.router.navigate(['/sua-trilha']);
    } catch {
      await this.mostrarToast('Erro ao processar diagnóstico com a IA. Tente novamente.', 'danger');
    } finally {
      this.gerandoTrilha = false;
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
