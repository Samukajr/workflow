# ✅ TESTE DE BUILD ANTES DO DEPLOYMENT

## 🧪 Testar localmente se tudo vai funcionar

### Teste 1: Build do Backend

```bash
cd E:\APP\WORKFLOW-NOVO\backend
npm install
npm start
```

Esperado:
```
╔════════════════════════════════════════════════════════╗
║        🚀 WORKFLOW - BACKEND INICIADO 🚀              ║
╚════════════════════════════════════════════════════════╝

📍 Ambiente: development
🌐 URL: http://localhost:3000
```

Teste:
```bash
curl http://localhost:3000/health
```

### Teste 2: Build do Frontend

Em outro terminal:

```bash
cd E:\APP\WORKFLOW-NOVO\frontend
npm install
npm run build
npm run preview
```

Esperado:
- Build completa sem erros
- Dizendo que está em http://localhost:4173

Teste:
- Abrir http://localhost:4173 no navegador
- Tentar fazer login com `admin@empresa.com / 123456`
- Deve funcionar normalmente

### Teste 3: Simular produção localmente

Para simular mais fidedignamente a produção:

```bash
# Configurar .env para simular Vercel
# Editar frontend/.env:
VITE_API_URL=http://localhost:3000
VITE_ENV=production

# Fazer build de produção
npm run build

# Servir com preview
npm run preview
```

### Checklist antes de fazer push para GitHub

- [ ] `npm start` funciona no backend sem erros
- [ ] `npm run build` funciona no frontend sem erros
- [ ] Health check retorna status OK
- [ ] Login funciona
- [ ] Pode submeter requisição
- [ ] Pode validar requisição
- [ ] Pode processar pagamento
- [ ] Nenhum erro no console do navegador
- [ ] Nenhum erro CORS

---

## 📤 Se tudo passou, fazer commit e push:

```bash
cd E:\APP\WORKFLOW-NOVO

git add .
git commit -m "Preparar para deployment em Render + Vercel"
git push origin main
```

Após push:
1. Render fará deploy automático (~5 min)
2. Vercel fará deploy automático (~2 min)
3. Sistema estará disponível em produção

---

## 🔍 Monitorar deployment

- Render: https://render.com/dashboard
- Vercel: https://vercel.com/dashboard

Procure por:
- Build status (deve ser "Success")
- Qualquer erro em logs
- Mensagens de CORS

---

## ❌ Se algo der errado

### Build falhou no Render/Vercel

1. Verificar logs exatos da falha
2. Testar localmente: `npm install && npm start`
3. Se funciona localmente, problema é de ambiente
4. Verificar variáveis `.env`

### Frontend não conecta ao backend

1. Verificar `VITE_API_URL` no Vercel
2. Verificar `ALLOWED_ORIGINS` no Render (incluir domínio Vercel)
3. Se ainda falhar, fazer curl manual:

```bash
curl https://workflow-backend.onrender.com/health
```

### Dados não persistem

ESPERADO no plano gratuito! Dados estão em memória.
Solução: Implementar PostgreSQL permanente (guia no GUIA-DEPLOYMENT.md Phase 2)

---

**Tudo pronto? Vamos fazer o deploy! 🚀**
