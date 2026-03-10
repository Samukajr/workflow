# API Reference

## 📚 Documentação da API REST

Base URL: `http://localhost:3000/api`

## 🔐 Autenticação

Todas as requisições (exceto `/auth`) requerem header:
```
Authorization: Bearer <token_jwt>
```

## 📋 Endpoints

### 🔑 Authentication

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@empresa.com",
  "password": "senha"
}

Response 200:
{
  "token": "eyJhbGc...",
  "user": {
    "id": "user_123",
    "nome": "João Silva",
    "email": "joao@empresa.com",
    "departamento": "VALIDACAO"
  }
}
```

#### Refresh Token
```http
POST /auth/refresh
Authorization: Bearer <refresh_token>

Response 200:
{
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### 📋 Requisições

#### Listar Requisições
```http
GET /requisicoes?status=PENDENTE&page=1&limit=10

Response 200:
{
  "data": [
    {
      "id": "req_123",
      "numero": "REQ-001",
      "descricao": "Fatura de Telefone",
      "valor": 1200.50,
      "status": "PENDENTE",
      "dataVencimento": "2026-03-15",
      "usuario": { "id": "user_123", "nome": "João" },
      "documentos": [
        {
          "id": "doc_123",
          "nome": "NF-001.pdf",
          "tipo": "NOTA_FISCAL",
          "tamanho": 204800
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45
  }
}
```

#### Criar Requisição (com upload)
```http
POST /requisicoes
Content-Type: multipart/form-data

FormData:
- descricao: "Fatura de Telefone"
- valor: "1200.50"
- dataVencimento: "2026-03-15"
- documentos: [file1.pdf, file2.pdf]

Response 201:
{
  "id": "req_123",
  "numero": "REQ-0001",
  "status": "PENDENTE",
  "createdAt": "2026-03-02T10:30:00Z"
}
```

#### Obter Detalhes
```http
GET /requisicoes/:id

Response 200:
{
  "id": "req_123",
  "numero": "REQ-001",
  ...completo
}
```

#### Atualizar Requisição
```http
PATCH /requisicoes/:id
Content-Type: application/json

{
  "descricao": "Novo texto",
  "dataVencimento": "2026-03-20"
}

Response 200: { ...updated }
```

---

### ✅ Validações

#### Listar Pendências
```http
GET /validacoes?status=PENDENTE

Response 200:
{
  "data": [
    {
      "id": "val_123",
      "requisicao": { ...data },
      "status": "PENDENTE",
      "createdAt": "2026-03-02"
    }
  ]
}
```

#### Aprovar
```http
POST /validacoes/:id/aprovar
Content-Type: application/json

{
  "comentario": "Documentos OK"
}

Response 200:
{
  "id": "val_123",
  "status": "APROVADO",
  "requisicao": { "status": "VALIDADA" }
}
```

#### Rejeitar
```http
POST /validacoes/:id/rejeitar
Content-Type: application/json

{
  "motivo": "Valor incorreto",
  "comentario": "NF não confere com sistema"
}

Response 200:
{
  "id": "val_123",
  "status": "REJEITADO",
  "requisicao": { "status": "REJEITADA" }
}
```

---

### 💰 Pagamentos

#### Listar Aprovados
```http
GET /pagamentos?status=PENDENTE

Response 200: { "data": [...] }
```

#### Processar Pagamento
```http
POST /pagamentos/:requisicaoId/pagar
Content-Type: application/json

{
  "metodo": "TED",
  "banco": "001",
  "conta": "12345-6",
  "agencia": "0001"
}

Response 200: { "id": "pag_123", "status": "PROCESSANDO" }
```

#### Registrar Baixa
```http
POST /pagamentos/:id/baixa
Content-Type: application/json

{
  "comprovante": "https://...",
  "dataPagamento": "2026-03-02"
}

Response 200:
{
  "id": "pag_123",
  "status": "PAGO",
  "dataPagamento": "2026-03-02"
}
```

---

### 👥 Usuários

#### Listar Usuários
```http
GET /usuarios?departamento=VALIDACAO

Response 200: { "data": [...] }
```

#### Criar Usuário (Admin)
```http
POST /usuarios
Content-Type: application/json

{
  "nome": "Maria Silva",
  "email": "maria@empresa.com",
  "cpf": "123.456.789-00",
  "departamento": "FINANCEIRO",
  "senha": "senha_inicial"
}

Response 201: { "id": "user_123", ... }
```

#### Obter Perfil (Self)
```http
GET /usuarios/me

Response 200: { "id": "user_123", ... }
```

---

### 📊 Relatórios

#### Relatório de Pagamentos
```http
GET /relatorios/pagamentos?dataInicio=2026-01-01&dataFim=2026-03-02

Response 200:
{
  "periodo": "Jan/2026 - Mar/2026",
  "totalPago": 125000.00,
  "quantidade": 25,
  "porDepartamento": [...]
}
```

#### Relatório de Auditoria
```http
GET /relatorios/auditoria?usuario=user_123&dias=30

Response 200:
{
  "logs": [
    {
      "id": "log_123",
      "acao": "UPDATE",
      "entidade": "requisicoes",
      "usuario": "admin@empresa.com",
      "createdAt": "2026-03-02T10:30:00Z"
    }
  ]
}
```

---

## 🔴 Códigos de Erro

| Código | Significado |
|--------|-------------|
| 200 | OK |
| 201 | Criado |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 403 | Acesso proibido (permissão) |
| 404 | Não encontrado |
| 409 | Conflito (dados duplicados) |
| 500 | Erro interno do servidor |
| 503 | Serviço indisponível |

---

## 📌 Exemplo Completo: Submissão → Validação → Pagamento

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@empresa.com","password":"123456"}'

# 2. Criar requisição (com arquivo)
curl -X POST http://localhost:3000/api/requisicoes \
  -H "Authorization: Bearer TOKEN" \
  -F "descricao=NF Telefone" \
  -F "valor=1200.50" \
  -F "dataVencimento=2026-03-15" \
  -F "documentos=@nota_fiscal.pdf"

# 3. Listar para validação
curl http://localhost:3000/api/validacoes \
  -H "Authorization: Bearer TOKEN"

# 4. Aprovar
curl -X POST http://localhost:3000/api/validacoes/VAL_ID/aprovar \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comentario":"OK"}'

# 5. Processar pagamento
curl -X POST http://localhost:3000/api/pagamentos/REQ_ID/pagar \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"metodo":"TED","banco":"001"}'

# 6. Registrar comprovante
curl -X POST http://localhost:3000/api/pagamentos/PAG_ID/baixa \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comprovante":"URL","dataPagamento":"2026-03-02"}'
```

---

Para teste interativo, acesse: http://localhost:3000/api-docs (Swagger)
