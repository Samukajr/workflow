# 🔐 Resolvendo Problema de Login do Superadministrador

## ❌ Problema
Você não consegue fazer login com as credenciais do superadministrador:
- **Erro:** "Nome de usuário ou senha inválidos"

## ✅ Solução Rápida

### **Como resolver (escolha uma das opções abaixo):**

#### **OPÇÃO 1: Script Automático de Diagnóstico e Reparo (RECOMENDADO)**

```bash
cd backend
npm run fix:login
```

Este script irá:
- ✅ Verificar se o superadmin existe no banco
- ✅ Verificar se está ativo
- ✅ Criar se não existir
- ✅ Restaurar todos os usuários
- ✅ Atualizar enums se necessário
- ✅ Mostrar o painel com todas as credenciais

---

#### **OPÇÃO 2: Scripts Manuais (Se preferir fazer passo a passo)**

**Passo 1:** Listar usuários existentes
```bash
cd backend
npm run users:list
```

**Passo 2:** Atualizar departamentos no banco
```bash
npm run departments:update
```

**Passo 3:** Restaurar/criar usuários faltantes
```bash
npm run users:restore
```

---

## 🔐 Credenciais de Login

Após executar o script, use estas credenciais:

| Email | Senha | Departamento | Acesso |
|-------|-------|--------------|--------|
| `superadmin@empresa.com` | `DemoPass@123` | superadmin | ⭐⭐⭐ Total |
| `admin@empresa.com` | `DemoPass@123` | admin | ⭐⭐⭐ Total |
| `financeiro@empresa.com` | `DemoPass@123` | financeiro | ⭐⭐ Financeiro |
| `validacao@empresa.com` | `DemoPass@123` | validacao | ⭐⭐ Validação |
| `submissao@empresa.com` | `DemoPass@123` | submissao | ⭐ Submissão |

---

## 🔧 Quando Fazer Login

1. **Execute o script de reparo:**
   ```bash
   cd backend
   npm run fix:login
   ```

2. **Inicie o backend** (em outro terminal):
   ```bash
   cd backend
   npm run dev
   ```

3. **Acesse o sistema:**
   - Frontend URL: `http://localhost:5173` (ou a porta configurada)
   - Login com qualquer email/senha acima

4. **Teste o login:**
   - Use `superadmin@empresa.com` com `DemoPass@123`

---

## 🆘 Se o Problema Continuar

Se mesmo depois de executar o script você ainda não conseguir fazer login:

### **1. Verifique se o backend está rodando:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev
```

Você deve ver logs como:
```
✅ Connected to PostgreSQL database
🚀 Server listening on port 3000
```

### **2. Verifique a resposta de login:**
Abra o DevTools (F12) no navegador → Aba Network → Tente fazer login → Clique na requisição `/auth/login`

**Resposta esperada (sucesso):**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "token": "eyJ...",
  "user": {
    "id": "...",
    "email": "superadmin@empresa.com",
    "name": "Super Admin",
    "department": "superadmin"
  }
}
```

**Resposta com erro:**
```json
{
  "success": false,
  "message": "Email ou senha inválidos"
}
```

Se vir a resposta com erro, pode ser:
- Usuário não existe no banco
- Senha está errada
- Enum de departamentos não tem "superadmin"

### **3. Execute novamente o script:**
```bash
cd backend
npm run fix:login
```

### **4. Limpe o cache do navegador:**
- Pressione `Ctrl+Shift+Delete` (Windows)
- Selecione "Cookies e outros dados de site"
- Clique em "Limpar dados"

---

## 📊 Verificar Status do Banco Manualmente

Se quiser verificar manualmente no PostgreSQL:

```sql
-- Ver todos os usuários
SELECT email, name, department, is_active FROM users;

-- Ver enums de departamentos disponíveis
SELECT enum_range(NULL::department_enum);

-- Ver se superadmin existe
SELECT * FROM users WHERE email = 'superadmin@empresa.com';
```

---

## 💡 Dicas

- A senha é **case-sensitive**: `DemoPass@123` não é igual a `demopass@123`
- Não há espaços no email ou senha
- Todos os usuários têm a **mesma senha padrão**: `DemoPass@123`
- Você pode depois alterar as senhas pelo sistema se desejar

---

## ✅ Checklist de Resolução

- [ ] Executei `npm run fix:login` e vejo mensagem de sucesso
- [ ] Backend está rodando com `npm run dev`
- [ ] Frontend está acessível
- [ ] Consigo fazer login com `superadmin@empresa.com`
- [ ] Dashboard carrega após o login

Se tudo estiver marcado ✅, o problema foi resolvido!
