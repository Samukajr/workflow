# 🚀 Configuração de Produção - Backend em Vercel

## ⚠️ Problema Encontrado

O frontend está em **produção no Vercel**, mas o backend não está configurado.

**Erro:** 404 ao tentar chamar `/api/login`

---

## ✅ Solução

### PASSO 1: Identificar URL do Backend em Produção

Você precisa me informar onde o backend está deployado:

- ❓ URL do backend: `https://...?`
- ❓ Por exemplo: `https://seu-backend.com` ou `https://api.seu-dominio.com`

### PASSO 2: Atualizar `vercel.json`

Abra `vercel.json` e **substitua** `https://seu-backend-aqui.com` pela URL real do backend:

```json
{
	"$schema": "https://openapi.vercel.sh/vercel.json",
	"installCommand": "npm --prefix packages/frontend install",
	"buildCommand": "npm --prefix packages/frontend run build",
	"outputDirectory": "packages/frontend/dist",
	"rewrites": [
		{
			"source": "/api/(.*)",
			"destination": "https://SEU-BACKEND-AQUI.com/api/$1"
		},
		{
			"source": "/(.*)",
			"destination": "/index.html"
		}
	],
	"env": {
		"VITE_API_URL": "https://SEU-BACKEND-AQUI.com/api"
	}
}
```

**Exemplo:** Se backend está em `https://api.meus-pagamentos.com`:
```json
"destination": "https://api.meus-pagamentos.com/api/$1"
"VITE_API_URL": "https://api.meus-pagamentos.com/api"
```

### PASSO 3: Deploy

Após atualizar:
```bash
git add vercel.json
git commit -m "config: Configurar URL do backend em produção"
git push origin master
```

O Vercel vai fazer redeploy automaticamente.

---

## 🔧 Opção Alternativa: Variáveis de Ambiente

Se preferir usar variáveis de ambiente no Vercel:

### No Dashboard Vercel:
1. Projeto → Settings → Environment Variables
2. Adicione:
   ```
   VITE_API_URL=https://seu-backend.com/api
   ```

### No `vercel.json`:
```json
{
	"rewrites": [
		{
			"source": "/api/(.*)",
			"destination": "$VITE_API_URL/$1"
		}
	]
}
```

---

## 📊 Fluxo de Requisições

```
Frontend (Vercel)
    ↓
    POST /api/auth/login
    ↓
Vercel Rewrite
    ↓
Backend (https://seu-backend.com/api/auth/login)
    ↓
Resposta (token JWT)
```

---

## 🆘 Próximas Informações Necessárias

Me informar:
1. ✅ URL do backend em produção
2. ✅ Porta do backend (se não for padrão)
3. ✅ Se o backend está protegido por CORS

Quando tiver, posso atualizar o `vercel.json` corretamente!
