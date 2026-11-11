import 'dotenv/config';
import { createApp, createFallbackCollection } from '../src/app.js';
import { createGeminiClient } from '../src/ai/gemini-client.js';
import assert from 'node:assert/strict';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error('GEMINI_API_KEY é obrigatória para executar o teste live.');
}
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
const JWT_SECRET = process.env.AUTH_JWT_SECRET || 'test-secret-with-more-than-thirty-two-characters-long';

console.log('====================================================');
console.log('INICIANDO TESTE COMPLETO DE PONTA A PONTA (PROMPT 3)');
console.log('====================================================');

const usersCollection = createFallbackCollection();
const customTrailsCollection = createFallbackCollection();
const userProgressCollection = createFallbackCollection();
const diagnosticResultsCollection = createFallbackCollection();
const tutorMessagesCollection = createFallbackCollection();

const geminiClient = createGeminiClient({
  apiKey: API_KEY,
  modelName: MODEL,
  timeoutMs: 45000,
  maxRetries: 2
});

const app = createApp({
  users: usersCollection,
  customTrails: customTrailsCollection,
  userProgress: userProgressCollection,
  diagnosticResults: diagnosticResultsCollection,
  chatMessages: tutorMessagesCollection,
  jwtSecret: JWT_SECRET,
  clientOrigin: 'http://localhost:4200',
  geminiClient
});

const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
console.log(`[E2E] Servidor de teste ouvindo em ${origin}`);

try {
  // 1. HealthCheck da IA
  console.log('\n[Passo 1] Testando HealthCheck da IA Gemini...');
  const isHealthy = await geminiClient.healthCheck();
  assert.equal(isHealthy, true, 'Gemini deve responder com sucesso');
  console.log('  -> IA Gemini operacional!');

  // 2. Cadastro de Usuário
  console.log('\n[Passo 2] Registrando novo usuário...');
  const email = `aluno_${Date.now()}@trampotech.com`;
  const regRes = await fetch(`${origin}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: 'Carlos Aluno Teste',
      email,
      senha: 'SenhaForte123!',
      termosAceitos: true
    })
  });
  assert.equal(regRes.status, 201);
  const regData = await regRes.json();
  const sessionCookie = regRes.headers.get('set-cookie')?.split(';')[0];
  assert.ok(sessionCookie, 'Cookie de sessão deve ser emitido');
  assert.equal(regData.user.trail_source, 'default', 'Novo usuário deve começar com trilha padrão');
  assert.equal(regData.user.custom_trail_id, null, 'custom_trail_id deve ser null inicialmente');
  console.log(`  -> Usuário criado: ID ${regData.user.id}, trail_source: ${regData.user.trail_source}`);

  // 3. Verificação da Trilha Padrão Inicial
  console.log('\n[Passo 3] Verificando trilha ativa inicial (padrão do código)...');
  const activeRes1 = await fetch(`${origin}/api/trails/active`, {
    headers: { Cookie: sessionCookie }
  });
  assert.equal(activeRes1.status, 200);
  const activeData1 = await activeRes1.json();
  assert.equal(activeData1.source, 'default');
  assert.equal(activeData1.trail.id, 'default-trail');
  assert.equal(activeData1.trail.modulos.length, 5);
  console.log(`  -> Trilha ativa: "${activeData1.trail.titulo}" (5 módulos, 25 tópicos)`);

  // 4. Diagnóstico
  console.log('\n[Passo 4] Buscando perguntas do diagnóstico...');
  const diagQRes = await fetch(`${origin}/api/diagnostic/questions`, {
    headers: { Cookie: sessionCookie }
  });
  assert.equal(diagQRes.status, 200);
  const diagQData = await diagQRes.json();
  assert.equal(diagQData.questions.length, 5);
  console.log(`  -> ${diagQData.questions.length} perguntas recebidas.`);

  console.log('\n[Passo 5] Submetendo respostas do diagnóstico e acionando geração por IA...');
  const diagSubmitRes = await fetch(`${origin}/api/diagnostic/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie
    },
    body: JSON.stringify({
      respostas: [
        { question_id: 'diag-q1', selected_option: 1 },
        { question_id: 'diag-q2', selected_option: 2 },
        { question_id: 'diag-q3', selected_option: 0 },
        { question_id: 'diag-q4', selected_option: 1 },
        { question_id: 'diag-q5', selected_option: 3 }
      ]
    })
  });
  assert.equal(diagSubmitRes.status, 201);
  const diagSubmitData = await diagSubmitRes.json();
  console.log(`  -> Diagnóstico avaliado: nível ${diagSubmitData.diagnostic.nivelSugerido || diagSubmitData.diagnostic.nivel_sugerido}, pontuação: ${diagSubmitData.diagnostic.pontuacaoTotal || diagSubmitData.diagnostic.pontuacao_total}%`);
  console.log(`  -> Trilha personalizada proposta gerada pela IA: "${diagSubmitData.proposed_trail.trail.titulo}"`);
  assert.equal(diagSubmitData.proposed_trail.status, 'proposta');
  assert.equal(diagSubmitData.proposed_trail.trail.modulos.length, 5);
  const proposedTrailId = diagSubmitData.proposed_trail.id;

  // 5. Comparação Lado a Lado
  console.log('\n[Passo 6] Comparando trilhas lado a lado em /api/trails/options...');
  const optionsRes = await fetch(`${origin}/api/trails/options`, {
    headers: { Cookie: sessionCookie }
  });
  assert.equal(optionsRes.status, 200);
  const optionsData = await optionsRes.json();
  assert.ok(optionsData.default_trail);
  assert.ok(optionsData.proposed_trail);
  assert.equal(optionsData.active_trail_source, 'default', 'A trilha ativa ainda deve ser default antes da escolha');
  console.log('  -> Opções comparativas entregues com sucesso.');

  // 6. Escolha da Trilha Personalizada
  console.log('\n[Passo 7] Escolhendo e ativando a trilha personalizada gerada pela IA...');
  const chooseRes = await fetch(`${origin}/api/trails/choose`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie
    },
    body: JSON.stringify({
      choice: 'custom',
      custom_trail_id: proposedTrailId
    })
  });
  assert.equal(chooseRes.status, 200);
  const chooseData = await chooseRes.json();
  assert.equal(chooseData.source, 'custom');
  assert.equal(chooseData.custom_trail_id, proposedTrailId);
  console.log(`  -> Trilha personalizada ativada: source=${chooseData.source}, ID=${chooseData.custom_trail_id}`);

  // 7. Progresso - Concluindo Tópico
  console.log('\n[Passo 8] Concluindo o primeiro tópico da trilha ativa...');
  const firstTopicId = chooseData.trail.modulos[0].topicos[0].id;
  const topicRes = await fetch(`${origin}/api/trails/progress/topic`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie
    },
    body: JSON.stringify({ topicId: firstTopicId })
  });
  assert.equal(topicRes.status, 200);
  const topicData = await topicRes.json();
  assert.ok(topicData.completed_topics.includes(firstTopicId));
  console.log(`  -> Tópico "${firstTopicId}" concluído com sucesso.`);

  // 8. Chat com o Tutor IA
  console.log('\n[Passo 9] Enviando mensagem geral de dúvidas para o Tutor IA...');
  const msg1Res = await fetch(`${origin}/api/tutor/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie
    },
    body: JSON.stringify({
      message: 'Olá, Tutor! Você pode me recomendar livros e canais no YouTube para me aprofundar no primeiro módulo da minha trilha?'
    })
  });
  assert.equal(msg1Res.status, 201);
  const msg1Data = await msg1Res.json();
  assert.equal(msg1Data.user_message.role, 'user');
  assert.equal(msg1Data.assistant_message.role, 'assistant');
  assert.ok(msg1Data.assistant_message.content.length > 50);
  console.log(`  -> Resposta do Tutor (${msg1Data.assistant_message.content.length} caracteres):`);
  console.log(`     "${msg1Data.assistant_message.content.slice(0, 150)}..."`);

  // 9. Detecção de Dor Específica pelo Tutor
  console.log('\n[Passo 10] Enviando mensagem expressando dor específica de gestão de equipes...');
  const msg2Res = await fetch(`${origin}/api/tutor/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie
    },
    body: JSON.stringify({
      message: 'Tutor, estou com uma dificuldade muito específica: não consigo gerir minha equipe de desenvolvedores e há muitos conflitos internos sobre prazos e prioridades.'
    })
  });
  assert.equal(msg2Res.status, 201);
  const msg2Data = await msg2Res.json();
  console.log(`  -> Dor detectada: ${msg2Data.pain_detected}`);
  console.log(`  -> Descrição da dor: ${msg2Data.pain_description}`);
  if (msg2Data.proposed_trail) {
    console.log(`  -> Nova proposta de trilha gerada: "${msg2Data.proposed_trail.trail.titulo}" (status: ${msg2Data.proposed_trail.status}, origem: ${msg2Data.proposed_trail.origem_gatilho})`);
    assert.equal(msg2Data.proposed_trail.status, 'proposta');
    assert.equal(msg2Data.proposed_trail.origem_gatilho, 'tutor');
    assert.equal(msg2Data.proposed_trail.trail.modulos.length, 5);

    // 10. Aceitação da Nova Proposta do Tutor
    console.log('\n[Passo 11] Aceitando a nova proposta do Tutor IA...');
    const acceptRes = await fetch(`${origin}/api/tutor/proposals/${msg2Data.proposed_trail.id}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie
      },
      body: JSON.stringify({ decision: 'accept' })
    });
    assert.equal(acceptRes.status, 200);
    const acceptData = await acceptRes.json();
    assert.equal(acceptData.decision, 'accept');
    assert.equal(acceptData.active_trail.source, 'custom');
    assert.equal(acceptData.active_trail.custom_trail_id, msg2Data.proposed_trail.id);
    console.log(`  -> Nova trilha ativada com sucesso! Trilha anterior foi arquivada.`);
  }

  // 11. Histórico do Chat
  console.log('\n[Passo 12] Consultando histórico completo do chat...');
  const histRes = await fetch(`${origin}/api/tutor/history`, {
    headers: { Cookie: sessionCookie }
  });
  assert.equal(histRes.status, 200);
  const histData = await histRes.json();
  assert.ok(histData.messages.length >= 4);
  console.log(`  -> ${histData.messages.length} mensagens no histórico persistidas e recuperadas em ordem.`);

  console.log('\n====================================================');
  console.log('TODOS OS 12 PASSOS DO FLUXO COMPLETO PASSARAM COM SUCESSO!');
  console.log('====================================================');

} finally {
  await new Promise((resolve) => server.close(resolve));
  console.log('[E2E] Servidor de teste encerrado.');
}
