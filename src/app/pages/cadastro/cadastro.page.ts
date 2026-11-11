import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonCheckbox,
  IonContent,
  IonIcon,
  MenuController,
  ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowForwardOutline,
  checkmarkCircleOutline,
  checkmarkOutline,
  closeCircleOutline,
  compassOutline,
  serverOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonIcon,
    IonCheckbox
  ]
})
export class CadastroPage implements OnInit {
  form!: FormGroup;
  modoLogin = false;
  carregando = false;
  mensagemAlerta: string | null = null;
  tipoAlerta: 'danger' | 'warning' | 'success' | null = null;
  apiStatus: { online: boolean; database?: string; message?: string } | null = null;

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly menuCtrl = inject(MenuController);
  private readonly toastCtrl = inject(ToastController);

  constructor() {
    addIcons({
      checkmarkCircleOutline,
      checkmarkOutline,
      arrowForwardOutline,
      compassOutline,
      alertCircleOutline,
      closeCircleOutline,
      serverOutline
    });
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
      ]],
      termos: [false, [Validators.requiredTrue]]
    });
  }

  async ionViewWillEnter(): Promise<void> {
    this.menuCtrl.enable(false);
    await this.verificarSaudeApi();
  }

  ionViewWillLeave(): void {
    this.menuCtrl.enable(true);
  }

  async verificarSaudeApi(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ status: string; database: string }>(`${environment.apiUrl}/health`)
      );
      this.apiStatus = {
        online: true,
        database: res.database === 'connected' ? 'MongoDB Conectado' : 'Modo Resiliente'
      };
    } catch {
      this.apiStatus = {
        online: false,
        message: 'Servidor backend offline. Inicie o servidor com "cd backend; npm run dev".'
      };
    }
  }

  get primeiroNome(): string {
    const nome = this.form.get('nome')?.value || '';
    return nome.split(' ')[0] || 'visitante';
  }

  alternarModo(): void {
    this.modoLogin = !this.modoLogin;
    this.mensagemAlerta = null;
    this.tipoAlerta = null;

    const nome = this.form.get('nome');
    const senha = this.form.get('senha');
    const termos = this.form.get('termos');

    if (this.modoLogin) {
      nome?.clearValidators();
      senha?.setValidators([Validators.required]);
      termos?.clearValidators();
    } else {
      nome?.setValidators([Validators.required, Validators.minLength(3)]);
      senha?.setValidators([
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
      ]);
      termos?.setValidators([Validators.requiredTrue]);
    }

    nome?.updateValueAndValidity();
    senha?.updateValueAndValidity();
    termos?.updateValueAndValidity();
  }

  fecharAlerta(): void {
    this.mensagemAlerta = null;
    this.tipoAlerta = null;
  }

  async submeter(): Promise<void> {
    this.mensagemAlerta = null;
    this.tipoAlerta = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.tipoAlerta = 'warning';
      this.mensagemAlerta = 'Por favor, preencha todos os campos corretamente antes de continuar.';
      await this.mostrarToast(this.mensagemAlerta, 'warning');
      return;
    }

    this.carregando = true;

    try {
      if (this.modoLogin) {
        const { email, senha } = this.form.value;
        await this.authService.login(email, senha);
        await this.mostrarToast('Login realizado com sucesso! Bem-vindo(a) de volta.', 'success');
        await this.router.navigate(['/sua-trilha']);
        return;
      }

      const { nome, email, senha, termos } = this.form.value;
      await this.authService.registrar({
        nome,
        email,
        senha,
        termosAceitos: termos
      });

      await this.mostrarToast('Conta criada com sucesso! Iniciando diagnóstico...', 'success');
      await this.router.navigate(['/diagnostico-inicial']);
    } catch (error) {
      const msg = this.mensagemErro(error);
      this.tipoAlerta = 'danger';
      this.mensagemAlerta = msg;
      await this.mostrarToast(msg, 'danger');
    } finally {
      this.carregando = false;
    }
  }

  private mensagemErro(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Falha de conexão com o servidor backend. Verifique se a API está rodando na porta 3000 (cd backend; npm run dev).';
      }
      if (error.status === 409) {
        return 'Já existe uma conta cadastrada com este e-mail. Alterne para o modo de login acima ou use outro e-mail.';
      }
      if (error.status === 401) {
        return 'E-mail ou senha incorretos. Verifique suas credenciais.';
      }
      if (error.status === 400 && typeof error.error?.message === 'string') {
        return error.error.message;
      }
      if (typeof error.error?.message === 'string') {
        return error.error.message;
      }
    }
    return 'Não foi possível completar a operação. Tente novamente em instantes.';
  }

  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3500,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
