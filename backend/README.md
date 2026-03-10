# Backend - Sistema de Workflow de Pagamentos

## Descrição

Backend Node.js + TypeScript para gerenciamento de fluxo de requisições de pagamento com validação de notas fiscais e boletos, atendendo LGPD e legislações brasileiras.

## Pré-requisitos

- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

## Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de exemplo de ambiente
cp .env.example .env

# Configurar variáveis de ambiente
# Editar .env com suas credenciais do banco de dados
```

## Configuração

### Variáveis de Ambiente

```env
DATABASE_URL=postgresql://user:password@localhost:5432/workflow_pagamentos
JWT_SECRET=seu_jwt_secret_muito_seguro_aqui
NODE_ENV=development
PORT=3000
CORS_ALLOWED_ORIGINS=http://localhost:5173
TRUST_PROXY=false
HEALTHCHECK_DB_TIMEOUT_MS=3000
```

### Banco de Dados

O banco de dados é criado automaticamente ao iniciar o servidor. As tabelas incluem:

- `users` - Usuários dos 3 departamentos
- `payment_requests` - Requisições de pagamento
- `payment_workflows` - Histórico de transições de status
- `audit_logs` - Log de auditoria (LGPD)
- `gdpr_consents` - Consentimentos LGPD

## Comandos

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar servidor de produção
npm start

# Type checking
npm run typecheck

# Lint
npm run lint

# Testes
npm run test
```

## API Endpoints

### Autenticação

- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obter dados do usuário autenticado

### Requisições de Pagamento

- `POST /api/payments/submit` - Submeter nova requisição (departamento: submissao)
- `POST /api/payments/validate` - Validar requisição (departamento: validacao)
- `POST /api/payments/process` - Processar pagamento (departamento: financeiro)
- `GET /api/payments` - Listar requisições
- `GET /api/payments/{id}` - Obter détalhes de uma requisição
- `GET /api/payments/dashboard/stats` - Estatísticas do dashboard

### Saúde da Aplicação (Fase 3F)

- `GET /health` - Health check básico
- `GET /health/live` - Liveness probe (uptime/processo)
- `GET /health/ready` - Readiness probe (valida banco com timeout)

## Autenticação

A API usa JWT para autenticação. Incluir no header:

```
Authorization: Bearer <token>
```

## Departamentos

- **submissao** - Pode submeter requisições de pagamento
- **validacao** - Pode aprovar ou rejeitar requisições
- **financeiro** - Pode processar pagamentos confirmados

## Documentação

A documentação Swagger está disponível em `/api-docs`

## Segurança e LGPD

- Senhas são hasheadas com bcrypt
- Tokens JWT com expiração configurável
- Log de auditoria para todas as ações
- Dados criptografados em trânsito (HTTPS em produção)
- Consentimento LGPD registrado
- CORS restrito por `CORS_ALLOWED_ORIGINS` em produção
- Validação de `JWT_SECRET` forte em produção (>= 32 chars)

## Governança de Dados (Retenção + Integridade)

Em produção, o backend pode executar um ciclo automático de governança para:

- remover arquivos antigos de `uploads` com base na retenção configurada;
- manter apenas metadados da requisição no banco (`document_url` é marcado como removido por retenção);
- validar referências recentes de upload e registrar alertas de integridade em `audit_logs`;
- limpar registros expirados de exportação LGPD (`personal_data_exports`).

Variáveis relacionadas:

- `DATA_GOVERNANCE_ENABLED` (opcional; padrão: `true` em produção)
- `DATA_GOVERNANCE_INTERVAL_HOURS` (padrão: `24`)
- `PAYMENT_DOCUMENT_RETENTION_YEARS` (padrão: `10`)
- `DATA_RETENTION_BATCH_SIZE` (padrão: `200`)
- `INTEGRITY_SCAN_DAYS` (padrão: `30`)
