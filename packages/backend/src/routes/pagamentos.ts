import express from 'express';

export const pagamentosRoutes = express.Router();

/**
 * @route GET /api/pagamentos
 * @description Listar pagamentos
 * @access Private
 */
pagamentosRoutes.get('/', (req, res) => {
  // TODO: Listar pagamentos
  res.json({ message: 'Lista de pagamentos' });
});

/**
 * @route POST /api/pagamentos/:id/pagar
 * @description Efetuar pagamento
 * @access Private
 */
pagamentosRoutes.post('/:id/pagar', (req, res) => {
  // TODO: Efetuar pagamento
  res.json({ message: 'Pagamento realizado' });
});

/**
 * @route POST /api/pagamentos/:id/baixa
 * @description Dar baixa no pagamento
 * @access Private
 */
pagamentosRoutes.post('/:id/baixa', (req, res) => {
  // TODO: Dar baixa
  res.json({ message: 'Baixa realizada' });
});
