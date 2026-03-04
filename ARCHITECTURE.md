# 🏗️ Arquitetura do Sistema

## Visão Geral da Aplicação

```
┌─────────────────────────────────────────────────────────────┐
│                    Navegador Web                            │
│  (Chrome, Firefox, Safari, Edge)                            │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/HTTPS
                     │
        ┌────────────▼────────────┐
        │                         │
        │  Frontend (React + Vite)│
        │  :5173                  │
        │                         │
        │ ├─ Pages                │
        │ │  ├─ Login             │
        │ │  ├─ Dashboard         │
        │ │  ├─ Submit Payment    │
        │ │  ├─ Validate          │
        │ │  └─ Process           │
        │ │                       │
        │ ├─ Components           │
        │ ├─ Services (Axios)     │
        │ ├─ Store (Jotai)        │
        │ └─ Hooks                │
        │                         │
        └────────────┬────────────┘
                     │ REST API (JSON)
                     │ Authorization: Bearer JWT
                     │
        ┌────────────▼────────────────────┐
        │                                 │
        │  Backend (Node + Express)       │
        │  :3000                          │
        │                                 │
        │ Routes                          │
        │  GET  /api/auth/register        │
        │  POST /api/auth/login           │
        │  GET  /api/auth/me              │
        │  POST /api/payments/submit      │
        │  POST /api/payments/validate    │
        │  POST /api/payments/process     │
        │  GET  /api/payments             │
        │  GET  /api/payments/:id         │
        │                                 │
        │ Middleware                      │
        │  ├─ Auth (JWT)                  │
        │  ├─ Error Handling              │
        │  └─ CORS                        │
        │                                 │
        │ Services                        │
        │  ├─ Auth Service                │
        │  └─ Payment Service             │
        │                                 │
        │ Controllers                     │
        │  ├─ Auth Controller             │
        │  └─ Payment Controller          │
        │                                 │
        │ Database Queries                │
        │  ├─ User Queries                │
        │  ├─ Payment Request Queries     │
        │  ├─ Workflow Queries            │
        │  └─ Audit Log Queries           │
        │                                 │
        └────────────┬────────────────────┘
                     │ pg (PostgreSQL Driver)
                     │
        ┌────────────▼─────────────────────┐
        │                                  │
        │  PostgreSQL Database             │
        │  :5432                           │
        │                                  │
        │  Tables                          │
        │  ├─ users                        │
        │  │  └─ id, email, name, dept    │
        │  │                               │
        │  ├─ payment_requests             │
        │  │  └─ id, status, amount, etc  │
        │  │                               │
        │  ├─ payment_workflows            │
        │  │  └─ id, action, status_from  │
        │  │     status_to, comments      │
        │  │                               │
        │  ├─ audit_logs                   │
        │  │  └─ para LGPD                │
        │  │                               │
        │  └─ gdpr_consents                │
        │     └─ para LGPD                │
        │                                  │
        └──────────────────────────────────┘
```

## Fluxo de Requisição

```
Usuário Login
    │
    ├─→ Frontend: LoginPage
    │   └─→ POST /api/auth/login
    │
    └─→ Backend: authController.login()
        ├─→ authService.loginUser()
        │   ├─→ getUserByEmail()
        │   ├─→ comparePassword()
        │   ├─→ generateToken()
        │   └─→ updateLastLogin() [Auditoria]
        │
        └─→ Response: { token, user }
            └─→ localStorage.setItem('token')
```

## Fluxo de Pagamento

```
Submissão da Requisição
    │
    ├─→ Frontend: SubmitPaymentPage
    │   └─→ POST /api/payments/submit (multipart/form-data)
    │
    └─→ Backend: paymentController.submitPaymentRequest()
        ├─→ paymentService.submitPaymentRequest()
        │   ├─→ createPaymentRequest() [DB]
        │   ├─→ createWorkflowEntry() [DB]
        │   ├─→ createAuditLog() [DB - LGPD]
        │   └─→ Status: pendente_validacao
        │
        └─→ Response: { payment_request }
            └─→ Frontend: atualiza lista


Validação da Requisição
    │
    ├─→ Frontend: ValidatePage
    │   └─→ POST /api/payments/validate
    │       ├─ payment_request_id
    │       ├─ approved (true/false)
    │       └─ comments
    │
    └─→ Backend: paymentController.validatePaymentRequest()
        ├─→ paymentService.validatePaymentRequest()
        │   ├─→ updatePaymentRequestStatus() [DB]
        │   │   └─ Status: validado ou rejeitado
        │   ├─→ createWorkflowEntry() [DB]
        │   └─→ createAuditLog() [DB - LGPD]
        │
        └─→ Response: { payment_request }


Processamento de Pagamento
    │
    ├─→ Frontend: ProcessPaymentPage
    │   └─→ POST /api/payments/process
    │       ├─ payment_request_id
    │       ├─ transaction_id
    │       └─ payment_date
    │
    └─→ Backend: paymentController.processPayment()
        ├─→ paymentService.processPayment()
        │   ├─→ updatePaymentRequestStatus() [DB]
        │   │   ├─ Status: em_pagamento
        │   │   └─ Status: pago
        │   ├─→ createWorkflowEntry() x2 [DB]
        │   └─→ createAuditLog() [DB - LGPD]
        │
        └─→ Response: { payment_request }
```

## Autenticação e Autorização

```
Login
│
├─→ POST /api/auth/login
│   └─ Retorna: token JWT
│
└─→ localStorage.setItem('token')


Requisição Autenticada
│
├─→ GET request header
│   └─ Authorization: Bearer <token>
│
├─→ Backend authMiddleware()
│   ├─→ Extrai token do header
│   ├─→ verifyToken()
│   ├─→ Decodifica JWT
│   └─→ Adiciona user ao req
│
└─→ requireDepartment() middleware
    └─→ Valida departamento do usuário


Departamentos (RBAC)
│
├─ submissao: Pode submeter requisições
├─ validacao: Pode validar e rejeitar
└─ financeiro: Pode processar pagamentos
```

## Segurança (LGPD)

```
Dados Pessoais
│
├─→ Senhas
│   └─ bcryptjs com 10 rounds
│
├─→ Logs de Ação
│   └─ audit_logs table [Auditoria]
│
├─→ IP e User-Agent
│   └─ Registrados em audit_logs
│
├─→ Consentimento
│   └─ gdpr_consents table
│
└─→ Retenção
    └─ Configurado no backend
```

## Estrutura de Pastas Detalhada

```
E:\APP\WORKFLOW\
│
├── backend/                          # Servidor Node.js + Express
│   ├── src/
│   │   ├── server.ts                # Entrada principal
│   │   │
│   │   ├── config/
│   │   │   ├── environment.ts       # Variáveis de ambiente
│   │   │   └── database.ts          # Configuração PostgreSQL
│   │   │
│   │   ├── database/
│   │   │   ├── migrations.ts        # Inicializar tabelas
│   │   │   └── queries.ts           # Todas as queries SQL
│   │   │
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.ts        # /api/auth
│   │   │   └── paymentRoutes.ts     # /api/payments
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.ts    # Lógica HTTP de auth
│   │   │   └── paymentController.ts # Lógica HTTP de pagamentos
│   │   │
│   │   ├── services/
│   │   │   ├── authService.ts       # Lógica de negócio (auth)
│   │   │   └── paymentService.ts    # Lógica de negócio (payments)
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT + RBAC
│   │   │   └── errorHandler.ts      # Error handling
│   │   │
│   │   └── utils/
│   │       ├── logger.ts            # Logging (Pino)
│   │       ├── password.ts          # bcryptjs
│   │       └── jwt.ts               # JWT
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                         # Configurações
│   ├── .eslintrc.json
│   └── README.md
│
├── frontend/                         # Aplicação React + Vite
│   ├── src/
│   │   ├── main.tsx                 # Entrada React
│   │   ├── App.tsx                  # Roteamento principal
│   │   ├── index.css                # Estilos globais
│   │   │
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx        # Login
│   │   │   ├── DashboardPage.tsx    # Dashboard
│   │   │   └── SubmitPaymentPage.tsx# Submeter pagamento
│   │   │
│   │   ├── components/
│   │   │   ├── Header.tsx           # Cabeçalho
│   │   │   ├── Sidebar.tsx          # Navegação
│   │   │   ├── ProtectedRoute.tsx   # Guard de rotas
│   │   │   └── ...
│   │   │
│   │   ├── services/
│   │   │   ├── api.ts               # Cliente Axios
│   │   │   ├── authService.ts       # Chamadas auth
│   │   │   └── paymentService.ts    # Chamadas payments
│   │   │
│   │   ├── store/
│   │   │   └── index.ts             # Estado global (Jotai)
│   │   │
│   │   ├── hooks/
│   │   │   └── useAuth.ts           # Custom hook auth
│   │   │
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces
│   │   │
│   │   └── utils/
│   │       └── ...
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   ├── .eslintrc.json
│   └── README.md
│
├── docker-compose.yml               # Docker Compose (PostgreSQL)
├── README.md                         # Overview
├── INSTALLATION.md                   # Guia de instalação
├── QUICK_START.md                    # Quick start
├── PROJECT_SUMMARY.md                # Sumário técnico
└── ARCHITECTURE.md                   # Este arquivo
```

## Tecnologias e Versões

**Linguagens**
- TypeScript 5.1+
- JavaScript ES2020+

**Backend**
- Node.js 18+
- Express 4.18
- PostgreSQL 15
- JWT (jsonwebtoken 9.0)
- bcryptjs 2.4
- Joi 17.9 (Validações)
- Multer 1.4 (Upload)
- Pino 8.14 (Logging)

**Frontend**
- React 18.2
- Vite 5.0
- Tailwind CSS 3.4
- Axios 1.6
- Jotai 2.6 (Estado)
- React Router 6.20

**Desenvolvimento**
- ESLint 8.x
- Jest 29.x
- Docker & Docker Compose

## Fluxo de Dados

```
Componente React
    │
    ├─→ useAuth hook ou useAtom
    │
    ├─→ Jotai Atom (estado global)
    │
    └─→ Service (api call)
        │
        ├─→ Axios com interceptor
        │   └─ Adiciona token JWT
        │
        └─→ Backend API
            │
            ├─→ authMiddleware
            │   └─ Valida token
            │
            ├─→ requireDepartment
            │   └─ Valida departamento
            │
            ├─→ Controller
            │   └─ Processa req
            │
            ├─→ Service
            │   └─ Lógica de negócio
            │
            └─→ Database Queries
                └─ PostgreSQL
                    │
                    ├─ Retorna dados
                    │
                    └─ Cria audit log
```

---

**Sistema moderna, escalável e seguro para gestão de fluxos de pagamento!** 🚀
