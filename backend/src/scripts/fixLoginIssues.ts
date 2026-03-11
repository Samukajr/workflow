import { pool } from '../config/database';
import bcrypt from 'bcryptjs';

type UserRow = { email: string; name: string; department: string; is_active: boolean };

async function fixLoginIssues() {
  try {
    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log('║  🔧 DIAGNÓSTICO E REPARO - PROBLEMAS DE LOGIN  ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    // ==========================================
    // PASSO 1: Verificar usuarios existentes
    // ==========================================
    console.log('📊 PASSO 1: Verificando usuários existentes...\n');
    
    const usersResult = await pool.query('SELECT email, name, department, is_active FROM users ORDER BY created_at DESC');
    const existingUsers = usersResult.rows;
    
    if (existingUsers.length === 0) {
      console.log('❌ PROBLEMA: Nenhum usuário encontrado no banco de dados!\n');
    } else {
      console.log(`✅ Encontrados ${existingUsers.length} usuário(s):\n`);
      existingUsers.forEach((user: UserRow) => {
        const status = user.is_active ? '✅ Ativo' : '❌ Inativo';
        console.log(`   • ${user.email} (${user.department}) - ${status}`);
      });
      console.log('');
    }

    // ==========================================
    // PASSO 2: Verificar se superadmin existe
    // ==========================================
    console.log('🔍 PASSO 2: Verificando superadministrador...\n');
    
    const superadminCheck = existingUsers.find((u: UserRow) => u.email === 'superadmin@empresa.com');
    
    if (superadminCheck) {
      console.log('✅ Superadmin já existe!\n');
      
      // Se existe mas está inativo, reativar
      if (!superadminCheck.is_active) {
        console.log('⚠️  ENCONTRADO PROBLEMA: Superadmin está INATIVO!');
        console.log('🔧 Reativando superadmin...\n');
        
        await pool.query(
          'UPDATE users SET is_active = true WHERE email = $1',
          ['superadmin@empresa.com']
        );
        
        console.log('✅ Superadmin reativado!\n');
      }
    } else {
      console.log('❌ PROBLEMA: Superadmin não existe no banco!\n');
      console.log('🔧 Criando superadmin...\n');
      
      const demoPassword = await bcrypt.hash('DemoPass@123', 10);
      
      try {
        await pool.query(
          'INSERT INTO users (email, name, department, password_hash, is_active) VALUES ($1, $2, $3, $4, $5)',
          ['superadmin@empresa.com', 'Super Admin', 'superadmin', demoPassword, true]
        );
        
        console.log('✅ Superadmin criado com sucesso!\n');
      } catch (error: unknown) {
        if (error instanceof Error && (error.message.includes('violates enum') || error.message.includes('invalid enum'))) {
          console.log('❌ PROBLEMA: O enum de departamentos não tem "superadmin"!\n');
          console.log('🔧 Adicionando departamentos ao enum...\n');
          
          // Tentar adicionar ao enum
          try {
            await pool.query(`
              ALTER TYPE department_enum ADD VALUE 'admin' IF NOT EXISTS;
              ALTER TYPE department_enum ADD VALUE 'superadmin' IF NOT EXISTS;
            `);
            
            console.log('✅ Enums atualizados!\n');
            console.log('🔧 Tentando criar superadmin novamente...\n');
            
            // Tentar novamente
            await pool.query(
              'INSERT INTO users (email, name, department, password_hash, is_active) VALUES ($1, $2, $3, $4, $5)',
              ['superadmin@empresa.com', 'Super Admin', 'superadmin', demoPassword, true]
            );
            
            console.log('✅ Superadmin criado com sucesso após atualizar enums!\n');
          } catch (updateError: unknown) {
            console.error('❌ Erro ao atualizar enum:', updateError instanceof Error ? updateError.message : String(updateError));
            console.log('\n💡 SOLUÇÃO MANUAL: Execute em um terminal PostgreSQL:\n');
            console.log('   ALTER TYPE department_enum ADD VALUE \'admin\';');
            console.log('   ALTER TYPE department_enum ADD VALUE \'superadmin\';\n');
            throw updateError;
          }
        } else {
          throw error;
        }
      }
    }

    // ==========================================
    // PASSO 3: Restaurar todos os usuarios
    // ==========================================
    console.log('📋 PASSO 3: Garantindo que todos os usuários existem...\n');
    
    const demoPassword = await bcrypt.hash('DemoPass@123', 10);
    
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
      const exists = existingUsers.some((u: UserRow) => u.email === user.email);
      
      if (exists) {
        console.log(`⏭️  ${user.email} - ja existe`);
        skipped++;
      } else {
        try {
          await pool.query(
            'INSERT INTO users (email, name, department, password_hash, is_active) VALUES ($1, $2, $3, $4, $5)',
            [user.email, user.name, user.department, demoPassword, true]
          );
          console.log(`✅ ${user.email} - criado`);
          created++;
        } catch (error: unknown) {
          if (error instanceof Error && error.message.includes('violates enum')) {
            console.log(`❌ ${user.email} - erro: departamento '${user.department}' não existe no enum`);
          } else {
            console.log(`❌ ${user.email} - erro: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }
    }

    console.log(`\n📊 Criados: ${created}, Existentes: ${skipped}\n`);

    // ==========================================
    // PASSO 4: Verificacao final
    // ==========================================
    console.log('✅ PASSO 4: Verificação Final\n');
    
    const finalCheck = await pool.query('SELECT COUNT(*) as count FROM users WHERE email = $1 AND is_active = true', ['superadmin@empresa.com']);
    
    if (finalCheck.rows[0].count > 0) {
      console.log('✅ Superadmin está pronto para usar!\n');
    } else {
      console.log('❌ Superadmin ainda não foi criado com sucesso\n');
    }

    // ==========================================
    // RESUMO FINAL
    // ==========================================
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║           📝 CREDENCIAIS PARA LOGIN            ║');
    console.log('╠═══════════════════════════════════════════════╣');
    console.log('║                                               ║');
    console.log('║  Email:    superadmin@empresa.com             ║');
    console.log('║  Senha:    DemoPass@123                       ║');
    console.log('║                                               ║');
    console.log('║  Ou use qualquer outro usuário:               ║');
    console.log('║  - submissao@empresa.com                      ║');
    console.log('║  - validacao@empresa.com                      ║');
    console.log('║  - financeiro@empresa.com                     ║');
    console.log('║  - admin@empresa.com                          ║');
    console.log('║                                               ║');
    console.log('║  Todos com a mesma senha: DemoPass@123        ║');
    console.log('║                                               ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    console.log('✅ Processo de reparo concluído!\n');
    console.log('Próximos passos:');
    console.log('  1. Inicie o backend: npm run dev');
    console.log('  2. Tente fazer login no frontend');
    console.log('  3. Use as credenciais acima\n');

    await pool.end();
  } catch (error: unknown) {
    console.error('\n❌ Erro durante o processo de reparo:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

fixLoginIssues();
