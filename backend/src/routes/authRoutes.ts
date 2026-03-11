import { Router } from 'express';
import * as authController from '../controllers/authController';
import * as passwordResetController from '../controllers/passwordResetController';
import { authMiddleware, requireSuperadmin } from '../middleware/auth';
import { passwordResetLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar novo usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               department:
 *                 type: string
 *                 enum: [submissao, validacao, financeiro]
 */
router.post('/register', authMiddleware, requireSuperadmin, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login de usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obter informações do usuário autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', authMiddleware, authController.me);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Solicitar recuperação de senha
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 */
router.post('/forgot-password', passwordResetLimiter, passwordResetController.forgotPassword);

/**
 * @swagger
 * /api/auth/validate-reset-token:
 *   post:
 *     summary: Validar token de reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 */
router.post('/validate-reset-token', passwordResetController.validateToken);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Redefinir senha com token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 */
router.post('/reset-password', passwordResetController.resetPasswordController);

export default router;
