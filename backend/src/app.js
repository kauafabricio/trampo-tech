import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import {
  normalizeEmail,
  validateLogin,
  validateDiagnostic,
  validateProfile,
  validateRegistration
} from './validation.js';

const SESSION_COOKIE = 'trampotech_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions(production) {
  return {
    httpOnly: true,
    secure: production,
    sameSite: 'lax',
    path: '/api'
  };
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    nome: user.nome,
    email: user.email,
    termosAceitos: user.termosAceitos,
    dataCriacao: user.dataCriacao.toISOString(),
    trilhaEscolhida: user.trilhaEscolhida
  };
}

function publicDiagnostic(diagnostic) {
  return {
    versaoQuestionario: diagnostic.versaoQuestionario,
    respostas: diagnostic.respostas,
    resultado: diagnostic.resultado,
    criadoEm: diagnostic.criadoEm.toISOString(),
    atualizadoEm: diagnostic.atualizadoEm.toISOString()
  };
}

function issueSession(res, user, jwtSecret, production) {
  const token = jwt.sign({}, jwtSecret, {
    subject: user._id.toString(),
    algorithm: 'HS256',
    expiresIn: '7d'
  });
  res.cookie(SESSION_COOKIE, token, {
    ...cookieOptions(production),
    maxAge: SESSION_DURATION_MS
  });
}

function sendError(res, status, message) {
  return res.status(status).json({ message });
}

export function createApp({ users, diagnoses, jwtSecret, clientOrigin, production = false }) {
  if (!users || !diagnoses || !jwtSecret || !clientOrigin) {
    throw new Error('Users and diagnoses collections, JWT secret, and client origin are required.');
  }

  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin: clientOrigin,
    credentials: true
  }));
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());

  const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Muitas tentativas. Tente novamente em alguns minutos.' }
  });

  const authRouter = express.Router();

  const requireAuth = async (req, res, next) => {
    const token = req.cookies[SESSION_COOKIE];
    if (!token) {
      return sendError(res, 401, 'Autenticação necessária.');
    }

    let payload;
    try {
      payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.clearCookie(SESSION_COOKIE, cookieOptions(production));
        return sendError(res, 401, 'Sessão inválida ou expirada.');
      }
      return next(error);
    }

    if (typeof payload === 'string' || typeof payload.sub !== 'string' || !ObjectId.isValid(payload.sub)) {
      res.clearCookie(SESSION_COOKIE, cookieOptions(production));
      return sendError(res, 401, 'Sessão inválida ou expirada.');
    }

    const user = await users.findOne({ _id: new ObjectId(payload.sub) });
    if (!user) {
      res.clearCookie(SESSION_COOKIE, cookieOptions(production));
      return sendError(res, 401, 'Sessão inválida ou expirada.');
    }

    req.authUser = user;
    return next();
  };

  authRouter.post('/register', authRateLimit, async (req, res) => {
    const validation = validateRegistration(req.body);
    if (validation.error) {
      return sendError(res, 400, validation.error);
    }

    const { nome, email, senha, termosAceitos } = validation.value;
    const passwordHash = await bcrypt.hash(senha, 12);
    const user = {
      nome,
      email,
      passwordHash,
      termosAceitos,
      dataCriacao: new Date(),
      trilhaEscolhida: 'execucao'
    };

    try {
      const result = await users.insertOne(user);
      user._id = result.insertedId;
    } catch (error) {
      if (error?.code === 11000) {
        return sendError(res, 409, 'Já existe uma conta com este e-mail.');
      }
      throw error;
    }

    issueSession(res, user, jwtSecret, production);
    return res.status(201).json({ user: publicUser(user) });
  });

  authRouter.post('/login', authRateLimit, async (req, res) => {
    const validation = validateLogin(req.body);
    if (validation.error) {
      return sendError(res, 400, validation.error);
    }

    const { email, senha } = validation.value;
    const user = await users.findOne({ email });
    if (!user || !(await bcrypt.compare(senha, user.passwordHash))) {
      return sendError(res, 401, 'E-mail ou senha inválidos.');
    }

    issueSession(res, user, jwtSecret, production);
    return res.json({ user: publicUser(user) });
  });

  authRouter.post('/logout', (_req, res) => {
    res.clearCookie(SESSION_COOKIE, cookieOptions(production));
    return res.json({ message: 'Sessão encerrada.' });
  });

  authRouter.get('/me', requireAuth, (req, res) => {
    return res.json({ user: publicUser(req.authUser) });
  });

  authRouter.patch('/me', requireAuth, async (req, res) => {
    const validation = validateProfile(req.body);
    if (validation.error) {
      return sendError(res, 400, validation.error);
    }

    const { nome, email, trilhaEscolhida } = validation.value;
    const duplicate = await users.findOne({
      email: normalizeEmail(email),
      _id: { $ne: req.authUser._id }
    });
    if (duplicate) {
      return sendError(res, 409, 'Já existe uma conta com este e-mail.');
    }

    try {
      await users.updateOne(
        { _id: req.authUser._id },
        { $set: { nome, email, trilhaEscolhida } }
      );
    } catch (error) {
      if (error?.code === 11000) {
        return sendError(res, 409, 'Já existe uma conta com este e-mail.');
      }
      throw error;
    }
    const user = await users.findOne({ _id: req.authUser._id });
    return res.json({ user: publicUser(user) });
  });

  const diagnosisRouter = express.Router();

  diagnosisRouter.get('/', requireAuth, async (req, res) => {
    const diagnostic = await diagnoses.findOne({ userId: req.authUser._id });
    return res.json({ diagnostico: diagnostic ? publicDiagnostic(diagnostic) : null });
  });

  diagnosisRouter.post('/', requireAuth, async (req, res) => {
    const validation = validateDiagnostic(req.body);
    if (validation.error) {
      return sendError(res, 400, validation.error);
    }

    const now = new Date();
    await diagnoses.updateOne(
      { userId: req.authUser._id },
      {
        $set: {
          versaoQuestionario: 1,
          respostas: validation.value.respostas,
          resultado: validation.value.resultado,
          atualizadoEm: now
        },
        $setOnInsert: {
          userId: req.authUser._id,
          criadoEm: now
        }
      },
      { upsert: true }
    );
    const diagnostic = await diagnoses.findOne({ userId: req.authUser._id });
    if (!diagnostic) {
      throw new Error('Saved diagnosis could not be retrieved.');
    }
    return res.status(201).json({ diagnostico: publicDiagnostic(diagnostic) });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/diagnostico', diagnosisRouter);
  app.use((_req, res) => sendError(res, 404, 'Rota não encontrada.'));
  app.use((error, _req, res, _next) => {
    if (error?.type === 'entity.parse.failed') {
      return sendError(res, 400, 'O corpo da requisição não contém JSON válido.');
    }
    console.error('API request failed:', error);
    return sendError(res, 500, 'Ocorreu um erro interno.');
  });

  return app;
}
