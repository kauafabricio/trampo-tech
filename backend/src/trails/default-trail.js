/**
 * @file Trilha padrão definida no código: "Gestão de Projetos em Startups".
 * Arquitetura: definida exclusivamente em código, sem persistência em banco ou seeds.
 * Regra 5x5x5: 5 módulos, 5 tópicos por módulo (25 tópicos), 1 avaliação por módulo com 5 perguntas (25 perguntas).
 * Todos os IDs são fixos e estáveis para permitir referência consistente pelo progresso do usuário.
 */

/** @type {import('./types.js').Trail} */
export const defaultTrail = Object.freeze({
  id: 'default-trail',
  slug: 'gestao-de-projetos-startups',
  titulo: 'Gestão de Projetos em Startups',
  descricao: 'Formação completa em gestão ágil de produtos e projetos de TI voltada ao ambiente dinâmico, incerto e de alto crescimento das startups.',
  modulos: [
    {
      id: 'default-m1',
      ordem: 1,
      titulo: 'Fundamentos de Startups e Metodologias Ágeis',
      descricao: 'Compreenda a natureza do ecossistema de inovação, o método Lean Startup e como adaptar cerimônias ágeis para cenários de alta incerteza.',
      topicos: [
        {
          id: 'default-m1-t1',
          ordem: 1,
          titulo: 'O ecossistema de startups e a mentalidade de experimentação',
          descricao: 'Diferença entre empresas tradicionais e startups: busca por um modelo de negócio repetível e escalável sob extrema incerteza.',
          conteudo: 'Startups não são versões menores de grandes corporações. Seu objetivo primário é aprender rápido por meio de hipóteses testáveis antes que o capital acabe.'
        },
        {
          id: 'default-m1-t2',
          ordem: 2,
          titulo: 'Metodologia Lean Startup e o ciclo Construir-Medir-Aprender',
          descricao: 'Aplicação prática do ciclo de feedback de Eric Ries para acelerar a aprendizagem validada com clientes reais.',
          conteudo: 'A métrica de progresso em startups é o aprendizado validado. Cada iteração deve responder a uma dúvida crítica de negócio com o menor esforço viável.'
        },
        {
          id: 'default-m1-t3',
          ordem: 3,
          titulo: 'MVP (Produto Mínimo Viável): conceitos, tipos e armadilhas',
          descricao: 'Estratégias de MVP fumaça, concierge, mágico de oz e protótipos funcionais, evitando o perfeccionismo prematuro.',
          conteudo: 'O MVP deve conter apenas as funcionalidades indispensáveis para testar uma hipótese fundamental, equilibrando viabilidade, usabilidade e valor.'
        },
        {
          id: 'default-m1-t4',
          ordem: 4,
          titulo: 'Frameworks ágeis no contexto de incerteza: Scrum vs. Kanban',
          descricao: 'Quando utilizar ciclos fechados (timebox de sprints) e quando o fluxo contínuo de entregas é mais eficiente para o time.',
          conteudo: 'Scrum oferece cadência e previsibilidade em equipes que já possuem direção clara. Kanban foca em fluxo contínuo e redução de WIP, ideal para demandas muito variáveis.'
        },
        {
          id: 'default-m1-t5',
          ordem: 5,
          titulo: 'Papéis, responsabilidades e times multidisciplinares (Squads)',
          descricao: 'Atribuições do Product Manager, Tech Lead, Designers e Desenvolvedores trabalhando em autonomia alinhada.',
          conteudo: 'Squads de alta performance possuem competências de ponta a ponta e responsabilidade compartilhada pelo resultado de negócio, não apenas pela entrega de código.'
        }
      ],
      avaliacao: {
        id: 'default-m1-assessment',
        titulo: 'Avaliação de Fundamentos de Startups e Agilidade',
        perguntas: [
          {
            id: 'default-m1-q1',
            enunciado: 'Qual é a principal definição de startup segundo Steve Blank e Eric Ries?',
            alternativas: [
              'Uma empresa recém-aberta que atua exclusivamente no setor de tecnologia com investimento anjo.',
              'Uma organização temporária desenhada para buscar um modelo de negócio repetível e escalável sob condições de extrema incerteza.',
              'Qualquer microempresa de serviços digitais focada em prestar consultoria a grandes corporações.',
              'Um projeto corporativo com prazo de entrega rígido e escopo previamente contratado.'
            ],
            respostaCorreta: 1,
            explicacao: 'Startups são organizações temporárias cujo propósito é descobrir e validar um modelo de negócio repetível e escalável sob incerteza.'
          },
          {
            id: 'default-m1-q2',
            enunciado: 'No ciclo Construir-Medir-Aprender do Lean Startup, qual é o objetivo central de cada iteração?',
            alternativas: [
              'Maximizar o número de linhas de código entregues por sprint.',
              'Gerar aprendizado validado sobre o cliente com o menor tempo e custo possíveis.',
              'Concluir todo o escopo do projeto antes de qualquer contato com o mercado.',
              'Eliminar a necessidade de fazer testes com usuários finais.'
            ],
            respostaCorreta: 1,
            explicacao: 'O objetivo de rodar o ciclo é produzir aprendizado validado sobre as hipóteses centrais de negócio rapidamente.'
          },
          {
            id: 'default-m1-q3',
            enunciado: 'O que caracteriza um MVP do tipo "Mágico de Oz"?',
            alternativas: [
              'O produto já possui arquitetura de microsserviços e inteligência artificial rodando em nuvem.',
              'Para o usuário o serviço parece 100% automatizado, mas os processos internos são executados manualmente pela equipe.',
              'Um vídeo explicativo simples que mede apenas a quantidade de cliques em uma página de captura.',
              'Uma versão definitiva do aplicativo disponibilizada gratuitamente para amigos e familiares.'
            ],
            respostaCorreta: 1,
            explicacao: 'No MVP Mágico de Oz, a experiência frontal simula automação total enquanto os fundadores operam o backend manualmente para validar a proposta de valor.'
          },
          {
            id: 'default-m1-q4',
            enunciado: 'Em qual situação o método Kanban é geralmente mais adequado do que o Scrum com sprints fixas?',
            alternativas: [
              'Quando o time precisa de fluxo contínuo e prioridades mudam com muita frequência sem tempo de planejar sprints de duas semanas.',
              'Quando a equipe deseja abandonar completamente reuniões e documentações de software.',
              'Apenas quando o projeto tem orçamento estritamente fixo e data limite inalterável.',
              'Quando não há programadores na equipe, apenas analistas de negócios.'
            ],
            respostaCorreta: 0,
            explicacao: 'O Kanban é ideal para prioridades altamente dinâmicas e fluxo sob demanda, gerenciando o trabalho em progresso (WIP).'
          },
          {
            id: 'default-m1-q5',
            enunciado: 'Qual é o papel fundamental do Tech Lead em uma squad ágil de startup?',
            alternativas: [
              'Definir sozinho a visão de negócios do produto sem consultar o Product Manager.',
              'Garantir viabilidade técnica, arquitetura sustentável e guiar decisões de engenharia alinhadas aos objetivos de negócio.',
              'Escrever relatórios diários de horas trabalhadas de cada desenvolvedor para a diretoria.',
              'Impedir que qualquer mudança de escopo ocorra após o início do projeto.'
            ],
            respostaCorreta: 1,
            explicacao: 'O Tech Lead lidera a engenharia, assegurando decisões técnicas sólidas, qualidade do código e sinergia com os objetivos do produto.'
          }
        ]
      }
    },
    {
      id: 'default-m2',
      ordem: 2,
      titulo: 'Descoberta de Produto (Product Discovery) e Validação',
      descricao: 'Aprenda a entender profundamente as dores dos clientes, conduzir pesquisas qualitativas eficazes e priorizar hipóteses de maior impacto.',
      topicos: [
        {
          id: 'default-m2-t1',
          ordem: 1,
          titulo: 'Identificação de personas, dores reais e jornada do usuário',
          descricao: 'Mapeamento empírico de quem é o usuário, quais problemas ele enfrenta e os momentos de atrito na sua rotina.',
          conteudo: 'Personas baseadas em suposições falham. Elas devem ser construídas a partir de observação real de comportamento e dores sentidas pelos clientes.'
        },
        {
          id: 'default-m2-t2',
          ordem: 2,
          titulo: 'Técnicas de entrevistas de validação e o "Mom Test"',
          descricao: 'Como formular perguntas sem induzir respostas ou receber elogios falsos, focando em fatos passados e hábitos concretos.',
          conteudo: 'Nunca pergunte se o cliente usaria ou compraria sua ideia no futuro. Pergunte como ele resolve o problema hoje e quanto tempo ou dinheiro já gastou.'
        },
        {
          id: 'default-m2-t3',
          ordem: 3,
          titulo: 'Problem-Solution Fit e proposição de valor única (UVP)',
          descricao: 'Alinhamento entre o que a startup oferece e a dor prioritária que o cliente está ativamente disposto a pagar para resolver.',
          conteudo: 'Ter uma boa solução não basta se o problema for irrelevante. O encaixe problema-solução ocorre quando os usuários demonstram urgência real pela cura da dor.'
        },
        {
          id: 'default-m2-t4',
          ordem: 4,
          titulo: 'Métricas de tração inicial e o funil AARRR (Métricas Piratas)',
          descricao: 'Mapeamento de Aquisição, Ativação, Retenção, Receita e Recomendação como bússola de validação do produto.',
          conteudo: 'Sem retenção, qualquer aquisição é desperdício. Em startups iniciais, o foco primário no funil AARRR deve ser a retenção e a ativação.'
        },
        {
          id: 'default-m2-t5',
          ordem: 5,
          titulo: 'Frameworks de priorização de hipóteses: RICE e ICE Score',
          descricao: 'Critérios objetivos de Alcance, Impacto, Confiança e Esforço para decidir o que construir primeiro.',
          conteudo: 'Usar modelos como RICE remove o viés da opinião da pessoa mais bem paga da sala (HiPPO) e prioriza experimentos com melhor retorno sobre esforço.'
        }
      ],
      avaliacao: {
        id: 'default-m2-assessment',
        titulo: 'Avaliação de Product Discovery e Validação',
        perguntas: [
          {
            id: 'default-m2-q1',
            enunciado: 'Segundo os princípios do livro "The Mom Test" (Rob Fitzpatrick), qual pergunta é a mais apropriada em uma entrevista com cliente?',
            alternativas: [
              '"Você compraria nosso aplicativo se custasse apenas R$ 20 por mês?"',
              '"Você acha que nossa ideia de inteligência artificial resolveria seus problemas?"',
              '"Como você resolve essa dificuldade atualmente e que ferramentas você já utilizou nos últimos 30 dias?"',
              '"Nosso layout parece moderno e amigável para você?"'
            ],
            respostaCorreta: 2,
            explicacao: 'Perguntas sobre comportamentos passados e reais revelam a verdade sobre o problema, ao passo que perguntas hipotéticas induzem falsas confirmações.'
          },
          {
            id: 'default-m2-q2',
            enunciado: 'O que caracteriza o estágio de Problem-Solution Fit em uma startup?',
            alternativas: [
              'A empresa já tem mais de 100 funcionários e filial internacional.',
              'Evidências concretas de que o problema investigado é real, relevante e que a solução proposta gera valor percebido evidente para os primeiros usuários.',
              'O código do sistema foi totalmente reescrito em microsserviços sem erros em produção.',
              'A startup fechou uma rodada Series B de investimento.'
            ],
            respostaCorreta: 1,
            explicacao: 'Problem-Solution Fit é a validação de que os clientes realmente se importam com o problema e reconhecem valor na solução proposta.'
          },
          {
            id: 'default-m2-q3',
            enunciado: 'No funil AARRR (Métricas Piratas), qual etapa é considerada a mais crítica para comprovar a viabilidade de longo prazo de um produto?',
            alternativas: [
              'Aquisição, pois conseguir tráfego pago inicial garante o sucesso da empresa.',
              'Retenção, pois usuários que retornam voluntariamente demonstram que o produto resolve um problema recorrente.',
              'Recomendação, porque um produto não precisa de retenção se o marketing for viral.',
              'Receita pontual, mesmo que o usuário cancele imediatamente no dia seguinte.'
            ],
            respostaCorreta: 1,
            explicacao: 'A retenção é a métrica mais decisiva: sem ela, a startup está enchendo um balde furado com custos de aquisição insustentáveis.'
          },
          {
            id: 'default-m2-q4',
            enunciado: 'No cálculo do RICE Score para priorização de backlog, o que compõe o numerador e o denominador da fórmula?',
            alternativas: [
              'Numerador: (Alcance × Impacto × Confiança); Denominador: Esforço.',
              'Numerador: Esforço total; Denominador: Custo financeiro estimado.',
              'Numerador: Número de reuniões; Denominador: Quantidade de desenvolvedores.',
              'Numerador: Urgência do patrocinador; Denominador: Tempo até o lançamento.'
            ],
            respostaCorreta: 0,
            explicacao: 'RICE = (Reach × Impact × Confidence) / Effort. Ajuda a comparar iniciativas ponderando o retorno pelo esforço requerido.'
          },
          {
            id: 'default-m2-q5',
            enunciado: 'Qual é o maior risco de focar excessivamente no "Delivery" (entrega) sem investir em "Discovery" (descoberta)?',
            alternativas: [
              'A equipe de desenvolvimento ficar ociosa sem tarefas no quadro Kanban.',
              'Construir com perfeição técnica uma funcionalidade que nenhum usuário precisa ou quer utilizar.',
              'Reduzir acidentalmente a qualidade do código fonte e dos testes.',
              'Receber muitos elogios de investidores antes do produto estar pronto.'
            ],
            respostaCorreta: 1,
            explicacao: 'O maior desperdício em software não é atrasar a entrega, mas entregar com excelência algo completamente inútil para o usuário.'
          }
        ]
      }
    },
    {
      id: 'default-m3',
      ordem: 3,
      titulo: 'Planejamento, Gestão de Backlog e Execução Ágil',
      descricao: 'Transforme descobertas de produto em itens acionáveis de engenharia, gerencie roadmaps dinâmicos e conduza sprints produtivas.',
      topicos: [
        {
          id: 'default-m3-t1',
          ordem: 1,
          titulo: 'Roadmaps orientados a resultados (Outcomes vs. Outputs)',
          descricao: 'Estruturação de roadmaps baseados em problemas a resolver (Agora, Próximo, Futuro) em vez de datas e listas de features estáticas.',
          conteudo: 'Roadmaps baseados em features viram promessas rígidas que frustram o time quando o mercado exige ajustes. Foque nas métricas e problemas que serão atacados.'
        },
        {
          id: 'default-m3-t2',
          ordem: 2,
          titulo: 'Escrita de Histórias de Usuário e Critérios de Aceite',
          descricao: 'Formato "Como [persona], quero [ação], para que [benefício]" acompanhado de critérios de aceite verificáveis (Gherkin/Given-When-Then).',
          conteudo: 'Uma boa história de usuário deve ser independente, negociável, valiosa, estimável, concisa e testável (critérios INVEST).'
        },
        {
          id: 'default-m3-t3',
          ordem: 3,
          titulo: 'Definição de Pronto (DoD) e Definição de Preparado (DoR)',
          descricao: 'Acordos claros de trabalho entre design, produto e engenharia para evitar retrabalho e bugs em produção.',
          conteudo: 'DoR assegura que a história está madura para ser desenvolvida. DoD assegura que a entrega cumpre todos os padrões de qualidade, testes e deploy.'
        },
        {
          id: 'default-m3-t4',
          ordem: 4,
          titulo: 'Cerimônias ágeis eficientes: Sprints, Dailies e Retrospectivas',
          descricao: 'Como conduzir cerimônias sem transformar o dia a dia em reuniões infinitas, focando em alinhamento e melhoria contínua.',
          conteudo: 'A Daily não é relatório de status para o gestor, mas alinhamento mútuo entre os membros da equipe sobre impedimentos e progresso em direção à meta da sprint.'
        },
        {
          id: 'default-m3-t5',
          ordem: 5,
          titulo: 'Gestão de impedimentos, dependências e mitigação de riscos',
          descricao: 'Identificação precoce de gargalos operacionais, dependências externas de APIs e planos de contingência em entregas críticas.',
          conteudo: 'Em ambientes enxutos, bloquear uma história gera custo oculto imediato. O time deve atuar coletivamente para remover o bloqueio prioritário.'
        }
      ],
      avaliacao: {
        id: 'default-m3-assessment',
        titulo: 'Avaliação de Gestão de Backlog e Execução Ágil',
        perguntas: [
          {
            id: 'default-m3-q1',
            enunciado: 'Qual é a principal diferença entre um roadmap focado em "Outputs" e outro em "Outcomes"?',
            alternativas: [
              'Outputs focam em entregar funcionalidades e telas específicas; Outcomes focam em atingir resultados de negócio e mudanças no comportamento do usuário.',
              'Outputs são exclusivos de projetos com Scrum e Outcomes pertencem unicamente ao Kanban.',
              'Outputs são definidos pela equipe de TI e Outcomes são criados apenas pelos investidores financeiros.',
              'Não existe diferença prática, são apenas sinônimos em inglês para a mesma lista de tarefas.'
            ],
            respostaCorreta: 0,
            explicacao: 'Outputs medem o que foi produzido (funcionalidades), enquanto Outcomes medem o impacto real gerado nos usuários e no negócio.'
          },
          {
            id: 'default-m3-q2',
            enunciado: 'O que define a sigla INVEST na criação de histórias de usuário de qualidade?',
            alternativas: [
              'Investimento, Negociação, Vendas, Estratégia, Tecnologia e Sucesso.',
              'Independente, Negociável, Valiosa, Estimável, Pequena (Small) e Testável.',
              'Inovadora, Notória, Viável, Econômica, Simples e Temporal.',
              'Integrada, Normalizada, Validada, Escrita, Segura e Traduzida.'
            ],
            respostaCorreta: 1,
            explicacao: 'INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable) é o checklist ágil padrão para histórias de usuário de alta qualidade.'
          },
          {
            id: 'default-m3-q3',
            enunciado: 'Qual é o papel da "Definition of Done" (DoD) em um time de desenvolvimento de software?',
            alternativas: [
              'Definir a lista de perguntas da entrevista de emprego dos novos programadores.',
              'Estabelecer um critério compartilhado de qualidade técnica que um item deve cumprir para ser considerado finalizado e pronto para release.',
              'Substituir a necessidade de testes automatizados e code review.',
              'Determinar o salário e o bônus de final de ano de cada membro da squad.'
            ],
            respostaCorreta: 1,
            explicacao: 'A Definition of Done estabelece o acordo de qualidade inegociável (ex: testes passando, código revisado, documentação e deploy sem regressão).'
          },
          {
            id: 'default-m3-q4',
            enunciado: 'Qual é o propósito principal da reunião diária (Daily Scrum)?',
            alternativas: [
              'Prestar contas de produtividade individual para cobrança pelo gerente.',
              'Inspecionar o progresso em direção à Meta da Sprint e sincronizar o plano do dia, identificando impedimentos que bloqueiam o time.',
              'Fazer uma demonstração detalhada do layout para os diretores da startup.',
              'Debater toda a arquitetura de banco de dados do próximo ano.'
            ],
            respostaCorreta: 1,
            explicacao: 'A daily é uma reunião rápida de alinhamento tático do time de desenvolvimento para colaborar na superação de bloqueios rumo à meta da sprint.'
          },
          {
            id: 'default-m3-q5',
            enunciado: 'O que uma equipe ágil deve fazer ao identificar que uma dependência externa atrasará a entrega da sprint?',
            alternativas: [
              'Ignorar o problema e esperar o final da sprint para reportar o fracasso na retrospectiva.',
              'Comunicar imediatamente o impedimento, negociar o escopo da sprint com o Product Owner e reorganizar as prioridades sem comprometer a transparência.',
              'Exigir que os desenvolvedores trabalhem durante a madrugada sem intervalo para compensar o atraso externo.',
              'Remover todos os testes de segurança para acelerar a compilação do software.'
            ],
            respostaCorreta: 1,
            explicacao: 'Transparência e comunicação precoce permitem adaptar o plano em colaboração com o PO, preservando o alinhamento de expectativas.'
          }
        ]
      }
    },
    {
      id: 'default-m4',
      ordem: 4,
      titulo: 'Engenharia de TI, Arquitetura e Gestão de Débito Técnico',
      descricao: 'Equilibre velocidade de lançamento com qualidade de código, construa pipelines automatizados e mantenha a infraestrutura segura e evolutiva.',
      topicos: [
        {
          id: 'default-m4-t1',
          ordem: 1,
          titulo: 'Arquitetura evolutiva: do monólito enxuto aos microsserviços',
          descricao: 'Por que iniciar com um monólito modular bem desenhado é quase sempre a melhor escolha inicial para startups.',
          conteudo: 'Adotar microsserviços prematuramente gera custos de rede, complexidade de deploy e atrito desnecessário em equipes pequenas.'
        },
        {
          id: 'default-m4-t2',
          ordem: 2,
          titulo: 'Integração Contínua (CI) e Entrega Contínua (CD)',
          descricao: 'Pipelines automatizados de lint, build, testes e deploy para viabilizar entregas frequentes e seguras em produção.',
          conteudo: 'Deploy deve ser um não-evento rotineiro, realizado várias vezes ao dia sem medo, graças a suítes de testes automatizados e ambientes consistentes.'
        },
        {
          id: 'default-m4-t3',
          ordem: 3,
          titulo: 'Gestão consciente do Débito Técnico versus Time-to-Market',
          descricao: 'Como contrair dívida técnica de forma intencional para validar hipóteses e planejar seu pagamento antes de comprometer o produto.',
          conteudo: 'Débito técnico é como dívida financeira: útil para acelerar no momento certo, mas fatal se os juros acumulados paralisarem a capacidade de entrega do time.'
        },
        {
          id: 'default-m4-t4',
          ordem: 4,
          titulo: 'Fundamentos de Segurança da Informação e Privacidade (LGPD)',
          descricao: 'Proteção de credenciais, armazenamento seguro de senhas com hashing, variáveis de ambiente e conformidade básica com a LGPD.',
          conteudo: 'Startups lidam com dados sensíveis de clientes desde o primeiro dia. Vazamentos ou perda de credenciais podem destruir a reputação do negócio irrevogavelmente.'
        },
        {
          id: 'default-m4-t5',
          ordem: 5,
          titulo: 'Observabilidade, monitoramento de erros e métricas de infraestrutura',
          descricao: 'Uso de logs estruturados, rastreamento de erros (ex: Sentry) e métricas básicas de latência e disponibilidade.',
          conteudo: 'Você não pode corrigir o que não vê. Um sistema de monitoramento garante que a equipe saiba dos problemas antes que os clientes comecem a reclamar.'
        }
      ],
      avaliacao: {
        id: 'default-m4-assessment',
        titulo: 'Avaliação de Engenharia de TI e Débito Técnico',
        perguntas: [
          {
            id: 'default-m4-q1',
            enunciado: 'Por que a maioria dos especialistas em arquitetura de software recomenda iniciar o MVP de uma startup com um monólito modular em vez de microsserviços distribuídos?',
            alternativas: [
              'Porque monólitos rodam apenas em servidores locais e não podem ser hospedados na nuvem.',
              'Porque o monólito modular reduz o overhead operacional, simplifica o deploy e acelera o ciclo de aprendizado enquanto o domínio de negócio ainda não está consolidado.',
              'Porque microsserviços são proibidos pelas diretrizes de conformidade da LGPD.',
              'Porque linguagens modernas não oferecem suporte a comunicação entre serviços.'
            ],
            respostaCorreta: 1,
            explicacao: 'Separar em microsserviços antes de compreender claramente as fronteiras do domínio cria o pior dos cenários: um monólito distribuído com alta latência.'
          },
          {
            id: 'default-m4-q2',
            enunciado: 'Em relação ao conceito de "Débito Técnico" introduzido por Ward Cunningham, qual afirmação é verdadeira?',
            alternativas: [
              'Qualquer débito técnico deve ser evitado a qualquer custo, mesmo que a startup perca uma janela de oportunidade crucial de mercado.',
              'É aceitável assumir atalhos técnicos conscientemente para validar uma hipótese urgente, desde que o time reserve capacidade futura para refatorar e pagar a dívida.',
              'Débito técnico refere-se exclusivamente ao atraso no pagamento dos servidores de hospedagem em nuvem.',
              'Bugs conhecidos em produção nunca são considerados formas de débito técnico.'
            ],
            respostaCorreta: 1,
            explicacao: 'Assim como dívidas financeiras, o débito técnico pode ser uma ferramenta estratégica quando contraído intencionalmente e administrado com responsabilidade.'
          },
          {
            id: 'default-m4-q3',
            enunciado: 'Qual é o principal benefício de implementar pipelines automatizados de CI/CD (Integração e Entrega Contínuas)?',
            alternativas: [
              'Dispensar a necessidade de os desenvolvedores escreverem testes de software.',
              'Garantir que alterações de código sejam validadas e promovidas para produção de forma rápida, repetível, segura e com baixo risco de falhas manuais.',
              'Substituir o papel do Product Manager na priorização das sprints.',
              'Aumentar o tempo de build para evitar que a equipe entregue alterações muito rapidamente.'
            ],
            respostaCorreta: 1,
            explicacao: 'CI/CD automatiza compilação, validação e deploy, reduzindo drastically o tempo entre a escrita do código e a disponibilidade para os usuários com segurança.'
          },
          {
            id: 'default-m4-q4',
            enunciado: 'Qual prática de segurança é fundamental no tratamento de senhas de usuários em bancos de dados de startups?',
            alternativas: [
              'Criptografar as senhas com chave reversível e guardá-la no frontend do aplicativo.',
              'Salvar senhas em texto puro para permitir suporte imediato caso o usuário esqueça.',
              'Aplicar funções de hash criptográfico forte unidirecional com salt (ex: bcrypt ou argon2).',
              'Armazenar senhas em uma planilha compartilhada no Google Drive protegida por senha de acesso.'
            ],
            respostaCorreta: 2,
            explicacao: 'Senhas devem ser armazenadas exclusivamente através de funções de hash unidirecional com salt aleatório para impedir que vazamentos exponham as credenciais.'
          },
          {
            id: 'default-m4-q5',
            enunciado: 'O que compreende os três pilares fundamentais da Observabilidade em sistemas de software modernos?',
            alternativas: [
              'Vendas, Marketing e Suporte ao Cliente.',
              'Logs estruturados, Métricas quantitativas e Rastreamentos distribuídos (Tracing).',
              'HTML, CSS e JavaScript.',
              'Frontend, Backend e Banco de Dados relacional.'
            ],
            respostaCorreta: 1,
            explicacao: 'Logs, métricas e traces constituem a tríade que permite entender o comportamento interno de sistemas a partir de suas saídas externas.'
          }
        ]
      }
    },
    {
      id: 'default-m5',
      ordem: 5,
      titulo: 'Métricas de Tração, Governança e Escala',
      descricao: 'Acompanhe métricas de engenharia (DORA), alinhe objetivos estratégicos com OKRs e prepare a operação para o crescimento sustentável.',
      topicos: [
        {
          id: 'default-m5-t1',
          ordem: 1,
          titulo: 'Product-Market Fit (PMF) e sinais de prontidão para escala',
          descricao: 'Como saber quando o produto atingiu tração real (teste dos 40% de Sean Ellis) e quando investir agressivamente em crescimento.',
          conteudo: 'Escalar antes do PMF é a causa número um de mortalidade em startups. Investir em marketing antes de ter retenção saudável apenas acelera a queima de caixa.'
        },
        {
          id: 'default-m5-t2',
          ordem: 2,
          titulo: 'Métricas de Engenharia e Eficiência de Times (DORA Metrics)',
          descricao: 'As 4 métricas DORA: Frequência de Deploy, Lead Time for Changes, Change Failure Rate e Time to Restore Service.',
          conteudo: 'DORA mede a saúde do fluxo de entrega da engenharia, equilibrando velocidade e estabilidade operacional sem cair na armadilha de medir linhas de código.'
        },
        {
          id: 'default-m5-t3',
          ordem: 3,
          titulo: 'Definição e acompanhamento de metas com OKRs',
          descricao: 'Como conectar a visão de longo prazo dos fundadores com os entregáveis trimestrais das equipes técnicas usando Objetivos e Resultados-Chave.',
          conteudo: 'OKRs devem focar no impacto quantificável e ser ambiciosos. Acompanhamentos semanais (check-ins) evitam que as metas sejam esquecidas.'
        },
        {
          id: 'default-m5-t4',
          ordem: 4,
          titulo: 'Alinhamento entre liderança técnica, fundadores e investidores',
          descricao: 'Comunicação executiva de riscos técnicos, capacidade de entrega e ROI de melhorias de infraestrutura para stakeholders não técnicos.',
          conteudo: 'A linguagem com fundadores e investidores deve traduzir débitos técnicos em termos de risco de negócio, impacto financeiro e velocidade de lançamento.'
        },
        {
          id: 'default-m5-t5',
          ordem: 5,
          titulo: 'Governança leve e cultura de produto sustentável',
          descricao: 'Processos enxutos de documentação (ADRs - Architecture Decision Records), post-mortems sem culpa e retenção de talentos.',
          conteudo: 'Em escala, processos não devem engessar, mas sim liberar autonomia com responsabilidade. Post-mortems focam em falhas do sistema, nunca em culpar indivíduos.'
        }
      ],
      avaliacao: {
        id: 'default-m5-assessment',
        titulo: 'Avaliação de Métricas de Tração, Governança e Escala',
        perguntas: [
          {
            id: 'default-m5-q1',
            enunciado: 'O que prega a regra empírica do "teste dos 40%" de Sean Ellis para medir Product-Market Fit?',
            alternativas: [
              'O faturamento mensal da empresa deve crescer no mínimo 40% ao ano.',
              'Pelo menos 40% dos usuários pesquisados devem responder que ficariam "muito desapontados" se o produto deixasse de existir amanhã.',
              'Pelo menos 40% dos custos da empresa devem ser alocados em despesas de marketing no Google Ads.',
              'A equipe técnica deve dedicar 40% do tempo exclusivamente para reuniões diárias de status.'
            ],
            respostaCorreta: 1,
            explicacao: 'Se 40% ou mais dos clientes ativos afirmam que ficariam extremamente desapontados com o fim do produto, isso é forte evidência de PMF.'
          },
          {
            id: 'default-m5-q2',
            enunciado: 'Quais são as 4 métricas recomendadas pelo programa DORA (DevOps Research and Assessment) para avaliar a performance de entrega de software?',
            alternativas: [
              'Linhas de código escritas, horas extras trabalhadas, número de reuniões e bugs abertos.',
              'Frequência de Deploy, Lead Time para Alterações, Taxa de Falha em Produção (Change Failure Rate) e Tempo Médio de Recuperação (MTTR).',
              'Número de commits no Git, quantidade de comentários no código, páginas de documentação e custo do café.',
              'Pontos de função calculados, número de histórias de usuário finalizadas, estimativas de prazo e tamanho do backlog.'
            ],
            respostaCorreta: 1,
            explicacao: 'As métricas DORA medem de forma equilibrada a cadência de entrega (velocidade) e a estabilidade do sistema em produção.'
          },
          {
            id: 'default-m5-q3',
            enunciado: 'Em um modelo de gestão por OKRs (Objectives and Key Results), qual das alternativas representa um "Key Result" (KR) bem formulado?',
            alternativas: [
              '"Fazer o melhor produto do mercado"',
              '"Reduzir o tempo médio de resposta da API de 450ms para 150ms até o fim do segundo trimestre"',
              '"Trabalhar com dedicação em todas as sprints do ano"',
              '"Contratar vários programadores talentosos para a squad"'
            ],
            respostaCorreta: 1,
            explicacao: 'Key Results devem ser específicos, mensuráveis, com linha de base, meta quantitativa e prazo determinado.'
          },
          {
            id: 'default-m5-q4',
            enunciado: 'Qual é o princípio orientador de uma sessão de "Post-Mortem sem culpa" (Blameless Post-Mortem) após um incidente crítico em produção?',
            alternativas: [
              'Identificar o desenvolvedor que introduziu o bug e aplicar uma advertência formal por escrito.',
              'Assumir que engenheiros agem com boa fé e focar em compreender as falhas nos processos, ferramentas e defesas sistêmicas que permitiram o erro ocorrer.',
              'Ocultar o incidente dos usuários e stakeholders para proteger a reputação corporativa.',
              'Determinar que nenhum deploy em produção poderá mais ser realizado sem autorização prévia por e-mail de toda a diretoria.'
            ],
            respostaCorreta: 1,
            explicacao: 'A cultura sem culpa reconhece que erros humanos são sintomas de falhas no ambiente e processos; corrigir o sistema previne recorrências.'
          },
          {
            id: 'default-m5-q5',
            enunciado: 'Para que serve um Architecture Decision Record (ADR) em equipes de engenharia em expansão?',
            alternativas: [
              'Registrar de forma concisa o contexto, as alternativas consideradas, a decisão técnica tomada e suas consequências para referência futura do time.',
              'Substituir o repositório de código fonte do software por arquivos de texto.',
              'Servir como contrato jurídico assinado entre a startup e os clientes finais.',
              'Armazenar senhas e chaves privadas de criptografia dos servidores.'
            ],
            respostaCorreta: 0,
            explicacao: 'ADRs documentam decisões estruturais importantes e suas motivações, preservando o histórico da arquitetura para novos integrantes da equipe.'
          }
        ]
      }
    }
  ]
});
