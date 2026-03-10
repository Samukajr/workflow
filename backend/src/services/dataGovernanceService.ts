import fs from 'fs';
import path from 'path';
import { env } from '../config/environment';
import logger from '../utils/logger';
import {
  createAuditLog,
  deleteExpiredPersonalDataExports,
  getRecentUploadReferences,
  getRetentionDocumentCandidates,
  markDocumentAsRetentionRemoved,
} from '../database/queries';

const RETENTION_ELIGIBLE_STATUSES = ['pago', 'rejeitado', 'cancelado'];

function resolveUploadDir(): string {
  return path.isAbsolute(env.UPLOAD_DIR) ? env.UPLOAD_DIR : path.resolve(process.cwd(), env.UPLOAD_DIR);
}

function resolveUploadFilePath(documentUrl: string, uploadDir: string): string | null {
  if (!documentUrl.startsWith('/uploads/')) {
    return null;
  }

  const fileName = path.basename(documentUrl);
  const absolutePath = path.resolve(uploadDir, fileName);

  if (!absolutePath.startsWith(path.resolve(uploadDir))) {
    return null;
  }

  return absolutePath;
}

async function processDocumentRetention(): Promise<{ removed: number; missing: number }> {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - env.PAYMENT_DOCUMENT_RETENTION_YEARS);

  const candidates = await getRetentionDocumentCandidates(
    cutoff,
    RETENTION_ELIGIBLE_STATUSES,
    env.DATA_RETENTION_BATCH_SIZE,
  );

  if (candidates.length === 0) {
    return { removed: 0, missing: 0 };
  }

  const uploadDir = resolveUploadDir();
  let removed = 0;
  let missing = 0;

  for (const candidate of candidates) {
    const filePath = resolveUploadFilePath(candidate.document_url, uploadDir);

    if (!filePath) {
      await createAuditLog(
        null,
        'RETENTION_INVALID_PATH',
        'payment_request',
        candidate.id,
        {
          requestNumber: candidate.request_number,
          documentUrl: candidate.document_url,
        },
      );
      continue;
    }

    const fileExists = fs.existsSync(filePath);

    if (fileExists) {
      fs.unlinkSync(filePath);
      removed += 1;
    } else {
      missing += 1;
    }

    await markDocumentAsRetentionRemoved(candidate.id);

    await createAuditLog(
      null,
      fileExists ? 'RETENTION_DELETE_FILE' : 'RETENTION_MISSING_FILE',
      'payment_request',
      candidate.id,
      {
        requestNumber: candidate.request_number,
        status: candidate.status,
        createdAt: candidate.created_at,
        documentUrl: candidate.document_url,
        fileExists,
        retentionYears: env.PAYMENT_DOCUMENT_RETENTION_YEARS,
      },
    );
  }

  return { removed, missing };
}

async function verifyRecentUploadIntegrity(): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - env.INTEGRITY_SCAN_DAYS);

  const references = await getRecentUploadReferences(since, env.DATA_RETENTION_BATCH_SIZE);
  if (references.length === 0) {
    return 0;
  }

  const uploadDir = resolveUploadDir();
  let warnings = 0;

  for (const reference of references) {
    const filePath = resolveUploadFilePath(reference.document_url, uploadDir);
    const exists = filePath ? fs.existsSync(filePath) : false;

    if (!exists) {
      warnings += 1;
      await createAuditLog(
        null,
        'INTEGRITY_WARNING',
        'payment_request',
        reference.id,
        {
          requestNumber: reference.request_number,
          documentUrl: reference.document_url,
          createdAt: reference.created_at,
          scanWindowDays: env.INTEGRITY_SCAN_DAYS,
          reason: 'Arquivo referenciado não encontrado em disco',
        },
      );
    }
  }

  return warnings;
}

export async function runDataGovernanceCycle(): Promise<void> {
  if (!env.DATA_GOVERNANCE_ENABLED) {
    return;
  }

  const startedAt = Date.now();

  const [retentionResult, integrityWarnings, expiredExportsRemoved] = await Promise.all([
    processDocumentRetention(),
    verifyRecentUploadIntegrity(),
    deleteExpiredPersonalDataExports(env.DATA_RETENTION_BATCH_SIZE),
  ]);

  logger.info(
    {
      durationMs: Date.now() - startedAt,
      removedFiles: retentionResult.removed,
      missingFiles: retentionResult.missing,
      integrityWarnings,
      expiredExportsRemoved,
      retentionYears: env.PAYMENT_DOCUMENT_RETENTION_YEARS,
    },
    'Ciclo de governança de dados finalizado',
  );
}