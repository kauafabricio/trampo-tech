import { HttpErrorResponse } from '@angular/common/http';
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

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly menuCtrl = inject(MenuController);
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

  ionViewWillEnter(): void {
    this.menuCtrl.enable(false);
  }

  ionViewWillLeave(): void {
    this.menuCtrl.enable(true);
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
      if (typeof error.error?.message === 'string') {
        return error.error.message;
      }
      if (error.status === 0) {
        return 'Não foi possível conectar à API. Verifique se o backend está em execução.';
      }
    }
    return 'Não foi possível autenticar. Tente novamente.';
  }

  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
