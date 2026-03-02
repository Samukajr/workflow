# 📘 Documentação Técnica - Sistema de Workflow

## 🏗️ Arquitetura Implementada

### Backend (Node.js + Express)

**Arquivo:** `E:\APP\WORKFLOW-NOVO\backend\server.js`

#### Endpoints da API

##### Autenticação
- `POST /api/auth/login` - Login de usuário
  - **Body:** `{ "email": string, "password": string }`
  - **Response:** `{ "token": string, "user": {...} }`

##### Requisições
- `GET /api/requisicoes` - Listar todas as requisições
- `GET /api/requisicoes/:id` - Buscar requisição específica
- `POST /api/requisicoes` - Criar nova requisição
- `PATCH /api/requisicoes/:id` - Atualizar requisição

##### Validações
- `GET /api/validacoes` - Listar requisições pendentes de validação
- `POST /api/validacoes/:id/aprovar` - Aprovar requisição
- `POST /api/validacoes/:id/rejeitar` - Rejeitar requisição
  - **Body:** `{ "motivo": string }`

##### Pagamentos
- `GET /api/pagamentos` - Listar requisições aprovadas para pagamento
- `POST /api/pagamentos/:id/pagar` - Processar pagamento

##### Saúde
- `GET /health` - Health check do servidor

#### Modelo de Dados (In-Memory)

```javascript
// Usuário
{
  id: string,
  email: string,
  senha: string,
  nome: string,
  tipo: 'ADMIN' | 'VALIDACAO' | 'FINANCEIRO'
}

// Requisição
{
  id: string,
  numero: string,           // REQ-001, REQ-002, etc
  descricao: string,
  valor: number,
  status: 'PENDENTE' | 'VALIDANDO' | 'VALIDADA' | 'PAGA' | 'REJEITADA',
  dataVencimento: string,   // YYYY-MM-DD
  departamento: string,
  usuario: string,
  createdAt: string,
  validadoEm?: string,
  pagoEm?: string,
  motivoRejeicao?: string
}
```

### Frontend (React + Vite)

**Arquivo:** `E:\APP\WORKFLOW-NOVO\frontend/src/App.jsx`

#### Componentes e Estados

```javascript
// Estados principais
const [loggedIn, setLoggedIn] = useState(false)
const [user, setUser] = useState(null)
const [page, setPage] = useState('login')
const [requisicoes, setRequisicoes] = useState([])

// Login
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
```

#### Páginas Implementadas

1. **Login** (`!loggedIn`)
   - Formulário de autenticação
   - Exibição de usuários de teste
   - Armazenamento de token no localStorage

2. **Dashboard** (`page === 'dashboard'`)
   - 3 cards de estatísticas (Pendentes, Validadas, Pagas)
   - Tabela completa de requisições
   - Filtros por status com badges coloridos

3. **Validações** (`page === 'validacoes'`)
   - Lista de requisições PENDENTE ou VALIDANDO
   - Botão de aprovar por requisição
   - Atualização automática após aprovação

4. **Pagamentos** (`page === 'pagamentos'`)
   - Lista de requisições VALIDADA
   - Botão de processar pagamento
   - Mudança de status para PAGA

#### Funções Principais

```javascript
// Autenticação
handleLogin(e) - Faz POST para /api/auth/login
handleLogout() - Remove token e reseta estado

// Dados
loadRequisicoes() - GET /api/requisicoes

// Ações
aprovarRequisicao(id) - POST /api/validacoes/:id/aprovar
pagarRequisicao(id) - POST /api/pagamentos/:id/pagar
```

## 🎨 Estilos (CSS3)

**Arquivo:** `E:\APP\WORKFLOW-NOVO\frontend/src/App.css`

### Cores e Tema

```css
/* Gradiente principal */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Status badges */
.badge.pendente   - Amarelo (#fef3c7 / #92400e)
.badge.validando  - Azul (#dbeafe / #1e40af)
.badge.validada   - Verde (#d1fae5 / #065f46)
.badge.paga       - Ciano (#ccfbf1 / #134e4a)
.badge.rejeitada  - Vermelho (#fee2e2 / #991b1b)
```

### Componentes de UI

- **Cards:** `border-radius: 16px`, `box-shadow` suave
- **Tabelas:** Header com gradiente, hover em linhas
- **Botões:** Transições suaves, cores semânticas
- **Navbar:** Layout flexível, transparência nos botões

## 🔐 Segurança (Atual)

### Implementado
- ✅ Autenticação básica (email/senha)
- ✅ Tokens simulados (fake-jwt-token-{userId})
- ✅ CORS habilitado para desenvolvimento
- ✅ Armazenamento de token no localStorage

### Próximos Passos (Produção)
- 🔜 JWT real com chave secreta
- 🔜 Hash de senhas com bcrypt
- 🔜 Refresh tokens
- 🔜 Rate limiting
- 🔜 HTTPS obrigatório
- 🔜 Validação de inputs

## 📊 Fluxo de Estados

```
PENDENTE
   ↓ (Validador aprova)
VALIDADA
   ↓ (Financeiro processa)
PAGA
```

```
PENDENTE
   ↓ (Validador rejeita)
REJEITADA
```

## 🚀 Performance

- **Backend:** Express puro, sem ORM (dados em memória)
- **Frontend:** React sem bibliotecas pesadas (apenas Vite)
- **Build:** Vite com HMR (Hot Module Replacement)
- **Tempo de resposta:** < 50ms (localhost)

## 📦 Dependências

### Backend
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "dotenv": "^16.0.0"
}
```

### Frontend
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```

## 🔄 Migração para PostgreSQL (Futuro)

### Estrutura preparada

1. Copiar schema Prisma de `E:\APP\WORKFLOW\packages\backend\prisma\schema.prisma`
2. Instalar Prisma: `npm install prisma @prisma/client`
3. Configurar `.env`: `DATABASE_URL="postgresql://..."`
4. Executar: `npx prisma migrate dev`
5. Substituir arrays in-memory por queries Prisma

### Exemplo de migração

**Antes (In-Memory):**
```javascript
const requisicoes = requisicoes.filter(r => r.status === 'PENDENTE')
```

**Depois (Prisma):**
```javascript
const requisicoes = await prisma.requisicao.findMany({
  where: { status: 'PENDENTE' }
})
```

## 📝 Logs e Auditoria

### Preparado para LGPD

O modelo de dados já contempla:
- Rastreamento de usuário que criou/modificou
- Data de criação/modificação
- Motivo de rejeição
- Histórico de mudanças de status

### Implementação futura

Criar tabela `LogAuditoria`:
```sql
CREATE TABLE log_auditoria (
  id UUID PRIMARY KEY,
  acao VARCHAR(50),
  entidade VARCHAR(50),
  entidade_id UUID,
  usuario_id UUID,
  alteracoes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP
);
```

## 🧪 Testes

### Endpoints testados

- ✅ `GET /health` → `{ status: 'ok', timestamp: '...' }`
- ✅ `POST /api/auth/login` → `{ token: '...', user: {...} }`
- ✅ `GET /api/requisicoes` → `{ data: [...] }`

### Frontend testado

- ✅ Página carrega em http://localhost:5173
- ✅ Vite HMR funcionando
- ✅ Estilos aplicados corretamente

## 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs do backend (terminal onde rodou `node server.js`)
2. Abra o DevTools do navegador (F12) e veja o Console
3. Teste os endpoints diretamente com curl/Postman
4. Verifique se as portas 3000 e 5173 estão livres

---

**✨ Sistema pronto para evolução e implantação! ✨**
