import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  MenuController,
  ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  arrowForwardOutline,
  checkmarkCircle,
  checkmarkOutline,
  compassOutline,
  ellipseOutline,
  informationCircleOutline,
  searchOutline,
  sparklesOutline
} from 'ionicons/icons';
import { AuthService, Usuario } from '../../services/auth';
import { TrailService } from '../../services/trail.service';
import { ComparisonOptionsResponse, Trail } from '../../models/trail';

@Component({
  selector: 'app-sua-trilha',
  templateUrl: './sua-trilha.page.html',
  styleUrls: ['./sua-trilha.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon]
})
export class SuaTrilhaPage {
  usuarioLogado: Usuario | null = null;
  trilhaSelecionada: 'custom' | 'default' = 'custom';
  loading = true;
  comparison: ComparisonOptionsResponse | null = null;
  defaultTrail: Trail | null = null;
  proposedTrail: any | null = null;

  private readonly authService = inject(AuthService);
  private readonly trailService = inject(TrailService);
  private readonly router = inject(Router);
  private readonly menuCtrl = inject(MenuController);
  private readonly toastCtrl = inject(ToastController);

  constructor() {
    addIcons({
      searchOutline,
      checkmarkOutline,
      compassOutline,
      ellipseOutline,
      checkmarkCircle,
      informationCircleOutline,
      arrowBackOutline,
      arrowForwardOutline,
      sparklesOutline
    });
  }

  async ionViewWillEnter(): Promise<void> {
    this.menuCtrl.enable(false);
    this.loading = true;
    try {
      this.usuarioLogado = await this.authService.restaurarSessao();
      if (!this.usuarioLogado) {
        await this.router.navigate(['/cadastro']);
        return;
      }

      this.comparison = await this.trailService.getComparisonOptions();
      this.defaultTrail = this.comparison.default_trail;
      this.proposedTrail = this.comparison.proposed_trail;

      // Se há trilha personalizada proposta pela IA, recomenda e seleciona 'custom'
      if (this.proposedTrail) {
        this.trilhaSelecionada = 'custom';
      } else {
        this.trilhaSelecionada = 'default';
      }
    } catch {
      await this.mostrarToast('Não foi possível carregar as opções de trilha. Verifique a conexão com o servidor.', 'danger');
    } finally {
      this.loading = false;
    }
  }

  ionViewWillLeave() {
    this.menuCtrl.enable(true);
  }

  get iniciaisUsuario(): string {
    const nome = this.usuarioLogado?.nome || 'Usuário';
    const partes = nome.trim().split(' ');
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  selecionarTrilha(trilha: 'custom' | 'default'): void {
    this.trilhaSelecionada = trilha;
  }

  getModulosFluxo(trail: any): string {
    if (!trail || !Array.isArray(trail.modulos)) {
      return 'Módulo 1 → Módulo 2 → Módulo 3 → Módulo 4 → Módulo 5';
    }
    return trail.modulos.map((m: any) => m.titulo).join(' → ');
  }

  voltar(): void {
    this.router.navigate(['/diagnostico-inicial']);
  }

  async continuar(): Promise<void> {
    if (!this.trilhaSelecionada) return;

    if (!this.usuarioLogado) {
      await this.router.navigate(['/cadastro']);
      return;
    }

    try {
      const customTrailId = this.proposedTrail?.id || this.proposedTrail?.custom_trail_id || null;
      await this.trailService.chooseTrail(this.trilhaSelecionada, customTrailId);

      const nomeTrilha = this.trilhaSelecionada === 'custom'
        ? (this.proposedTrail?.titulo || 'Trilha Personalizada por IA')
        : (this.defaultTrail?.titulo || 'Trilha Padrão');

      await this.mostrarToast(`Trilha "${nomeTrilha}" ativada com sucesso!`, 'success');
      await this.router.navigate(['/tutor']);
    } catch (error) {
      const message = error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
        ? error.error.message
        : 'Não foi possível salvar sua escolha de trilha.';
      await this.mostrarToast(message, 'danger');
    }
  }

  private async mostrarToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
