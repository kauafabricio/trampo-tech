import { AfterViewChecked, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  MenuController,
  ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  personCircleOutline,
  sendOutline,
  sparklesOutline
} from 'ionicons/icons';
import { AuthService, Usuario } from '../../services/auth';
import { TutorService } from '../../services/tutor.service';
import { TrailService } from '../../services/trail.service';
import { ChatMessage, ProposedTrailSummary } from '../../models/chat';

@Component({
  selector: 'app-tutor',
  templateUrl: './tutor.page.html',
  styleUrls: ['./tutor.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon]
})
export class TutorPage implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef;

  usuarioLogado: Usuario | null = null;
  messages: ChatMessage[] = [];
  newMessage = '';
  sending = false;
  loading = true;

  /** Proposta de trilha pendente de decisão do usuário */
  pendingProposal: ProposedTrailSummary | null = null;
  pendingProposalId: string | null = null;
  respondingToProposal = false;

  private readonly authService = inject(AuthService);
  private readonly tutorService = inject(TutorService);
  private readonly trailService = inject(TrailService);
  private readonly router = inject(Router);
  private readonly menuCtrl = inject(MenuController);
  private readonly toastCtrl = inject(ToastController);

  private shouldScrollToBottom = false;

  constructor() {
    addIcons({
      sendOutline,
      sparklesOutline,
      personCircleOutline,
      arrowForwardOutline,
      checkmarkCircleOutline,
      closeCircleOutline
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
      this.messages = await this.tutorService.getChatHistory();

      // Se não há histórico, adiciona mensagem de boas-vindas local
      if (this.messages.length === 0) {
        this.messages = [{
          id: 'welcome',
          role: 'assistant',
          content: `Olá, ${this.usuarioLogado.nome?.split(' ')[0] || 'aluno'}! 👋 Sou o Tutor TrampoTech, seu mentor de Gestão de Projetos em Startups.\n\nEstou aqui para te ajudar a avançar na sua trilha de aprendizagem. Pode me perguntar sobre qualquer tópico, pedir recomendações de materiais ou compartilhar suas dificuldades. Por onde você quer começar?`,
          criado_em: new Date().toISOString()
        }];
      }
      this.shouldScrollToBottom = true;
    } catch {
      await this.mostrarToast('Não foi possível carregar o chat. Verifique a conexão.', 'danger');
    } finally {
      this.loading = false;
    }
  }

  ionViewWillLeave() {
    this.menuCtrl.enable(true);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  get iniciaisUsuario(): string {
    const nome = this.usuarioLogado?.nome || 'Usuário';
    const partes = nome.trim().split(' ');
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  async sendMessage(): Promise<void> {
    const text = this.newMessage.trim();
    if (!text || this.sending) return;

    this.sending = true;
    this.newMessage = '';

    // Adiciona a mensagem do usuário localmente de imediato (UX responsiva)
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      criado_em: new Date().toISOString()
    };
    this.messages = [...this.messages, tempUserMsg];
    this.shouldScrollToBottom = true;

    // Indicador de digitação
    const typingMsg: ChatMessage = {
      id: 'typing',
      role: 'assistant',
      content: '...',
      criado_em: new Date().toISOString()
    };
    this.messages = [...this.messages, typingMsg];
    this.shouldScrollToBottom = true;

    try {
      const result = await this.tutorService.sendMessage(text);

      // Remove os temporários e adiciona as reais (persistidas no banco)
      this.messages = this.messages
        .filter(m => m.id !== 'temp-' + tempUserMsg.id.replace('temp-', '') && m.id !== 'typing');

      // Remove temp user msg e typing
      this.messages = this.messages.filter(
        m => m.id !== tempUserMsg.id && m.id !== 'typing'
      );
      this.messages = [...this.messages, result.user_message, result.assistant_message];
      this.shouldScrollToBottom = true;

      // Se foi detectada uma dor e gerada proposta, exibe o card de decisão
      if (result.pain_detected && result.proposed_trail) {
        this.pendingProposal = result.proposed_trail;
        this.pendingProposalId = result.proposed_trail.id;
      }
    } catch {
      // Remove indicador de digitação em caso de erro
      this.messages = this.messages.filter(m => m.id !== 'typing');
      await this.mostrarToast('Erro ao enviar mensagem. Tente novamente.', 'danger');
    } finally {
      this.sending = false;
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  async acceptProposal(): Promise<void> {
    if (!this.pendingProposalId || this.respondingToProposal) return;
    this.respondingToProposal = true;
    try {
      await this.tutorService.respondToProposal(this.pendingProposalId, 'accept');
      await this.mostrarToast('Nova trilha personalizada ativada! Seu progresso anterior foi preservado.', 'success');
      this.pendingProposal = null;
      this.pendingProposalId = null;
    } catch {
      await this.mostrarToast('Não foi possível ativar a nova trilha. Tente novamente.', 'danger');
    } finally {
      this.respondingToProposal = false;
    }
  }

  async rejectProposal(): Promise<void> {
    if (!this.pendingProposalId || this.respondingToProposal) return;
    this.respondingToProposal = true;
    try {
      await this.tutorService.respondToProposal(this.pendingProposalId, 'reject');
      await this.mostrarToast('Proposta recusada. Sua trilha atual continua ativa.', 'success');
      this.pendingProposal = null;
      this.pendingProposalId = null;
    } catch {
      await this.mostrarToast('Erro ao recusar proposta. Tente novamente.', 'danger');
    } finally {
      this.respondingToProposal = false;
    }
  }

  dismissProposal(): void {
    this.pendingProposal = null;
    this.pendingProposalId = null;
  }

  formatMessageContent(content: string): string {
    // Converte quebras de linha e markdown básico para HTML seguro
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  navigateToTrail(): void {
    this.router.navigate(['/sua-trilha']);
  }

  private scrollToBottom(): void {
    try {
      const container = this.messagesContainer?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    } catch { /* silencioso */ }
  }

  private async mostrarToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3500,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
