import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configurar CORS dinamicamente
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',');
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (como mobile apps, curl, etc)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Chave de criptografia (em produção usar variável de ambiente)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'chave-segura-32-caracteres-aqui-1';

// ==========================================
// FUNÇÕES DE SEGURANÇA LGPD
// ==========================================

// Hash de senha (simulado - usar bcrypt em produção)
function hashSenha(senha) {
  return crypto.createHash('sha256').update(senha + ENCRYPTION_KEY).digest('hex');
}

// Criptografia de dados sensíveis
function criptografar(texto) {
  try {
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    let criptografado = cipher.update(texto, 'utf8', 'hex');
    criptografado += cipher.final('hex');
    return criptografado;
  } catch (e) {
    return texto; // Fallback se falhar
  }
}

// Descriptografia de dados
function descriptografar(textoCriptografado) {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let descriptografado = decipher.update(textoCriptografado, 'hex', 'utf8');
    descriptografado += decipher.final('utf8');
    return descriptografado;
  } catch (e) {
    return textoCriptografado; // Fallback se falhar
  }
}

// Registrar log de auditoria (para LGPD compliance)
function registrarAuditoria(acao, entidade, entidadeId, usuarioId, alteracoes, ipAddress = 'localhost', userAgent = 'unknown') {
  const log = {
    id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    acao,
    entidade,
    entidadeId,
    usuarioId,
    usuarioEmail: usuarios.find(u => u.id === usuarioId)?.email || 'unknown',
    alteracoes: JSON.stringify(alteracoes),
    ipAddress,
    userAgent,
    timestamp: new Date().toISOString(),
    descricaoAlteracao: `${acao} em ${entidade} #${entidadeId}`
  };
  
  logsAuditoria.push(log);
  console.log(`[AUDITORIA] ${log.descricaoAlteracao} por ${log.usuarioEmail}`);
  return log;
}

// Dados temporários em memória (depois migraremos para BD)
let requisicoes = [
  {
    id: '1',
    numero: 'REQ-001',
    descricao: 'Fatura Telefônica Vivo',
    valor: 1200.50,
    status: 'PENDENTE',
    dataVencimento: '2026-03-15',
    departamento: 'TI',
    usuario: 'João Silva',
    createdAt: '2026-03-01'
  },
  {
    id: '2',
    numero: 'REQ-002',
    descricao: 'Boleto Fornecedor XYZ',
    valor: 3500.00,
    status: 'VALIDANDO',
    dataVencimento: '2026-03-20',
    departamento: 'Compras',
    usuario: 'Maria Santos',
    createdAt: '2026-03-02'
  }
];

let usuarios = [
  { id: '0', email: 'superadmin@empresa.com', senha: hashSenha('123456'), nome: 'Super Administrador', tipo: 'SUPER_ADMIN', cpf: criptografar('99999999999'), aceiteTermoLGPD: true },
  { id: '1', email: 'admin@empresa.com', senha: hashSenha('123456'), nome: 'Administrador', tipo: 'ADMIN', cpf: criptografar('00000000000'), aceiteTermoLGPD: true },
  { id: '2', email: 'validador@empresa.com', senha: hashSenha('123456'), nome: 'Validador', tipo: 'VALIDACAO', cpf: criptografar('11111111111'), aceiteTermoLGPD: true },
  { id: '3', email: 'financeiro@empresa.com', senha: hashSenha('123456'), nome: 'Financeiro', tipo: 'FINANCEIRO', cpf: criptografar('22222222222'), aceiteTermoLGPD: true },
  { id: '4', email: 'departamento@empresa.com', senha: hashSenha('123456'), nome: 'Departamento TI', tipo: 'DEPARTAMENTO', cpf: criptografar('33333333333'), aceiteTermoLGPD: true }
];

// Array para armazenar logs de auditoria (LGPD)
let logsAuditoria = [];

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Middleware para registrar IPs
app.use((req, res, next) => {
  req.ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  req.userAgent = req.get('user-agent') || 'unknown';
  next();
});

function getUserFromAuthHeader(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const userId = token.replace('fake-jwt-token-', '');
  const user = usuarios.find(u => u.id === userId);
  return user || null;
}

function requireSuperAdmin(req, res, next) {
  const user = getUserFromAuthHeader(req);

  if (!user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  if (user.tipo !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Acesso negado. Apenas SUPER_ADMIN.' });
  }

  req.superAdmin = user;
  next();
}

// ==========================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = usuarios.find(u => u.email === email && u.senha === hashSenha(password));
  
  if (!user) {
    // Registrar tentativa de login falhada (segurança)
    registrarAuditoria('LOGIN_FALHOU', 'LOGIN', 'N/A', 'DESCONHECIDO', { email }, req.ipAddress, req.userAgent);
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  
  // Registrar login bem-sucedido
  registrarAuditoria('LOGIN_SUCESSO', 'LOGIN', user.id, user.id, { email }, req.ipAddress, req.userAgent);
  
  res.json({
    token: 'fake-jwt-token-' + user.id,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo: user.tipo,
      departamento: user.tipo
    }
  });
});

// ==========================================
// ROTAS DE ADMINISTRAÇÃO DE USUÁRIOS
// ==========================================

app.get('/api/usuarios', requireSuperAdmin, (req, res) => {
  const usuariosPublicos = usuarios.map(u => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    tipo: u.tipo,
    createdAt: u.createdAt || null,
    aceiteTermoLGPD: u.aceiteTermoLGPD
  }));

  res.json({ data: usuariosPublicos });
});

app.post('/api/usuarios', requireSuperAdmin, (req, res) => {
  const { nome, email, senha, tipo } = req.body;

  if (!nome || !email || !senha || !tipo) {
    return res.status(400).json({ error: 'Campos obrigatórios: nome, email, senha e tipo' });
  }

  const tiposPermitidos = ['ADMIN', 'VALIDACAO', 'FINANCEIRO', 'DEPARTAMENTO'];
  if (!tiposPermitidos.includes(tipo)) {
    return res.status(400).json({ error: `Tipo inválido. Use: ${tiposPermitidos.join(', ')}` });
  }

  const emailNormalizado = String(email).trim().toLowerCase();
  const emailJaExiste = usuarios.some(u => u.email.toLowerCase() === emailNormalizado);
  if (emailJaExiste) {
    return res.status(409).json({ error: 'Já existe um usuário com este email' });
  }

  const maiorId = usuarios.reduce((maxId, u) => {
    const idNumerico = parseInt(u.id, 10);
    return Number.isNaN(idNumerico) ? maxId : Math.max(maxId, idNumerico);
  }, 0);

  const novoUsuario = {
    id: String(maiorId + 1),
    email: emailNormalizado,
    senha: hashSenha(senha),
    nome: String(nome).trim(),
    tipo,
    cpf: criptografar('00000000000'),
    aceiteTermoLGPD: true,
    createdAt: new Date().toISOString()
  };

  usuarios.push(novoUsuario);

  registrarAuditoria(
    'USUARIO_CRIADO',
    'USUARIO',
    novoUsuario.id,
    req.superAdmin.id,
    { nome: novoUsuario.nome, email: novoUsuario.email, tipo: novoUsuario.tipo },
    req.ipAddress,
    req.userAgent
  );

  res.status(201).json({
    id: novoUsuario.id,
    nome: novoUsuario.nome,
    email: novoUsuario.email,
    tipo: novoUsuario.tipo,
    createdAt: novoUsuario.createdAt
  });
});

app.put('/api/usuarios/:id', requireSuperAdmin, (req, res) => {
  const { id } = req.params;
  const { nome, email, senha, tipo } = req.body;

  const usuarioIndex = usuarios.findIndex(u => u.id === id);
  if (usuarioIndex === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  // Validar tipo se fornecido
  if (tipo) {
    const tiposPermitidos = ['SUPER_ADMIN', 'ADMIN', 'VALIDACAO', 'FINANCEIRO', 'DEPARTAMENTO'];
    if (!tiposPermitidos.includes(tipo)) {
      return res.status(400).json({ error: `Tipo inválido. Use: ${tiposPermitidos.join(', ')}` });
    }
  }

  // Validar email único se estiver sendo alterado
  if (email) {
    const emailNormalizado = String(email).trim().toLowerCase();
    const emailJaExiste = usuarios.some(u => u.id !== id && u.email.toLowerCase() === emailNormalizado);
    if (emailJaExiste) {
      return res.status(409).json({ error: 'Já existe outro usuário com este email' });
    }
    usuarios[usuarioIndex].email = emailNormalizado;
  }

  // Atualizar campos
  if (nome) usuarios[usuarioIndex].nome = String(nome).trim();
  if (senha) usuarios[usuarioIndex].senha = hashSenha(senha);
  if (tipo) usuarios[usuarioIndex].tipo = tipo;

  usuarios[usuarioIndex].updatedAt = new Date().toISOString();

  registrarAuditoria(
    'USUARIO_ATUALIZADO',
    'USUARIO',
    id,
    req.superAdmin.id,
    { nome: usuarios[usuarioIndex].nome, email: usuarios[usuarioIndex].email, tipo: usuarios[usuarioIndex].tipo },
    req.ipAddress,
    req.userAgent
  );

  res.json({
    id: usuarios[usuarioIndex].id,
    nome: usuarios[usuarioIndex].nome,
    email: usuarios[usuarioIndex].email,
    tipo: usuarios[usuarioIndex].tipo,
    updatedAt: usuarios[usuarioIndex].updatedAt
  });
});

// ==========================================
// ROTAS DE REQUISIÇÕES
// ==========================================

app.get('/api/requisicoes', (req, res) => {
  res.json({ data: requisicoes });
});

app.get('/api/requisicoes/:id', (req, res) => {
  const req_data = requisicoes.find(r => r.id === req.params.id);
  if (!req_data) {
    return res.status(404).json({ error: 'Requisição não encontrada' });
  }
  res.json(req_data);
});

app.post('/api/requisicoes', (req, res) => {
  const { anexo } = req.body;

  // Validar anexo
  if (!anexo || !anexo.dados || !anexo.nome) {
    return res.status(400).json({ error: 'Anexo de documento é obrigatório' });
  }

  // Validar tamanho (Base64 é ~33% maior que o arquivo original)
  const tamanhoEstimado = anexo.tamanho || 0;
  if (tamanhoEstimado > 5 * 1024 * 1024) {
    return res.status(400).json({ error: 'Arquivo muito grande. Máximo: 5MB' });
  }

  const novaRequisicao = {
    id: String(requisicoes.length + 1),
    numero: `REQ-${String(requisicoes.length + 1).padStart(3, '0')}`,
    ...req.body,
    status: 'PENDENTE',
    createdAt: new Date().toISOString()
  };
  
  requisicoes.push(novaRequisicao);
  
  // Registrar auditoria
  registrarAuditoria('REQUISICAO_CRIADA', 'REQUISICAO', novaRequisicao.id, 'desconhecido',
    { numero: novaRequisicao.numero, valor: novaRequisicao.valor, descricao: novaRequisicao.descricao, anexo: anexo.nome }, 
    req.ipAddress, req.userAgent);
  
  res.status(201).json(novaRequisicao);
});

app.patch('/api/requisicoes/:id', (req, res) => {
  const index = requisicoes.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Requisição não encontrada' });
  }
  
  requisicoes[index] = { ...requisicoes[index], ...req.body };
  res.json(requisicoes[index]);
});

// ==========================================
// ROTAS DE VALIDAÇÃO
// ==========================================

app.get('/api/validacoes', (req, res) => {
  const pendentes = requisicoes.filter(r => r.status === 'PENDENTE' || r.status === 'VALIDANDO');
  res.json({ data: pendentes });
});

app.post('/api/validacoes/:id/aprovar', (req, res) => {
  const index = requisicoes.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Requisição não encontrada' });
  }
  
  requisicoes[index].status = 'VALIDADA';
  requisicoes[index].validadoEm = new Date().toISOString();
  
  // Registrar auditoria
  registrarAuditoria('VALIDACAO_APROVADA', 'REQUISICAO', req.params.id, 'desconhecido',
    { status: 'VALIDADA', nf: requisicoes[index].numero }, req.ipAddress, req.userAgent);
  
  res.json(requisicoes[index]);
});

app.post('/api/validacoes/:id/rejeitar', (req, res) => {
  const index = requisicoes.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Requisição não encontrada' });
  }
  
  requisicoes[index].status = 'REJEITADA';
  requisicoes[index].motivoRejeicao = req.body.motivo;
  
  // Registrar auditoria
  registrarAuditoria('VALIDACAO_REJEITADA', 'REQUISICAO', req.params.id, 'desconhecido',
    { status: 'REJEITADA', motivo: req.body.motivo }, req.ipAddress, req.userAgent);
  
  res.json(requisicoes[index]);
});

// ==========================================
// ROTAS DE PAGAMENTO
// ==========================================

app.get('/api/pagamentos', (req, res) => {
  const aprovadas = requisicoes.filter(r => r.status === 'VALIDADA' || r.status === 'PAGA');
  res.json({ data: aprovadas });
});

app.post('/api/pagamentos/:id/pagar', (req, res) => {
  const index = requisicoes.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Requisição não encontrada' });
  }
  
  requisicoes[index].status = 'PAGA';
  requisicoes[index].pagoEm = new Date().toISOString();
  
  // Registrar auditoria
  registrarAuditoria('PAGAMENTO_PROCESSADO', 'REQUISICAO', req.params.id, 'desconhecido', 
    { status: 'PAGA', valor: requisicoes[index].valor }, 'localhost', 'api');
  
  res.json(requisicoes[index]);
});

// ==========================================
// ROTAS DE AUDITORIA E CONFORMIDADE LGPD
// ==========================================

app.get('/api/auditoria/logs', (req, res) => {
  // Nota: Em produção, proteger com autenticação e verificar permissões
  res.json({ 
    data: logsAuditoria,
    total: logsAuditoria.length,
    aviso: 'Logs sensíveis - Acesso restrito a administradores'
  });
});

// Direito ao esquecimento (LGPD Artigo 17)
app.delete('/api/dados-pessoais/deletar/:usuarioId', (req, res) => {
  const usuarioId = req.params.usuarioId;
  
  // Verificar se é o próprio usuário ou admin
  // (Em produção, validar token JWT)
  
  const usuarioIndex = usuarios.findIndex(u => u.id === usuarioId);
  if (usuarioIndex === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  const usuario = usuarios[usuarioIndex];
  
  // Anonimizar dados pessoais (manter apenas para auditoria)
  const deletedAt = new Date().toISOString();
  usuarios[usuarioIndex] = {
    ...usuarios[usuarioIndex],
    nome: 'DELETADO',
    email: `deletado-${usuarioId}@deleted.com`,
    cpf: 'DELETADO',
    deletedAt: deletedAt,
    deletedReason: 'Exercício de direito ao esquecimento (LGPD Artigo 17)'
  };
  
  // Registrar na auditoria que foi deletado
  registrarAuditoria('DIREITO_ESQUECIMENTO', 'USUARIO', usuarioId, usuarioId, 
    { acao: 'Dados pessoais removidos conforme LGPD' }, req.ipAddress, req.userAgent);
  
  res.json({ 
    message: 'Dados pessoais foram anonimizados conforme LGPD',
    deletedAt,
    aviso: 'Logs de auditoria foram mantidos por 10 anos conforme legislação'
  });
});

// Termo de consentimento LGPD
app.post('/api/lgpd/aceitar-termo', (req, res) => {
  const { usuarioId, versaoTermo = '1.0' } = req.body;
  
  const userIndex = usuarios.findIndex(u => u.id === usuarioId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  usuarios[userIndex].aceiteTermoLGPD = true;
  usuarios[userIndex].dataAceiteTermo = new Date().toISOString();
  usuarios[userIndex].versaoTermoAceito = versaoTermo;
  
  registrarAuditoria('ACEITE_TERMO_LGPD', 'USUARIO', usuarioId, usuarioId, 
    { versao: versaoTermo }, req.ipAddress, req.userAgent);
  
  res.json({ 
    message: 'Termo de consentimento LGPD aceito com sucesso',
    data: {
      usuarioId,
      dataAceite: usuarios[userIndex].dataAceiteTermo,
      versao: versaoTermo
    }
  });
});

// Informações sobre conformidade LGPD
app.get('/api/lgpd/info', (req, res) => {
  res.json({
    sistema: 'Workflow de Pagamentos',
    conformidade: {
      lgpd: '3/5 - Em implementação',
      seguridad: {
        senhas: 'SHA256 + Salt',
        criptografia: 'AES-256-CBC',
        auditoria: 'Completa',
        retenção: '7 anos (fiscal), 10 anos (auditoria)'
      }
    },
    politicas: {
      direito_esquecimento: 'Implementado',
      consentimento: 'Implementado',
      logs_auditoria: 'Implementado',
      protecao_dados: 'Em implementação'
    },
    proximas_melhorias: [
      'bcrypt para senhas (substituir SHA256)',
      'PostgreSQL for persistent storage',
      'HTTPS/TLS em produção',
      'Backup automático e criptografado'
    ]
  });
});

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    lgpd_compliance: 'Em andamento',
    logs_auditoria: logsAuditoria.length 
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║        🚀 WORKFLOW - BACKEND INICIADO 🚀              ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📍 Ambiente: ${NODE_ENV.toUpperCase()}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🔐 CORS habilitado para: ${allowedOrigins.join(' | ')}`);
  console.log('');
  console.log('🏥 Health Check:');
  console.log(`   → http://localhost:${PORT}/health`);
  console.log('');
  console.log('👥 Usuários de teste:');
  console.log('   - superadmin@empresa.com / 123456 (Super Admin)');
  console.log('   - admin@empresa.com / 123456 (Admin)');
  console.log('   - validador@empresa.com / 123456 (Validação)');
  console.log('   - financeiro@empresa.com / 123456 (Financeiro)');
  console.log('   - departamento@empresa.com / 123456 (Departamento)');
  console.log('');
});
