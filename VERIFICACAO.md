# ✅ Checklist de Verificação - Sistema Funcionando

## 🔍 Verificação Rápida (30 segundos)

### 1. Backend está rodando?

```powershell
curl.exe http://localhost:3000/health
```

**✅ Esperado:**
```json
{"status":"ok","timestamp":"2026-03-02T15:xx:xx.xxxZ"}
```

❌ **Se der erro "Failed to connect":**
```powershell
cd E:\APP\WORKFLOW-NOVO\backend
node server.js
```

---

### 2. Frontend está acessível?

Abra no navegador: **http://localhost:5173**

**✅ Esperado:** Página de login com formulário

❌ **Se não carregar:**
```powershell
cd E:\APP\WORKFLOW-NOVO\frontend
npm run dev
```

---

### 3. API de Login funciona?

```powershell
$body = @{ email = "admin@empresa.com"; password = "123456" } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method POST -Body $body -ContentType "application/json"
```

**✅ Esperado:**
```
token            user
-----            ----
fake-jwt-token-1 @{id=1; nome=Administrador; ...}
```

---

### 4. Requisições estão disponíveis?

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/requisicoes -Method GET
```

**✅ Esperado:**
```json
{
  "data": [
    { "numero": "REQ-001", "descricao": "Fatura Telefônica Vivo", ... },
    { "numero": "REQ-002", "descricao": "Boleto Fornecedor XYZ", ... }
  ]
}
```

---

## 🧪 Teste Manual Completo (5 minutos)

### Passo 1: Login como Validador

1. Acesse http://localhost:5173
2. Digite:
   - Email: `validador@empresa.com`
   - Senha: `123456`
3. Clique em **"Entrar"**

**✅ Esperado:** Você deve ver o Dashboard com 3 cards de estatísticas

---

### Passo 2: Aprovar uma Requisição

1. Clique em **"Validações"** no menu superior
2. Você deve ver a requisição **REQ-001** (Fatura Telefônica Vivo)
3. Clique no botão **"Aprovar"**

**✅ Esperado:** Mensagem "Requisição aprovada!"

---

### Passo 3: Login como Financeiro

1. Clique em **"Sair"** no canto superior direito
2. Faça login com:
   - Email: `financeiro@empresa.com`
   - Senha: `123456`

**✅ Esperado:** Tela de login → Dashboard

---

### Passo 4: Processar Pagamento

1. Clique em **"Pagamentos"** no menu superior
2. Você deve ver a REQ-001 que você aprovou anteriormente
3. Clique em **"Processar Pagamento"**

**✅ Esperado:** Mensagem "Pagamento realizado!"

---

### Passo 5: Verificar Dashboard

1. Clique em **"Dashboard"** no menu superior
2. Verifique os cards de estatísticas:
   - **1** Pendente (REQ-002)
   - **0** Validadas
   - **1** Paga (REQ-001)
3. Role a página e veja a tabela com todas as requisições
4. A REQ-001 deve ter badge **PAGA** (azul claro)

**✅ Esperado:** Números corretos e REQ-001 marcada como PAGA

---

## 🎯 Teste de Integração Completo

Execute este script PowerShell para testar toda a API:

```powershell
# Teste 1: Health Check
Write-Host "1. Testando Health Check..." -ForegroundColor Yellow
curl.exe http://localhost:3000/health

# Teste 2: Login
Write-Host "`n2. Testando Login..." -ForegroundColor Yellow
$body = @{ email = "admin@empresa.com"; password = "123456" } | ConvertTo-Json
$login = Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method POST -Body $body -ContentType "application/json"
Write-Host "Token: $($login.token)" -ForegroundColor Green

# Teste 3: Listar Requisições
Write-Host "`n3. Testando Listagem de Requisições..." -ForegroundColor Yellow
$reqs = Invoke-RestMethod -Uri http://localhost:3000/api/requisicoes -Method GET
Write-Host "Total de requisições: $($reqs.data.Count)" -ForegroundColor Green
$reqs.data | Format-Table numero, descricao, valor, status

# Teste 4: Aprovar Requisição
Write-Host "`n4. Testando Aprovação..." -ForegroundColor Yellow
$aprovacao = Invoke-RestMethod -Uri http://localhost:3000/api/validacoes/1/aprovar -Method POST -ContentType "application/json"
Write-Host "REQ-001 agora está: $($aprovacao.status)" -ForegroundColor Green

# Teste 5: Processar Pagamento
Write-Host "`n5. Testando Pagamento..." -ForegroundColor Yellow
$pagamento = Invoke-RestMethod -Uri http://localhost:3000/api/pagamentos/1/pagar -Method POST -ContentType "application/json"
Write-Host "REQ-001 agora está: $($pagamento.status)" -ForegroundColor Green

# Teste 6: Verificar Estado Final
Write-Host "`n6. Estado Final das Requisições:" -ForegroundColor Yellow
$final = Invoke-RestMethod -Uri http://localhost:3000/api/requisicoes -Method GET
$final.data | Format-Table numero, descricao, status

Write-Host "`n✅ Todos os testes concluídos!" -ForegroundColor Green
```

---

## 🔧 Troubleshooting

### ❌ Problema: "Failed to connect to localhost port 3000"

**Causa:** Backend não está rodando

**Solução:**
```powershell
cd E:\APP\WORKFLOW-NOVO\backend
node server.js
```

---

### ❌ Problema: "net::ERR_CONNECTION_REFUSED" no navegador

**Causa:** Frontend não está rodando

**Solução:**
```powershell
cd E:\APP\WORKFLOW-NOVO\frontend
npm run dev
```

---

### ❌ Problema: Página carrega mas não exibe dados

**Causa:** CORS ou backend não está respondendo

**Verificação:**
1. Abra DevTools (F12)
2. Vá na aba **Console**
3. Verifique se há erros de CORS ou network

**Solução:**
```powershell
# Reiniciar backend
cd E:\APP\WORKFLOW-NOVO\backend
# Ctrl+C para parar
node server.js
```

---

### ❌ Problema: Login não funciona

**Causa:** Credenciais erradas ou backend não responde

**Verificação:**
```powershell
# Teste direto na API
$body = @{ email = "admin@empresa.com"; password = "123456" } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method POST -Body $body -ContentType "application/json"
```

**Solução:** Use exatamente estas credenciais:
- `admin@empresa.com` / `123456`
- `validador@empresa.com` / `123456`
- `financeiro@empresa.com` / `123456`

---

## 📊 Status Report

Execute este comando para ver um resumo:

```powershell
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  SISTEMA DE WORKFLOW - STATUS REPORT" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Backend
try {
    $health = curl.exe -s http://localhost:3000/health | ConvertFrom-Json
    Write-Host "✅ Backend ONLINE (porta 3000)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend OFFLINE" -ForegroundColor Red
}

# Frontend
try {
    $frontend = curl.exe -s http://localhost:5173
    if ($frontend) {
        Write-Host "✅ Frontend ONLINE (porta 5173)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend OFFLINE" -ForegroundColor Red
}

# Requisições
try {
    $reqs = Invoke-RestMethod -Uri http://localhost:3000/api/requisicoes -Method GET
    $pendentes = ($reqs.data | Where-Object { $_.status -eq 'PENDENTE' }).Count
    $validadas = ($reqs.data | Where-Object { $_.status -eq 'VALIDADA' }).Count
    $pagas = ($reqs.data | Where-Object { $_.status -eq 'PAGA' }).Count
    
    Write-Host "`nRequisições:" -ForegroundColor Yellow
    Write-Host "  - Pendentes: $pendentes" -ForegroundColor White
    Write-Host "  - Validadas: $validadas" -ForegroundColor White
    Write-Host "  - Pagas: $pagas" -ForegroundColor White
} catch {
    Write-Host "❌ Não foi possível obter dados" -ForegroundColor Red
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "Acesse: http://localhost:5173" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
```

---

## ✅ Checklist Final

- [ ] Backend responde em `http://localhost:3000/health`
- [ ] Frontend carrega em `http://localhost:5173`
- [ ] Consegue fazer login com `validador@empresa.com`
- [ ] Página "Validações" mostra requisições pendentes
- [ ] Botão "Aprovar" funciona e exibe mensagem de sucesso
- [ ] Consegue fazer login como `financeiro@empresa.com`
- [ ] Página "Pagamentos" mostra requisições aprovadas
- [ ] Botão "Processar Pagamento" funciona
- [ ] Dashboard atualiza os números corretamente
- [ ] Tabela exibe status PAGA para requisições processadas

---

**🎉 Se todos os checkboxes estão marcados, seu sistema está 100% funcional! 🎉**
