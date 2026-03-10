# 🚀 Guia Completo - Inicializando o Sistema

## ⚠️ Pré-requisitos

Antes de resolver o problema de login, você precisa ter o **PostgreSQL rodando**.

---

## 📋 OPÇÃO 1: PostgreSQL via Docker (RECOMENDADO)

### Passo 1: Verificar se Docker está instalado
```bash
docker --version
docker-compose --version
```

Se não estiver instalado, [baixe aqui](https://www.docker.com/products/docker-desktop)

### Passo 2: Iniciar PostgreSQL
```bash
cd e:\APP\WORKFLOW
docker-compose up -d
```

### Verificar se está rodando:
```bash
docker-compose ps
```

Você deve ver:
```
CONTAINER ID   IMAGE              STATUS
xxx            postgres:15-alpine  Up 2 minutes
xxx            pgadmin4:latest     Up 2 minutes
```

---

## 📋 OPÇÃO 2: PostgreSQL Local Instalado

Se você já tem PostgreSQL instalado globalmente no Windows:

### Passo 1: Verificar instalação
```bash
psql --version
```

### Passo 2: Conectar ao PostgreSQL
```bash
psql -U postgres -h localhost
```

### Passo 3: Criar banco de dados (se não existir)
```sql
CREATE DATABASE workflow_pagamentos;
```

---

## 🔧 Passo 3: Após o Banco Estar Rodando

### Terminal 1 - Iniciar Backend:
```bash
cd e:\APP\WORKFLOW\backend
npm install  # Se não tiver feito
npm run migrate  # Criar tabelas
npm run fix:login  # Corrigir problema de login
npm run dev  # Iniciar servidor
```

### Terminal 2 - Iniciar Frontend:
```bash
cd e:\APP\WORKFLOW\packages\frontend
npm install  # Se não tiver feito
npm run dev  # Iniciar frontend
```

---

## ✅ Checklist - Antes de Resolver o Login

- [ ] PostgreSQL está rodando (porta 5432)
- [ ] `.env` foi criado com variáveis de banco
- [ ] Backend pode conectar ao banco
- [ ] Frontend está acessível em `http://localhost:5173`

---

## 🔌 Testando Conexão com o Banco

```bash
cd backend
npm run users:list
```

Se funcionar, você verá a lista de usuários.

Se der erro de conexão:
- Verifique se PostgreSQL está rodando
- Verifique as credenciais em `.env`
- Verifique a porta (5432)

---

## 🆘 Troubleshooting

### "Connection refused"
- PostgreSQL não está rodando
- Solução: Inicie com `docker-compose up -d`

### "database does not exist"
- Banco não foi criado
- Solução: Execute `npm run migrate`

### "password authentication failed"
- Credenciais erradas em `.env`
- Verifique DB_USER e DB_PASSWORD

### "ECONNREFUSED 127.0.0.1:5432"
- PostgreSQL não está acessível
- Verifique a porta e se está rodando

---

## 📊 Portas Importantes

| Serviço | Porta | URL |
|---------|-------|-----|
| Backend | 3000 | http://localhost:3000 |
| Frontend | 5173 | http://localhost:5173 |
| PostgreSQL | 5432 | localhost:5432 |
| PgAdmin | 5050 | http://localhost:5050 |

---

## 🔐 Próximo Passo

Após o banco estar rodando e o backend conectado com sucesso:

```bash
npm run fix:login
```

Isso vai criar o superadministrador e outros usuários automaticamente.

---

## 📝 Credenciais Padrão (Após fix:login)

Todos com senha: **DemoPass@123**

| Email | Acesso |
|-------|--------|
| superadmin@empresa.com | ⭐⭐⭐ Total |
| admin@empresa.com | ⭐⭐⭐ Total |
| financeiro@empresa.com | Financeiro |
| validacao@empresa.com | Validação |
| submissao@empresa.com | Submissão |
