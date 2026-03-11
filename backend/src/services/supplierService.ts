import * as XLSX from 'xlsx';
import { pool } from '../config/database';
import logger from '../utils/logger';
import { Supplier } from '../types';

type SpreadsheetRow = Record<string, unknown>;

type SupplierImportInput = {
  supplier_name: string;
  trade_name?: string;
  supplier_type?: string;
  document_raw: string;
  document_normalized: string;
  contact_name?: string;
  contact_phone?: string;
  company?: string;
  city_state?: string;
  status?: string;
  bank_name?: string;
  bank_branch?: string;
  bank_account?: string;
  is_active: boolean;
};

export interface SupplierImportSkippedRow {
  row: number;
  reason: string;
  supplier_name?: string;
  document?: string;
}

export interface SupplierImportResult {
  sheet_name: string;
  total_rows: number;
  imported: number;
  updated: number;
  skipped: SupplierImportSkippedRow[];
}

const headerMap: Record<string, keyof SupplierImportInput | 'ignore'> = {
  fornecedor: 'supplier_name',
  'nome fantasia': 'trade_name',
  'tipo de fornecedor': 'supplier_type',
  'cpf / cnpj': 'document_raw',
  'cpf/cnpj': 'document_raw',
  cpf: 'document_raw',
  cnpj: 'document_raw',
  'nome de contato': 'contact_name',
  'numero de contato': 'contact_phone',
  'número de contato': 'contact_phone',
  empresa: 'company',
  'cidade e estado': 'city_state',
  status: 'status',
  banco: 'bank_name',
  'agencia bancaria': 'bank_branch',
  'agência bancária': 'bank_branch',
  'conta bancario': 'bank_account',
  'conta bancário': 'bank_account',
};

function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanText(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function normalizeDocument(value: string | undefined): string {
  if (!value) return '';
  const digitsOnly = value.replace(/\D/g, '');
  if (digitsOnly) {
    return digitsOnly;
  }
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function parseBooleanStatus(status?: string): boolean {
  return normalizeHeader(status || 'ativo') !== 'inativo';
}

function mapSpreadsheetRow(row: SpreadsheetRow): SupplierImportInput | null {
  const mapped: Partial<SupplierImportInput> = {};

  for (const [rawHeader, rawValue] of Object.entries(row)) {
    const mappedKey = headerMap[normalizeHeader(rawHeader)];
    if (!mappedKey || mappedKey === 'ignore') {
      continue;
    }

    const value = cleanText(rawValue);
    if (!value) {
      continue;
    }

    mapped[mappedKey] = value as never;
  }

  const supplierName = mapped.supplier_name || mapped.trade_name;
  const documentRaw = mapped.document_raw;
  const documentNormalized = normalizeDocument(documentRaw);

  if (!supplierName || !documentRaw || !documentNormalized) {
    return null;
  }

  return {
    supplier_name: supplierName,
    trade_name: mapped.trade_name,
    supplier_type: mapped.supplier_type,
    document_raw: documentRaw,
    document_normalized: documentNormalized,
    contact_name: mapped.contact_name,
    contact_phone: mapped.contact_phone,
    company: mapped.company,
    city_state: mapped.city_state,
    status: mapped.status,
    bank_name: mapped.bank_name,
    bank_branch: mapped.bank_branch,
    bank_account: mapped.bank_account,
    is_active: parseBooleanStatus(mapped.status),
  };
}

async function insertSupplier(
  supplier: SupplierImportInput,
  sourceFileName: string,
  createdBy: string,
): Promise<void> {
  await pool.query(
    `INSERT INTO suppliers (
      supplier_name,
      trade_name,
      supplier_type,
      document_raw,
      document_normalized,
      contact_name,
      contact_phone,
      company,
      city_state,
      status,
      bank_name,
      bank_branch,
      bank_account,
      source_file_name,
      is_active,
      created_by
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
    )`,
    [
      supplier.supplier_name,
      supplier.trade_name ?? null,
      supplier.supplier_type ?? null,
      supplier.document_raw,
      supplier.document_normalized,
      supplier.contact_name ?? null,
      supplier.contact_phone ?? null,
      supplier.company ?? null,
      supplier.city_state ?? null,
      supplier.status ?? null,
      supplier.bank_name ?? null,
      supplier.bank_branch ?? null,
      supplier.bank_account ?? null,
      sourceFileName,
      supplier.is_active,
      createdBy,
    ],
  );
}

async function updateSupplier(
  supplier: SupplierImportInput,
  sourceFileName: string,
): Promise<void> {
  await pool.query(
    `UPDATE suppliers SET
      supplier_name = $2,
      trade_name = $3,
      supplier_type = $4,
      document_raw = $5,
      contact_name = $6,
      contact_phone = $7,
      company = $8,
      city_state = $9,
      status = $10,
      bank_name = $11,
      bank_branch = $12,
      bank_account = $13,
      source_file_name = $14,
      is_active = $15,
      updated_at = CURRENT_TIMESTAMP
     WHERE document_normalized = $1`,
    [
      supplier.document_normalized,
      supplier.supplier_name,
      supplier.trade_name ?? null,
      supplier.supplier_type ?? null,
      supplier.document_raw,
      supplier.contact_name ?? null,
      supplier.contact_phone ?? null,
      supplier.company ?? null,
      supplier.city_state ?? null,
      supplier.status ?? null,
      supplier.bank_name ?? null,
      supplier.bank_branch ?? null,
      supplier.bank_account ?? null,
      sourceFileName,
      supplier.is_active,
    ],
  );
}

export async function listSuppliers(search?: string): Promise<Supplier[]> {
  const searchTerm = cleanText(search);

  if (!searchTerm) {
    const result = await pool.query(
      `SELECT * FROM suppliers
       ORDER BY is_active DESC, supplier_name ASC
       LIMIT 300`,
    );

    return result.rows;
  }

  const like = `%${searchTerm}%`;
  const normalized = normalizeDocument(searchTerm);
  const result = await pool.query(
    `SELECT * FROM suppliers
     WHERE supplier_name ILIKE $1
        OR COALESCE(trade_name, '') ILIKE $1
        OR COALESCE(company, '') ILIKE $1
        OR document_raw ILIKE $1
        OR document_normalized = $2
     ORDER BY is_active DESC, supplier_name ASC
     LIMIT 300`,
    [like, normalized],
  );

  return result.rows;
}

export async function getSupplierByDocument(document: string): Promise<Supplier | null> {
  const normalized = normalizeDocument(document);
  if (!normalized) {
    return null;
  }

  const result = await pool.query(
    `SELECT * FROM suppliers WHERE document_normalized = $1 LIMIT 1`,
    [normalized],
  );

  return result.rows[0] || null;
}

export async function updateSupplierStatus(id: string, isActive: boolean): Promise<Supplier | null> {
  const result = await pool.query(
    `UPDATE suppliers
     SET is_active = $2,
         status = CASE WHEN $2 THEN 'Ativo' ELSE 'Inativo' END,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [id, isActive],
  );

  return result.rows[0] || null;
}

export async function importSuppliersFromSpreadsheet(
  fileBuffer: Buffer,
  originalFileName: string,
  createdBy: string,
): Promise<SupplierImportResult> {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('A planilha não possui abas legíveis');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<SpreadsheetRow>(worksheet, { defval: '' });

  let imported = 0;
  let updated = 0;
  const skipped: SupplierImportSkippedRow[] = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const parsed = mapSpreadsheetRow(row);

    if (!parsed) {
      skipped.push({
        row: rowNumber,
        reason: 'Linha sem fornecedor ou documento válido',
        supplier_name: cleanText(row['Fornecedor']),
        document: cleanText(row['CPF / CNPJ']),
      });
      continue;
    }

    const existing = await pool.query(
      'SELECT id FROM suppliers WHERE document_normalized = $1',
      [parsed.document_normalized],
    );

    if (existing.rowCount && existing.rowCount > 0) {
      await updateSupplier(parsed, originalFileName);
      updated++;
    } else {
      await insertSupplier(parsed, originalFileName, createdBy);
      imported++;
    }
  }

  logger.info(
    {
      originalFileName,
      sheetName,
      totalRows: rows.length,
      imported,
      updated,
      skipped: skipped.length,
    },
    'Importação de fornecedores concluída',
  );

  return {
    sheet_name: sheetName,
    total_rows: rows.length,
    imported,
    updated,
    skipped: skipped.slice(0, 20),
  };
}