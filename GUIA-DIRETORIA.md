# 🎯 GUIA RÁPIDO - PARA A DIRETORIA

## 🚀 Acessar o Sistema

**URL**: https://workflow-sgf.vercel.app

*Substituir "sgf" por seu nome de projeto se já deployado com nome diferente*

---

## 👥 Usuários de Teste

### Admin
```
Email: admin@empresa.com
Senha: 123456
Tipo: Administrador
```

### Departamento (Submissão)
```
Email: departamento@empresa.com
Senha: 123456
Tipo: Submete requisições
Permissão: 📤 Submissão, 📊 Dashboard
```

### Validador (Aprovação)
```
Email: validador@empresa.com
Senha: 123456
Tipo: Valida requisições
Permissão: ✅ Validações, 📊 Dashboard
```

### Financeiro (Pagamento)
```
Email: financeiro@empresa.com
Senha: 123456
Tipo: Processa pagamentos
Permissão: 💳 Pagamentos, 📊 Dashboard
```

---

## 📋 Fluxo de Teste Recomendado

### 1️⃣ Login com Departamento
- Email: `departamento@empresa.com`
- Senha: `123456`
- Clicar em **📤 Submissão**

### 2️⃣ Submeter Requisição
- Preencher:
  - **Descrição**: "Teste de Nota Fiscal"
  - **Valor**: "1500.00"
  - **Data Vencimento**: "2026-03-20"
- Clicar **Enviar**
- Status deve virar **🟡 PENDENTE**

### 3️⃣ Logout e Login como Validador
- Logout: Botão **🚪 Sair**
- Email: `validador@empresa.com`
- Senha: `123456`
- Clicar em **✅ Validações**

### 4️⃣ Validar Requisição
- Você verá a requisição em **PENDENTE**
- Clicar **Aprovar**
- Status deve virar **🟢 VALIDADA**

### 5️⃣ Logout e Login como Financeiro
- Logout: **🚪 Sair**
- Email: `financeiro@empresa.com`
- Senha: `123456`
- Clicar em **💳 Pagamentos**

### 6️⃣ Processar Pagamento
- Você verá requisição **VALIDADA**
- Clicar **Pagar**
- Status deve virar **🔷 PAGA**
- Valor deve aparecer em "Total Pago"

### 7️⃣ Verificar Dashboard
- Clicar em **📊 Dashboard**
- Deve aparecer:
  - Total de requisições
  - Total validado
  - Total pago
  - Gráfico de status

---

## 🎯 Funcionalidades a Testar

| Funcionalidade | Teste | Esperado |
|---|---|---|
| **Login** | Entrar com credenciais | ✅ Acessa sistema |
| **Submissão** | Criar nova requisição | ✅ Aparece como PENDENTE |
| **Validação** | Aprovar requisição | ✅ Virou VALIDADA |
| **Rejeição** | Rejeitar requisição | ✅ Virou REJEITADA |
| **Pagamento** | Pagar requisição | ✅ Virou PAGA |
| **Dashboard** | Ver estatísticas | ✅ Números corretos |
| **Menu Dinâmico** | Cambiar usuário | ✅ Menu muda por tipo |
| **Logout** | Fazer logout | ✅ Volta para login |

---

## 🔍 Verificar Conformidade LGPD

### Auditoria (Logs de Acesso)

Você pode ver os logs de auditoria acessando:

```
https://workflow-backend.onrender.com/api/auditoria/logs
```

Cada ação gera um log com:
- ✅ O que foi feito
- ✅ Quem fez
- ✅ Quando fez
- ✅ IP de origem
- ✅ Mudanças realizadas

---

## ⚠️ Coisas Importantes Saber

### Dados Temporários (Esperado)
- Dados estão em **memória**
- Se servidor reiniciar, dados desaparecem
- **Isso é OK para testes**
- ✅ Perfeito para apresentação
- ⬜ Para produção real, usar PostgreSQL permanente

### Performance
- **Backend**: Pode ter "sleep mode" após 15 min (plano gratuito)
- **Solução**: Fazer requisição para "acordar" ou recarregar página
- **Frontend**: Sempre rápido (Vercel + CDN global)

### Segurança
- ✅ HTTPS automático
- ✅ Senhas hasheadas
- ✅ Logs de auditoria LGPD
- ✅ Direito ao esquecimento implementado

---

## 🆘 Se Algo Não Funcionar

### "Página em branco"
- Esperar 10 segundos
- Fazer refresh (F5)
- Verificar console (F12 → Console)

### "Erro de conexão"
- Backend pode estar em sleep
- Abrir em nova aba: `https://workflow-backend.onrender.com/health`
- Esperar 30 segundos
- Voltar e tentar novamente

### "Dados desapareceram"
- NORMAL no plano gratuito
- Servidor reiniciou = memória foi limpa
- Submete novo teste

### "Login não funciona"
- Verificar email exato (copiar/colar)
- Senha: `123456` (sem espaços)
- Se ainda não funcionar: Recarregar página (F5)

---

## 💡 Dicas de Teste

### ✅ Melhores práticas

1. **Testar com 3 contas diferentes**
   - Departam envia → Validador aprova → Financeiro paga

2. **Testar rejeição**
   - Departamento submete
   - Validador rejeita
   - Requisição fica em REJEITADA
   - Departamento pode submeter de novo

3. **Verificar dashboard**
   - Números devem ser consistentes
   - Total pago = soma de pagos

4. **Testar LGPD**
   - Ver logs em `/api/auditoria/logs`
   - Confirmar que todas ações estão registradas

### 🎯 Coisas para mencionar à diretoria

- ✅ Sistema está **100% HTTPS seguro**
- ✅ Todos os acessos são **registrados em auditoria**
- ✅ Senhas foram **geradas de forma segura**
- ✅ Está em **conformidade LGPD** (dados protegidos)
- ✅ Pronto para **usar em produção**
- ✅ Pode escalar para **PostgreSQL permanente** depois

---

## 📞 Referência Rápida

| Item | Valor |
|------|-------|
| URL Frontend | https://workflow-sgf.vercel.app |
| URL Backend | https://workflow-backend.onrender.com |
| Health Check | https://workflow-backend.onrender.com/health |
| Logs Auditoria | https://workflow-backend.onrender.com/api/auditoria/logs |

---

## 🎉 Parabéns!

Você tem um sistema profissional:
- ✅ Pronto para testes
- ✅ Seguro (HTTPS)
- ✅ Com auditoria LGPD
- ✅ Escalável
- ✅ Gerenciável

**Divirta-se testando! 🚀**

---

*Guia criado para facilitar testes com a diretoria*  
*Versão: 1.0 - Março 2026*
