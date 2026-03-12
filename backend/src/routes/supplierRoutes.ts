import { Router } from 'express';
import multer from 'multer';
import * as supplierController from '../controllers/supplierController';
import { authMiddleware, requireDepartment, requireSuperadmin } from '../middleware/auth';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const lowerName = (file.originalname || '').toLowerCase();
    if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) {
      cb(null, true);
      return;
    }

    cb(new Error('Arquivo inválido. Envie uma planilha .xls ou .xlsx'));
  },
});

router.get('/', authMiddleware, supplierController.getSuppliers);
router.post('/', authMiddleware, requireSuperadmin, supplierController.createSupplier);
router.post('/import', authMiddleware, requireDepartment('admin'), upload.single('file'), supplierController.importSuppliers);
router.patch('/:id/status', authMiddleware, requireDepartment('admin'), supplierController.updateSupplierStatus);
router.patch('/:id', authMiddleware, requireSuperadmin, supplierController.updateSupplier);

export default router;