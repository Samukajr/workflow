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
});

const processPaymentSchema = Joi.object({
  payment_request_id: Joi.string().uuid().required(),
  transaction_id: Joi.string().required(),
  payment_date: Joi.date().required(),
  notes: Joi.string().optional(),
});

export const submitPaymentRequest = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  if (req.user.department !== 'submissao') {
    throw new ErrorHandler(403, 'Apenas departamento de submissão pode criar requisições');
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

  if (req.user.department !== 'validacao') {
    throw new ErrorHandler(403, 'Apenas departamento de validação pode validar requisições');
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

  if (req.user.department !== 'financeiro') {
    throw new ErrorHandler(403, 'Apenas departamento financeiro pode processar pagamentos');
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
