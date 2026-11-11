export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    pain_detected?: boolean;
    pain_description?: string | null;
    proposed_trail_id?: string | null;
  };
  criado_em: string;
}

export interface ProposedTrailSummary {
  id: string;
  status: 'proposta' | 'ativa' | 'arquivada';
  origem_gatilho: string;
  trail: {
    id: string;
    titulo: string;
    descricao: string;
    modulos: { titulo: string }[];
  };
}

export interface SendMessageResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
  pain_detected: boolean;
  pain_description: string | null;
  proposed_trail: ProposedTrailSummary | null;
}

export interface ProposalResponseResult {
  decision: 'accept' | 'reject';
  message: string;
  active_trail: any;
}
