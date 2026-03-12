# Sistema de Workflow de Pagamentos

## Visão Geral

Sistema completo para gerenciamento de fluxo de requisições de pagamento com validação de notas fiscais e boletos, com controles técnicos de segurança e privacidade para suporte à conformidade LGPD e legislação brasileira aplicável.

## Arquitetura

```
┌─────────────────────────────────────────────────┐
│         Frontend (React + TypeScript)            │
│  - Dashboard, Submissão, Validação, Pagamentos  │
├─────────────────────────────────────────────────┤
│        Backend (Node.js + TypeScript)           │
│  - API REST com JWT, Auditoria, LGPD            │
├─────────────────────────────────────────────────┤
│     Banco de Dados (PostgreSQL)                 │
│  - Tabelas: users, payment_requests, workflows  │
└─────────────────────────────────────────────────┘
```

## Componentes

### Backend
- Express.js com TypeScript
- PostgreSQL para persistência
- JWT para autenticação
- Multer para upload de arquivos
- Swagger para documentação
- Logs com Pino

### Frontend
- React 18 com TypeScript
- Vite para build
- React Router para navegação
- Zustand para gerenciamento de estado
- Tailwind CSS para estilos
- Axios para requisições HTTP

## Fluxo de Pagamento

1. **Submissão** (Departamento: submissao)
   - Upload de nota fiscal ou boleto
   - Informações do fornecedor e valor
   - Requisição criada em status "pendente_validacao"

2. **Validação** (Departamento: validacao)
   - Revisão de documentos
   - Aprovação ou rejeição
   - Status alterado para "validado" ou "rejeitado"

3. **Financeiro** (Departamento: financeiro)
   - Processamento do pagamento
   - Confirmação da transação
   - Status alterado para "pago"

## Conformidade LGPD

- Auditoria completa de todas as ações
- Registro de consentimento do usuário
- Logs com IP e User-Agent
- Criptografia de senhas com bcrypt
- Expiração de tokens JWT
- Backup de dados

## Documentação Legal e Compliance

- Política de Privacidade: [docs/POLITICA_PRIVACIDADE.md](docs/POLITICA_PRIVACIDADE.md)
- Termos de Uso: [docs/TERMOS_DE_USO.md](docs/TERMOS_DE_USO.md)
- Resumo LGPD técnico: [docs/LGPD.md](docs/LGPD.md)

## Credenciais de Demonstração

### Usuários Pré-cadastrados

| Departamento | Email | Senha |
|---|---|---|
| Submissão | submissao@empresa.com | DemoPass@123 |
| Validação | validacao@empresa.com | DemoPass@123 |
| Financeiro | financeiro@empresa.com | DemoPass@123 |

## Iniciando o Projeto

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env com credenciais do PostgreSQL
npm run dev
```

API estará em: http://localhost:3000
Documentação em: http://localhost:3000/api-docs

### Frontend

```bash
cd packages/frontend
npm install
npm run dev
```

Frontend estará em: http://localhost:5173

## Próximos Passos

- [ ] Implementar páginas de validação e processamento de pagamentos
- [ ] Adicionar exportação de relatórios
- [ ] Implementar notificações por email
- [ ] Adicionar filtros avançados
- [ ] Implementar testes automatizados
- [ ] Configurar CI/CD
- [ ] Deploy em produção (Docker, K8s)

## Suporte

Para dúvidas ou problemas, consulte a documentação nos arquivos README de cada módulo.
