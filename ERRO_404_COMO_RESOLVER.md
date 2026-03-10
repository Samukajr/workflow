# 🚨 ERRO: Backend não está respondendo!

## ❌ Erro Recebido
```
Failed to load resource: the server responded with a status of 404 ()
api/auth/login:1 Failed to load resource: the server responded with a status of 404 ()
```

## 🎯 Causa
**O backend não está rodando na porta 3000!**

O frontend está tentando conectar ao backend, mas não consegue encontrá-lo.

---

## ✅ Solução - inicieSeja 3 Terminais

### **Terminal 1: PostgreSQL**
```bash
cd e:\APP\WORKFLOW
docker-compose up -d
```

Aguarde 10-15 segundos. Depois continue.

---

### **Terminal 2: Backend** (ESTE É O IMPORTANTE!)

```bash
cd e:\APP\WORKFLOW\backend

# Primeira vez? Execute:
npm install
npm run migrate
npm run fix:login

# Depois sempre:
npm run dev
```

**✅ Quando ver esta mensagem, o backend está pronto:**
```
✅ Connected to PostgreSQL database
🚀 Server listening on port 3000
```

**⚠️ IMPORTANTE: Deixe este terminal aberto!** Não feche, não minimize para a bandeja.

---

### **Terminal 3: Frontend** (Execute SOMENTE após o Terminal 2 estar pronto)

```bash
cd e:\APP\WORKFLOW\packages\frontend
npm install  # Se for primeira vez
npm run dev
```

**Quando ver:**
```
➜  Local:   http://localhost:5173/
```

Está pronto! Acesse esse link.

---

## 🔐 Faça Login Agora

1. Acesse: **http://localhost:5173**
2. Email: `superadmin@empresa.com`
3. Senha: `DemoPass@123`

---

## 🆘 Se Ainda Não Funcionar

### Checklist:

- [ ] Terminal 1: Docker rodando? (vê `docker-compose ps` listando containers)
- [ ] Terminal 2: Backend rodando? (vê mensagem "🚀 Server listening on port 3000")
- [ ] Terminal 3: Frontend rodando? (vê mensagem "Local: http://localhost:5173")
- [ ] Navegador: Limpou cache? (Ctrl+Shift+Delete)
- [ ] Navegador: Fez force refresh? (Ctrl+F5)

### Se Backend diz "Connection refused":
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps

# Se não estiver:
cd e:\APP\WORKFLOW
docker-compose up -d
```

### Se Backend falha ao rodar:
```bash
cd e:\APP\WORKFLOW\backend

# Limpar e reinstalar
rm -r node_modules package-lock.json
npm install
npm run dev
```

---

## 📺 O que Deveria Ver no Terminal 2 (Backend):

```
$ npm run dev

> workflow-pagamentos-backend@1.0.0 dev
> ts-node-dev --respawn src/server.ts

[INFO 10:30:15] src/server.ts - ✅ Connected to PostgreSQL database
[INFO 10:30:15] src/server.ts - 🚀 Server listening on port 3000
```

Se não ver isso, o backend não está pronto!

---

## 🎯 Resumo Rápido

**Você precisa:**
1. Terminal 1: `docker-compose up -d`
2. Terminal 2: `npm run dev` (no backend)
3. Terminal 3: `npm run dev` (no frontend)
4. Navegador: http://localhost:5173

**Antes de fazer login, verifique no Terminal 2:**
- Mensagem: "🚀 Server listening on port 3000"

Se vir essa mensagem, o backend está pronto e o login vai funcionar! ✅
