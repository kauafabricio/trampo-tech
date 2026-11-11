/**
 * Perguntas de Avaliação Diagnóstica para Gestão de Projetos em Startups e Tecnologia.
 * Estruturadas em 5 eixos temáticos essenciais.
 */
export const DIAGNOSTIC_QUESTIONS = [
  {
    id: 'diag-q1',
    categoria: 'Metodologias Ágeis e Ciclo de Entrega',
    enunciado: 'Em um cenário onde o time de desenvolvimento frequentemente não entrega as histórias planejadas na sprint e o escopo muda durante a iteração, qual é a conduta ágil mais adequada?',
    opcoes: [
      {
        texto: 'Aumentar a duração das sprints para 6 semanas e bloquear qualquer comunicação entre desenvolvedores e clientes.',
        pontos: 0,
        nivel: 'iniciante'
      },
      {
        texto: 'Cobrar horas extras da equipe para cumprir o planejado, mantendo as estimativas iniciais sem alterações.',
        pontos: 1,
        nivel: 'iniciante'
      },
      {
        texto: 'Revisar a definição de pronto (DoD), diminuir o tamanho dos itens de backlog e negociar o escopo com o Product Owner.',
        pontos: 3,
        nivel: 'avancado'
      },
      {
        texto: 'Substituir reuniões diárias por relatórios semanais estáticos enviados por e-mail à diretoria.',
        pontos: 1,
        nivel: 'intermediario'
      }
    ],
    lacunaSeFalhar: 'Metodologias Ágeis e Planejamento de Sprints'
  },
  {
    id: 'diag-q2',
    categoria: 'Product Discovery e Validação de Hipóteses',
    enunciado: 'Sua startup identificou uma oportunidade de mercado e quer lançar uma nova funcionalidade. Qual é a melhor abordagem inicial segundo a mentalidade Lean Startup?',
    opcoes: [
      {
        texto: 'Construir a versão completa do sistema com todas as integrações antes de mostrar a qualquer usuário.',
        pontos: 0,
        nivel: 'iniciante'
      },
      {
        texto: 'Formular hipóteses de valor falsificáveis e criar um MVP (ex.: protótipo interativo ou concierge) para testar com usuários reais.',
        pontos: 3,
        nivel: 'avancado'
      },
      {
        texto: 'Encomendar uma pesquisa de mercado teórica de 6 meses e redigir um plano de negócios de 80 páginas.',
        pontos: 1,
        nivel: 'iniciante'
      },
      {
        texto: 'Lançar direto uma campanha de marketing paga com desconto agressivo sem validar a dor real do cliente.',
        pontos: 1,
        nivel: 'intermediario'
      }
    ],
    lacunaSeFalhar: 'Product Discovery e Validação de MVP'
  },
  {
    id: 'diag-q3',
    categoria: 'Priorização e Gestão de Backlog',
    enunciado: 'Com dezenas de solicitações de stakeholders e clientes, como você define a ordem dos itens a serem desenvolvidos no próximo ciclo?',
    opcoes: [
      {
        texto: 'Priorizar sempre a solicitação do stakeholder de cargo mais alto (efeito HiPPO).',
        pontos: 0,
        nivel: 'iniciante'
      },
      {
        texto: 'Implementar as tarefas mais fáceis e rápidas primeiro, independentemente do retorno financeiro ou estratégico.',
        pontos: 1,
        nivel: 'iniciante'
      },
      {
        texto: 'Utilizar frameworks estruturados como RICE (Reach, Impact, Confidence, Effort) ou ICE alinhados aos objetivos estratégicos.',
        pontos: 3,
        nivel: 'avancado'
      },
      {
        texto: 'Atender por ordem de chegada de chamados no canal de suporte.',
        pontos: 1,
        nivel: 'intermediario'
      }
    ],
    lacunaSeFalhar: 'Frameworks de Priorização e Gestão de Backlog'
  },
  {
    id: 'diag-q4',
    categoria: 'Engenharia de TI e Débito Técnico',
    enunciado: 'Para acelerar entregas, a equipe acumulou código com testes frágeis e deploys manuais que começaram a derrubar a aplicação. Como agir?',
    opcoes: [
      {
        texto: 'Ignorar o débito técnico e continuar adicionando features, pois clientes não veem arquitetura.',
        pontos: 0,
        nivel: 'iniciante'
      },
      {
        texto: 'Pausar todo o desenvolvimento do produto por 1 ano para reescrever o sistema do zero em outra linguagem.',
        pontos: 1,
        nivel: 'iniciante'
      },
      {
        texto: 'Alocar uma fração fixa do backlog da sprint (ex.: 20%) para refatoração contínua, testes automatizados e pipeline CI/CD.',
        pontos: 3,
        nivel: 'avancado'
      },
      {
        texto: 'Contratar mais desenvolvedores juniores para substituir a equipe que conhece as falhas.',
        pontos: 0,
        nivel: 'iniciante'
      }
    ],
    lacunaSeFalhar: 'Engenharia de Software, Qualidade e Débito Técnico'
  },
  {
    id: 'diag-q5',
    categoria: 'Métricas de Tração e Governança',
    enunciado: 'Qual das alternativas reflete o monitoramento de saúde e tração de produto mais eficiente para uma startup em crescimento?',
    opcoes: [
      {
        texto: 'Medir apenas métricas de vaidade como número total de downloads acumulados e curtidas em redes sociais.',
        pontos: 0,
        nivel: 'iniciante'
      },
      {
        texto: 'Acompanhar métricas de retenção (cohorts), LTV/CAC, Churn Rate e North Star Metric alinhadas a OKRs claros.',
        pontos: 3,
        nivel: 'avancado'
      },
      {
        texto: 'Avaliar a produtividade do time contando linhas de código produzidas por dia por cada programador.',
        pontos: 0,
        nivel: 'iniciante'
      },
      {
        texto: 'Analisar faturamento bruto sem considerar custos de aquisição ou custos de infraestrutura em nuvem.',
        pontos: 1,
        nivel: 'intermediario'
      }
    ],
    lacunaSeFalhar: 'Métricas de Tração, Unit Economics e OKRs'
  }
];

/**
 * Avalia as respostas do diagnóstico e gera relatório de lacunas e nível sugerido.
 * @param {Array<{ question_id: string, selected_option: number }>} respostas
 */
export function evaluateDiagnostic(respostas) {
  if (!Array.isArray(respostas) || respostas.length === 0) {
    throw new Error('Respostas do diagnóstico devem ser uma lista não vazia.');
  }

  const answerMap = new Map();
  for (const item of respostas) {
    if (item && item.question_id) {
      answerMap.set(item.question_id, Number(item.selected_option));
    }
  }

  let totalPoints = 0;
  const maxPossible = DIAGNOSTIC_QUESTIONS.length * 3; // 15
  const lacunas = [];

  for (const q of DIAGNOSTIC_QUESTIONS) {
    const selectedIdx = answerMap.get(q.id);
    const option = typeof selectedIdx === 'number' && q.opcoes[selectedIdx]
      ? q.opcoes[selectedIdx]
      : null;

    if (option) {
      totalPoints += option.pontos;
      if (option.pontos < 3) {
        lacunas.push(q.lacunaSeFalhar);
      }
    } else {
      lacunas.push(q.lacunaSeFalhar);
    }
  }

  const scorePercentage = Math.round((totalPoints / maxPossible) * 100);

  let nivelSugerido = 'iniciante';
  if (scorePercentage >= 75) {
    nivelSugerido = 'avancado';
  } else if (scorePercentage >= 45) {
    nivelSugerido = 'intermediario';
  }

  return {
    pontuacao_total: scorePercentage,
    pontos_brutos: totalPoints,
    max_pontos: maxPossible,
    nivel_sugerido: nivelSugerido,
    resumo_lacunas: lacunas.length > 0 ? lacunas : ['Aprofundamento em Gestão Estratégica e Escala'],
    total_respondidas: answerMap.size
  };
}
