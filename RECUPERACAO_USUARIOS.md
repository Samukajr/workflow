# 🔧 Guia de Recuperação de Usuários

## ⚠️ Problema
Seus usuários existentes (validação, submissão, financeiro, admin, superadmin) podem não estar funcionando devido a limitações no enum de departamentos do PostgreSQL.

## ✅ Solução Completa

Execute os passos abaixo **na ordem indicada** para restaurar todos os seus usuários:

---

## 🚀 Passo a Passo

### **1️⃣ Verificar Usuários Existentes**

Primeiro, vamos ver quais usuários realmente existem no banco:

```bash
cd backend
npm run users:list
```

**O que esse comando faz:**
- Lista todos os usuários cadastrados no banco
- Mostra email, departamento, status ativo e data de criação
- Ajuda a identificar se seus usuários estão lá ou não

**Resultado esperado:**
```
===========================================
📋 LISTANDO TODOS OS USUÁRIOS DO SISTEMA
===========================================

✅ Total de usuários encontrados: 5

1. 👤 Super Admin
   Email: superadmin@empresa.com
   Departamento: superadmin
   Ativo: ✅ Sim
   Último login: Nunca
   Criado em: 09/03/2026 10:30:00
   ID: 123e4567-e89b-12d3-a456-426614174000

2. 👤 Admin Sistema
   Email: admin@empresa.com
   ...
```

---

### **2️⃣ Atualizar Enum de Departamentos**

Se o enum do PostgreSQL não tiver os departamentos `admin` e `superadmin`, você precisa adicioná-los:

```bash
npm run departments:update
```

**O que esse comando faz:**
- Adiciona 'admin' e 'superadmin' ao enum `department_enum` do PostgreSQL
- Lista todos os departamentos disponíveis após a atualização
- Não afeta dados existentes

**Resultado esperado:**
```
===========================================
🔧 ATUALIZANDO ENUM DE DEPARTAMENTOS
===========================================

✅ Departamento 'admin' adicionado ao enum
✅ Departamento 'superadmin' adicionado ao enum

📋 Departamentos disponíveis no sistema:
   1. financeiro
   2. validacao
   3. submissao
   4. admin
   5. superadmin

===========================================
✅ Enum atualizado com sucesso!
===========================================
```

---

### **3️⃣ Restaurar/Criar Usuários**

Agora vamos garantir que todos os 5 usuários essenciais existam:

```bash
npm run users:restore
```

**O que esse comando faz:**
- Verifica quais usuários já existem
- Cria apenas os usuários que estão faltando
- Não duplica usuários existentes
- Define a senha padrão: `DemoPass@123`

**Usuários criados/verificados:**
- `submissao@empresa.com` → Departamento: submissao
- `validacao@empresa.com` → Departamento: validacao
- `financeiro@empresa.com` → Departamento: financeiro
- `admin@empresa.com` → Departamento: admin
- `superadmin@empresa.com` → Departamento: superadmin

**Resultado esperado:**
```
===========================================
🔧 RESTAURANDO USUÁRIOS DO SISTEMA
===========================================

📊 Usuários existentes: 2
Emails encontrados:
  - submissao@empresa.com
  - validacao@empresa.com

⏭️  Pulando submissao@empresa.com (já existe)
⏭️  Pulando validacao@empresa.com (já existe)
✅ Criado: financeiro@empresa.com (financeiro)
✅ Criado: admin@empresa.com (admin)
✅ Criado: superadmin@empresa.com (superadmin)

===========================================
✅ Usuários criados: 3
⏭️  Usuários pulados: 2
===========================================

📝 CREDENCIAIS (todos com a mesma senha):
   Email: <qualquer um dos acima>
   Senha: DemoPass@123
```

---

### **4️⃣ Verificar Novamente**

Confirme que todos os usuários estão funcionando:

```bash
npm run users:list
```

Você deve ver todos os 5 usuários listados agora!

---

## 🔐 Credenciais de Login

Após executar os scripts, você pode fazer login com qualquer um destes usuários:

| Email | Senha | Departamento | Permissões |
|-------|-------|--------------|------------|
| `submissao@empresa.com` | `DemoPass@123` | submissao | Submeter requisições |
| `validacao@empresa.com` | `DemoPass@123` | validacao | Validar requisições |
| `financeiro@empresa.com` | `DemoPass@123` | financeiro | Processar pagamentos |
| `admin@empresa.com` | `DemoPass@123` | admin | **Todas as permissões** |
| `superadmin@empresa.com` | `DemoPass@123` | superadmin | **Todas as permissões** |

---

## 🛠️ Comandos Úteis

```bash
# Listar todos os usuários
npm run users:list

# Restaurar usuários faltantes
npm run users:restore

# Atualizar departamentos no banco
npm run departments:update

# Iniciar o backend
npm run dev
```

---

## 📊 Estrutura dos Departamentos

### **Departamentos Operacionais:**
- **submissao** → Pode submeter novas requisições de pagamento
- **validacao** → Pode aprovar/rejeitar requisições
- **financeiro** → Pode processar pagamentos

### **Departamentos Administrativos:**
- **admin** → Acesso total a todas as funcionalidades
- **superadmin** → Acesso total a todas as funcionalidades

**Sidebar Admin/Superadmin tem acesso a:**
- ✅ Submeter Requisição
- ✅ Validar Requisições
- ✅ Processar Pagamentos
- ✅ Todas Requisições

---

## ❓ Resolução de Problemas

### **Problema: `department_enum` já existe**
```
ERROR: type "department_enum" already exists
```

**Solução:** Isso é normal! Significa que o enum já foi criado. Execute apenas:
```bash
npm run departments:update  # Adiciona valores faltantes
```

---

### **Problema: Usuário não consegue fazer login**
```
ERROR: Invalid credentials
```

**Possíveis causas:**
1. Senha incorreta → Use `DemoPass@123`
2. Email incorreto → Confira na listagem com `npm run users:list`
3. Usuário inativo → Verifique `is_active` na listagem

**Solução:**
```bash
# 1. Liste os usuários
npm run users:list

# 2. Se o usuário não existir, restaure
npm run users:restore
```

---

### **Problema: Enum não aceita 'admin' ou 'superadmin'**
```
ERROR: invalid input value for enum department_enum: "admin"
```

**Solução:**
```bash
# Execute o script de atualização do enum
npm run departments:update
```

---

## 🔄 Fluxo Completo de Recuperação

```bash
# 1. Entre no diretório do backend
cd backend

# 2. Verifique estado atual
npm run users:list

# 3. Atualize departamentos (se necessário)
npm run departments:update

# 4. Restaure usuários faltantes
npm run users:restore

# 5. Confirme que tudo está OK
npm run users:list

# 6. Inicie o servidor
npm run dev
```

---

## ✅ Checklist Final

Após executar tudo, confirme:

- [ ] Comando `npm run users:list` mostra 5 usuários
- [ ] Todos os emails estão corretos
- [ ] Todos estão com `is_active: true`
- [ ] Login funciona com `DemoPass@123`
- [ ] Sidebar mostra opções corretas para cada departamento
- [ ] Admin/Superadmin têm acesso a tudo

---

## 📝 Observações Importantes

1. **Senhas são hasheadas:** A senha `DemoPass@123` é armazenada com bcrypt (10 rounds)
2. **Enum é imutável:** Valores adicionados ao enum não podem ser removidos facilmente
3. **Dados preservados:** Os scripts NUNCA deletam dados existentes
4. **Idempotência:** Você pode executar os scripts múltiplas vezes sem problemas

---

## 🎯 Resumo Rápido

```bash
cd backend
npm run departments:update  # Adiciona admin e superadmin ao enum
npm run users:restore       # Cria usuários faltantes
npm run users:list          # Confirma que tudo está OK
npm run dev                 # Inicia o servidor
```

**Pronto! Seus 5 usuários estão funcionando! 🚀**
