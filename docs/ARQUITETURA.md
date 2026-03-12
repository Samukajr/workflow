# Arquitetura do Sistema

## 📐 Visão Geral

O Workflow de Pagamentos é um sistema moderno desenvolvido com arquitetura em camadas, seguindo princípios de design limpo e escalabilidade.

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│              Vite + TypeScript + Tailwind CSS            │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────────┐
│              Backend (Node.js + Express)                 │
│      TypeScript + Prisma + PostgreSQL Integration       │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│          Banco de Dados (PostgreSQL)                     │
│          Dados, Auditoria, Compliance                    │
└─────────────────────────────────────────────────────────┘
```

## 🏗️ Estrutura de Diretórios

```
workflow/
├── backend/                     # API REST principal
│   ├── src/
│   │   ├── server.ts           # Entry point
│   │   ├── config/             # Configurações (DB, JWT, etc)
│   │   ├── middleware/         # Express middleware
│   │   ├── routes/             # Rotas da API
│   │   ├── controllers/        # Lógica de requisições
│   │   ├── services/           # Lógica de negócios
│   │   ├── utils/              # Funções auxiliares
│   │   └── types/              # Tipos TypeScript
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── packages/frontend/           # Aplicação React
│   ├── src/
│   │   ├── components/          # Componentes reutilizáveis
│   │   ├── pages/               # Páginas da aplicação
│   │   ├── store/               # Estado global (Zustand)
│   │   ├── services/            # Chamadas à API
│   │   ├── types/               # Tipos TypeScript
│   │   ├── App.tsx              # Componente principal
│   │   ├── main.tsx             # Entry point
│   │   └── index.css            # Estilos globais
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                        # Documentação
├── .env.example                 # Variáveis de ambiente
├── .gitignore
├── docker-compose.yml
├── package.json
└── README.md
```

## 🔄 Fluxo de Dados

### Submissão de Requisição

```
Departamento X
      ↓
[Upload NF + Boleto] (Frontend)
      ↓
POST /api/requisicoes (Backend)
      ↓
Prisma → PostgreSQL
      ↓
[Status: PENDENTE]
```

### Validação

```
Departamento Validação
      ↓
[Lista Requisições] (Frontend)
      ↓
GET /api/validacoes (Backend)
      ↓
Análise do documento
      ↓
POST /api/validacoes/:id/aprovar (ou rejeitar)
      ↓
Prisma → PostgreSQL
      ↓
[Status: VALIDADA ou REJEITADA]
```

### Pagamento

```
Departamento Financeiro
      ↓
[Lista para Pagar] (Frontend)
      ↓
GET /api/pagamentos (Backend)
      ↓
Efetuar pagamento
      ↓
POST /api/pagamentos/:id/pagar
      ↓
[Status: PAGO]
      ↓
Auditoria logged (LGPD)
```

## 💾 Modelo de Dados

### Tabelas Principais

- **Departamentos**: Define os tipos de departamentos
- **Usuarios**: Usuários do sistema com vínculos de departamento
- **Requisicoes**: Requisições de pagamento
- **Documentos**: Arquivos anexados (NF, Boletos)
- **Validacoes**: Histórico de validações
- **Pagamentos**: Histórico de pagamentos
- **LogsAuditoria**: Rastreamento LGPD

## 🔐 Segurança

### Autenticação
- JWT (JSON Web Tokens)
- Senhas hasheadas com bcrypt
- Refresh tokens para sessões longas

### Autorização
- Controle de acesso por departamento
- Middleware de verificação de permissões
- Roles: SUBMISSAO, VALIDACAO, FINANCEIRO, ADMIN

### Criptografia
- Dados sensíveis criptografados em repouso
- TLS/HTTPS em produção
- Checksum de documentos

## 📋 LGPD e Compliance

- **Auditoria Completa**: Cada ação é registrada
- **Right to be Forgotten**: Política de retenção de dados
- **Data Privacy**: Proteção de dados pessoais (CPF, CNPJ)
- **Encryption**: Dados sensíveis sempre criptografados

## 🔗 Integração com Sistemas Externos

- **Email**: Notificações via SMTP
- **S3/Cloud Storage**: Upload de documentos
- **Gateway de Pagamento**: Integração futura (Stripe, PayPal, etc)

## 🚀 Performance

- Paginação em listagens
- Índices no banco de dados
- Cache de dados frequentes
- Compressão de requisições HTTP

---

Para mais informações, consulte [INSTALACAO.md](./INSTALACAO.md)
