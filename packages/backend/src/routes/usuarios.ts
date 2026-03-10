import express from 'express';

export const usuariosRoutes = express.Router();

/**
 * @route GET /api/usuarios
 * @description Listar usuários
 * @access Private (Admin)
 */
usuariosRoutes.get('/', (req, res) => {
  // TODO: Listar usuários
  res.json({ message: 'Lista de usuários' });
});

/**
 * @route POST /api/usuarios
 * @description Criar novo usuário
 * @access Private (Admin)
 */
usuariosRoutes.post('/', (req, res) => {
  // TODO: Criar usuário
  res.json({ message: 'Usuário criado' });
});

/**
 * @route GET /api/usuarios/me
 * @description Obter perfil do usuário atual
 * @access Private
 */
usuariosRoutes.get('/me', (req, res) => {
  // TODO: Obter perfil
  res.json({ message: 'Perfil do usuário' });
});
