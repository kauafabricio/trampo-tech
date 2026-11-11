import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  termosAceitos: boolean;
  dataCriacao: string;
  trail_source?: 'default' | 'custom';
  custom_trail_id?: string | null;
  trilhaEscolhida?: 'execucao' | 'fundamentos' | null;
}

interface UsuarioResponse {
  user: Usuario;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly authUrl = `${environment.apiUrl}/auth`;
  private readonly tokenKey = 'trampotech_token';
  private usuarioLogado: Usuario | null = null;
  private readonly http = inject(HttpClient);

  getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  setToken(token: string | null): void {
    if (typeof localStorage !== 'undefined') {
      if (token) {
        localStorage.setItem(this.tokenKey, token);
      } else {
        localStorage.removeItem(this.tokenKey);
      }
    }
  }

  async registrar(dados: Pick<Usuario, 'nome' | 'email' | 'termosAceitos'> & { senha: string }): Promise<Usuario> {
    const response = await firstValueFrom(
      this.http.post<UsuarioResponse>(`${this.authUrl}/register`, dados, { withCredentials: true })
    );
    if (response.token) {
      this.setToken(response.token);
    }
    this.usuarioLogado = response.user;
    return response.user;
  }

  async login(email: string, senha: string): Promise<Usuario> {
    const response = await firstValueFrom(
      this.http.post<UsuarioResponse>(
        `${this.authUrl}/login`,
        { email, senha },
        { withCredentials: true }
      )
    );
    if (response.token) {
      this.setToken(response.token);
    }
    this.usuarioLogado = response.user;
    return response.user;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.authUrl}/logout`, {}, { withCredentials: true })
      );
    } finally {
      this.setToken(null);
      this.usuarioLogado = null;
    }
  }

  async restaurarSessao(): Promise<Usuario | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<UsuarioResponse>(`${this.authUrl}/me`, { withCredentials: true })
      );
      this.usuarioLogado = response.user;
      return response.user;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.setToken(null);
        this.usuarioLogado = null;
        return null;
      }
      throw error;
    }
  }

  getUsuarioLogado(): Usuario | null {
    return this.usuarioLogado;
  }

  async atualizarUsuario(usuarioAtualizado: Usuario): Promise<Usuario> {
    const response = await firstValueFrom(
      this.http.patch<UsuarioResponse>(
        `${this.authUrl}/me`,
        {
          nome: usuarioAtualizado.nome,
          email: usuarioAtualizado.email,
          trilhaEscolhida: usuarioAtualizado.trilhaEscolhida
        },
        { withCredentials: true }
      )
    );
    this.usuarioLogado = response.user;
    return response.user;
  }
}
