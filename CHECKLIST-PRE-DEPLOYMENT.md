# ✅ CHECKLIST PRÉ-DEPLOYMENT

## 🔍 Verificações Finais Antes de Fazer Push

### 1. Variáveis de Ambiente

- [ ] Backend `.env` tem `ENCRYPTION_KEY` definida
- [ ] Backend `.env` tem `ALLOWED_ORIGINS` correto
- [ ] Frontend `.env` não será versionado (gitignore OK)
- [ ] `.env` está em `.gitignore` ✓

### 2. Código Backend

- [ ] `server.js` importa `dotenv`
- [ ] `server.js` usa `process.env.PORT`
- [ ] `server.js` usa `corsOptions` dinâmico
- [ ] Sem `console.log()` com dados sensíveis
- [ ] Nenhum `http://localhost` hardcoded

### 3. Código Frontend

- [ ] `App.jsx` importa `VITE_API_URL`
- [ ] Todas as chamadas de fetch usam `API_URL`
- [ ] Nenhum `localhost:3000` hardcoded
- [ ] Sem `console.error()` que exponha dados

### 4. Dependências

- [ ] `npm list` mostra versões corretas
- [ ] Sem vulnerabilidades conhecidas:

```bash
# Verificar vulnerabilidades
npm audit

# Se houver, rodar:
npm audit fix
```

### 5. Testes Locais

- [ ] `npm start` funciona (backend)
- [ ] `npm run dev` funciona (frontend)
- [ ] Login com `admin@empresa.com / 123456` funciona
- [ ] Consegue submeter requisição
- [ ] Consegue validar
- [ ] Consegue processar pagamento
- [ ] Health check retorna OK

### 6. Arquivos Git

- [ ] `.gitignore` está configurado
- [ ] Nenhum arquivo .env será versionado
- [ ] `.env.example` existe como template
- [ ] `package-lock.json` vai ser versionado (OK)

### 7. Documentação

- [ ] GUIA-DEPLOYMENT.md está completo
- [ ] TESTE-BUILD.md está acessível
- [ ] CONFORMIDADE-LGPD.md listado
- [ ] README.md existe

### 8. Configuração Render/Vercel

- [ ] Tem conta no Render
- [ ] Tem conta no Vercel
- [ ] Ambas conectadas ao seu GitHub
- [ ] Heroku NÃO será usado (Render é melhor)

---

## 🚀 Script de Validação Completa

Execute isso antes de fazer push:

```bash
# 1. Navegar para pasta do projeto
cd E:\APP\WORKFLOW-NOVO

# 2. Limpar node_modules antigos
rmdir /s /q backend\node_modules frontend\node_modules

# 3. Instalar dependências limpas
cd backend
npm install
cd ..\frontend
npm install
cd ..

# 4. Testar build
echo "=== TESTANDO BACKEND ==="
cd backend
npm start &
timeout /t 5

echo "=== TESTANDO FRONTEND ==="
cd ..\frontend
npm run build
if errorlevel 1 (
    echo "❌ Build falhou!"
    exit /b 1
)

echo "✅ Tudo OK!"
```

---

## 📝 Git Checklist

Antes de fazer `git push`:

```bash
# 1. Verificar status
git status

# Esperado:
# - .env NÃO deve aparecer (por causa de .gitignore)
# - Apenas arquivos de código/docs

# 2. Sem arquivos sensíveis
git ls-files | findstr ".env"
# Esperado: Noutput (não deve ser versionado)

# 3. Fazer commit
git add .
git commit -m "Sistem pronto para deployment Render + Vercel"

# 4. Fazer push
git push origin main

# Pronto! Render + Vercel fazem deploy automático
```

---

## ⚡ Checklist Rápido (2 minutos)

```bash
# Terminal 1
cd E:\APP\WORKFLOW-NOVO\backend && npm start

# Terminal 2
cd E:\APP\WORKFLOW-NOVO\frontend && npm run dev

# Terminal 3
curl http://localhost:3000/health
# Deve retornar: {"status":"ok",...}

# Abrir navegador
http://localhost:5173
# Login com admin@empresa.com / 123456
# Tudo funciona? SIM ✓
```

---

## 🎯 Status Final

| Item | Status |
|------|--------|
| Backend configurado | ✅ |
| Frontend configurado | ✅ |
| Variáveis ambiente | ✅ |
| Segurança LGPD | ✅ |
| Documentação | ✅ |
| Pronto para GitHub | ✅ |
| Pronto para Render | ✅ |
| Pronto para Vercel | ✅ |

---

**Se todos os itens têm ✅, você está pronto para fazer:**

```bash
git push origin main
```

Após push:
- Render faz deploy automático (3-5 min) ✓
- Vercel faz deploy automático (1-2 min) ✓
- Sistema está em produção! 🎉

---

## 📞 Próximo Passo

1. Seguir este checklist
2. Fazer `git push origin main`
3. Monitorar Render + Vercel dashboards
4. Abrir URL de produção quando estiver pronto
5. Testar tudo novamente
6. Compartilhar com diretoria: `https://workflow-sgf.vercel.app`

**Tempo estimado: 45 minutos total (primeira vez)**

Ousadia! 🚀
