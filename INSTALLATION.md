# Guia de Instalação e Configuração

## Requisitos Mínimos

- Node.js 18+ (https://nodejs.org/)
- Docker e Docker Compose (https://www.docker.com/)
- ou PostgreSQL 12+ instalado localmente

## Passos de Instalação

### 1. Clonar/Extrair o Projeto

```bash
cd E:\APP\WORKFLOW
```

### 2. Configurar o Banco de Dados

#### Opção A: Using Docker Compose (Recomendado)

```bash
docker-compose up -d
```

Isso irá iniciar:
- PostgreSQL em localhost:5432
- pgAdmin em http://localhost:5050

#### Opção B: PostgreSQL Local

Criar banco de dados:
```sql
CREATE DATABASE workflow_pagamentos;
```

Atualizar .env no backend com suas credenciais.

### 3. Instalar Backend

```bash
cd backend
npm install
npm run dev
```

Backend estará em: http://localhost:3000
Documentação API: http://localhost:3000/api-docs

### 4. Instalar Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend estará em: http://localhost:5173

## Testar a Aplicação

1. Abrir http://localhost:5173
2. Login com uma das credenciais:
   - Email: submissao@empresa.com | Senha: DemoPass@123
   - Email: validacao@empresa.com | Senha: DemoPass@123
   - Email: financeiro@empresa.com | Senha: DemoPass@123

## Troubleshooting

### Erro de conexão ao banco de dados

- Verificar se PostgreSQL está rodando
- Verificar variáveis de ambiente em .env
- Para Docker: `docker-compose logs postgres`

### Porta já em uso

- Backend (3000): `lsof -i :3000` (macOS/Linux) ou `netstat -ano | findstr :3000` (Windows)
- Frontend (5173): `lsof -i :5173` (macOS/Linux) ou `netstat -ano | findstr :5173` (Windows)

### Limpar tudo

```bash
# Parar containers
docker-compose down

# Remover volumes (limpar dados)
docker-compose down -v

# Reinstalar dependências
rm -rf backend/node_modules frontend/node_modules
npm install
```

## Estrutura de Pastas

```
workflow-pagamentos/
├── backend/              # Servidor Node.js
│   ├── src/
│   │   ├── server.ts
│   │   ├── config/      # Configurações
│   │   ├── database/    # Queries e Migrations
│   │   ├── types/       # Type Definitions
│   │   ├── routes/      # Rotas da API
│   │   ├── controllers/ # Controladores
│   │   ├── services/    # Lógica de negócio
│   │   ├── middleware/  # Middlewares
│   │   └── utils/       # Utilitários
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── frontend/            # Aplicação React
│   ├── src/
│   │   ├── pages/       # Páginas
│   │   ├── components/  # Componentes
│   │   ├── services/    # Serviços de API
│   │   ├── store/       # Estado global
│   │   ├── hooks/       # Custom hooks
│   │   ├── types/       # Type Definitions
│   │   └── utils/       # Utilitários
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docs/                # Documentação
├── docker-compose.yml   # Docker compose
└── README.md
```

## Variáveis de Ambiente Importantes

### Backend (.env)

- `DATABASE_URL`: String de conexão PostgreSQL
- `JWT_SECRET`: Chave para assinar tokens JWT
- `NODE_ENV`: development/production
- `PORT`: Porta do servidor

### Frontend (.env opcional)

- `VITE_API_URL`: URL da API backend

## Próximas Etapas

- [ ] Implementar todas as páginas (validação, processamento, histórico)
- [ ] Adicionar testes automatizados (Jest, React Testing Library)
- [ ] Configurar CI/CD (GitHub Actions)
- [ ] Deploy em produção (Vercel, Railway, etc)
- [ ] Adicionar notificações por email
- [ ] Implementar relatórios e exportação de dados
- [ ] Melhorar segurança (CORS, rate limiting, etc)
