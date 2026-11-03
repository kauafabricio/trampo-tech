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
  trilhaEscolhida: 'execucao' | 'fundamentos';
}

interface UsuarioResponse {
  user: Usuario;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly authUrl = `${environment.apiUrl}/auth`;
  private usuarioLogado: Usuario | null = null;
  private readonly http = inject(HttpClient);

  async registrar(dados: Pick<Usuario, 'nome' | 'email' | 'termosAceitos'> & { senha: string }): Promise<Usuario> {
    const response = await firstValueFrom(
      this.http.post<UsuarioResponse>(`${this.authUrl}/register`, dados, { withCredentials: true })
    );
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
    this.usuarioLogado = response.user;
    return response.user;
  }

  async logout(): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.authUrl}/logout`, {}, { withCredentials: true })
    );
    this.usuarioLogado = null;
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
