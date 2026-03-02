# 🚀 GUIA DE DEPLOYMENT - WORKFLOW GRATUITO

## Visão Geral

Este guia descreve como fazer o deploy **COMPLETAMENTE GRATUITO** do sistema Workflow usando:
- **Backend**: Render.com (Node.js + PostgreSQL grátis)
- **Frontend**: Vercel (React + Vite)

Estimativa de tempo: **30-45 minutos** (primeira vez)

---

## 📋 Pré-requisitos

1. **GitHub** - Conta gratuita em https://github.com
2. **Render** - Conta gratuita em https://render.com
3. **Vercel** - Conta gratuita em https://vercel.com

> ⚠️ Todas as plataformas oferecem plano gratuito sem necessidade de cartão de crédito

---

## ✅ PASSO 1: Preparar Repositório GitHub

### 1.1 Criar repositório

```bash
# Abrir repositório no GitHub
# https://github.com/new

# Nome do repositório: "workflow-sgf"
# Descrição: "Sistema de Workflow de Validação e Pagamento de Notas Fiscais"
# Público (para Vercel funcionar melhor)
# Adicionar .gitignore para Node.js
```

### 1.2 Fazer push do código

```bash
cd E:\APP\WORKFLOW-NOVO

git init
git add .
git commit -m "Initial commit: Workflow system ready for deployment"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/workflow-sgf.git
git push -u origin main
```

---

## 🔧 PASSO 2: Deploy Backend no Render

### 2.1 Criar novo serviço

1. Acessar https://render.com/dashboard
2. Clicar em **"New +"** → **"Web Service"**
3. Conectar conta GitHub (autorizar acesso)
4. Selecionar repositório: `workflow-sgf`
5. Preencher configurações:

| Campo | Valor |
|-------|-------|
| **Name** | `workflow-backend` |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Region** | `Oregon (US West)` ou `Frankfurt` |
| **Plan** | `Free` |

### 2.2 Configurar variáveis de ambiente

Na aba **"Environment"**, adicionar:

```bash
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=https://workflow-sgf.vercel.app,https://workflow-backend.onrender.com
ENCRYPTION_KEY=<GERAR_CHAVE_SEGURA>
```

Para gerar `ENCRYPTION_KEY`:

```bash
# No terminal do seu computador:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copiar a saída (ex: a4f8c9d2e1b5f3a7...)
```

### 2.3 Deploy automático

- Render faz deploy automaticamente quando houver push em `main`
- Esperar 3-5 minutos pelo build
- Backend estará disponível em: `https://workflow-backend.onrender.com`

### 2.4 Testar backend

```bash
# Verificar health check
curl https://workflow-backend.onrender.com/health

# Deve retornar:
# {"status":"ok","timestamp":"...","lgpd_compliance":"Em andamento",...}
```

---

## 🎨 PASSO 3: Deploy Frontend no Vercel

### 3.1 Configurar build

Criar `vercel.json` na raiz do projeto:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "env": {
    "VITE_API_URL": "@workflow_api_url"
  }
}
```

### 3.2 Criar no Vercel

1. Acessar https://vercel.com/new
2. Importar repositório GitHub `workflow-sgf`
3. Preencher configurações:

| Campo | Valor |
|-------|-------|
| **Project Name** | `workflow-sgf` |
| **Framework Preset** | `React` |
| **Root Directory** | `./frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 3.3 Variáveis de ambiente

Na aba **"Environment Variables"**:

```bash
VITE_API_URL = https://workflow-backend.onrender.com
```

### 3.4 Deploy

- Clicar em **"Deploy"**
- Esperar 3-5 minutos
- Frontend estará em: `https://workflow-sgf.vercel.app`

---

## 🧪 PASSO 4: Testar Sistema Completo

### 4.1 Acessar aplicação

```
Frontend: https://workflow-sgf.vercel.app
Backend: https://workflow-backend.onrender.com
```

### 4.2 Testar login

```
Email: admin@empresa.com
Senha: 123456
```

### 4.3 Testar funcionalidades

- [ ] Login e logout funcionam
- [ ] Dashboard aparece
- [ ] DEPARTAMENTO consegue submeter requisições
- [ ] VALIDADOR consegue aprovar/rejeitar
- [ ] FINANCEIRO consegue processar pagamentos
- [ ] Logs de auditoria estão sendo registrados

### 4.4 Verificar CORS

Se receber erro **"CORS policy violation"**:

1. Voltar ao Render
2. No backend, editar **"Environment"**
3. Atualizar `ALLOWED_ORIGINS`:

```bash
ALLOWED_ORIGINS=https://workflow-sgf.vercel.app,https://workflow-backend.onrender.com,http://localhost:5173
```

4. Salvar e o Render vai fazer redeploy automaticamente

---

## 📊 PASSO 5: Monitoramento

### Logs do Backend (Render)

1. Dashboard Render → `workflow-backend`
2. Aba **"Logs"** mostra requisições em tempo real
3. Procurar por erros ou CORS violations

### Logs do Frontend (Vercel)

1. Dashboard Vercel → `workflow-sgf`
2. Aba **"Deployments"** mostra histórico
3. Clicar em deployment para ver logs de build

### Verificar saúde do sistema

```bash
# Ver status do backend
curl https://workflow-backend.onrender.com/health

# Ver logs de auditoria
curl https://workflow-backend.onrender.com/api/auditoria/logs
```

---

## 🔄 Atualizações Futuras

### Atualizar código

```bash
# No seu VSCode:
git add .
git commit -m "Descrição da mudança"
git push origin main

# Render + Vercel fazem redeploy AUTOMATICAMENTE
```

### Configuração contínua

- Render redeploy: ~3-5 minutos
- Vercel redeploy: ~1-2 minutos

---

## ⚠️ Limitações do Plano Gratuito

| Recurso | Gratuito | Pago |
|---------|----------|------|
| **Uptime** | 99% | 99.9% |
| **Requisições** | 500K/mês | Ilimitado |
| **Dados** | 256MB PostgreSQL | 10GB+ |
| **Build Time** | 3-5 min | Mais rápido |
| **Armazenamento** | 100MB | 1GB+ |

**Recomendação**: Plano gratuito é excelente para testes. Para produção real, considerar upgrade após validação com diretoria.

---

## 🚨 Problemas Comuns

### "Backend não responde"

```bash
# Solução:
# 1. Verificar Render dashboard
# 2. Checar se app entrou em "sleep" (plano gratuito)
# 3. Clicar em "Wake Up" ou fazer uma requisição curl
```

### "CORS error ao fazer login"

```bash
# Solução:
# 1. Verificar ALLOWED_ORIGINS no Render
# 2. Incluir URL exata do frontend
# 3. Fazer redeploy do backend
```

### "Dados desapareceram depois de horas"

```bash
# Isso é NORMAL no plano gratuito Render
# Solução: Implementar PostgreSQL permanente
# (fácil de fazer, pode ser feito depois)
```

---

## ✨ Próximas Melhorias (Após Validação)

- [ ] Adicionar PostgreSQL persistent
- [ ] Implementar bcrypt para senhas
- [ ] HTTPS automático (já incluído)
- [ ] Backup automático
- [ ] Email notifications
- [ ] Custom domain (seu.dominio.com.br)

---

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs no Render/Vercel
2. Testar localmente: `npm run dev` (backend) + `npm run dev` (frontend)
3. Verificar `.env` files têm valores corretos
4. Confirmar GitHub push foi bem-sucedido

---

**Parabéns! O sistema está pronto para apresentação à diretoria! 🎉**
