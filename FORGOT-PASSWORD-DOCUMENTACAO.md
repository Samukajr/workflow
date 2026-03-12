# Funcionalidade de Recuperação de Senha

## ✅ Implementação Completa

Esta documentação descreve o sistema de recuperação de senha (Forgot Password) implementado no sistema de workflow.

---

## 📋 Visão Geral

Sistema completo de recuperação de senha via email com token seguro de uso único e tempo limitado.

### Características Principais:
- ✅ Tokens SHA-256 hasheados
- ✅ Expiração de 1 hora
- ✅ Tokens de uso único (não reutilizáveis)
- ✅ Rate limiting (3 tentativas/hora por IP)
- ✅ Prevenção de enumeração de emails
- ✅ Templates de email HTML profissionais
- ✅ Auditoria completa (LGPD compliance)
- ✅ Limpeza automática de tokens expirados

---

## 🔧 Backend (100% Completo)

### 1. Banco de Dados

**Tabela:** `password_reset_tokens`

```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash VARCHAR(64) UNIQUE NOT NULL,  -- SHA-256 do token
  expires_at TIMESTAMP NOT NULL,            -- 1 hora de validade
  used BOOLEAN DEFAULT FALSE,               -- Uso único
  ip_address VARCHAR(45),                   -- Auditoria
  user_agent TEXT,                          -- Auditoria
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_expires_at ON password_reset_tokens(expires_at);
```

**Arquivo:** `backend/src/database/passwordResetMigrations.ts`

### 2. Serviço de Email

**Funcionalidades:**
- Configuração SMTP (Gmail, Outlook, SendGrid)
- Template HTML responsivo com gradiente
- Verificação de conexão no startup
- Tratamento de erros

**Configuração (.env):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-app-password
APP_NAME=Sistema de Workflow
FRONTEND_URL=http://localhost:5173
```

**Para Gmail:** Use "App Passwords" (https://myaccount.google.com/apppasswords)

**Arquivo:** `backend/src/services/emailService.ts`

### 3. Lógica de Negócio

**Arquivo:** `backend/src/services/passwordResetService.ts`

**Funções:**

#### `requestPasswordReset(email, ipAddress, userAgent)`
1. Busca usuário por email
2. **SEMPRE retorna sucesso** (previne enumeração de emails)
3. Se usuário existe:
   - Verifica se já existe token recente (5 min)
   - Gera token random de 32 bytes (hex)
   - Hasheia token com SHA-256
   - Salva no banco com expiração 1h
   - Envia email com link de recuperação
4. Captura IP e User-Agent para auditoria

#### `validateResetToken(token)`
1. Hasheia token recebido
2. Busca no banco
3. Verifica:
   - Token existe
   - Não foi usado
   - Não expirou
4. Retorna dados do usuário se válido

#### `resetPassword(token, newPassword, ipAddress, userAgent)`
1. Valida token
2. Inicia transação:
   - Marca token como usado
   - Atualiza senha do usuário (bcrypt)
   - Registra na auditoria LGPD
3. Commit ou rollback

#### `invalidateUserTokens(userId)`
- Marca todos tokens do usuário como usados
- Útil para logout forçado ou mudança de senha

### 4. Rate Limiting

**Arquivo:** `backend/src/middleware/rateLimit.ts`

```typescript
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hora
  max: 3,                     // 3 tentativas
  message: 'Muitas solicitações de recuperação. Tente novamente em 1 hora.'
});
```

**Objetivo:** Prevenir spam e tentativas de enumeração de emails

### 5. Endpoints REST

**Arquivo:** `backend/src/routes/authRoutes.ts`

#### POST `/api/auth/forgot-password` (com rate limit)
**Request:**
```json
{
  "email": "usuario@empresa.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Se o email existir, um link de recuperação será enviado"
}
```

**Nota:** Sempre retorna sucesso por segurança

---

#### POST `/api/auth/validate-reset-token`
**Request:**
```json
{
  "token": "abc123..."
}
```

**Response Sucesso:**
```json
{
  "success": true,
  "message": "Token válido"
}
```

**Response Erro:**
```json
{
  "success": false,
  "message": "Token inválido, expirado ou já usado"
}
```

---

#### POST `/api/auth/reset-password`
**Request:**
```json
{
  "token": "abc123...",
  "newPassword": "NovaSenha123",
  "confirmPassword": "NovaSenha123"
}
```

**Validações:**
- Senha mínima 6 caracteres
- Senhas devem coincidir
- Token válido

**Response Sucesso:**
```json
{
  "success": true,
  "message": "Senha redefinida com sucesso"
}
```

### 6. Limpeza Automática

**Arquivo:** `backend/src/server.ts`

```typescript
// Executa a cada 24h em produção
setInterval(async () => {
  await cleanExpiredTokens();  // Remove tokens expirados/usados
  await processDataDeletionQueue();  // LGPD
}, 24 * 60 * 60 * 1000);
```

---

## 🎨 Frontend (100% Completo)

### 1. Página de Solicitação

**Arquivo:** `frontend/src/pages/ForgotPasswordPage.tsx`

**Características:**
- Formulário com validação de email
- Loading state
- Mensagem de sucesso genérica (previne enumeração)
- Detecção e exibição de rate limit (429)
- Link de volta para login
- Gradiente azul/indigo de fundo
- Ícone de envelope (Mail)

**Rota:** `/forgot-password`

**Fluxo:**
1. Usuário digita email
2. Submit → POST `/api/auth/forgot-password`
3. Se sucesso: "Se o email existir, um link será enviado"
4. Se rate limit (429): "Muitas tentativas! Aguarde X minutos"

---

### 2. Página de Redefinição

**Arquivo:** `frontend/src/pages/ResetPasswordPage.tsx`

**Características:**
- Extração de token da URL (`?token=abc123...`)
- Validação de token ao carregar
- Campos de nova senha + confirmação
- Mostrar/ocultar senha (Eye/EyeOff)
- Indicador de força da senha (3 níveis)
- Validações client-side:
  - Mínimo 6 caracteres
  - Senhas devem coincidir
- Redirect automático para login após 3s
- Tratamento de token inválido/expirado

**Rota:** `/reset-password?token=abc123...`

**Fluxo:**
1. Página carrega → valida token automaticamente
2. Se inválido: Mostra erro + botão "Solicitar Novo Link"
3. Se válido: Mostra formulário de senha
4. Submit → POST `/api/auth/reset-password`
5. Sucesso → Aguarda 3s → Redireciona para `/login`

---

### 3. Link no Login

**Arquivo:** `frontend/src/pages/LoginPage.tsx` (modificado)

```tsx
<div className="mt-4 text-center">
  <Link
    to="/forgot-password"
    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
  >
    Esqueci minha senha
  </Link>
</div>
```

**Localização:** Abaixo do botão de login

---

### 4. Rotas

**Arquivo:** `frontend/src/App.tsx` (modificado)

```tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
  <Route path="/reset-password" element={<ResetPasswordPage />} />
  
  {/* Rotas protegidas */}
  <Route path="/*" element={<ProtectedRoute>...</ProtectedRoute>} />
</Routes>
```

**Nota:** Rotas públicas (não requerem autenticação)

---

## 🔒 Segurança

### 1. Prevenção de Enumeração de Emails
- Endpoint de solicitação **sempre retorna sucesso**
- Impede atacantes de descobrirem emails válidos

### 2. Tokens Seguros
- Gerados com `crypto.randomBytes(32)` (256 bits)
- Hasheados com SHA-256 antes de salvar no banco
- Se banco for comprometido, tokens originais não são expostos

### 3. Expiração e Uso Único
- Tokens expiram em 1 hora
- Podem ser usados apenas uma vez
- Após uso, marcados como `used = true`

### 4. Rate Limiting
- 3 tentativas por hora por IP
- Previne spam de emails
- Previne tentativas de enumeração em massa

### 5. Auditoria (LGPD)
- IP e User-Agent capturados em cada operação
- Reset registrado em `personal_data_audit`
- Permite rastreamento de atividades suspeitas

### 6. Email Seguro
- Avisos sobre phishing no template
- Link expira em 1 hora claramente mencionado
- Recomendação de não compartilhar link

---

## 📧 Template de Email

### Estrutura:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Recuperação de Senha - Sistema de Workflow</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
  <!-- Header com gradiente azul -->
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              padding: 40px 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">🔐 Recuperação de Senha</h1>
  </div>
  
  <!-- Conteúdo -->
  <div style="padding: 40px 20px; max-width: 600px; margin: 0 auto;">
    <p>Olá, <strong>{{userName}}</strong></p>
    
    <p>Recebemos uma solicitação para redefinir sua senha.</p>
    
    <!-- Botão de ação -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{resetLink}}" 
         style="background-color: #667eea; color: white; padding: 15px 40px; 
                text-decoration: none; border-radius: 5px; display: inline-block;">
        Redefinir Senha
      </a>
    </div>
    
    <p><strong>⏰ Este link expira em 1 hora</strong></p>
    
    <!-- Avisos de segurança -->
    <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p><strong>⚠️ Atenção:</strong></p>
      <ul>
        <li>Este link só pode ser usado uma vez</li>
        <li>Não compartilhe este link com ninguém</li>
        <li>Se não foi você, ignore este email</li>
      </ul>
    </div>
    
    <p>Ou copie e cole este link no seu navegador:</p>
    <p style="word-break: break-all; color: #666;">{{resetLink}}</p>
  </div>
  
  <!-- Footer -->
  <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666;">
    <p>Sistema de Workflow</p>
    <p style="font-size: 12px;">Este é um email automático, não responda.</p>
  </div>
</body>
</html>
```

### Versão Plain Text:
Também enviada para clientes que não suportam HTML

---

## 🧪 Como Testar

### 1. Configurar Email
Edite `backend/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-app-password
FRONTEND_URL=http://localhost:5173
```

### 2. Iniciar Servidores
```bash
# Backend
cd backend
npm run dev

# Frontend
cd packages/frontend
npm run dev
```

### 3. Testar Fluxo Completo

#### A) Solicitar Recuperação:
1. Acesse http://localhost:5173/login
2. Clique em "Esqueci minha senha"
3. Digite um email válido (ex: submissao@empresa.com)
4. Clique em "Enviar Link"
5. Veja mensagem de sucesso

#### B) Verificar Email:
1. Abra a caixa de entrada do email configurado
2. Procure email de "Sistema de Workflow"
3. Clique no botão "Redefinir Senha"

#### C) Redefinir Senha:
1. Será redirecionado para http://localhost:5173/reset-password?token=...
2. Digite nova senha (min 6 caracteres)
3. Confirme a senha
4. Clique em "Redefinir Senha"
5. Aguarde redirecionamento para login
6 Faça login com nova senha

#### D) Testar Rate Limit:
1. Solicite recuperação 4 vezes seguidas
2. Na 4ª tentativa, deve ver: "Muitas tentativas! Aguarde..."
3. Aguarde 1 hora ou reinicie servidor para resetar

#### E) Testar Token Expirado:
1. Solicite recuperação
2. Aguarde 1 hora e 1 minuto
3. Tente usar o link
4. Deve ver: "Link Inválido - Este link expirou"

#### F) Testar Token Usado:
1. Solicite recuperação
2. Use o token para redefinir senha
3. Tente usar o mesmo link novamente
4. Deve ver: "Token já foi usado"

---

## 📊 Monitoramento

### Logs do Sistema:
```typescript
// Email enviado
console.log('Email de recuperação enviado para:', user.email);

// Token validado
console.log('Token validado para usuário:', user.id);

// Senha redefinida
console.log('Senha redefinida para usuário:', user.id);

// Token expirado/usado
console.error('Token inválido:', { token, error });
```

### Consultas SQL Úteis:

```sql
-- Ver todos os tokens pendentes
SELECT * FROM password_reset_tokens 
WHERE used = FALSE AND expires_at > NOW();

-- Ver tentativas por IP
SELECT ip_address, COUNT(*) as tentativas,
       MAX(created_at) as ultima_tentativa
FROM password_reset_tokens
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
ORDER BY tentativas DESC;

-- Ver tokens expirados não limpos
SELECT COUNT(*) FROM password_reset_tokens
WHERE (used = TRUE OR expires_at < NOW());

-- Limpar manualmente tokens antigos
DELETE FROM password_reset_tokens
WHERE used = TRUE OR expires_at < NOW();
```

---

## 🚀 Próximos Passos (Opcionais)

### Melhorias Futuras:
1. **2FA (Two-Factor Authentication)**
   - Código SMS ou autenticador
   - Email + código de 6 dígitos

2. **Histórico de Senhas**
   - Impedir reutilização de senhas antigas
   - Armazenar hash das últimas 5 senhas

3. **Notificação de Mudança de Senha**
   - Email confirmando mudança
   - Link para reverter se não foi o usuário

4. **Regras de Senha Mais Fortes**
   - Mínimo 8 caracteres
   - Letras maiúsculas + minúsculas + números + símbolos
   - Score de força da senha (zxcvbn)

5. **Captcha**
   - reCAPTCHA v3 no formulário
   - Previne bots

6. **OAuth/Social Login**
   - Google, Microsoft, GitHub
   - "Recuperar senha" não se aplica

---

## 📝 Checklist de Implementação

### Backend:
- [x] Tabela password_reset_tokens criada
- [x] Serviço de email configurado
- [x] Lógica de geração de tokens
- [x] Lógica de validação de tokens
- [x] Lógica de reset de senha
- [x] Rate limiting (3/hora)
- [x] Controllers REST
- [x] Rotas registradas
- [x] Swagger documentation
- [x] Limpeza automática de tokens
- [x] Auditoria LGPD
- [x] Variáveis de ambiente
- [x] .env.example atualizado

### Frontend:
- [x] ForgotPasswordPage criada
- [x] ResetPasswordPage criada
- [x] Link no LoginPage
- [x] Rotas registradas no App.tsx
- [x] Validações client-side
- [x] Tratamento de erros
- [x] Loading states
- [x] UI/UX consistente
- [x] Mensagens de sucesso/erro
- [x] Ícones (lucide-react)

### Testes:
- [ ] Teste de envio de email
- [ ] Teste de token válido
- [ ] Teste de token expirado
- [ ] Teste de token usado
- [ ] Teste de rate limiting
- [ ] Teste de senha fraca
- [ ] Teste de senhas não coincidentes
- [ ] Teste de email inválido

---

## ⚠️ Troubleshooting

### Email não está sendo enviado:
1. Verifique configuração SMTP no .env
2. Para Gmail, use "App Passwords" (não senha normal)
3. Verifique logs do terminal: `Email de recuperação enviado`
4. Teste conexão SMTP no startup

### Token sempre inválido:
1. Verifique se URL tem parâmetro `?token=...`
2. Verifique se token não expirou (1h)
3. Verifique se token não foi usado
4. Consulte banco: `SELECT * FROM password_reset_tokens WHERE token_hash = '...'`

### Rate limit não funciona:
1. Verifique se `passwordResetLimiter` está aplicado na rota
2. Rate limit é por IP (use IPs diferentes para testar)
3. Em development, rate limit pode estar desabilitado

### Frontend não compila:
1. Verifique se `lucide-react` foi instalado: `npm list lucide-react`
2. Reinstale: `npm install lucide-react --save`
3. Limpe cache: `npm run build`

---

## 📦 Arquivos Criados/Modificados

### Backend (11 arquivos):

**Novos (5):**
1. `backend/src/database/passwordResetMigrations.ts`
2. `backend/src/services/emailService.ts`
3. `backend/src/services/passwordResetService.ts`
4. `backend/src/controllers/passwordResetController.ts`
5. `backend/package.json` (nodemailer adicionado)

**Modificados (6):**
1. `backend/src/routes/authRoutes.ts` (3 rotas adicionadas)
2. `backend/src/middleware/rateLimit.ts` (passwordResetLimiter)
3. `backend/src/config/environment.ts` (SMTP vars)
4. `backend/src/database/migrations.ts` (import + call createPasswordResetTable)
5. `backend/src/server.ts` (email verification + cleanup)
6. `backend/.env.example` (email config section)

### Frontend (4 arquivos):

**Novos (2):**
1. `frontend/src/pages/ForgotPasswordPage.tsx`
2. `frontend/src/pages/ResetPasswordPage.tsx`

**Modificados (2):**
1. `frontend/src/pages/LoginPage.tsx` (link "Esqueci senha")
2. `frontend/src/App.tsx` (rotas /forgot-password e /reset-password)

---

## 🎯 Conclusão

Sistema de recuperação de senha completo e seguro, seguindo as melhores práticas da indústria:

✅ Tokens criptografados (SHA-256)  
✅ Expiração e uso único  
✅ Rate limiting anti-spam  
✅ Prevenção de enumeração de emails  
✅ Emails profissionais com HTML  
✅ Auditoria LGPD completa  
✅ UI/UX intuitiva  
✅ Tratamento robusto de erros

**Status:** Pronto para produção após configuração de SMTP e testes.
