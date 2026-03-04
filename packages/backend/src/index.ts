import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import pinoHttp from 'pino-http';
import { router } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3000;

// ==========================================
// Middleware de Segurança
// ==========================================
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
  credentials: JSON.parse(process.env.CORS_CREDENTIALS || 'true')
}));

// ==========================================
// Middleware de Logging
// ==========================================
app.use(pinoHttp({
  level: process.env.LOG_LEVEL || 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
}));

// ==========================================
// Middleware de Parsing
// ==========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ==========================================
// Health Check
// ==========================================
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==========================================
// Rotas Públicas
// ==========================================
app.use('/api/auth', router.auth);

// ==========================================
// Middleware de Autenticação
// ==========================================
app.use(authMiddleware);

// ==========================================
// Rotas Autenticadas
// ==========================================
app.use('/api/requisicoes', router.requisicoes);
app.use('/api/validacoes', router.validacoes);
app.use('/api/pagamentos', router.pagamentos);
app.use('/api/usuarios', router.usuarios);
app.use('/api/departamentos', router.departamentos);
app.use('/api/relatorios', router.relatorios);

// ==========================================
// Middleware de Tratamento de Erros
// ==========================================
app.use(errorHandler);

// ==========================================
// 404 - Não encontrado
// ==========================================
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ==========================================
// Iniciar servidor
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado em http://localhost:${PORT}`);
  console.log(`📚 Documentação em http://localhost:${PORT}/api-docs`);
});

export default app;
