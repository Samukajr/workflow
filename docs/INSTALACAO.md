# Guias de Instalação

## 📋 Pré-requisitos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 ou **yarn**
- **PostgreSQL** >= 13
- **Git**
- **Docker** e **Docker Compose** (opcional)

## 🚀 Instalação Local

### Passo 1: Clonar/Preparar o Repositório

```bash
# Navegue até a pasta do projeto
cd E:\APP\WORKFLOW
```

### Passo 2: Instalar Dependências

```bash
# Instalar dependências do monorepo
npm install

# Ou se preferir usar yarn
yarn install
```

### Passo 3: Configurar Banco de Dados

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas credenciais PostgreSQL
```

**Exemplo de .env:**
```env
BACKEND_PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=workflow_user
DB_PASSWORD=sua_senha_aqui
DB_NAME=workflow_db
JWT_SECRET=sua_chave_secreta_muito_longa_aqui
```

### Passo 4: Executar Migrações do Banco de Dados

```bash
# Navegue até a pasta do backend
cd packages/backend

# Execute as migrações Prisma
npx prisma migrate dev

# (Opcional) Popular com dados de exemplo
npx prisma db seed
```

### Passo 5: Iniciar os Serviços

**Terminal 1 - Backend:**
```bash
cd packages/backend
npm run dev
# Servidor rodará em http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd packages/frontend
npm run dev
# Aplicação rodará em http://localhost:5173
```

## 🐳 Instalação com Docker

### Passo 1: Verificar Docker

```bash
docker --version
docker-compose --version
```

### Passo 2: Preparar Variáveis de Ambiente

```bash
cp .env.example .env
```

### Passo 3: Iniciar Containers

```bash
# Na raiz do projeto
docker-compose up -d

# Ou para ver os logs
docker-compose up
```

### Passo 4: Executar Migrações

```bash
docker-compose exec backend npm run migrate
```

A aplicação estará disponível em:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **Banco de Dados**: localhost:5432

## 🔧 Parar os Serviços

```bash
# Local
Ctrl+C (em cada terminal)

# Docker
docker-compose down

# Para remover volumes também
docker-compose down -v
```

## 📚 Próximas Pastas

1. Acessar http://localhost:5173
2. Login com credenciais de teste (conforme seeding)
3. Começar a usar o sistema

## ⚠️ Troubleshooting

### Erro de conexão com banco de dados
- Verifique se PostgreSQL está rodando
- Confirme as credenciais em .env
- Tente criar o banco manualmente: `createdb workflow_db`

### Porta já em uso
- Altere `BACKEND_PORT` ou `FRONTEND_PORT` em .env
- Ou finalize o processo usando a porta: `lsof -i :3000`

### Problemas com node_modules
```bash
rm -rf node_modules package-lock.json
npm install
```

---

Para mais detalhes, consulte [ARQUITETURA.md](./ARQUITETURA.md)
