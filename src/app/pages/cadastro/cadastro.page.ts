import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonCheckbox,
  IonContent,
  IonIcon,
  ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  checkmarkCircleOutline,
  checkmarkOutline,
  compassOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonContent,
    IonIcon,
    IonCheckbox
  ]
})
export class CadastroPage implements OnInit {
  form!: FormGroup;
  modoLogin = false;

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);

  constructor() {
    addIcons({ checkmarkCircleOutline, checkmarkOutline, arrowForwardOutline, compassOutline });
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

  get primeiroNome(): string {
    const nome = this.form.get('nome')?.value || '';
    return nome.split(' ')[0] || 'visitante';
  }

  alternarModo(): void {
    this.modoLogin = !this.modoLogin;

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

  async submeter(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.mostrarToast('Preencha todos os campos corretamente.', 'warning');
      return;
    }

    try {
      if (this.modoLogin) {
        const { email, senha } = this.form.value;
        await this.authService.login(email, senha);
        await this.mostrarToast('Login realizado com sucesso!', 'success');
        await this.router.navigate(['/folder/inbox']);
        return;
      }

      const { nome, email, senha, termos } = this.form.value;
      await this.authService.registrar({
        nome,
        email,
        senha,
        termosAceitos: termos
      });

      await this.mostrarToast('Conta criada com sucesso!', 'success');
      await this.router.navigate(['/diagnostico-inicial']);
    } catch (error) {
      await this.mostrarToast(this.mensagemErro(error), 'danger');
    }
  }

  private mensagemErro(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Não conseguimos nos conectar ao serviço de contas. Confira sua conexão com a internet e tente novamente em instantes.';
      }
      if (error.status === 401) {
        return 'Não foi possível entrar com esses dados. Confira seu e-mail e sua senha e tente novamente.';
      }
      if (error.status === 409) {
        return 'Já existe uma conta com este e-mail. Entre na sua conta ou use outro e-mail.';
      }
      if (error.status === 429) {
        return 'Houve muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.';
      }
      if (error.status >= 500) {
        return 'Tivemos um imprevisto ao processar seu pedido. Seus dados não foram alterados. Tente novamente em alguns minutos.';
      }
      if (typeof error.error?.message === 'string') {
        return error.error.message;
      }
    }
    return 'Não foi possível concluir agora. Tente novamente e, se o problema continuar, fale com nosso suporte.';
  }

  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: color === 'danger' ? 6000 : 2500,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
