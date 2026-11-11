import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ChatMessage,
  ProposalResponseResult,
  SendMessageResponse
} from '../models/chat';

@Injectable({
  providedIn: 'root'
})
export class TutorService {
  private readonly baseUrl = environment.apiUrl;
  private readonly http = inject(HttpClient);

  /**
   * Busca todo o histórico de mensagens do chat do usuário.
   */
  async getChatHistory(): Promise<ChatMessage[]> {
    const response = await firstValueFrom(
      this.http.get<{ messages: ChatMessage[] }>(
        `${this.baseUrl}/tutor/history`,
        { withCredentials: true }
      )
    );
    return response.messages;
  }

  /**
   * Envia uma mensagem ao tutor e retorna a resposta, incluindo
   * detecção de dor e proposta de trilha se identificada.
   */
  async sendMessage(message: string): Promise<SendMessageResponse> {
    return firstValueFrom(
      this.http.post<SendMessageResponse>(
        `${this.baseUrl}/tutor/message`,
        { message },
        { withCredentials: true }
      )
    );
  }

  /**
   * Aceita ou recusa uma proposta de trilha gerada pelo tutor.
   */
  async respondToProposal(
    proposalId: string,
    decision: 'accept' | 'reject'
  ): Promise<ProposalResponseResult> {
    return firstValueFrom(
      this.http.post<ProposalResponseResult>(
        `${this.baseUrl}/tutor/proposals/${proposalId}/respond`,
        { decision },
        { withCredentials: true }
      )
    );
  }
}
