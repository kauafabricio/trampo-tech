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
