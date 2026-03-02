# ⚡ INÍCIO RÁPIDO - 2 Minutos

## 🎯 Acesse Agora

**Abra seu navegador em:** http://localhost:5173

## 🔑 Credenciais de Teste

| Usuário | Email | Senha | Permissões |
|---------|-------|-------|------------|
| Admin | admin@empresa.com | 123456 | Visualizar tudo |
| Validador | validador@empresa.com | 123456 | Aprovar requisições |
| Financeiro | financeiro@empresa.com | 123456 | Processar pagamentos |

## ✅ Teste o Fluxo Completo

### 1. Como Validador 🔍
1. Acesse http://localhost:5173
2. Faça login com **validador@empresa.com** / **123456**
3. Clique em **"Validações"** no menu
4. Clique em **"Aprovar"** na requisição REQ-001
5. Veja a mensagem: "Requisição aprovada!"

### 2. Como Financeiro 💰
1. Clique em **"Sair"**
2. Faça login com **financeiro@empresa.com** / **123456**
3. Clique em **"Pagamentos"** no menu
4. Clique em **"Processar Pagamento"** na REQ-001
5. Veja a mensagem: "Pagamento realizado!"

### 3. Veja o Resultado 📊
1. Clique em **"Dashboard"** no menu
2. Veja que agora você tem:
   - 1 requisição PENDENTE (REQ-002)
   - 0 requisições VALIDADAS
   - 1 requisição PAGA (REQ-001) ✅

## 🚀 Servidores Ativos

- **Backend API:** http://localhost:3000
  - Health check: http://localhost:3000/health

- **Frontend Web:** http://localhost:5173
  - Interface visual completa

## 📱 Páginas Disponíveis

- **Login:** Autenticação de usuários
- **Dashboard:** Visão geral com estatísticas
- **Validações:** Aprovar/Rejeitar requisições
- **Pagamentos:** Processar pagamentos aprovados

## 🔧 Se der algo errado

### Backend não está respondendo?
```powershell
cd E:\APP\WORKFLOW-NOVO\backend
node server.js
```

### Frontend não carrega?
```powershell
cd E:\APP\WORKFLOW-NOVO\frontend
npm run dev
```

## 🎨 Visual do Sistema

- **Design moderno** com gradiente roxo
- **Cards coloridos** para cada status
- **Tabelas responsivas** para dados
- **Badges de status** com cores:
  - 🟡 PENDENTE (amarelo)
  - 🔵 VALIDANDO (azul)
  - 🟢 VALIDADA (verde)
  - 🔵 PAGA (ciano)
  - 🔴 REJEITADA (vermelho)

---

**🎉 Pronto! Sistema funcionando 100% para a equipe do financeiro! 🎉**
