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
  validateProfile,
  validateRegistration
} from './validation.js';
import { createAiRouter } from './routes/ai.js';
import { createTrailsRouter } from './routes/trails.js';
import { createDiagnosticRouter } from './routes/diagnostic.js';
import { createUsersRepository } from './repositories/users-repository.js';
import { createCustomTrailsRepository } from './repositories/custom-trails-repository.js';
import { createUserProgressRepository } from './repositories/user-progress-repository.js';
import { createDiagnosticResultsRepository } from './repositories/diagnostic-results-repository.js';
import { AIService } from './services/ai-service.js';
import { TrailService } from './services/trail-service.js';

const SESSION_COOKIE = 'trampotech_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions(production) {
  return {
    httpOnly: true,
    secure: production,
    sameSite: 'lax',
    path: '/api/auth'
  };
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    nome: user.nome,
    email: user.email,
    termosAceitos: user.termosAceitos,
    dataCriacao: user.dataCriacao instanceof Date ? user.dataCriacao.toISOString() : user.dataCriacao,
    trail_source: user.trail_source || 'default',
    custom_trail_id: user.custom_trail_id ? user.custom_trail_id.toString() : null,
    ...(user.trilhaEscolhida ? { trilhaEscolhida: user.trilhaEscolhida } : {})
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

export function createFallbackCollection() {
  const docs = [];
  return {
    async findOne(query) {
      return docs.find(d => {
        for (const [k, v] of Object.entries(query)) {
          const docVal = d[k];
          if (v && typeof v.equals === 'function') {
            if (!docVal || !v.equals(docVal)) return false;
          } else if (docVal && typeof docVal.equals === 'function') {
            if (!v || !docVal.equals(v)) return false;
          } else if (docVal !== v) {
            return false;
          }
        }
        return true;
      }) || null;
    },
    async insertOne(doc) {
      const inserted = { ...doc, _id: doc._id || new ObjectId() };
      docs.push(inserted);
      return { insertedId: inserted._id };
    },
    async updateOne(query, update, options = {}) {
      let doc = await this.findOne(query);
      if (!doc && options.upsert) {
        doc = { _id: new ObjectId(), ...query };
        if (update.$setOnInsert) Object.assign(doc, update.$setOnInsert);
        docs.push(doc);
      }
      if (doc) {
        if (update.$set) {
          for (const [k, v] of Object.entries(update.$set)) {
            const parts = k.split('.');
            if (parts.length === 2) {
              if (!doc[parts[0]]) doc[parts[0]] = {};
              doc[parts[0]][parts[1]] = v;
            } else {
              doc[k] = v;
            }
          }
        }
        if (update.$addToSet) {
          for (const [k, v] of Object.entries(update.$addToSet)) {
            if (!Array.isArray(doc[k])) doc[k] = [];
            if (!doc[k].includes(v)) doc[k].push(v);
          }
        }
        return { matchedCount: 1, modifiedCount: 1 };
      }
      return { matchedCount: 0, modifiedCount: 0 };
    },
    find(query = {}) {
      let sortKey = null;
      let sortDir = 1;
      return {
        sort(sortSpec = {}) {
          const keys = Object.keys(sortSpec);
          if (keys.length > 0) {
            sortKey = keys[0];
            sortDir = sortSpec[sortKey];
          }
          return this;
        },
        async toArray() {
          const filtered = docs.filter(d => {
            for (const [k, v] of Object.entries(query)) {
              const docVal = d[k];
              if (v && typeof v.equals === 'function') {
                if (!docVal || !v.equals(docVal)) return false;
              } else if (docVal && typeof docVal.equals === 'function') {
                if (!v || !docVal.equals(v)) return false;
              } else if (docVal !== v) {
                return false;
              }
            }
            return true;
          });
          if (sortKey) {
            filtered.sort((a, b) => {
              const valA = a[sortKey] instanceof Date ? a[sortKey].getTime() : a[sortKey];
              const valB = b[sortKey] instanceof Date ? b[sortKey].getTime() : b[sortKey];
              if (valA < valB) return -1 * sortDir;
              if (valA > valB) return 1 * sortDir;
              return 0;
            });
          }
          return [...filtered];
        }
      };
    }
  };
}

export function createApp({
  users,
  customTrails,
  userProgress,
  diagnosticResults,
  jwtSecret,
  clientOrigin,
  geminiClient,
  trailService: injectedTrailService,
  production = false
}) {
  if (!users || !jwtSecret || !clientOrigin) {
    throw new Error('Users collection, JWT secret, and client origin are required.');
  }

  // Inicializa serviços e repositórios
  const usersRepo = createUsersRepository(users);
  const customTrailsRepo = createCustomTrailsRepository(customTrails || createFallbackCollection());
  const progressRepo = createUserProgressRepository(userProgress || createFallbackCollection());
  const diagnosticResultsRepo = createDiagnosticResultsRepository(diagnosticResults || createFallbackCollection());

  const aiService = geminiClient ? new AIService({ geminiClient }) : null;

  const trailService = injectedTrailService || new TrailService({
    usersRepo,
    customTrailsRepo,
    progressRepo,
    diagnosticResultsRepo,
    aiService
  });

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

    // Regra: Todo novo usuário começa com a trilha padrão como ativa (trail_source = "default"),
    // sem criar nenhum registro de trilha no banco.
    const user = {
      nome,
      email,
      passwordHash,
      termosAceitos,
      dataCriacao: new Date(),
      trail_source: 'default',
      custom_trail_id: null
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

    const { nome, email, trail_source, custom_trail_id, trilhaEscolhida } = validation.value;
    const duplicate = await users.findOne({
      email: normalizeEmail(email),
      _id: { $ne: req.authUser._id }
    });
    if (duplicate) {
      return sendError(res, 409, 'Já existe uma conta com este e-mail.');
    }

    const setFields = { nome, email };
    if (trail_source) setFields.trail_source = trail_source;
    if (custom_trail_id !== undefined) setFields.custom_trail_id = custom_trail_id;
    if (trilhaEscolhida) setFields.trilhaEscolhida = trilhaEscolhida;

    try {
      await users.updateOne(
        { _id: req.authUser._id },
        { $set: setFields }
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

  app.use('/api/auth', authRouter);

  // Rotas de Trilhas, Comparação e Escolha
  const trailsRouter = createTrailsRouter({ trailService, requireAuth });
  app.use('/api/trails', trailsRouter);

  // Rotas de Avaliação Diagnóstica
  const diagnosticRouter = createDiagnosticRouter({ trailService, requireAuth });
  app.use('/api/diagnostic', diagnosticRouter);

  // Rotas de IA (infraestrutura/ping)
  if (geminiClient) {
    const aiRouter = createAiRouter({ geminiClient, requireAuth });
    app.use('/api/ai', aiRouter);
  }

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
