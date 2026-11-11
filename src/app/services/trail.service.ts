import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ActiveTrailResponse,
  ComparisonOptionsResponse,
  DiagnosticAnswer,
  DiagnosticQuestion,
  DiagnosticResult,
  Trail
} from '../models/trail';

@Injectable({
  providedIn: 'root'
})
export class TrailService {
  private readonly baseUrl = environment.apiUrl;
  private readonly http = inject(HttpClient);

  /**
   * Obtém as perguntas do diagnóstico.
   */
  async getDiagnosticQuestions(): Promise<DiagnosticQuestion[]> {
    const response = await firstValueFrom(
      this.http.get<{ questions: DiagnosticQuestion[] }>(
        `${this.baseUrl}/diagnostic/questions`,
        { withCredentials: true }
      )
    );
    return response.questions;
  }

  /**
   * Envia as respostas do diagnóstico e gera a trilha proposta pela IA.
   */
  async submitDiagnostic(respostas: DiagnosticAnswer[]): Promise<{
    diagnostic: DiagnosticResult;
    proposed_trail: any;
  }> {
    return firstValueFrom(
      this.http.post<{ diagnostic: DiagnosticResult; proposed_trail: any }>(
        `${this.baseUrl}/diagnostic/submit`,
        { respostas },
        { withCredentials: true }
      )
    );
  }

  /**
   * Consulta as duas opções lado a lado (padrão e personalizada proposta).
   */
  async getComparisonOptions(): Promise<ComparisonOptionsResponse> {
    return firstValueFrom(
      this.http.get<ComparisonOptionsResponse>(
        `${this.baseUrl}/trails/options`,
        { withCredentials: true }
      )
    );
  }

  /**
   * Escolhe a trilha ativa (default ou custom).
   */
  async chooseTrail(choice: 'default' | 'custom', customTrailId?: string | null): Promise<ActiveTrailResponse> {
    return firstValueFrom(
      this.http.post<ActiveTrailResponse>(
        `${this.baseUrl}/trails/choose`,
        {
          choice,
          custom_trail_id: customTrailId || undefined
        },
        { withCredentials: true }
      )
    );
  }

  /**
   * Retorna a trilha ativa e progresso.
   */
  async getActiveTrail(): Promise<ActiveTrailResponse> {
    return firstValueFrom(
      this.http.get<ActiveTrailResponse>(
        `${this.baseUrl}/trails/active`,
        { withCredentials: true }
      )
    );
  }
}
