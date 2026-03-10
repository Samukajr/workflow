import express from 'express';

export const authRoutes = express.Router();

/**
 * @route POST /api/auth/login
 * @description Login de usuário
 * @access Public
 */
authRoutes.post('/login', (req, res) => {
  // TODO: Implementar login
  res.json({ message: 'Login endpoint' });
});

/**
 * @route POST /api/auth/register
 * @description Registrar novo usuário
 * @access Public
 */
authRoutes.post('/register', (req, res) => {
  // TODO: Implementar registro
  res.json({ message: 'Register endpoint' });
});

/**
 * @route POST /api/auth/refresh
 * @description Renovar token JWT
 * @access Public
 */
authRoutes.post('/refresh', (req, res) => {
  // TODO: Implementar refresh token
  res.json({ message: 'Refresh endpoint' });
});
