/**
 * @typedef {Object} Question
 * @property {string} id - ID estável da pergunta (ex: "default-m1-q1")
 * @property {string} enunciado - Texto da pergunta
 * @property {string[]} alternativas - Lista com 4 alternativas
 * @property {number} respostaCorreta - Índice (0..3) da alternativa correta
 * @property {string} [explicacao] - Explicação pedagógica da resposta
 *
 * @typedef {Object} Assessment
 * @property {string} id - ID estável da avaliação (ex: "default-m1-assessment")
 * @property {string} titulo - Título da avaliação
 * @property {Question[]} perguntas - Exatamente 5 perguntas
 *
 * @typedef {Object} Topic
 * @property {string} id - ID estável do tópico (ex: "default-m1-t1")
 * @property {string} titulo - Título do tópico
 * @property {string} descricao - Resumo do que será aprendido
 * @property {number} ordem - Posição ordinal no módulo (1 a 5)
 * @property {string} [conteudo] - Conteúdo detalhado ou diretrizes de estudo
 *
 * @typedef {Object} Module
 * @property {string} id - ID estável do módulo (ex: "default-m1")
 * @property {string} titulo - Nome do módulo
 * @property {string} descricao - Descrição do escopo do módulo
 * @property {number} ordem - Posição ordinal na trilha (1 a 5)
 * @property {Topic[]} topicos - Exatamente 5 tópicos
 * @property {Assessment} avaliacao - Avaliação do módulo contendo exatamente 5 perguntas
 *
 * @typedef {Object} Trail
 * @property {string} id - ID único da trilha ("default-trail" ou ObjectId em string)
 * @property {string} slug - Identificador amigável para URL
 * @property {string} titulo - Nome da trilha
 * @property {string} descricao - Apresentação da trilha
 * @property {Module[]} modulos - Exatamente 5 módulos
 */

export {};
