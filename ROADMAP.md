# 🎯 Roadmap de Evolução do Sistema

## ✅ FASE 1 - CONCLUÍDA (Sistema Base)

- ✅ Backend API REST funcional
- ✅ Frontend React com interface completa
- ✅ Autenticação de usuários
- ✅ Fluxo completo: Submissão → Validação → Pagamento
- ✅ Dashboard com estatísticas
- ✅ Dados em memória (2 requisições de exemplo)

## 🚀 FASE 2 - Banco de Dados (Próximo Passo)

### 1. Instalar PostgreSQL

**Windows:**
```powershell
# Instalar PostgreSQL 13+ 
# Download: https://www.postgresql.org/download/windows/
```

### 2. Configurar Banco de Dados

```bash
cd E:\APP\WORKFLOW-NOVO\backend
npm install prisma @prisma/client
npm install -D prisma
```

### 3. Copiar Schema Prisma

```bash
# Criar pasta
mkdir prisma

# Copiar arquivo
copy E:\APP\WORKFLOW\packages\backend\prisma\schema.prisma prisma\schema.prisma
```

### 4. Configurar .env

```env
DATABASE_URL="postgresql://postgres:senha@localhost:5432/workflow_db"
PORT=3000
NODE_ENV=development
JWT_SECRET="sua-chave-secreta-aqui"
```

### 5. Executar Migrations

```bash
npx prisma migrate dev --name initial
npx prisma generate
```

### 6. Atualizar server.js

Substituir arrays por queries Prisma:

```javascript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Antes:
const requisicoes = requisicoes.filter(...)

// Depois:
const requisicoes = await prisma.requisicao.findMany({
  where: { status: 'PENDENTE' }
})
```

### 7. Criar Seeds (Dados Iniciais)

```bash
# prisma/seed.js
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Criar departamentos
  const depAdmin = await prisma.departamento.create({
    data: { nome: 'Administração', tipo: 'ADMIN' }
  })
  
  // Criar usuários
  const admin = await prisma.usuario.create({
    data: {
      nome: 'Administrador',
      email: 'admin@empresa.com',
      senha: await bcrypt.hash('123456', 10),
      cpf: '000.000.000-00',
      departamentoId: depAdmin.id
    }
  })
  
  // ... mais seeds
}

main()
```

## 🔐 FASE 3 - Segurança Real

### 1. Implementar JWT Real

```bash
npm install jsonwebtoken bcryptjs
```

```javascript
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// Login
const token = jwt.sign(
  { userId: user.id, tipo: user.tipo },
  process.env.JWT_SECRET,
  { expiresIn: '8h' }
)

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token não fornecido' })
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' })
  }
}
```

### 2. Hash de Senhas

```javascript
// Registro
const hashedPassword = await bcrypt.hash(password, 10)

// Login
const isValid = await bcrypt.compare(password, user.senha)
```

## 📎 FASE 4 - Upload de Arquivos

### 1. Instalar Multer

```bash
npm install multer
```

### 2. Configurar Upload

```javascript
import multer from 'multer'

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`
    cb(null, uniqueName)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Apenas PDFs são permitidos'))
    }
  }
})

// Rota
app.post('/api/requisicoes', upload.array('documentos', 5), async (req, res) => {
  const { descricao, valor } = req.body
  const arquivos = req.files
  
  // Salvar no banco
  const requisicao = await prisma.requisicao.create({
    data: {
      descricao,
      valor: parseFloat(valor),
      documentos: {
        create: arquivos.map(f => ({
          nome: f.originalname,
          caminho: f.path,
          tamanho: f.size
        }))
      }
    }
  })
  
  res.json(requisicao)
})
```

### 3. Atualizar Frontend

```javascript
const handleSubmit = async (e) => {
  e.preventDefault()
  
  const formData = new FormData()
  formData.append('descricao', descricao)
  formData.append('valor', valor)
  
  for (let file of files) {
    formData.append('documentos', file)
  }
  
  await fetch('http://localhost:3000/api/requisicoes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })
}
```

## 📧 FASE 5 - Notificações por Email

### 1. Instalar Nodemailer

```bash
npm install nodemailer
```

### 2. Configurar SMTP

```javascript
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// Enviar email quando aprovar
await transporter.sendMail({
  from: 'noreply@empresa.com',
  to: requisicao.usuario.email,
  subject: 'Requisição Aprovada',
  html: `
    <h1>Sua requisição foi aprovada!</h1>
    <p>Número: ${requisicao.numero}</p>
    <p>Valor: R$ ${requisicao.valor}</p>
  `
})
```

## 📊 FASE 6 - Relatórios e Exportação

### 1. Instalar PDFKit

```bash
npm install pdfkit
```

### 2. Gerar PDF

```javascript
import PDFDocument from 'pdfkit'

app.get('/api/relatorios/pagamentos/pdf', async (req, res) => {
  const doc = new PDFDocument()
  
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename=relatorio.pdf')
  
  doc.pipe(res)
  
  doc.fontSize(20).text('Relatório de Pagamentos', 100, 100)
  doc.fontSize(12).text(`Total pago: R$ ${total}`, 100, 150)
  
  doc.end()
})
```

### 3. Exportar Excel

```bash
npm install xlsx
```

```javascript
import XLSX from 'xlsx'

app.get('/api/relatorios/pagamentos/excel', async (req, res) => {
  const pagamentos = await prisma.pagamento.findMany()
  
  const worksheet = XLSX.utils.json_to_sheet(pagamentos)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pagamentos')
  
  const buffer = XLSX.write(workbook, { type: 'buffer' })
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename=pagamentos.xlsx')
  res.send(buffer)
})
```

## 🐳 FASE 7 - Docker (Deploy)

### 1. Dockerfile Backend

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

### 2. Dockerfile Frontend

```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 3. docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: workflow_db
      POSTGRES_USER: workflow_user
      POSTGRES_PASSWORD: senha123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://workflow_user:senha123@db:5432/workflow_db
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## 🔍 FASE 8 - Monitoramento e Logs

### 1. Winston Logger

```bash
npm install winston
```

```javascript
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

logger.info('Requisição criada', { requisicaoId: req.id, userId: req.userId })
```

### 2. Prometheus Metrics

```bash
npm install prom-client
```

## 🧪 FASE 9 - Testes Automatizados

### 1. Jest + Supertest (Backend)

```bash
npm install -D jest supertest
```

```javascript
import request from 'supertest'
import app from '../server'

describe('POST /api/auth/login', () => {
  it('deve retornar token válido', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@empresa.com', password: '123456' })
    
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('token')
  })
})
```

### 2. Testing Library (Frontend)

```bash
npm install -D @testing-library/react @testing-library/jest-dom
```

## 📱 FASE 10 - PWA (Progressive Web App)

```javascript
// vite.config.js
import { VitePWA } from 'vite-plugin-pwa'

export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Workflow Pagamentos',
        short_name: 'Workflow',
        theme_color: '#667eea',
        icons: [...]
      }
    })
  ]
}
```

---

## 🎯 Prioridades Recomendadas

1. **URGENTE:** Fase 2 (Banco de Dados) - Dados não devem ficar em memória
2. **ALTA:** Fase 3 (Segurança) - JWT real e hash de senhas
3. **MÉDIA:** Fase 4 (Upload) - Envio de notas fiscais
4. **MÉDIA:** Fase 5 (Emails) - Notificações automáticas
5. **BAIXA:** Fases 6-10 - Melhorias incrementais

---

**💡 Comece pela Fase 2 (Banco de Dados) assim que possível!**
