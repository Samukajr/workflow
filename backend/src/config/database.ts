import { Pool, PoolConfig } from 'pg';
import { env } from './environment';

const poolConfig: PoolConfig = {
  connectionString: env.DATABASE_URL || `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('Nova conexão com banco de dados estabelecida');
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões', err);
});

export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Conexão com banco de dados estabelecida:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Falha ao conectar ao banco de dados:', error);
    return false;
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}
