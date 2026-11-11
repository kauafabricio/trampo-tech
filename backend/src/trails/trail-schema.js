import { z } from 'zod';

/**
 * Schema para uma pergunta de avaliação.
 * Cada pergunta possui ID estável, enunciado claro, 4 alternativas e o índice da resposta correta (0 a 3).
 */
export const QuestionSchema = z.object({
  id: z.string().min(1, 'ID da pergunta é obrigatório'),
  enunciado: z.string().min(10, 'Enunciado deve ter pelo menos 10 caracteres'),
  alternativas: z.array(z.string().min(1, 'Alternativa não pode ser vazia'))
    .length(4, 'Cada pergunta deve conter exatamente 4 alternativas'),
  respostaCorreta: z.number().int().min(0).max(3, 'Índice da resposta correta deve ser entre 0 e 3'),
  explicacao: z.string().min(1, 'Explicação pedagógica é recomendada').optional()
});

/**
 * Schema para a avaliação de um módulo.
 * Deve conter exatamente 5 perguntas.
 */
export const AssessmentSchema = z.object({
  id: z.string().min(1, 'ID da avaliação é obrigatório'),
  titulo: z.string().min(3, 'Título da avaliação é obrigatório'),
  perguntas: z.array(QuestionSchema).length(5, 'A avaliação deve conter exatamente 5 perguntas')
});

/**
 * Schema para um tópico de estudo dentro do módulo.
 */
export const TopicSchema = z.object({
  id: z.string().min(1, 'ID do tópico é obrigatório'),
  titulo: z.string().min(3, 'Título do tópico é obrigatório'),
  descricao: z.string().min(10, 'Descrição do tópico deve ter pelo menos 10 caracteres'),
  ordem: z.number().int().min(1, 'Ordem deve ser um número inteiro positivo'),
  conteudo: z.string().optional()
});

/**
 * Schema para um módulo da trilha.
 * Deve conter exatamente 5 tópicos e exatamente 1 avaliação com 5 perguntas.
 */
export const ModuleSchema = z.object({
  id: z.string().min(1, 'ID do módulo é obrigatório'),
  titulo: z.string().min(3, 'Título do módulo é obrigatório'),
  descricao: z.string().min(10, 'Descrição do módulo deve ter pelo menos 10 caracteres'),
  ordem: z.number().int().min(1, 'Ordem deve ser um número inteiro positivo'),
  topicos: z.array(TopicSchema).length(5, 'Cada módulo deve conter exatamente 5 tópicos'),
  avaliacao: AssessmentSchema
});

/**
 * Schema principal da Trilha (padrão ou personalizada).
 * Deve conter exatamente 5 módulos (5 módulos x 5 tópicos x 5 perguntas por avaliação = regra 5x5x5).
 */
export const TrailSchema = z.object({
  id: z.string().min(1, 'ID da trilha é obrigatório'),
  slug: z.string().min(1, 'Slug da trilha é obrigatório'),
  titulo: z.string().min(3, 'Título da trilha é obrigatório'),
  descricao: z.string().min(10, 'Descrição da trilha deve ter pelo menos 10 caracteres'),
  modulos: z.array(ModuleSchema).length(5, 'A trilha deve conter exatamente 5 módulos')
}).superRefine((trail, ctx) => {
  // Valida unicidade de IDs em toda a trilha
  const moduleIds = new Set();
  const topicIds = new Set();
  const questionIds = new Set();

  trail.modulos.forEach((mod, modIdx) => {
    if (moduleIds.has(mod.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `ID de módulo duplicado: "${mod.id}"`,
        path: ['modulos', modIdx, 'id']
      });
    }
    moduleIds.add(mod.id);

    mod.topicos.forEach((top, topIdx) => {
      if (topicIds.has(top.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `ID de tópico duplicado: "${top.id}"`,
          path: ['modulos', modIdx, 'topicos', topIdx, 'id']
        });
      }
      topicIds.add(top.id);
    });

    mod.avaliacao.perguntas.forEach((q, qIdx) => {
      if (questionIds.has(q.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `ID de pergunta duplicado: "${q.id}"`,
          path: ['modulos', modIdx, 'avaliacao', 'perguntas', qIdx, 'id']
        });
      }
      questionIds.add(q.id);
    });
  });
});

/**
 * Valida se uma trilha atende a todos os critérios estruturais e de integridade.
 * @param {unknown} data
 * @returns {{ valid: boolean, errors?: string[] }}
 */
export function validateTrail(data) {
  const result = TrailSchema.safeParse(data);
  if (result.success) {
    return { valid: true };
  }
  return {
    valid: false,
    errors: (result.error.issues || []).map(err => `${err.path.join('.')}: ${err.message}`)
  };
}
