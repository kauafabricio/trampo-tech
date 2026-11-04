import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { 
  IonContent,
  IonIcon,
  ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  checkmarkOutline, 
  compassOutline, 
  ellipseOutline, 
  checkmarkCircle,
  informationCircleOutline,
  arrowBackOutline,
  arrowForwardOutline
} from 'ionicons/icons';
import { AuthService, Usuario } from '../../services/auth';

@Component({
  selector: 'app-sua-trilha',
  templateUrl: './sua-trilha.page.html',
  styleUrls: ['./sua-trilha.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon]
})
export class SuaTrilhaPage {
  usuarioLogado: Usuario | null = null;
  trilhaSelecionada: 'execucao' | 'fundamentos' | null = null;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);

  constructor() {
    addIcons({
      checkmarkOutline,
      compassOutline,
      ellipseOutline,
      checkmarkCircle,
      informationCircleOutline,
      arrowBackOutline,
      arrowForwardOutline
    });
  }

  async ionViewWillEnter(): Promise<void> {
    try {
      this.usuarioLogado = await this.authService.restaurarSessao();
      if (!this.usuarioLogado) {
        await this.router.navigate(['/cadastro']);
        return;
      }
      this.trilhaSelecionada = this.usuarioLogado.trilhaEscolhida;
    } catch {
      await this.mostrarToast('Não foi possível carregar sua conta. Verifique a conexão com a API.', 'danger');
      await this.router.navigate(['/cadastro']);
    }
  }

  // Gera as iniciais (ex: "Marina Costa" -> "MC")
  get iniciaisUsuario(): string {
    const nome = this.usuarioLogado?.nome || 'Usuário';
    const partes = nome.trim().split(' ');
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  selecionarTrilha(trilha: 'execucao' | 'fundamentos'): void {
    this.trilhaSelecionada = trilha;
  }

  voltar(): void {
    this.router.navigate(['/cadastro']);
  }

  async continuar(): Promise<void> {
    if (!this.trilhaSelecionada) return;

    if (!this.usuarioLogado) {
      await this.router.navigate(['/cadastro']);
      return;
    }

    try {
      this.usuarioLogado = await this.authService.atualizarUsuario({
        ...this.usuarioLogado,
        trilhaEscolhida: this.trilhaSelecionada
      });
      await this.mostrarToast(
        `Trilha "${this.trilhaSelecionada === 'execucao' ? 'Da ideia à execução' : 'Comece pelos fundamentos'}" salva.`,
        'success'
      );
      await this.router.navigate(['/folder/inbox']);
    } catch (error) {
      const message = error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
        ? error.error.message
        : 'Não foi possível salvar sua trilha. Verifique a conexão com a API.';
      await this.mostrarToast(message, 'danger');
    }
  }

  private async mostrarToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'top'
    });
    await toast.present();
  }
}