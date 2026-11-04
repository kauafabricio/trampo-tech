import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RespostasDiagnostico {
  estagio: string;
  tamanhoEquipe: string;
  organizacaoProjetos: string;
  objetivos: string;
  distribuicaoTarefas: string;
  prazos: string;
  riscos: string;
  acompanhamento: string;
  prioridades: string;
  registroDecisoes: string;
  identificacaoAtrasos: string;
  processos: string;
  revisaoResultados: string;
  resultadoDesejado: string;
  problemaRecorrente: string;
}

export interface ResultadoDiagnostico {
  pontuacaoGeral: number;
  pontuacoesPorDimensao: {
    planejamento: number;
    execucaoEAcompanhamento: number;
    processosEFerramentas: number;
  };
  nivelMaturidade: 'Inicial' | 'Em desenvolvimento' | 'Estruturado' | 'Avançado';
}

export interface Diagnostico {
  versaoQuestionario: number;
  respostas: RespostasDiagnostico;
  resultado: ResultadoDiagnostico;
  criadoEm: string;
  atualizadoEm: string;
}

interface DiagnosticoResponse {
  diagnostico: Diagnostico | null;
}

@Injectable({
  providedIn: 'root'
})
export class DiagnosticoService {
  private readonly diagnosticoUrl = `${environment.apiUrl}/diagnostico`;
  private readonly http = inject(HttpClient);

  async obter(): Promise<Diagnostico | null> {
    const response = await firstValueFrom(
      this.http.get<DiagnosticoResponse>(this.diagnosticoUrl, { withCredentials: true })
    );
    return response.diagnostico;
  }

  async salvar(respostas: RespostasDiagnostico): Promise<Diagnostico> {
    const response = await firstValueFrom(
      this.http.post<DiagnosticoResponse>(
        this.diagnosticoUrl,
        { respostas },
        { withCredentials: true }
      )
    );
    if (!response.diagnostico) {
      throw new Error('A API não retornou o diagnóstico salvo.');
    }
    return response.diagnostico;
  }
}
