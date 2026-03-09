import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import * as paymentController from '../controllers/paymentController';
import { authMiddleware, requireDepartment } from '../middleware/auth';
import { env } from '../config/environment';

const router = Router();

const uploadDir = path.isAbsolute(env.UPLOAD_DIR) ? env.UPLOAD_DIR : path.resolve(process.cwd(), env.UPLOAD_DIR);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedMimeToExtensions: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
};

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const originalExtension = path.extname(file.originalname || '').toLowerCase();
    const allowedExtensions = allowedMimeToExtensions[file.mimetype] || [];
    const extension = allowedExtensions.includes(originalExtension)
      ? originalExtension
      : allowedExtensions[0] || '.bin';
    const safeFileName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
    cb(null, safeFileName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const originalExtension = path.extname(file.originalname || '').toLowerCase();
    const allowedExtensions = allowedMimeToExtensions[file.mimetype];

    if (!allowedExtensions) {
      cb(new Error('Tipo de arquivo não permitido'));
      return;
    }

    if (originalExtension && !allowedExtensions.includes(originalExtension)) {
      cb(new Error('Extensão de arquivo incompatível com o tipo enviado'));
      return;
    }

    if (allowedExtensions) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  },
  limits: {
    fileSize: env.MAX_FILE_SIZE,
    files: 1,
  },
});

/**
 * @swagger
 * /api/payments/submit:
 *   post:
 *     summary: Submeter nova requisição de pagamento
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document_type:
 *                 type: string
 *                 enum: [nf, boleto]
 *               amount:
 *                 type: number
 *               supplier_name:
 *                 type: string
 *               supplier_document:
 *                 type: string
 *               due_date:
 *                 type: string
 *               notes:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 */
router.post(
  '/submit',
  authMiddleware,
  requireDepartment('submissao'),
  upload.single('file'),
  paymentController.submitPaymentRequest,
);

/**
 * @swagger
 * /api/payments/validate:
 *   post:
 *     summary: Validar requisição de pagamento
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payment_request_id:
 *                 type: string
 *               approved:
 *                 type: boolean
 *               comments:
 *                 type: string
 */
router.post('/validate', authMiddleware, requireDepartment('validacao'), paymentController.validatePaymentRequest);

/**
 * @swagger
 * /api/payments/process:
 *   post:
 *     summary: Processar pagamento
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payment_request_id:
 *                 type: string
 *               transaction_id:
 *                 type: string
 *               payment_date:
 *                 type: string
 *               notes:
 *                 type: string
 */
router.post('/process', authMiddleware, requireDepartment('financeiro'), paymentController.processPayment);

/**
 * @swagger
 * /api/payments/close:
 *   post:
 *     summary: Encerrar solicitação após pagamento
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payment_request_id:
 *                 type: string
 *               comments:
 *                 type: string
 */
router.post('/close', authMiddleware, requireDepartment('financeiro'), paymentController.closePaymentRequest);

/**
 * @swagger
 * /api/payments/dashboard/stats:
 *   get:
 *     summary: Obter estatísticas do dashboard
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/dashboard/stats', authMiddleware, paymentController.getDashboard);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Listar requisições de pagamento
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *       - in: query
 *         name: offset
 *         schema:
 *           type: number
 */
router.get('/', authMiddleware, paymentController.listPaymentRequests);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Obter detalhes de uma requisição de pagamento
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', authMiddleware, paymentController.getPaymentRequest);

export default router;
