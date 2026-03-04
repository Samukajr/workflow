import express from 'express';

export const departamentosRoutes = express.Router();

/**
 * @route GET /api/departamentos
 * @description Listar departamentos
 * @access Private
 */
departamentosRoutes.get('/', (req, res) => {
  // TODO: Listar departamentos
  res.json({ message: 'Lista de departamentos' });
});

/**
 * @route POST /api/departamentos
 * @description Criar departamento
 * @access Private (Admin)
 */
departamentosRoutes.post('/', (req, res) => {
  // TODO: Criar departamento
  res.json({ message: 'Departamento criado' });
});
