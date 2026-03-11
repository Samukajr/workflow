import { pool } from '../config/database';

async function listAllUsers() {
  try {
    console.log('\n===========================================');
    console.log('📋 LISTANDO TODOS OS USUÁRIOS DO SISTEMA');
    console.log('===========================================\n');

    const result = await pool.query(`
      SELECT 
        id,
        email,
        name,
        department,
        is_active,
        last_login,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);

    if (result.rows.length === 0) {
      console.log('❌ NENHUM USUÁRIO ENCONTRADO NO BANCO!\n');
      console.log('O banco está vazio. Execute o seed para criar usuários demo.\n');
    } else {
      console.log(`✅ Total de usuários encontrados: ${result.rows.length}\n`);
      
      result.rows.forEach((user, index) => {
        console.log(`${index + 1}. 👤 ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Departamento: ${user.department}`);
        console.log(`   Ativo: ${user.is_active ? '✅ Sim' : '❌ Não'}`);
        console.log(`   Último login: ${user.last_login ? new Date(user.last_login).toLocaleString('pt-BR') : 'Nunca'}`);
        console.log(`   Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
        console.log(`   ID: ${user.id}`);
        console.log('');
      });
    }

    console.log('===========================================\n');

    await pool.end();
  } catch (error: unknown) {
    console.error('❌ Erro ao listar usuários:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

listAllUsers();
