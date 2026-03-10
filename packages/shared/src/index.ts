// Tipos compartilhados entre Backend e Frontend

export enum StatusRequisicao {
  PENDENTE = 'PENDENTE',
  VALIDANDO = 'VALIDANDO',
  VALIDADA = 'VALIDADA',
  PAGANDO = 'PAGANDO',
  PAGA = 'PAGA',
  REJEITADA = 'REJEITADA',
  CANCELADA = 'CANCELADA',
}

export enum TipoDepartamento {
  SUBMISSAO = 'SUBMISSAO',
  VALIDACAO = 'VALIDACAO',
  FINANCEIRO = 'FINANCEIRO',
  ADMIN = 'ADMIN',
}

export enum TipoDocumento {
  NOTA_FISCAL = 'NOTA_FISCAL',
  BOLETO = 'BOLETO',
  COMPROVANTE_PAGAMENTO = 'COMPROVANTE_PAGAMENTO',
  OUTRO = 'OUTRO',
}

// Interfaces

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  departamento: TipoDepartamento;
  ativo: boolean;
  ultimoAcesso?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Requisicao {
  id: string;
  numero: string;
  descricao: string;
  valor: number;
  status: StatusRequisicao;
  dataVencimento: Date;
  usuario: Usuario;
  documentos: Documento[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Documento {
  id: string;
  nome: string;
  tipo: TipoDocumento;
  caminho: string;
  tamanho: number;
  checksum?: string;
  createdAt: Date;
}

export interface Validacao {
  id: string;
  status: 'APROVADO' | 'REJEITADO' | 'PENDENTE';
  motivo?: string;
  comentario?: string;
  requisicao: Requisicao;
  usuario: Usuario;
  createdAt: Date;
}

export interface Pagamento {
  id: string;
  numero: string;
  valor: number;
  dataPagamento?: Date;
  comprovante?: string;
  status: 'PENDENTE' | 'PROCESSANDO' | 'PAGO' | 'ERRO';
  requisicao: Requisicao;
  usuario: Usuario;
  createdAt: Date;
}

// DTOs para requisições

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Usuario;
}

export interface CreateRequisicaoRequest {
  descricao: string;
  valor: number;
  dataVencimento: string;
  documentos: File[];
}

export interface AprovRequisicaoRequest {
  comentario?: string;
}

export interface RejeitorRequisicaoRequest {
  motivo: string;
  comentario?: string;
}

export interface PagarRequisicaoRequest {
  metodo: string;
  banco?: string;
  conta?: string;
  agencia?: string;
}

// Responses

export interface ApiResponse<T> {
  data: T;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ErrorResponse {
  error: string;
  timestamp: Date;
}
