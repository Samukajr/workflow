import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { pool } from '../config/database';

export type ReportType = 'payments' | 'validations' | 'audit';

type ReportRow = Record<string, string | number | null>;

const reportTitles: Record<ReportType, string> = {
  payments: 'Relatorio de Pagamentos',
  validations: 'Relatorio de Validacoes',
  audit: 'Relatorio de Auditoria',
};

function formatDate(value: Date | string | null): string {
  if (!value) {
    return '-';
  }

  const dateValue = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateValue.getTime())) {
    return String(value);
  }

  return dateValue.toLocaleString('pt-BR');
}

function formatCurrency(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return '-';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function prettyHeader(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function getReportData(type: ReportType, limit: number): Promise<ReportRow[]> {
  if (type === 'payments') {
    const result = await pool.query(
      `SELECT
        pr.request_number,
        pr.status,
        pr.amount,
        pr.supplier_name,
        pr.supplier_document,
        pr.due_date,
        pr.created_at,
        u.name AS solicitado_por
      FROM payment_requests pr
      LEFT JOIN users u ON u.id = pr.user_id
      ORDER BY pr.created_at DESC
      LIMIT $1`,
      [limit],
    );

    return result.rows.map((row) => ({
      request_number: row.request_number,
      status: row.status,
      amount: formatCurrency(Number(row.amount)),
      supplier_name: row.supplier_name,
      supplier_document: row.supplier_document,
      due_date: formatDate(row.due_date),
      created_at: formatDate(row.created_at),
      solicitado_por: row.solicitado_por || '-',
    }));
  }

  if (type === 'validations') {
    const result = await pool.query(
      `SELECT
        pr.request_number,
        pw.action,
        pw.status_to,
        pw.comments,
        pw.created_at,
        u.name AS validado_por
      FROM payment_workflows pw
      INNER JOIN payment_requests pr ON pr.id = pw.payment_request_id
      LEFT JOIN users u ON u.id = pw.performed_by
      WHERE pw.action IN ('validacao', 'rejeicao', 'aprovacao')
      ORDER BY pw.created_at DESC
      LIMIT $1`,
      [limit],
    );

    return result.rows.map((row) => ({
      request_number: row.request_number,
      action: row.action,
      status_to: row.status_to,
      comments: row.comments || '-',
      created_at: formatDate(row.created_at),
      validado_por: row.validado_por || '-',
    }));
  }

  const result = await pool.query(
    `SELECT
      al.action,
      al.entity_type,
      al.entity_id,
      al.ip_address,
      al.created_at,
      u.name AS usuario
    FROM audit_logs al
    LEFT JOIN users u ON u.id = al.user_id
    ORDER BY al.created_at DESC
    LIMIT $1`,
    [limit],
  );

  return result.rows.map((row) => ({
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id || '-',
    ip_address: row.ip_address || '-',
    created_at: formatDate(row.created_at),
    usuario: row.usuario || '-',
  }));
}

export async function buildExcelReport(type: ReportType, rows: ReportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(reportTitles[type]);
  const generatedAt = new Date().toLocaleString('pt-BR');

  worksheet.addRow([reportTitles[type]]);
  worksheet.addRow([`Gerado em: ${generatedAt}`]);
  worksheet.addRow([]);

  if (rows.length === 0) {
    worksheet.addRow(['Nenhum registro encontrado para os filtros selecionados.']);
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  const columns = Object.keys(rows[0]);
  worksheet.columns = columns.map((column) => ({
    header: prettyHeader(column),
    key: column,
    width: 24,
  }));

  rows.forEach((row) => worksheet.addRow(row));

  const headerRow = worksheet.getRow(4);
  headerRow.font = { bold: true };

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function buildPdfReport(type: ReportType, rows: ReportRow[]): Promise<Buffer> {
  const generatedAt = new Date().toLocaleString('pt-BR');
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const chunks: Buffer[] = [];

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text(reportTitles[type], { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Gerado em: ${generatedAt}`);
    doc.moveDown();

    if (rows.length === 0) {
      doc.fontSize(12).text('Nenhum registro encontrado para os filtros selecionados.');
      doc.end();
      return;
    }

    rows.forEach((row, index) => {
      doc.fontSize(11).text(`${index + 1}.`, { continued: true }).text(' Registro');
      Object.entries(row).forEach(([key, value]) => {
        doc.fontSize(9).text(`${prettyHeader(key)}: ${value ?? '-'}`);
      });
      doc.moveDown(0.4);

      if (doc.y > 760) {
        doc.addPage();
      }
    });

    doc.end();
  });
}