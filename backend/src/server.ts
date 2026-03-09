import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './config/environment';
import { testConnection, closePool } from './config/database';
import { initializeDatabase, seedDatabase } from './database/migrations';
import { createLGPDTables, processDataDeletionQueue } from './database/lgpdMigrations';
import { cleanExpiredTokens } from './database/passwordResetMigrations';
import { runBankingMigrations } from './database/bankingMigrations';
import { verifyEmailConnection } from './services/emailService';
import logger from './utils/logger';
import { errorMiddleware } from './middleware/errorHandler';
import { helmetConfig } from './middleware/helmetConfig';
import { authLimiter, uploadLimiter, generalLimiter } from './middleware/rateLimit';
import { requestLoggerMiddleware } from './middleware/requestLogger';
import authRoutes from './routes/authRoutes';
import paymentRoutes from './routes/paymentRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import bankingRoutes from './routes/bankingRoutes';
import lgpdRoutes from './routes/lgpdRoutes';

const app: Express = express();
const uploadDir = path.isAbsolute(env.UPLOAD_DIR) ? env.UPLOAD_DIR : path.resolve(process.cwd(), env.UPLOAD_DIR);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ============= MIDDLEWARE DE SEGURANÇA =============

// Helmet: Headers de segurança avançados
app.use(helmetConfig);

// CORS: Controle de origem
app.use(cors());

// Logging: Registrar requisições com IP/User-Agent
app.use(requestLoggerMiddleware);

// Rate Limiting: Proteção contra brute force e DDoS
app.use(generalLimiter);

// Parsing: JSON e URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(uploadDir, { dotfiles: 'deny' }));

// ============= SWAGGER SETUP =============

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Workflow de Pagamentos API',
      version: '1.0.0',
      description: 'API para gerenciamento de fluxo de pagamentos com validação de notas fiscais',
    },
    servers: [
      {
        url: env.API_URL,
        description: env.NODE_ENV === 'development' ? 'Development server' : 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ============= ROUTES =============

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/banking', bankingRoutes);
app.use('/api/lgpd', lgpdRoutes);

// ============= ERROR HANDLING =============

app.use(errorMiddleware);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Rota ${req.path} não encontrada`,
  });
});

// ============= SERVER INITIALIZATION =============

async function startServer() {
  try {
    // Testar conexão com banco de dados
    const connected = await testConnection();

    if (!connected) {
      logger.error('Não foi possível conectar ao banco de dados');
      process.exit(1);
    }

    // Inicializar banco de dados
    await createLGPDTables();
    await runBankingMigrations();
    // IMPORTANTE: Seed não é mais executado automaticamente!
    // Execute manualmente apenas no setup inicial: npm run seed

    // Verificar conexão com servidor de email (não-bloqueante)
    verifyEmailConnection().catch((err) => {
      logger.warn('⚠️ Servidor de email não configurado. Recuperação de senha indisponível.');
    });

    // Agendar limpeza de dados deletados (a cada 24 horas)
    if (env.NODE_ENV === 'production') {
      setInterval(() => {
        processDataDeletionQueue().catch((err) => logger.error('Erro no cleanup LGPD:', err));
        cleanExpiredTokens().catch((err) => logger.error('Erro ao limpar tokens:', err));
      }, 24 * 60 * 60 * 1000);
    }

    // Iniciar servidor
    const PORT = env.PORT;

    const server = app.listen(PORT, () => {
      logger.info(`Servidor iniciado em ${env.API_URL}`);
      logger.info(`Documentação Swagger em ${env.API_URL}/api-docs`);
      logger.info(`Ambiente: ${env.NODE_ENV}`);
      logger.info('🔒 Segurança ativada: Rate Limiting + Helmet + LGPD + IP Logging');
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Recebido sinal ${signal}, encerrando servidor...`);

      server.close(async () => {
        await closePool();
        logger.info('Conexões fechadas, servidor encerrado');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Timeout ao encerrar o servidor');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();

export default app;
