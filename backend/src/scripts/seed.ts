/**
 * Script de Seed Inicial do Banco de Dados
 * 
 * IMPORTANTE: Este script deve ser executado APENAS UMA VEZ durante o setup inicial!
 * 
 * ⚠️  AVISO: NÃO execute este script se você já tem usuários cadastrados!
 * 
 * Para executar:
 * > cd backend
 * > npm run seed
 * 
 * O script verifica automaticamente se já existem usuários e
 * não sobrescreve dados existentes.
 */

import { pool, closePool } from '../config/database';
import logger from '../utils/logger';
import bcrypt from 'bcryptjs';

async function seedDatabase(): Promise<void> {
  try {
    logger.info('===========================================');
    logger.info('🌱 INICIANDO SEED DO BANCO DE DADOS');
    logger.info('===========================================\n');

    // Verificar se já existem usuários
    const result = await pool.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(result.rows[0].count);

    if (userCount > 0) {
      logger.warn(`⚠️  SEED CANCELADO: Já existem ${userCount} usuário(s) no banco de dados!`);
      logger.warn('   Para proteger seus dados, o seed não será executado.');
      logger.warn('   Se você quer resetar o banco, delete os usuários manualmente primeiro.\n');
      logger.info('===========================================');
      return;
    }

    logger.info('✅ Banco de dados vazio. Criando usuários demo...\n');

    // Hash da senha demo (DemoPass@123)
    const demoPassword = await bcrypt.hash('DemoPass@123', 10);

    // Inserir usuários demo
    await pool.query(`
      INSERT INTO users (email, name, department, password_hash) VALUES
      ('submissao@empresa.com', 'João Submissão', 'submissao', $1),
      ('validacao@empresa.com', 'Maria Validação', 'validacao', $1),
      ('financeiro@empresa.com', 'Carlos Financeiro', 'financeiro', $1);
    `, [demoPassword]);

    logger.info('✅ Usuários demo criados com sucesso!\n');
    logger.info('📝 CREDENCIAIS DE ACESSO:');
    logger.info('   - submissao@empresa.com | DemoPass@123');
    logger.info('   - validacao@empresa.com | DemoPass@123');
    logger.info('   - financeiro@empresa.com | DemoPass@123\n');
    logger.info('===========================================');
    logger.info('🎉 SEED CONCLUÍDO COM SUCESSO!');
    logger.info('===========================================\n');

  } catch (error: unknown) {
    logger.error('❌ ERRO ao fazer seed do banco de dados:', error);

    if ((error as { code?: string }).code === '23505') {
      logger.error('   Erro: Usuários já existem (violação de chave única)');
    } else if ((error as { code?: string }).code === '42P01') {
      logger.error('   Erro: Tabela "users" não existe. Execute as migrations primeiro!');
    }

    throw error;
  }
}

// Executar seed e fechar conexão
seedDatabase()
  .then(() => {
    logger.info('🔒 Fechando conexão com o banco de dados...\n');
    closePool();
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Falha crítica no seed:', error);
    closePool();
    process.exit(1);
  });
