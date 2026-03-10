#!/usr/bin/env node

/**
 * Script de Diagnóstico do Sistema
 * Verifica: Docker, PostgreSQL, Backend, Frontend
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n╔════════════════════════════════════════════════╗');
console.log('║      🔍 DIAGNÓSTICO DO SISTEMA - v1.0         ║');
console.log('╚════════════════════════════════════════════════╝\n');

const checks = [];

// ==========================================
// 1. DOCKER
// ==========================================
console.log('1️⃣  VERIFICANDO DOCKER...\n');

try {
  execSync('docker --version', { stdio: 'pipe' });
  console.log('   ✅ Docker instalado');
  checks.push({ name: 'Docker', status: 'OK' });
} catch (error) {
  console.log('   ❌ Docker não instalado ou não está no PATH');
  console.log('      https://www.docker.com/products/docker-desktop\n');
  checks.push({ name: 'Docker', status: 'ERRO' });
}

try {
  execSync('docker-compose --version', { stdio: 'pipe' });
  console.log('   ✅ Docker Compose instalado\n');
} catch (error) {
  console.log('   ❌ Docker Compose não instalado\n');
}

// ==========================================
// 2. POSTGRESQL
// ==========================================
console.log('2️⃣  VERIFICANDO POSTGRESQL...\n');

try {
  execSync('docker-compose ps', { cwd: 'e:\\APP\\WORKFLOW', stdio: 'pipe' });
  console.log('   ✅ Docker Compose pode rodar');
  checks.push({ name: 'Docker-Compose', status: 'OK' });
} catch (error) {
  console.log('   ❌ Docker Compose não consegue rodar');
  console.log('      Certifique-se que você está no diretório correto\n');
  checks.push({ name: 'Docker-Compose', status: 'ERRO' });
}

// ==========================================
// 3. VARIÁVEIS DE AMBIENTE
// ==========================================
console.log('3️⃣  VERIFICANDO CONFIGURAÇÕES...\n');

const envPath = path.join('e:', 'APP', 'WORKFLOW', '.env');
if (fs.existsSync(envPath)) {
  console.log('   ✅ Arquivo .env existe');
  checks.push({ name: 'Variáveis de Ambiente', status: 'OK' });
} else {
  console.log('   ❌ Arquivo .env não encontrado');
  console.log('      Execute: COPY .env.example .env\n');
  checks.push({ name: 'Variáveis de Ambiente', status: 'ERRO' });
}

// ==========================================
// 4. BACKEND
// ==========================================
console.log('4️⃣  VERIFICANDO BACKEND...\n');

const backendPath = path.join('e:', 'APP', 'WORKFLOW', 'backend', 'package.json');
if (fs.existsSync(backendPath)) {
  console.log('   ✅ Backend existe');
  
  try {
    const content = fs.readFileSync(path.join('e:', 'APP', 'WORKFLOW', 'backend', 'node_modules', '@types', 'node'), 'utf8');
    console.log('   ✅ Dependências do Backend instaladas\n');
    checks.push({ name: 'Backend', status: 'OK' });
  } catch (error) {
    console.log('   ⚠️  Dependências do Backend não instaladas');
    console.log('      Execute: cd backend && npm install\n');
    checks.push({ name: 'Backend', status: 'AVISO' });
  }
} else {
  console.log('   ❌ Backend não encontrado\n');
  checks.push({ name: 'Backend', status: 'ERRO' });
}

// ==========================================
// 5. FRONTEND
// ==========================================
console.log('5️⃣  VERIFICANDO FRONTEND...\n');

const frontendPath = path.join('e:', 'APP', 'WORKFLOW', 'packages', 'frontend', 'package.json');
if (fs.existsSync(frontendPath)) {
  console.log('   ✅ Frontend existe');
  
  try {
    const content = fs.readFileSync(path.join('e:', 'APP', 'WORKFLOW', 'packages', 'frontend', 'node_modules', 'react'), 'utf8');
    console.log('   ✅ Dependências do Frontend instaladas\n');
    checks.push({ name: 'Frontend', status: 'OK' });
  } catch (error) {
    console.log('   ⚠️  Dependências do Frontend não instaladas');
    console.log('      Execute: cd packages/frontend && npm install\n');
    checks.push({ name: 'Frontend', status: 'AVISO' });
  }
} else {
  console.log('   ❌ Frontend não encontrado\n');
  checks.push({ name: 'Frontend', status: 'ERRO' });
}

// ==========================================
// RESUMO
// ==========================================
console.log('\n╔════════════════════════════════════════════════╗');
console.log('║                   📊 RESUMO                     ║');
console.log('╚════════════════════════════════════════════════╝\n');

checks.forEach(check => {
  const icon = check.status === 'OK' ? '✅' : check.status === 'AVISO' ? '⚠️ ' : '❌';
  console.log(`${icon} ${check.name.padEnd(30)} ${check.status}`);
});

// ==========================================
// PRÓXIMOS PASSOS
// ==========================================
console.log('\n╔════════════════════════════════════════════════╗');
console.log('║              🚀 PRÓXIMOS PASSOS                ║');
console.log('╚════════════════════════════════════════════════╝\n');

console.log('1. Abra COMECE_AQUI.md para instruções detalhadas');
console.log('2. Siga a ordem:\n');

console.log('   Terminal 1:');
console.log('   $ cd e:\\APP\\WORKFLOW');
console.log('   $ docker-compose up -d\n');

console.log('   Terminal 2:');
console.log('   $ cd e:\\APP\\WORKFLOW\\backend');
console.log('   $ npm install (se necessário)');
console.log('   $ npm run migrate');
console.log('   $ npm run fix:login');
console.log('   $ npm run dev\n');

console.log('   Terminal 3:');
console.log('   $ cd e:\\APP\\WORKFLOW\\packages\\frontend');
console.log('   $ npm install (se necessário)');
console.log('   $ npm run dev\n');

console.log('3. Acesse: http://localhost:5173\n');

console.log('✅ Pronto!\n');
