export function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function validateRegistration(body) {
  const nome = typeof body?.nome === 'string' ? body.nome.trim() : '';
  const email = normalizeEmail(body?.email);
  const senha = typeof body?.senha === 'string' ? body.senha : '';

  if (nome.length < 3 || nome.length > 100) {
    return { error: 'Informe um nome com pelo menos 3 caracteres.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { error: 'Informe um e-mail válido.' };
  }
  if (senha.length < 8 || !/[A-Za-z]/.test(senha) || !/\d/.test(senha)) {
    return { error: 'A senha deve ter pelo menos 8 caracteres, incluindo letras e números.' };
  }
  if (body?.termosAceitos !== true) {
    return { error: 'É necessário aceitar os termos para criar uma conta.' };
  }

  return { value: { nome, email, senha, termosAceitos: true } };
}

export function validateLogin(body) {
  const email = normalizeEmail(body?.email);
  const senha = typeof body?.senha === 'string' ? body.senha : '';

  if (!email || !senha) {
    return { error: 'Informe o e-mail e a senha.' };
  }

  return { value: { email, senha } };
}

export function validateProfile(body) {
  const nome = typeof body?.nome === 'string' ? body.nome.trim() : '';
  const email = normalizeEmail(body?.email);
  const trilhaEscolhida = body?.trilhaEscolhida;

  if (nome.length < 3 || nome.length > 100) {
    return { error: 'Informe um nome com pelo menos 3 caracteres.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { error: 'Informe um e-mail válido.' };
  }
  if (trilhaEscolhida !== 'execucao' && trilhaEscolhida !== 'fundamentos') {
    return { error: 'Selecione uma trilha válida.' };
  }

  return { value: { nome, email, trilhaEscolhida } };
}

const diagnosticOptions = {
  estagio: [
    'Ideação — estamos desenvolvendo a ideia.',
    'Validação — estamos testando a solução.',
    'MVP — temos uma versão inicial do produto.',
    'Operação — já temos clientes.',
    'Crescimento — estamos expandindo o negócio.'
  ],
  tamanhoEquipe: ['1 pessoa.', '2 a 5 pessoas.', '6 a 10 pessoas.', '11 a 20 pessoas.', 'Mais de 20 pessoas.'],
  organizacaoProjetos: [
    'Não temos um método definido.',
    'Organizamos as atividades informalmente.',
    'Utilizamos planilhas ou listas de tarefas.',
    'Utilizamos ferramentas de gestão de projetos.',
    'Seguimos uma metodologia estruturada.'
  ],
  objetivos: [
    'Não são definidos claramente.',
    'São definidos informalmente pela equipe.',
    'São registrados, mas não possuem indicadores.',
    'São documentados com metas, prazos e indicadores.'
  ],
  distribuicaoTarefas: [
    'Não existe uma divisão clara.',
    'As tarefas são distribuídas conforme surgem.',
    'Cada integrante possui responsabilidades definidas.',
    'Utilizamos planejamento e acompanhamento das responsabilidades.'
  ],
  prazos: [
    'Não estabelecemos prazos.',
    'Definimos prazos sem estimativas estruturadas.',
    'Estimamos prazos considerando as tarefas e os recursos.',
    'Monitoramos os prazos e ajustamos o planejamento quando necessário.'
  ],
  riscos: [
    'Não identificamos riscos antecipadamente.',
    'Identificamos riscos quando os problemas aparecem.',
    'Discutimos os riscos durante o planejamento.',
    'Registramos, priorizamos e acompanhamos os riscos.'
  ],
  acompanhamento: [
    'Não realiza acompanhamento regular.',
    'Acompanha por conversas informais.',
    'Utiliza reuniões, planilhas ou ferramentas.',
    'Utiliza indicadores e revisões periódicas.'
  ],
  prioridades: [
    'As prioridades mudam sem organização.',
    'As mudanças são decididas informalmente.',
    'Avaliamos o impacto antes de mudar as prioridades.',
    'Utilizamos critérios definidos para priorizar e reorganizar tarefas.'
  ],
  registroDecisoes: [
    'Não são registradas.',
    'Ficam principalmente em conversas e mensagens.',
    'São registradas em documentos ou planilhas.',
    'São centralizadas em uma ferramenta acessível à equipe.'
  ],
  identificacaoAtrasos: [
    'Geralmente percebemos quando o prazo já foi comprometido.',
    'Identificamos por meio de conversas.',
    'Acompanhamos as tarefas e seus prazos.',
    'Utilizamos indicadores e alertas para antecipar problemas.'
  ],
  processos: [
    'Não temos processos definidos.',
    'Existem processos, mas são conhecidos informalmente.',
    'Alguns processos estão documentados.',
    'Os principais processos estão documentados e são revisados.'
  ],
  revisaoResultados: [
    'Nunca.',
    'Somente quando surge um problema.',
    'Periodicamente.',
    'Ao final de cada etapa e também durante a execução.'
  ]
};

const diagnosticDimensions = {
  planejamento: ['objetivos', 'distribuicaoTarefas', 'prazos', 'riscos'],
  execucaoEAcompanhamento: [
    'acompanhamento',
    'prioridades',
    'registroDecisoes',
    'identificacaoAtrasos'
  ],
  processosEFerramentas: ['organizacaoProjetos', 'processos', 'revisaoResultados']
};

function calculateDimensionScore(respostas, questions) {
  const earned = questions.reduce(
    (total, question) => total + diagnosticOptions[question].indexOf(respostas[question]),
    0
  );
  const possible = questions.reduce(
    (total, question) => total + diagnosticOptions[question].length - 1,
    0
  );
  return Math.round((earned / possible) * 100);
}

export function validateDiagnostic(body) {
  const respostas = body?.respostas;
  const expectedFields = [...Object.keys(diagnosticOptions), 'resultadoDesejado', 'problemaRecorrente'];
  if (!respostas || typeof respostas !== 'object' || Array.isArray(respostas)) {
    return { error: 'Informe as respostas do diagnóstico.' };
  }
  if (Object.keys(respostas).length !== expectedFields.length
    || expectedFields.some(field => !Object.hasOwn(respostas, field))) {
    return { error: 'Responda todas as perguntas do diagnóstico.' };
  }

  for (const [field, options] of Object.entries(diagnosticOptions)) {
    const value = respostas[field];
    if (typeof value !== 'string' || !options.includes(value)) {
      return { error: 'Uma ou mais alternativas do diagnóstico são inválidas.' };
    }
  }

  const resultadoDesejado = typeof respostas.resultadoDesejado === 'string'
    ? respostas.resultadoDesejado.trim()
    : '';
  const problemaRecorrente = typeof respostas.problemaRecorrente === 'string'
    ? respostas.problemaRecorrente.trim()
    : '';
  if (!resultadoDesejado || !problemaRecorrente) {
    return { error: 'Preencha as duas respostas abertas do diagnóstico.' };
  }
  if (resultadoDesejado.length > 1000 || problemaRecorrente.length > 1000) {
    return { error: 'As respostas abertas devem ter no máximo 1000 caracteres.' };
  }

  const respostasValidadas = {
    ...Object.fromEntries(Object.keys(diagnosticOptions).map(field => [field, respostas[field]])),
    resultadoDesejado,
    problemaRecorrente
  };
  const pontuacoesPorDimensao = Object.fromEntries(
    Object.entries(diagnosticDimensions).map(([dimension, questions]) => [
      dimension,
      calculateDimensionScore(respostasValidadas, questions)
    ])
  );
  const pontuacaoGeral = Math.round(
    Object.values(pontuacoesPorDimensao).reduce((total, score) => total + score, 0)
      / Object.keys(pontuacoesPorDimensao).length
  );
  const nivelMaturidade = pontuacaoGeral < 25
    ? 'Inicial'
    : pontuacaoGeral < 50
      ? 'Em desenvolvimento'
      : pontuacaoGeral < 75
        ? 'Estruturado'
        : 'Avançado';

  return {
    value: {
      respostas: respostasValidadas,
      resultado: { pontuacaoGeral, pontuacoesPorDimensao, nivelMaturidade }
    }
  };
}
