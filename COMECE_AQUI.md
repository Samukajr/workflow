# 🚀 Passo a Passo - Iniciar Sistema Completo

## ⚠️ ORDEM IMPORTANTE - Execute Nesta Sequência!

---

## 📍 PASSO 1: PostgreSQL (Docker)

### Terminal 1 - Iniciar Banco de Dados:
```bash
cd e:\APP\WORKFLOW
docker-compose up -d
```

**Aguarde 10-15 segundos** para o PostgreSQL iniciar completamente.

**Verificar se está rodando:**
```bash
docker-compose ps
```

Você deve ver dois containers rodando:
- `workflow_db` (PostgreSQL)
- `workflow_pgadmin` (Interface de admin)

---

## 🔧 PASSO 2: Backend (Cria tabelas e usuários)

### Terminal 2 - Backend:
```bash
cd e:\APP\WORKFLOW\backend

# Instalar dependências (primeira vez)
npm install

# Criar tabelas no banco
npm run migrate

# Corrigir problema de login (criar superadmin)
npm run fix:login

# Iniciar servidor
npm run dev
```

**Quando vir esta mensagem, está funcionando:**
```
✅ Connected to PostgreSQL database
🚀 Server listening on port 3000
```

**Deixe este terminal aberto!**

---

## 🎨 PASSO 3: Frontend (Quando Backend estiver pronto)

### Terminal 3 - Frontend:

Só inicie DEPOIS que o backend estiver rodando (viu a mensagem acima).

```bash
cd e:\APP\WORKFLOW\packages\frontend

# Instalar dependências (primeira vez)
npm install

# Iniciar servidor
npm run dev
```

**Quando vir esta mensagem, está pronto:**
```
 ➜  Local:   http://localhost:5173/
```

---

## ✅ TESTE DE ACESSO

Após tudo estar rodando:

### 1️⃣ **Frontend está acessível?**
- Abra: http://localhost:5173
- Deve ver tela de login

### 2️⃣ **Backend está acessível?**
Abra um novo terminal:
```bash
curl http://localhost:3000/api/auth/login -X OPTIONS
```

Deve retornar headers (sem erro 404)

### 3️⃣ **Banco está funcionando?**
```bash
cd e:\APP\WORKFLOW\backend
npm run users:list
```

Deve listar os usuários criados

---

## 🔐 Agora Faça Login

Com tudo rodando:

1. Acesse: http://localhost:5173/login
2. Use **qualquer uma** destas credenciais:

| Email | Senha |
|-------|-------|
| superadmin@empresa.com | DemoPass@123 |
| admin@empresa.com | DemoPass@123 |
| financeiro@empresa.com | DemoPass@123 |
| validacao@empresa.com | DemoPass@123 |
| submissao@empresa.com | DemoPass@123 |

---

## ❌ Se Erro: "Failed to load resource: the server responded with a status of 404"

**Significa:** Frontend não consegue conectar ao backend!

### Checklist de Troubleshooting:

✅ **1. Backend está rodando?**
```bash
# Ver os logs do backend - deve estar em Terminal 2
# Procure por: "🚀 Server listening on port 3000"
```

❌ Se não vir, volta ao PASSO 2 e execute:
```bash
cd e:\APP\WORKFLOW\backend
npm run dev
```

✅ **2. PostgreSQL está rodando?**
```bash
cd e:\APP\WORKFLOW
docker-compose ps
```

❌ Se não vir containers rodando:
```bash
docker-compose up -d
```

✅ **3. Verifique a porta do Backend:**
```bash
netstat -ano | findstr :3000
```

❌ Se não retornar nada, backend não está rodando.

✅ **4. Limpe cache do navegador:**
- Pressione: `Ctrl+Shift+Delete`
- Selecione: "Cookies e outros dados de site"
- Clique: "Limpar dados"

✅ **5. Força refresh da página:**
- `Ctrl+F5` (ou `Cmd+Shift+R` no Mac)

---

## 📊 Status Esperado Quando Tudo Está Rodando

Você deve ter **3 terminais abertos**:

| Terminal | Serviço | Mensagem |
|----------|---------|----------|
| 1 | PostgreSQL | ✅ Rodando (docker-compose) |
| 2 | Backend | 🚀 Server listening on port 3000 |
| 3 | Frontend | ➜ Local: http://localhost:5173 |

**E no navegador:**
- http://localhost:5173 → Tela de login
- http://localhost:5173/login → Formulário funcional

---

## 🆘 Última Opção - Reiniciar Tudo

Se nada funcionar, reinicie na ordem:

```bash
# Terminal 1
docker-compose down
docker-compose up -d

# Aguarde 15 segundos, depois Terminal 2

# Terminal 2
cd e:\APP\WORKFLOW\backend
npm run migrate
npm run fix:login
npm run dev

# Aguarde backend estar pronto, depois Terminal 3

# Terminal 3
cd e:\APP\WORKFLOW\packages\frontend
npm run dev
```

---

## 🎯 Resumo Rápido

```
┌─────────────────────────────────────┐
│ 1. docker-compose up -d             │ Terminal 1
│ 2. npm run dev (backend)            │ Terminal 2
│ 3. npm run dev (frontend)           │ Terminal 3
│ 4. Acesse http://localhost:5173/    │ Navegador
└─────────────────────────────────────┘
```

Pronto! ✅
