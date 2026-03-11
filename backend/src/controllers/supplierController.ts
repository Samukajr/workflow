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