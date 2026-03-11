/**
 * Script de setup completo para produção.
 * Cria todas as tabelas e popula os usuários do sistema.
 * Execute: ts-node src/scripts/setupProduction.ts
 */
import { pool } from '../config/database';
import { initializeDatabase } from '../database/migrations';
import { createLGPDTables } from '../database/lgpdMigrations';
import { runBankingMigrations } from '../database/bankingMigrations';
import { createPasswordResetTable } from '../database/passwordResetMigrations';
import bcrypt from 'bcryptjs';

async function setup() {
  console.log('\n==========================================');
  console.log('🚀 SETUP COMPLETO DE PRODUÇÃO');
  console.log('==========================================\n');

  try {
    // 1. Testar conexão
    console.log('1️⃣  Testando conexão com banco de dados...');
    await pool.query('SELECT NOW()');
    console.log('   ✅ Conexão estabelecida\n');

    // 2. Criar ENUMs e tabelas core (users, payment_requests, etc.)
    console.log('2️⃣  Criando ENUMs e tabelas core...');
    await pool.query(`
      DO $$ BEGIN CREATE TYPE department_enum AS ENUM ('financeiro','validacao','submissao','admin','superadmin'); EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN CREATE TYPE request_status_enum AS ENUM ('pendente_validacao','validado','rejeitado','em_pagamento','pago','cancelado'); EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN CREATE TYPE document_type_enum AS ENUM ('nf','boleto'); EXCEPTION WHEN duplicate_object THEN null; END $$;

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        department department_enum NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);

      CREATE TABLE IF NOT EXISTS payment_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_number VARCHAR(50) NOT NULL UNIQUE,
        user_id UUID NOT NULL REFERENCES users(id),
        document_url VARCHAR(500) NOT NULL,
        document_type document_type_enum NOT NULL,
        status request_status_enum DEFAULT 'pendente_validacao',
        amount NUMERIC(15,2) NOT NULL,
        supplier_name VARCHAR(255) NOT NULL,
        supplier_document VARCHAR(20) NOT NULL,
        due_date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
    `);
    console.log('   ✅ Tabelas core criadas\n');

    // 3. Criar restante das tabelas (dependem de users e payment_requests)
    console.log('3️⃣  Criando tabelas dependentes...');
    await initializeDatabase();
    console.log('   ✅ Tabelas dependentes criadas\n');

    // 4. Criar tabelas LGPD
    console.log('4️⃣  Criando tabelas LGPD...');
    await createLGPDTables();
    console.log('   ✅ Tabelas LGPD criadas\n');

    // 5. Criar tabelas banking
    console.log('5️⃣  Criando tabelas banking...');
    await runBankingMigrations();
    console.log('   ✅ Tabelas banking criadas\n');

    // 6. Criar tabela de reset de senha
    console.log('6️⃣  Criando tabela de reset de senha...');
    await createPasswordResetTable();
    console.log('   ✅ Tabela de reset criada\n');

    // 7. Criar/restaurar usuários
    console.log('7️⃣  Criando usuários do sistema...');
    const demoPassword = await bcrypt.hash('DemoPass@123', 10);

    const users = [
      { email: 'submissao@empresa.com', name: 'João Submissão', department: 'submissao' },
      { email: 'validacao@empresa.com', name: 'Maria Validação', department: 'validacao' },
      { email: 'financeiro@empresa.com', name: 'Carlos Financeiro', department: 'financeiro' },
      { email: 'admin@empresa.com', name: 'Admin Sistema', department: 'admin' },
      { email: 'superadmin@empresa.com', name: 'Super Admin', department: 'superadmin' },
    ];

    for (const user of users) {
      try {
        await pool.query(
          `INSERT INTO users (email, name, department, password_hash, is_active)
           VALUES ($1, $2, $3, $4, true)
           ON CONFLICT (email) DO UPDATE SET
             is_active = true,
             password_hash = EXCLUDED.password_hash,
             department = EXCLUDED.department`,
          [user.email, user.name, user.department, demoPassword]
        );
        console.log(`   ✅ ${user.email} (${user.department})`);
      } catch (err: unknown) {
        console.error(`   ❌ Erro em ${user.email}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    console.log('\n==========================================');
    console.log('✅ SETUP CONCLUÍDO COM SUCESSO!');
    console.log('==========================================');
    console.log('\n📋 CREDENCIAIS DE ACESSO:');
    console.log('   Senha de todos os usuários: DemoPass@123');
    console.log('   superadmin@empresa.com  → Superadmin');
    console.log('   admin@empresa.com       → Admin');
    console.log('   financeiro@empresa.com  → Financeiro');
    console.log('   validacao@empresa.com   → Validação');
    console.log('   submissao@empresa.com   → Submissão');
    console.log('\n⚠️  IMPORTANTE: Altere as senhas após o primeiro acesso!\n');

  } catch (error: unknown) {
    console.error('\n❌ ERRO NO SETUP:', error instanceof Error ? error.message : String(error));
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setup();
