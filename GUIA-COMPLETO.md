# 📚 GUIA COMPLETO DE USO - Sistema de Workflow de Pagamentos

## 🎯 O QUE É ESTE SISTEMA?

Sistema para gerenciar o **fluxo completo de pagamento** de notas fiscais e boletos com **3 etapas e 3 tipos de usuários**:

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLUXO DO SISTEMA                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1️⃣  DEPARTAMENTO submete documento                           │
│      ↓                                                          │
│      (Status: PENDENTE)                                         │
│      ↓                                                          │
│                                                                 │
│  2️⃣  VALIDADOR aprova/rejeita                                 │
│      ↓                                                          │
│      (Status: VALIDADA ou REJEITADA)                            │
│      ↓                                                          │
│                                                                 │
│  3️⃣  FINANCEIRO processa pagamento                            │
│      ↓                                                          │
│      (Status: PAGA) ✅                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 👥 TRÊS TIPOS DE USUÁRIOS

### 1️⃣ DEPARTAMENTO (Submissão)
**Email:** `departamento@empresa.com`
**Senha:** `123456`

**O que faz:**
- ✅ Submete boletos, notas fiscais, prestações
- ✅ Ve o histórico de suas submissões
- ✅ Acompanha o status de cada documento

**Menu disponível:**
- 📤 **Submissão** (área principal)
- 📊 **Dashboard** (visão geral)

**Acesso:** http://localhost:5173

---

### 2️⃣ VALIDADOR (Validação)
**Email:** `validador@empresa.com`
**Senha:** `123456`

**O que faz:**
- ✅ Aprova ou rejeita documentos
- ✅ Valida se a nota fiscal ou boleto estão corretos
- ✅ Encaminha documentos aprovados para o financeiro

**Menu disponível:**
- ✅ **Validações** (lista de documentos pendentes)
- 📊 **Dashboard** (visão geral)

**Acesso:** http://localhost:5173

---

### 3️⃣ FINANCEIRO (Pagamento)
**Email:** `financeiro@empresa.com`
**Senha:** `123456`

**O que faz:**
- ✅ Processa os pagamentos aprovados
- ✅ Marca como PAGO os documentos
- ✅ Controla o fluxo de caixa

**Menu disponível:**
- 💳 **Pagamentos** (lista de documentos para pagar)
- 📊 **Dashboard** (visão geral)

**Acesso:** http://localhost:5173

---

## 🚀 COMO USAR - Passo a Passo

### PASSO 1: Departamento Submete Boleto

#### 1.1 Faça Login como Departamento

1. Abra http://localhost:5173
2. Preencha:
   - **Email:** `departamento@empresa.com`
   - **Senha:** `123456`
3. Clique em **"Entrar"**

#### 1.2 Submeta um Boleto ou Nota Fiscal

1. Clique na aba **"📤 Submissão"** no menu superior
2. Você verá um formulário com 3 campos:

```
📋 Descrição do Documento:
   Ex: Fatura Telefônica Vivo, Boleto Fornecedor XYZ, etc

💰 Valor (R$):
   Ex: 1500.50

📅 Data de Vencimento:
   Escolha a data no calendário
```

3. **Exemplo de preenchimento:**
   - Descrição: `Fatura Internet Vivo`
   - Valor: `899.90`
   - Vencimento: `15/03/2026`

4. Clique em **"✅ Enviar para Validação"**

5. Você verá uma mensagem: **"✅ Requisição enviada para validação!"**

6. O documento aparecerá na tabela com status **PENDENTE** (amarelo)

---

### PASSO 2: Validador Aprova

#### 2.1 Faça Login como Validador

1. Clique em **"🚪 Sair"** no canto superior direito
2. Faça login com:
   - **Email:** `validador@empresa.com`
   - **Senha:** `123456`
3. Clique em **"Entrar"**

#### 2.2 Aprove o Documento

1. Clique na aba **"✅ Validações"** no menu superior
2. Você verá uma tabela com documentos pendentes
3. Veja o documento que o Departamento enviou:
   - Número: `REQ-001` (ou superior)
   - Descrição: `Fatura Internet Vivo`
   - Valor: `R$ 899,90`
   - Status: `PENDENTE` (amarelo)

4. Clique no botão **"Aprovar"** na linha do documento

5. Você verá a mensagem: **"Requisição aprovada!"**

6. O status do documento mudará para **"VALIDADA"** (verde)

---

### PASSO 3: Financeiro Processa Pagamento

#### 3.1 Faça Login como Financeiro

1. Clique em **"🚪 Sair"** no canto superior direito
2. Faça login com:
   - **Email:** `financeiro@empresa.com`
   - **Senha:** `123456`
3. Clique em **"Entrar"**

#### 3.2 Processe o Pagamento

1. Clique na aba **"💳 Pagamentos"** no menu superior
2. Você verá uma tabela com documentos aprovados
3. Veja o documento que o Validador aprovou:
   - Número: `REQ-001`
   - Descrição: `Fatura Internet Vivo`
   - Valor: `R$ 899,90`
   - Status: `VALIDADA` (verde)

4. Clique no botão **"Processar Pagamento"** na linha do documento

5. Você verá a mensagem: **"Pagamento realizado!"**

6. O status do documento mudará para **"PAGA"** (azul claro)

---

### PASSO 4: Veja o Resultado Final no Dashboard

1. Clique na aba **"📊 Dashboard"** no menu superior
2. Você verá 3 cards:
   - **Pendentes:** 0 (nenhum documento aguardando aprovação)
   - **Validadas:** 0 (nenhum esperando pagamento)
   - **Pagas:** 2 (REQ-001 e REQ-002 já pagas ou processadas)

3. Abaixo vê a tabela com todos os documentos e seus status:
   - REQ-001: Fatura Internet Vivo - **PAGA** ✅
   - REQ-002: Boleto Fornecedor XYZ - **PAGA** ✅

---

## 📊 ENTENDENDO O DASHBOARD

O **Dashboard** mostra:

### Cards de Estatísticas (topo)
```
┌──────────────────────┐
│ 1                    │
│ Pendentes            │ = Documentos aguardando aprovação
└──────────────────────┘

┌──────────────────────┐
│ 0                    │
│ Validadas            │ = Documentos aprovados, aguardando pagamento
└──────────────────────┘

┌──────────────────────┐
│ 2                    │
│ Pagas                │ = Documentos já pagos ✅
└──────────────────────┘
```

### Tabela Completa (abaixo)
Mostra TODOS os documentos com:
- **Número:** REQ-001, REQ-002, etc
- **Descrição:** Nome do boleto ou nota fiscal
- **Valor:** Quanto vale o documento
- **Status:** PENDENTE, VALIDADA, PAGA, REJEITADA
- **Vencimento:** Data de vencimento

---

## 🎨 ENTENDENDO OS STATUS

Cada documento passa por estágios, representados por cores:

| Cor | Status | Significado | Próximo Passo |
|-----|--------|-------------|---------------|
| 🟡 Amarelo | PENDENTE | Aguardando validação | Validador aprova |
| 🔵 Azul | VALIDANDO | Em processo de validação | Aguarde |
| 🟢 Verde | VALIDADA | Aprovado, pronto para pagamento | Financeiro paga |
| 🔷 Ciano | PAGA | Pagamento realizado ✅ | Encerrado |
| 🔴 Vermelho | REJEITADA | Rejeitado, voltar ao departamento | Reenviar corrigido |

---

## 💡 DICAS IMPORTANTES

### ✅ Dica 1: Menu Diferente por Usuário

Cada tipo de usuário vê um menu diferente:

**Departamento vê:**
- 📤 Submissão (enviar documentos)
- 📊 Dashboard (acompanhar)

**Validador vê:**
- ✅ Validações (aprovar/rejeitar)
- 📊 Dashboard (visão geral)

**Financeiro vê:**
- 💳 Pagamentos (pagar)
- 📊 Dashboard (visão geral)

---

### ✅ Dica 2: Você Vê Diferentes Documentos por Perfil

**Dashboard do Departamento:**
- Vê seus próprios documentos enviados

**Dashboard do Validador:**
- Vê documentos pendentes de TODAS as áreas
- Precisa revisar cada um

**Dashboard do Financeiro:**
- Vê documentos aprovados prontos para pagar
- Precisa processar os pagamentos

---

### ✅ Dica 3: Exemplo de Fluxo Completo

1. **Seg 10h:** Departamento de TI envia fatura da internet
   - Status: PENDENTE ⏳

2. **Seg 11h:** Validador aprova a fatura
   - Status: VALIDADA ✅

3. **Seg 14h:** Financeiro processa o pagamento
   - Status: PAGA 💳

---

### ✅ Dica 4: Rejeitando Documentos

Se o Validador achar que tem algo errado:

1. Clica em **❌ Rejeitar** (quando implementado)
2. O status volta para **REJEITADA**
3. O departamento é notificado
4. Departamento resubmete o documento corrigido

---

```

## 🆘 SOLVING PROBLEMS

### ❌ Problema: Login não funciona

**Solução:** Use EXATAMENTE estas credenciais:

```
Departamento:  departamento@empresa.com / 123456
Validador:     validador@empresa.com / 123456
Financeiro:    financeiro@empresa.com / 123456
```

---

### ❌ Problema: Botão de Submissão não aparece

**Causa:** Você não está logado como Departamento

**Solução:** Faça logout e login com `departamento@empresa.com`

---

### ❌ Problema: Não vejo documentos para validar

**Causa:** Não há documentos com status PENDENTE

**Solução:**
1. Faça login como Departamento
2. Submeta um novo documento
3. Volte para Validador
4. O documento aparecerá

---

### ❌ Problema: Página carrega mas está em branco

**Solução:**
1. Pressione F5 para recarregar
2. Verifique se ambos os servidores estão rodando:
   - Backend: `http://localhost:3000/health`
   - Frontend: `http://localhost:5173`

---

## 🎯 CHECKLIST DE USO

- [ ] Consegui fazer login como Departamento
- [ ] Consegui submeter um novo boleto/nota fiscal
- [ ] O documento apareceu com status PENDENTE
- [ ] Consegui fazer login como Validador
- [ ] Vi o documento na aba Validações
- [ ] Cliquei em Aprovar e o status virou VALIDADA
- [ ] Consegui fazer login como Financeiro
- [ ] Vi o documento na aba Pagamentos
- [ ] Cliquei em Processar Pagamento e o status virou PAGA
- [ ] Voltei ao Dashboard e vi os números atualizados

Se todos os checkboxes estão marcados, você domina o sistema! ✅

---

## 🚀 PRÓXIMAS FUNCIONALIDADES

Em breve o sistema terá:

- 📎 **Upload de Arquivos:** Anexar PDFs de notas fiscais
- 📧 **Notificações por Email:** Avisar automaticamente
- 🗄️ **Banco de Dados PostgreSQL:** Dados persistentes
- 🔐 **JWT Real:** Segurança com tokens verdadeiros
- 📊 **Relatórios:** Exportar PDF/Excel
- 🔍 **Auditoria:** Registro de quem fez o quê

---

**🎊 Você agora é um especialista no Sistema de Workflow de Pagamentos! 🎊**
