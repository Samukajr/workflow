import express from 'express';

export const requisicoesRoutes = express.Router();

/**
 * @route GET /api/requisicoes
 * @description Listar todas as requisições
 * @access Private
 */
requisicoesRoutes.get('/', (req, res) => {
  // TODO: Listar requisições
  res.json({ message: 'Lista de requisições' });
});

/**
 * @route POST /api/requisicoes
 * @description Criar nova requisição com upload de documentos
 * @access Private
 */
requisicoesRoutes.post('/', (req, res) => {
  // TODO: Criar requisição
  res.json({ message: 'Criar requisição' });
});

/**
 * @route GET /api/requisicoes/:id
 * @description Obter detalhes de uma requisição
 * @access Private
 */
requisicoesRoutes.get('/:id', (req, res) => {
  // TODO: Obter detalhes
  res.json({ message: 'Detalhes da requisição' });
});

/**
 * @route PATCH /api/requisicoes/:id
 * @description Atualizar requisição
 * @access Private
 */
requisicoesRoutes.patch('/:id', (req, res) => {
  // TODO: Atualizar requisição
  res.json({ message: 'Atualizar requisição' });
});
