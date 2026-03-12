# 🚀 Workflow de Pagamentos - Sistema de Validação e Pagamento de Notas Fiscais

## ⚡ Início Rápido

Siga os 3 passos abaixo na ordem correta para ter o sistema rodando localmente.

---

## ⚙️ Requisitos

- **Docker Desktop** ([Baixar aqui](https://www.docker.com/products/docker-desktop))
- **Node.js** 18+ ([Baixar aqui](https://nodejs.org/))
- **PostgreSQL** (via Docker - incluído)

---

## 🎯 Início Rápido (3 passos)

### 1️⃣ Terminal 1 - PostgreSQL
```bash
cd e:\APP\WORKFLOW
docker-compose up -d
```

### 2️⃣ Terminal 2 - Backend
```bash
cd backend
npm install
npm run migrate
npm run fix:login
npm run dev
```
✅ Aguarde pela mensagem: `🚀 Server listening on port 3000`

### 3️⃣ Terminal 3 - Frontend
```bash
cd packages/frontend
npm install
npm run dev
```

Depois acesse: **http://localhost:5173**

---

## 🔐 Credenciais de Teste

Todos com senha: **`DemoPass@123`**

| Email | Acesso |
|-------|--------|
| `superadmin@empresa.com` | ⭐⭐⭐ Total (Recomendado) |
| `admin@empresa.com` | ⭐⭐⭐ Total |
| `financeiro@empresa.com` | ⭐⭐ Financeiro |
| `validacao@empresa.com` | ⭐⭐ Validação |
| `submissao@empresa.com` | ⭐ Submissão |

---

## 🔍 Verificar Instalação

```bash
cd backend
npm run diagnose.js
```

---

## 📊 Arquitetura

```
┌─────────────────────────────────────────┐
│         Frontend (React + Vite)         │
│         http://localhost:5173           │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼─────────┐
        │   Backend API    │
        │ http://localhost │
        │     :3000        │
        └────────┬─────────┘
                 │
        ┌────────▼─────────┐
        │    PostgreSQL    │
        │ (PostgreSQL:5432)│
        └──────────────────┘
```

---

## 📁 Estrutura do Projeto

```
WORKFLOW/
├── backend/              # API (Express + TypeScript)
├── packages/
│   └── frontend/         # Interface (React)
├── docker-compose.yml    # Orquestração Docker
├── .env                  # Variáveis de ambiente
└── docs/                 # Documentação
```

---

## 🛠️ Comandos Úteis

### Backend
```bash
cd backend

npm run dev              # Iniciar em desenvolvimento
npm run build           # Compilar TypeScript
npm run migrate         # Criar tabelas do banco
npm run fix:login       # Corrigir problemas de login
npm run users:list      # Listar usuários
npm run users:restore   # Restaurar usuários
npm run seed            # Popular banco com dados
npm run test            # Executar testes
```

### Frontend
```bash
cd packages/frontend

npm run dev             # Iniciar em desenvolvimento
npm run build           # Compilar para produção
npm run preview         # Preview da build
npm run type-check      # Verificar tipos TypeScript
```

### Docker
```bash
cd e:\APP\WORKFLOW

docker-compose ps       # Ver containers rodando
docker-compose down     # Parar containers
docker-compose logs -f  # Ver logs em tempo real
```

---

## 🆘 Problemas Comuns

### ❌ "Connection refused"
Backend não consegue conectar ao PostgreSQL.
```bash
docker-compose ps  # PostgreSQL está rodando?
```

### ❌ "Failed to load resource: 404"
Frontend não consegue conectar ao backend.
```bash
# Verifique se backend está rodando
npm run dev  # no diretório backend
```

### ❌ "Database does not exist"
Banco não foi inicializado.
```bash
npm run migrate
```

---

## 📖 Documentação Completa

- [API Documentation](docs/API.md)
- [Arquitetura](docs/ARQUITETURA.md)
- [Segurança LGPD](docs/LGPD.md)
- [Como Contribuir](docs/CONTRIBUICAO.md)

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Revise os logs dos terminais
2. Verifique se o PostgreSQL está rodando: `docker-compose ps`
3. Verifique se o backend está ativo na porta 3000
4. Limpe cache do navegador (Ctrl+Shift+Delete)
5. Reinicie os serviços

---

## ✅ Checklist Inicial

- [ ] Docker Desktop instalado
- [ ] Node.js 18+ instalado
- [ ] PostgreSQL rodando (`docker-compose up -d`)
- [ ] Backend iniciado (`npm run dev`)
- [ ] Frontend iniciado (`npm run dev`)
- [ ] Acesso a http://localhost:5173
- [ ] Conseguiu fazer login

---

**Documentação completa → [docs/](docs/)** ✅
