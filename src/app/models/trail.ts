export interface Question {
  id: string;
  enunciado: string;
  alternativas: string[];
  respostaCorreta: number;
  explicacao?: string;
}

export interface Assessment {
  id: string;
  titulo: string;
  perguntas: Question[];
}

export interface Topic {
  id: string;
  titulo: string;
  descricao: string;
  ordem: number;
  conteudo?: string;
}

export interface Module {
  id: string;
  titulo: string;
  descricao: string;
  ordem: number;
  topicos: Topic[];
  avaliacao: Assessment;
}

export interface Trail {
  id: string;
  slug: string;
  titulo: string;
  descricao: string;
  modulos: Module[];
}

export interface UserProgress {
  user_id: string;
  trail_source: 'default' | 'custom';
  custom_trail_id: string | null;
  completed_topics: string[];
  completed_topics_count: number;
  total_topics: number;
  assessment_scores: Record<string, {
    score: number;
    passed: boolean;
    completed_at: string;
    attempts: number;
  }>;
  current_module_id: string;
}

export interface ActiveTrailResponse {
  source: 'default' | 'custom';
  custom_trail_id: string | null;
  status: string;
  origem_gatilho: string;
  trail: Trail;
  progress: UserProgress;
}

export interface DiagnosticQuestionOption {
  texto: string;
}

export interface DiagnosticQuestion {
  id: string;
  categoria: string;
  enunciado: string;
  opcoes: DiagnosticQuestionOption[];
}

export interface DiagnosticAnswer {
  question_id: string;
  selected_option: number;
}

export interface DiagnosticResult {
  _id?: string;
  user_id?: string;
  pontuacao_total: number;
  pontos_brutos?: number;
  nivel_sugerido: string;
  resumo_lacunas: string[];
  realizado_em: string;
}

export interface ComparisonOptionsResponse {
  default_trail: Trail & { source: 'default'; badge?: string };
  proposed_trail: (Trail & {
    id: string;
    custom_trail_id: string;
    status: 'proposta' | 'ativa' | 'arquivada';
    origem_gatilho: string;
    source: 'custom';
    badge?: string;
  }) | null;
  active_trail_source: 'default' | 'custom';
  active_custom_trail_id: string | null;
  diagnostic: DiagnosticResult | null;
}
