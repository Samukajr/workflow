# Checklist de Homologacao E2E

## 1. Objetivo
Validar o sistema ponta a ponta apos as fases 3E e 3F, cobrindo:
- Fluxo funcional completo (Auth, Pagamentos, Analytics, Banking, LGPD)
- Seguranca basica e prontidao de producao
- Criterios de aceite para Go/No-Go

## 2. Escopo da rodada
Aplicacao alvo:
- Backend: `backend`
- Frontend: `packages/frontend`

Versoes e baseline:
- Branch: `master`
- Commit minimo recomendado: `91148f9` (Fase 3F)

## 3. Pre-condicoes
- Banco PostgreSQL ativo e acessivel
- Variaveis de ambiente configuradas (`backend/.env`)
- `JWT_SECRET` forte em ambiente de producao (>= 32 chars)
- `CORS_ALLOWED_ORIGINS` definido para a URL real do frontend
- Dependencias instaladas na raiz do projeto

Checklist rapido:
- [ ] `npm run type-check` na raiz sem erros
- [ ] `npm run build` na raiz sem erros
- [ ] Backend sobe sem erro
- [ ] Frontend sobe sem erro

## 4. Smoke tecnico inicial
Com backend em execucao:
- [ ] `GET /health` retorna 200
- [ ] `GET /health/live` retorna 200
- [ ] `GET /health/ready` retorna 200 com database `up`
- [ ] `/api-docs` acessivel

Comandos uteis (PowerShell):
```powershell
Invoke-RestMethod http://localhost:3000/health
Invoke-RestMethod http://localhost:3000/health/live
Invoke-RestMethod http://localhost:3000/health/ready
```

## 5. Checklist funcional E2E

### 5.1 Autenticacao e sessao
- [ ] Login com usuario valido (submissao)
- [ ] Login com usuario valido (validacao)
- [ ] Login com usuario valido (financeiro)
- [ ] Login invalido retorna erro amigavel
- [ ] Rota protegida redireciona para login sem token
- [ ] Logout invalida sessao no frontend

### 5.2 Recuperacao de senha
- [ ] Acesso a pagina `forgot-password`
- [ ] Solicitacao de reset com email valido retorna sucesso
- [ ] Rate limit de reset ativo apos excesso
- [ ] Token de reset valido abre pagina de redefinicao
- [ ] Redefinicao com senha valida conclui e redireciona para login
- [ ] Token invalido/expirado mostra mensagem correta

### 5.3 Fluxo principal de pagamentos
- [ ] Submissao: criar requisicao com upload valido (pdf/jpg/png)
- [ ] Validacao: aprovar requisicao como departamento `validacao`
- [ ] Financeiro: processar requisicao aprovada
- [ ] Financeiro: encerrar requisicao processada
- [ ] Listagem reflete status em cada etapa
- [ ] Detalhes da requisicao exibem historico completo

### 5.4 Governanca (Fase 2)
- [ ] Checklist de conformidade carregado por requisicao
- [ ] Regras de alcada listadas corretamente
- [ ] Historico de aprovacoes exibido
- [ ] Blocklist: inserir fornecedor e bloquear operacao quando aplicavel

### 5.5 Analytics (Fase 3C)
- [ ] Dashboard analytics abre sem erro
- [ ] Filtro de periodo funciona (`today/week/month/quarter/year`)
- [ ] Cards KPI carregam valores
- [ ] Graficos renderizam sem quebra visual

### 5.6 Banking/ERP (Fase 3D)
- [ ] Criar integracao bancaria
- [ ] Testar conexao da integracao
- [ ] Iniciar pagamento via integracao
- [ ] Webhook do banco processa sem erro
- [ ] Tela de reconciliacao mostra status esperado
- [ ] Lista de reconciliacoes pendentes carregada

### 5.7 LGPD
- [ ] Registrar consentimento
- [ ] Revogar consentimento
- [ ] Solicitar exclusao de dados
- [ ] Exportar dados pessoais (download)
- [ ] Consultar trilha de auditoria
- [ ] Aprovar solicitacao de delecao com perfil autorizado

## 6. Checklist de seguranca e prontidao
- [ ] CORS bloqueia origem nao permitida em producao
- [ ] Helmet ativo (headers de seguranca presentes)
- [ ] Rate limit ativo para auth e reset de senha
- [ ] Sem stack trace exposta para cliente
- [ ] Logs de requisicao com IP/User-Agent ativos
- [ ] Graceful shutdown testado (SIGINT/SIGTERM)

## 7. Testes de regressao rapida
- [ ] Navegacao geral sem telas em branco
- [ ] Rotas legadas (`/requisicoes`, `/validacoes`, `/pagamentos`) redirecionam
- [ ] Performance aceitavel em dashboard e listagens
- [ ] Sem erro critico no console do navegador

## 8. Evidencias obrigatorias
Anexar para cada bloco validado:
- Captura de tela (frontend)
- Payload de request/response (quando aplicavel)
- Horario da execucao
- Usuario/departamento usado
- Resultado (PASS/FAIL)

Template de registro:
```text
ID:
Cenario:
Usuario:
Passos executados:
Resultado esperado:
Resultado obtido:
Evidencia (arquivo/link):
Status: PASS | FAIL | BLOCKED
Observacoes:
```

## 9. Criterio Go/No-Go
Go:
- 100% dos cenarios criticos PASS:
  - Auth/login
  - Recuperacao de senha
  - Fluxo submit -> validate -> process -> close
  - Health `/health/ready` OK
  - Banking initiate + reconciliation
  - LGPD export + consent
- 0 bug critico aberto
- <= 3 bugs major com workaround aprovado

No-Go:
- Qualquer falha em cenario critico
- Inconsistencia de dados no fluxo financeiro
- Falha de seguranca (CORS/rate limit/exposicao de erro)

## 10. Plano de execucao sugerido (1 dia)
- Bloco A (1h): Smoke tecnico e auth
- Bloco B (2h): Fluxo de pagamentos completo
- Bloco C (1h): Analytics e relatorios
- Bloco D (1h): Banking e reconciliacao
- Bloco E (1h): LGPD e seguranca
- Bloco F (30m): consolidacao de evidencias + decisao Go/No-Go

## 11. Responsaveis
- QA/Homologacao: execucao dos cenarios
- Tech Lead: triagem e severidade de bugs
- Produto/Negocio: validacao funcional final
- Operacoes: checklist de deploy e monitoracao
