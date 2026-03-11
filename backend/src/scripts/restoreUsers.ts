import { pool } from '../config/database';
import bcrypt from 'bcryptjs';

async function restoreUsers() {
  try {
    console.log('\n===========================================');
    console.log('🔧 RESTAURANDO USUÁRIOS DO SISTEMA');
    console.log('===========================================\n');

    // Verificar usuários existentes
    const existingUsers = await pool.query('SELECT email FROM users');
    const existingEmails = existingUsers.rows.map(u => u.email);

    console.log(`📊 Usuários existentes: ${existingEmails.length}`);
    if (existingEmails.length > 0) {
      console.log('Emails encontrados:');
      existingEmails.forEach(email => console.log(`  - ${email}`));
      console.log('');
    }

    // Senha padrão: DemoPass@123
    const demoPassword = await bcrypt.hash('DemoPass@123', 10);

    // Usuários a serem criados/restaurados
    const usersToCreate = [
      { email: 'submissao@empresa.com', name: 'João Submissão', department: 'submissao' },
      { email: 'validacao@empresa.com', name: 'Maria Validação', department: 'validacao' },
      { email: 'financeiro@empresa.com', name: 'Carlos Financeiro', department: 'financeiro' },
      { email: 'admin@empresa.com', name: 'Admin Sistema', department: 'admin' },
      { email: 'superadmin@empresa.com', name: 'Super Admin', department: 'superadmin' },
    ];

    let created = 0;
    let skipped = 0;

    for (const user of usersToCreate) {
      if (existingEmails.includes(user.email)) {
        console.log(`⏭️  Pulando ${user.email} (já existe)`);
        skipped++;
      } else {
        try {
          await pool.query(
            'INSERT INTO users (email, name, department, password_hash) VALUES ($1, $2, $3, $4)',
            [user.email, user.name, user.department, demoPassword]
          );
          console.log(`✅ Criado: ${user.email} (${user.department})`);
          created++;
        } catch (error: unknown) {
          console.error(`❌ Erro ao criar ${user.email}:`, error instanceof Error ? error.message : String(error));
        }
      }
    }

    console.log('\n===========================================');
    console.log(`✅ Usuários criados: ${created}`);
    console.log(`⏭️  Usuários pulados: ${skipped}`);
    console.log('===========================================');
    console.log('\n📝 CREDENCIAIS (todos com a mesma senha):');
    console.log('   Email: <qualquer um dos acima>');
    console.log('   Senha: DemoPass@123\n');

    await pool.end();
  } catch (error: unknown) {
    console.error('❌ Erro ao restaurar usuários:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

restoreUsers();
