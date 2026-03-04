# 🚀 Quick Start

## ⚡ Inicio Rápido (5 minutos)

### 1️⃣ Instalar Dependências
```bash
npm install
```

### 2️⃣ Configurar Ambiente
```bash
cp .env.example .env
# Edite o .env com suas credenciais PostgreSQL
```

### 3️⃣ Iniciar Desenvolvimento

**Terminal 1 - Backend:**
```bash
cd packages/backend
npm run dev
# http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd packages/frontend
npm run dev
# http://localhost:5173
```

### 4️⃣ Acessar a Aplicação
- URL: **http://localhost:5173**
- Email (teste): `demo@empresa.com`
- Senha (teste): `123456`

---

## 📦 Docker (Alternativa)

```bash
docker-compose up -d
# Aguarde ~30 segundos e acesse http://localhost:5173
```

---

## 📚 Documentação Completa

| Documento | Conteúdo |
|-----------|----------|
| [INSTALACAO.md](./docs/INSTALACAO.md) | Instalação detalhada |
| [ARQUITETURA.md](./docs/ARQUITETURA.md) | Estrutura do projeto |
| [API.md](./docs/API.md) | Endpoints e exemplos |
| [LGPD.md](./docs/LGPD.md) | Conformidade e segurança |
| [CONTRIBUICAO.md](./docs/CONTRIBUICAO.md) | Como contribuir |

---

## 🛠️ Scripts Úteis

```bash
# Desenvolvimento
npm run dev            # Inicia tudo
npm run dev --workspace=backend  # Só backend
npm run dev --workspace=frontend # Só frontend

# Build
npm run build          # Compila para produção

# Validação
npm run lint           # Verifica estilo
npm run type-check     # Verifica tipos TS
npm run test           # Roda testes

# Banco de Dados
npm run migrate        # Executa migrações Prisma
npm run seed           # Popular dados de teste
```

---

## 🔑 Variáveis de Ambiente Essenciais

```env
# Banco de Dados
DB_HOST=localhost
DB_USERNAME=workflow_user
DB_PASSWORD=sua_senha

# JWT
JWT_SECRET=chave_longa_muito_segura

# API
BACKEND_PORT=3000
CORS_ORIGIN=http://localhost:5173
```

---

## ✅ Checklist de Primeiro Uso

- [ ] Node.js 18+ instalado
- [ ] PostgreSQL rodando
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado
- [ ] Terminal 1: Backend iniciado
- [ ] Terminal 2: Frontend iniciado
- [ ] Acessou http://localhost:5173
- [ ] Fez login com sucesso

---

## 🆘 Troubleshooting

| Problema | Solução |
|----------|---------|
| Porta 3000 em uso | Mude `BACKEND_PORT` no .env |
| BD não conecta | Verifique credenciais em .env |
| yarn vs npm | Use o mesmo em todo projeto |
| Erro de tipos | Execute `npm run type-check` |

---

**Precisa de ajuda?** Consulte a [documentação completa](./docs/INSTALACAO.md)
