import express from 'express';
import { authRoutes } from './auth';
import { requisicoesRoutes } from './requisicoes';
import { validacoesRoutes } from './validacoes';
import { pagamentosRoutes } from './pagamentos';
import { usuariosRoutes } from './usuarios';
import { departamentosRoutes } from './departamentos';
import { relatoriosRoutes } from './relatorios';

export const router = {
  auth: authRoutes,
  requisicoes: requisicoesRoutes,
  validacoes: validacoesRoutes,
  pagamentos: pagamentosRoutes,
  usuarios: usuariosRoutes,
  departamentos: departamentosRoutes,
  relatorios: relatoriosRoutes
};
