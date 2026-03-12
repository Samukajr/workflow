import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  recordConsent,
  getUserConsents,
  revokeConsent,
  requestDataDeletion,
  getUserDeletionRequests,
  getPendingDeletionRequests,
  approveDeletionRequest,
  exportPersonalData,
  getPersonalDataAudit,
} from '../services/lgpdService';
import logger from '../utils/logger';

const router = Router();

// GET - Listar consentimentos do usuário autenticado
router.get('/consents', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || '';
    const consents = await getUserConsents(userId);
    res.json({ success: true, consents });
  } catch (error: unknown) {
    logger.error('Erro ao listar consentimentos:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar consentimentos' });
  }
});

// POST - Registrar consentimento
router.post('/consent', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { consent_type } = req.body;
    const userId = req.user?.id || '';
    const clientIp = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    if (!consent_type) {
      return res.status(400).json({ success: false, message: 'consent_type obrigatório' });
    }

    const consent = await recordConsent(userId, consent_type, clientIp, userAgent);
    res.status(201).json({ success: true, message: 'Consentimento registrado', consent });
  } catch (error: unknown) {
    logger.error('Erro ao registrar consentimento:', error);
    res.status(500).json({ success: false, message: 'Erro ao registrar consentimento' });
  }
});

// DELETE - Revogar consentimento
router.delete('/consent', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { consent_type } = req.body;
    const userId = req.user?.id || '';

    if (!consent_type) {
      return res.status(400).json({ success: false, message: 'consent_type obrigatório' });
    }

    await revokeConsent(userId, consent_type);
    res.json({ success: true, message: 'Consentimento revogado' });
  } catch (error: unknown) {
    logger.error('Erro ao revogar consentimento:', error);
    res.status(500).json({ success: false, message: 'Erro ao revogar consentimento' });
  }
});

// POST - Solicitar deleção de dados
router.post('/data-deletion', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const userId = req.user?.id || '';

    const request = await requestDataDeletion(userId, reason || 'Direito ao esquecimento');
    res.status(201).json({
      success: true,
      message: 'Requisição criada. Será processada em até 30 dias.',
      request,
    });
  } catch (error: unknown) {
    logger.error('Erro ao solicitar deleção:', error);
    res.status(500).json({ success: false, message: 'Erro ao solicitar deleção' });
  }
});

// GET - Listar solicitações de deleção do usuário autenticado
router.get('/data-deletion', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || '';
    const requests = await getUserDeletionRequests(userId);

    res.json({ success: true, requests });
  } catch (error: unknown) {
    logger.error('Erro ao listar solicitações de deleção:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar solicitações de deleção' });
  }
});

// GET - Exportar dados pessoais
router.get('/data-export', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || '';
    const data = await exportPersonalData(userId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="dados-${userId}.json"`);
    res.send(data);

    logger.info(`Dados exportados para ${userId}`);
  } catch (error: unknown) {
    logger.error('Erro ao exportar dados:', error);
    res.status(500).json({ success: false, message: 'Erro ao exportar dados' });
  }
});

// GET - Histórico de auditoria
router.get('/data-audit', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || '';
    const audit = await getPersonalDataAudit(userId);

    res.json({ success: true, message: 'Histórico de processamento', audit });
  } catch (error: unknown) {
    logger.error('Erro ao obter auditoria:', error);
    res.status(500).json({ success: false, message: 'Erro ao obter auditoria' });
  }
});

// GET - Listar requisições de deleção (ADMIN)
router.get('/deletion-requests', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Apenas usuários de validacao (que têm poder de aprovação) podem ver requisições
    if (req.user?.department !== 'validacao') {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }

    const requests = await getPendingDeletionRequests();
    res.json({ success: true, message: 'Requisições pendentes', requests });
  } catch (error: unknown) {
    logger.error('Erro ao listar requisições:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar' });
  }
});

// POST - Aprovar deleção (ADMIN)
router.post('/deletion-requests/:id/approve', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user?.department !== 'validacao') {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }

    await approveDeletionRequest(req.params.id, req.user.id || '');
    res.json({ success: true, message: 'Deleção aprovada' });
  } catch (error: unknown) {
    logger.error('Erro ao aprovar deleção:', error);
    res.status(500).json({ success: false, message: 'Erro ao aprovar' });
  }
});

export default router;
