# 🚀 Guia Rápido de Inicialização

## Status Atual

✅ **Backend**: Dependências instaladas (593 packages)
✅ **Frontend**: Dependências sendo instaladas
✅ **Banco de Dados**: Configurado com Docker Compose
✅ **Documentação**: Completa

## Próximos Passos

### 1. Iniciar o Banco de Dados

```bash
# Na pasta raiz do projeto
docker-compose up -d
```

Isso iniciará:
- PostgreSQL em `localhost:5432`
- pgAdmin em `http://localhost:5050`

Credenciais pgAdmin:
- Email: `admin@admin.com`
- Senha: `admin`

### 2. Iniciar o Backend

```bash
cd backend
npm run dev
```

O backend estará disponível em:
- API: `http://localhost:3000`
- Documentação Swagger: `http://localhost:3000/api-docs`

### 3. Iniciar o Frontend

Em outro terminal:

```bash
cd frontend
npm run dev
```

O frontend estará disponível em:
- Aplicação: `http://localhost:5173`

## Testar a Aplicação

1. Abra seu navegador em `http://localhost:5173`
2. Faça login com uma das credenciais:
   - **Submissão**: submissao@empresa.com / DemoPass@123
   - **Validação**: validacao@empresa.com / DemoPass@123
   - **Financeiro**: financeiro@empresa.com / DemoPass@123

## Arquivos Importantes

- [README.md](./README.md) - Overview do projeto
- [INSTALLATION.md](./INSTALLATION.md) - Guia de instalação detalhado
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Sumário técnico completo
- [backend/README.md](./backend/README.md) - Documentação do backend
- [frontend/README.md](./frontend/README.md) - Documentação do frontend

## Troubleshooting

### Erro ao conectar ao banco de dados

```bash
# Verificar se Docker está rodando
docker ps

# Ver logs do PostgreSQL
docker-compose logs postgres

# Reiniciar tudo
docker-compose down
docker-compose up -d
```

### Limpar cache e reinstalar

```bash
# Backend
cd backend
rm -r node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -r node_modules package-lock.json
npm install
```

### Portas em uso

Se as portas padrão estão em uso, você pode configurar:

- Backend `.env`: `PORT=3001` (ao invés de 3000)
- Frontend `vite.config.ts`: `port: 5174` (ao invés de 5173)

## Estrutura de Dados Criada Automaticamente

Ao iniciar o backend pela primeira vez, as seguintes tabelas são criadas:

1. `users` - Usuários dos 3 departamentos
2. `payment_requests` - Requisições de pagamento
3. `payment_workflows` - Histórico de fluxo
4. `audit_logs` - Logs de auditoria (LGPD)
5. `gdpr_consents` - Consentimentos LGPD

E 3 usuários de teste são inseridos automaticamente.

## API Endpoints Principais

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/me` - Dados do usuário autenticado

### Requisições de Pagamento
- `POST /api/payments/submit` - Submeter nova requisição  
- `POST /api/payments/validate` - Validar requisição
- `POST /api/payments/process` - Processar pagamento
- `GET /api/payments` - Listar requisições
- `GET /api/payments/{id}` - Detalhes de uma requisição
- `GET /api/payments/dashboard/stats` - Estatísticas do dashboard

## Permissões por Departamento

| Ação | Submissão | Validação | Financeiro |
|---|---|---|---|
| Submeter requisições | ✅ | ❌ | ❌ |
| Validar requisições | ❌ | ✅ | ❌ |
| Processar pagamentos | ❌ | ❌ | ✅ |
| Ver dashboard | ✅ | ✅ | ✅ |

## Desenvolvendo

### Adicionar Nova Página

1. Criar componente em `frontend/src/pages/`
2. Adicionar rota em `frontend/src/App.tsx`
3. Importar em `frontend/src/components/Sidebar.tsx` se necessário

### Adicionar Novo Endpoint

1. Criar função em `backend/src/database/queries.ts`
2. Criar serviço em `backend/src/services/`
3. Criar controller em `backend/src/controllers/`
4. Adicionar rota em `backend/src/routes/`

## Commits e Versionamento

Primeiro commit sugerido:

```bash
git add .
git commit -m "feat: Initial project setup with full workflow structure"
```

## Próximas Fases Recomendadas

1. ✅ Completar implementação das páginas de validação e processamento
2. ✅ Adicionar testes automatizados (Jest, Vitest)
3. ✅ Implementar CI/CD (GitHub Actions)
4. ✅ Adicionar notificações por email
5. ✅ Criar sistema de relatórios
6. ✅ Deploy em produção

---

**Projeto desenvolvido com segurança LGPD e melhores práticas modernas! 🎉**
