import { DiagnosticQuestion } from '../models/trail';

export const FALLBACK_DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 'diag-q1',
    categoria: 'Metodologias Ágeis e Ciclo de Entrega',
    enunciado: 'Em um cenário onde o time de desenvolvimento frequentemente não entrega as histórias planejadas na sprint e o escopo muda durante a iteração, qual é a conduta ágil mais adequada?',
    opcoes: [
      { texto: 'Aumentar a duração das sprints para 6 semanas e bloquear qualquer comunicação entre desenvolvedores e clientes.' },
      { texto: 'Cobrar horas extras da equipe para cumprir o planejado, mantendo as estimativas iniciais sem alterações.' },
      { texto: 'Revisar a definição de pronto (DoD), diminuir o tamanho dos itens de backlog e negociar o escopo com o Product Owner.' },
      { texto: 'Substituir reuniões diárias por relatórios semanais estáticos enviados por e-mail à diretoria.' }
    ]
  },
  {
    id: 'diag-q2',
    categoria: 'Product Discovery e Validação de Hipóteses',
    enunciado: 'Sua startup identificou uma oportunidade de mercado e quer lançar uma nova funcionalidade. Qual é a melhor abordagem inicial segundo a mentalidade Lean Startup?',
    opcoes: [
      { texto: 'Construir a versão completa do sistema com todas as integrações antes de mostrar a qualquer usuário.' },
      { texto: 'Formular hipóteses de valor falsificáveis e criar um MVP (ex.: protótipo interativo ou concierge) para testar com usuários reais.' },
      { texto: 'Encomendar uma pesquisa de mercado teórica de 6 meses e redigir um plano de negócios de 80 páginas.' },
      { texto: 'Lançar direto uma campanha de marketing paga com desconto agressivo sem validar a dor real do cliente.' }
    ]
  },
  {
    id: 'diag-q3',
    categoria: 'Priorização e Gestão de Backlog',
    enunciado: 'Com dezenas de solicitações de stakeholders e clientes, como você define a ordem dos itens a serem desenvolvidos no próximo ciclo?',
    opcoes: [
      { texto: 'Priorizar sempre a solicitação do stakeholder de cargo mais alto (efeito HiPPO).' },
      { texto: 'Implementar as tarefas mais fáceis e rápidas primeiro, independentemente do retorno financeiro ou estratégico.' },
      { texto: 'Utilizar frameworks estruturados como RICE (Reach, Impact, Confidence, Effort) ou ICE alinhados aos objetivos estratégicos.' },
      { texto: 'Atender por ordem de chegada de chamados no canal de suporte.' }
    ]
  },
  {
    id: 'diag-q4',
    categoria: 'Engenharia de TI e Débito Técnico',
    enunciado: 'Para acelerar entregas, a equipe acumulou código com testes frágeis e deploys manuais que começaram a derrubar a aplicação. Como agir?',
    opcoes: [
      { texto: 'Ignorar o débito técnico e continuar adicionando features, pois clientes não veem arquitetura.' },
      { texto: 'Pausar todo o desenvolvimento do produto por 1 ano para reescrever o sistema do zero em outra linguagem.' },
      { texto: 'Alocar uma fração fixa do backlog da sprint (ex.: 20%) para refatoração contínua, testes automatizados e pipeline CI/CD.' },
      { texto: 'Contratar mais desenvolvedores juniores para substituir a equipe que conhece as falhas.' }
    ]
  },
  {
    id: 'diag-q5',
    categoria: 'Métricas de Tração e Governança',
    enunciado: 'Qual das alternativas reflete o monitoramento de saúde e tração de produto mais eficiente para uma startup em crescimento?',
    opcoes: [
      { texto: 'Medir apenas métricas de vaidade como número total de downloads acumulados e curtidas em redes sociais.' },
      { texto: 'Acompanhar métricas de retenção (cohorts), LTV/CAC, Churn Rate e North Star Metric alinhadas a OKRs claros.' },
      { texto: 'Avaliar a produtividade do time contando linhas de código produzidas por dia por cada programador.' },
      { texto: 'Analisar faturamento bruto sem considerar custos de aquisição ou custos de infraestrutura em nuvem.' }
    ]
  }
];
