import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
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
  searchOutline,
  gitNetworkOutline,
  chatbubblesOutline,
  informationCircleOutline,
  personOutline,
  playCircleOutline,
  lockClosedOutline,
  checkmarkOutline,
  timeOutline,
  createOutline,
  closeOutline,
  arrowUpOutline,
  compassOutline,
  logOutOutline
} from 'ionicons/icons';
import { AuthService, Usuario } from '../services/auth';

export interface MensagemTutor {
  autor: 'ia' | 'usuario';
  titulo?: string;
  texto: string;
}

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon
  ],
})
export class FolderPage {
  abaAtiva: 'visao-geral' | 'tutor' | 'avaliacoes' | 'perfil' = 'visao-geral';

  usuarioLogado: Usuario | null = null;

  // Estado do Tutor IA
  conceitoSelecionado: string = 'Criar uma hipótese';
  textoMensagem: string = '';
  mensagensTutor: MensagemTutor[] = [];
  private readonly CHAT_STORAGE_KEY = 'trilha_mensagens_tutor';

  // Estado para o CRUD na aba "Editar perfil"
  editandoId: string | null = null;
  formEdicao: { nome: string; email: string; trilhaEscolhida: 'execucao' | 'fundamentos' } = {
    nome: '',
    email: '',
    trilhaEscolhida: 'execucao'
  };

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly menuCtrl = inject(MenuController);
  private readonly toastCtrl = inject(ToastController);

  constructor() {
    addIcons({
      searchOutline,
      gitNetworkOutline,
      chatbubblesOutline,
      informationCircleOutline,
      personOutline,
      playCircleOutline,
      lockClosedOutline,
      checkmarkOutline,
      timeOutline,
      createOutline,
      closeOutline,
      arrowUpOutline,
      compassOutline,
      logOutOutline
    });
  }

  async ionViewWillEnter(): Promise<void> {
    this.menuCtrl.enable(false);
    try {
      await this.carregarDados();
    } catch {
      await this.mostrarToast('Não foi possível carregar sua conta. Verifique a conexão com a API.', 'danger');
      await this.router.navigate(['/cadastro']);
    }
  }

  async carregarDados(): Promise<void> {
    this.usuarioLogado = await this.authService.restaurarSessao();
    if (!this.usuarioLogado) {
      await this.router.navigate(['/cadastro']);
      return;
    }

    const chatSalvo = localStorage.getItem(this.CHAT_STORAGE_KEY);
    if (chatSalvo) {
      this.mensagensTutor = JSON.parse(chatSalvo);
    } else {
      this.mensagensTutor = [
        {
          autor: 'ia',
          titulo: 'Contexto do módulo • Contexto inicial',
          texto: 'Qual é a dor real do seu negócio agora? Conte o tipo de negócio, o estágio e o que está travando. Isso ajuda a personalizar o contexto sem alterar o progresso do módulo.'
        }
      ];
    }
  }

  get iniciaisUsuario(): string {
    const nome = this.usuarioLogado?.nome || 'Usuário';
    const partes = nome.trim().split(' ');
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  get nomeTrilhaAtiva(): string {
    return this.usuarioLogado?.trilhaEscolhida === 'fundamentos'
      ? 'Comece pelos fundamentos'
      : 'Da ideia à execução';
  }

  selecionarAba(aba: 'visao-geral' | 'tutor' | 'avaliacoes' | 'perfil') {
    this.abaAtiva = aba;
  }

  // Na Visão Geral, clicar em "Iniciar estudo" leva para o Tutor IA!
  iniciarEstudo() {
    this.abaAtiva = 'tutor';
  }

  // --- Funções do Tutor IA ---
  selecionarConceito(conceito: string) {
    this.conceitoSelecionado = conceito;
    if (!this.textoMensagem.trim()) {
      this.textoMensagem = `Quero aplicar "${conceito}" no meu negócio atual...`;
    }
  }

  async enviarMensagemTutor() {
    const texto = this.textoMensagem.trim();
    if (!texto) return;

    this.mensagensTutor.push({
      autor: 'usuario',
      titulo: 'Seu contexto enviado',
      texto
    });

    this.textoMensagem = '';

    // Resposta contextualizada simulada para o "Caminho Feliz"
    this.mensagensTutor.push({
      autor: 'ia',
      titulo: `Tutor IA • Foco em ${this.conceitoSelecionado}`,
      texto: `Excelente ponto! Para validar essa dor no módulo de Estratégia e discovery, defina uma hipótese clara e um experimento rápido de MVP antes de construir funcionalidades complexas.`
    });

    localStorage.setItem(this.CHAT_STORAGE_KEY, JSON.stringify(this.mensagensTutor));
    await this.mostrarToast('Contexto guardado neste dispositivo.', 'success');
  }

  // --- Funções do CRUD (em "Editar perfil") ---
  iniciarEdicao(user: Usuario) {
    this.editandoId = user.id;
    this.formEdicao = {
      nome: user.nome,
      email: user.email,
      trilhaEscolhida: user.trilhaEscolhida || 'execucao'
    };
  }

  cancelarEdicao() {
    this.editandoId = null;
  }

  async salvarEdicao(userOriginal: Usuario): Promise<void> {
    if (!this.formEdicao.nome.trim() || !this.formEdicao.email.trim()) {
      await this.mostrarToast('Preencha o nome e o e-mail.', 'warning');
      return;
    }

    const atualizado: Usuario = {
      ...userOriginal,
      nome: this.formEdicao.nome,
      email: this.formEdicao.email,
      trilhaEscolhida: this.formEdicao.trilhaEscolhida
    };

    try {
      this.usuarioLogado = await this.authService.atualizarUsuario(atualizado);
      this.editandoId = null;
      await this.mostrarToast('Perfil atualizado com sucesso.', 'success');
    } catch (error) {
      const message = error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
        ? error.error.message
        : 'Não foi possível atualizar o perfil. Verifique a conexão com a API.';
      await this.mostrarToast(message, 'danger');
    }
  }

  async sair(): Promise<void> {
    try {
      await this.authService.logout();
      await this.router.navigate(['/cadastro']);
    } catch {
      await this.mostrarToast('Não foi possível encerrar a sessão. Tente novamente.', 'danger');
    }
  }

  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2200,
      color,
      position: 'top'
    });
    await toast.present();
  }
}