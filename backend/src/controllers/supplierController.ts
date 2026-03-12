import { Request, Response } from 'express';
import { asyncHandler, ErrorHandler } from '../middleware/errorHandler';
import * as supplierService from '../services/supplierService';

export const getSuppliers = asyncHandler(async (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const suppliers = await supplierService.listSuppliers(search);

  res.status(200).json({
    success: true,
    data: suppliers,
  });
});

export const importSuppliers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  if (!req.file) {
    throw new ErrorHandler(400, 'Envie um arquivo Excel para importar fornecedores');
  }

  const result = await supplierService.importSuppliersFromSpreadsheet(
    req.file.buffer,
    req.file.originalname,
    req.user.id,
  );

  res.status(200).json({
    success: true,
    message: 'Planilha processada com sucesso',
    data: result,
  });
});

export const updateSupplierStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const isActive = Boolean(req.body?.is_active);

  const supplier = await supplierService.updateSupplierStatus(id, isActive);

  if (!supplier) {
    throw new ErrorHandler(404, 'Fornecedor não encontrado');
  }

  res.status(200).json({
    success: true,
    message: isActive ? 'Fornecedor reativado com sucesso' : 'Fornecedor bloqueado com sucesso',
    data: supplier,
  });
});

export const updateSupplier = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const supplier = await supplierService.updateSupplierDetails(id, {
    supplier_name: req.body?.supplier_name,
    trade_name: req.body?.trade_name,
    supplier_type: req.body?.supplier_type,
    contact_name: req.body?.contact_name,
    contact_phone: req.body?.contact_phone,
    company: req.body?.company,
    city_state: req.body?.city_state,
    status: req.body?.status,
    bank_name: req.body?.bank_name,
    bank_branch: req.body?.bank_branch,
    bank_account: req.body?.bank_account,
  });

  if (!supplier) {
    throw new ErrorHandler(404, 'Fornecedor não encontrado');
  }

  res.status(200).json({
    success: true,
    message: 'Cadastro do fornecedor atualizado com sucesso',
    data: supplier,
  });
});

export const createSupplier = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const supplierName = typeof req.body?.supplier_name === 'string' ? req.body.supplier_name.trim() : '';
  const documentRaw = typeof req.body?.document_raw === 'string' ? req.body.document_raw.trim() : '';

  if (!supplierName) {
    throw new ErrorHandler(400, 'Nome do fornecedor é obrigatório');
  }

  if (!documentRaw) {
    throw new ErrorHandler(400, 'CPF/CNPJ é obrigatório');
  }

  const supplier = await supplierService.createSupplierManual(
    {
      supplier_name: supplierName,
      trade_name: req.body?.trade_name,
      supplier_type: req.body?.supplier_type,
      document_raw: documentRaw,
      contact_name: req.body?.contact_name,
      contact_phone: req.body?.contact_phone,
      company: req.body?.company,
      city_state: req.body?.city_state,
      status: req.body?.status,
      bank_name: req.body?.bank_name,
      bank_branch: req.body?.bank_branch,
      bank_account: req.body?.bank_account,
    },
    req.user.id,
  );

  res.status(201).json({
    success: true,
    message: 'Fornecedor cadastrado com sucesso',
    data: supplier,
  });
});