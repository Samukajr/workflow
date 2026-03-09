import { pool } from '../config/database';
import logger from '../utils/logger';

async function updateDepartmentEnum() {
  try {
    console.log('\n===========================================');
    console.log('🔧 ATUALIZANDO ENUM DE DEPARTAMENTOS');
    console.log('===========================================\n');

    // Adicionar novos valores ao enum
    const newDepartments = ['admin', 'superadmin'];

    for (const dept of newDepartments) {
      try {
        await pool.query(`
          ALTER TYPE department_enum ADD VALUE IF NOT EXISTS '${dept}';
        `);
        console.log(`✅ Departamento '${dept}' adicionado ao enum`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  Departamento '${dept}' já existe no enum`);
        } else {
          console.error(`❌ Erro ao adicionar '${dept}':`, error.message);
        }
      }
    }

    // Listar todos os valores do enum
    const result = await pool.query(`
      SELECT e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname = 'department_enum'
      ORDER BY e.enumsortorder;
    `);

    console.log('\n📋 Departamentos disponíveis no sistema:');
    result.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.enumlabel}`);
    });

    console.log('\n===========================================');
    console.log('✅ Enum atualizado com sucesso!');
    console.log('===========================================\n');

    await pool.end();
  } catch (error: any) {
    console.error('❌ Erro ao atualizar enum:', error.message);
    process.exit(1);
  }
}

updateDepartmentEnum();
