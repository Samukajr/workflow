import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import * as paymentService from '../services/paymentService';
import * as queries from '../database/queries';
import { asyncHandler, ErrorHandler } from '../middleware/errorHandler';
import Joi from 'joi';
import { env } from '../config/environment';
import { generateDocumentHash, registerDocumentSignature } from '../services/signatureService';

const submitPaymentSchema = Joi.object({
  document_type: Joi.string().valid('nf', 'boleto').required(),
  amount: Joi.number().positive().required(),
  supplier_name: Joi.string().required(),
  supplier_document: Joi.string().required(),
  due_date: Joi.date().required(),
  notes: Joi.string().optional(),
});

const validatePaymentSchema = Joi.object({
  payment_request_id: Joi.string().uuid().required(),
  approved: Joi.boolean().required(),
  comments: Joi.string().optional(),
  checklist_items: Joi.array().items(Joi.string()).optional(), // FASE 2
});

const processPaymentSchema = Joi.object({
  payment_request_id: Joi.string().uuid().required(),
  transaction_id: Joi.string().required(),
  payment_date: Joi.date().required(),
  notes: Joi.string().optional(),
});

const closePaymentSchema = Joi.object({
  payment_request_id: Joi.string().uuid().required(),
  close_reason: Joi.string().optional(), // FASE 2
  close_evidence_url: Joi.string().uri().optional(), // FASE 2
  comments: Joi.string().optional(),
});

export const submitPaymentRequest = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const { error, value } = submitPaymentSchema.validate(req.body);

  if (error) {
    throw new ErrorHandler(400, error.details[0].message);
  }

  if (!req.file) {
    throw new ErrorHandler(400, 'Arquivo obrigatório');
  }

  try {
    const paymentRequest = await paymentService.submitPaymentRequest(
      req.user.id,
      value.document_type,
      value.amount,
      value.supplier_name,
      value.supplier_document,
      new Date(value.due_date),
      `/uploads/${req.file.filename}`,
      value.notes,
    );

    // Gerar hash e assinatura digital do documento (Lei 8.934/1994)
    const uploadDir = path.isAbsolute(env.UPLOAD_DIR) ? env.UPLOAD_DIR : path.resolve(process.cwd(), env.UPLOAD_DIR);
    const filePath = path.join(uploadDir, req.file.filename);
    const fileContent = fs.readFileSync(filePath);
    const documentHash = generateDocumentHash(fileContent);

    await registerDocumentSignature(
      paymentRequest.id,
      documentHash,
      req.user.id,
      env.JWT_SECRET,
    );

    res.status(201).json({
      success: true,
      message: 'Requisição de pagamento submetida com sucesso',
      payment_request: paymentRequest,
      signature: {
        hash: documentHash,
        signed_at: new Date().toISOString(),
        status: 'válida',
      },
    });
  } catch (err: any) {
    if (req.file?.filename) {
      const uploadDir = path.isAbsolute(env.UPLOAD_DIR) ? env.UPLOAD_DIR : path.resolve(process.cwd(), env.UPLOAD_DIR);
      const uploadedFilePath = path.join(uploadDir, req.file.filename);

      if (fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
    }

    throw new ErrorHandler(500, err.message);
  }
});

export const validatePaymentRequest = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const { error, value } = validatePaymentSchema.validate(req.body);

  if (error) {
    throw new ErrorHandler(400, error.details[0].message);
  }

  try {
    const paymentRequest = await paymentService.validatePaymentRequest(
      value.payment_request_id,
      value.approved,
      req.user.id,
      value.comments,
      value.checklist_items, // FASE 2
    );

    res.status(200).json({
      success: true,
      message: `Requisição ${value.approved ? 'aprovada' : 'rejeitada'} com sucesso`,
      payment_request: paymentRequest,
    });
  } catch (err: any) {
    throw new ErrorHandler(400, err.message);
  }
});

export const processPayment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const { error, value } = processPaymentSchema.validate(req.body);

  if (error) {
    throw new ErrorHandler(400, error.details[0].message);
  }

  try {
    const paymentRequest = await paymentService.processPayment(
      value.payment_request_id,
      req.user.id,
      value.transaction_id,
      new Date(value.payment_date),
      value.notes,
    );

    res.status(200).json({
      success: true,
      message: 'Pagamento processado com sucesso',
      payment_request: paymentRequest,
    });
  } catch (err: any) {
    throw new ErrorHandler(400, err.message);
  }
});

export const closePaymentRequest = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const { error, value } = closePaymentSchema.validate(req.body);

  if (error) {
    throw new ErrorHandler(400, error.details[0].message);
  }

  try {
    const paymentRequest = await paymentService.closePaymentRequest(
      value.payment_request_id,
      req.user.id,
      value.close_reason, // FASE 2
      value.close_evidence_url, // FASE 2
      value.comments,
    );

    res.status(200).json({
      success: true,
      message: 'Solicitação encerrada com sucesso',
      payment_request: paymentRequest,
    });
  } catch (err: any) {
    throw new ErrorHandler(400, err.message);
  }
});

export const getPaymentRequest = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const { id } = req.params;

  try {
    const details = await paymentService.getPaymentRequestDetails(id);

    if (!details) {
      throw new ErrorHandler(404, 'Requisição de pagamento não encontrada');
    }

    res.status(200).json({
      success: true,
      data: details,
    });
  } catch (err: any) {
    if (err instanceof ErrorHandler) throw err;
    throw new ErrorHandler(500, err.message);
  }
});

export const listPaymentRequests = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const { status, limit = 50, offset = 0 } = req.query;

  try {
    let requests;

    if (status) {
      requests = await queries.getPaymentRequestsByStatus(String(status), Number(limit), Number(offset));
    } else {
      requests = await queries.getAllPaymentRequests(Number(limit), Number(offset));
    }

    res.status(200).json({
      success: true,
      data: requests,
      pagination: { limit: Number(limit), offset: Number(offset) },
    });
  } catch (err: any) {
    throw new ErrorHandler(500, err.message);
  }
});

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  try {
    const stats = await paymentService.getDashboardStats(req.user.department);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err: any) {
    throw new ErrorHandler(500, err.message);
  }
});

// ===== FASE 2: NOVOS ENDPOINTS =====

/**
 * GET /api/payments/checklist/:id
 * Obter checklist de conformidade de uma requisição
 */
export const getChecklist = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const { id } = req.params;

  try {
    const checklistData = await paymentService.getPaymentChecklist(id);

    if (!checklistData) {
      throw new ErrorHandler(404, 'Checklist não encontrado');
    }

    res.status(200).json({
      success: true,
      data: checklistData,
    });
  } catch (err: any) {
    if (err instanceof ErrorHandler) throw err;
    throw new ErrorHandler(500, err.message);
  }
});

/**
 * GET /api/payments/approval-rules
 * Listar regras de alçada de aprovação
 */
export const getApprovalRules = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  try {
    const rules = await paymentService.getApprovalRules();

    res.status(200).json({
      success: true,
      data: rules,
    });
  } catch (err: any) {
    throw new ErrorHandler(500, err.message);
  }
});

/**
 * GET /api/payments/approvals/:id
 * Obter histórico de aprovações de uma requisição
 */
export const getApprovals = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const { id } = req.params;

  try {
    const approvals = await paymentService.getPaymentApprovals(id);

    res.status(200).json({
      success: true,
      data: approvals,
    });
  } catch (err: any) {
    throw new ErrorHandler(500, err.message);
  }
});

const blocklistSchema = Joi.object({
  supplier_document: Joi.string().required(),
  supplier_name: Joi.string().required(),
  reason: Joi.string().required(),
});

/**
 * POST /api/payments/blocklist
 * Adicionar fornecedor à blocklist
 */
export const addToBlocklist = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const { error, value } = blocklistSchema.validate(req.body);

  if (error) {
    throw new ErrorHandler(400, error.details[0].message);
  }

  try {
    await paymentService.addSupplierToBlocklist(
      value.supplier_document,
      value.supplier_name,
      value.reason,
      req.user.id,
    );

    res.status(201).json({
      success: true,
      message: 'Fornecedor adicionado à blocklist com sucesso',
    });
  } catch (err: any) {
    throw new ErrorHandler(400, err.message);
  }
});

