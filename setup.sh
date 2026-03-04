#!/bin/bash

# Script de setup rápido para o Workflow de Pagamentos

set -e

echo "🚀 Iniciando setup do Workflow de Pagamentos..."
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Verificar Node.js
echo -e "${BLUE}📋 Verificando requisitos...${NC}"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado"
    echo "Baixe em: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"

# Step 2: Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm não está instalado"
    exit 1
fi
npm_version=$(npm -v)
echo -e "${GREEN}✓ npm ${npm_version}${NC}"

# Step 3: Instalar dependências
echo ""
echo -e "${BLUE}📦 Instalando dependências...${NC}"
npm install
echo -e "${GREEN}✓ Dependências instaladas${NC}"

# Step 4: Criar arquivo .env
echo ""
echo -e "${BLUE}⚙️  Configurando variáveis de ambiente...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Arquivo .env criado. Configure as variáveis necessárias!${NC}"
fi

# Step 5: Resumo
echo ""
echo -e "${GREEN}✅ Setup completo!${NC}"
echo ""
echo -e "${BLUE}Próximos passos:${NC}"
echo "1. Configure o arquivo .env com suas credenciais PostgreSQL"
echo "2. Execute: npm run dev"
echo ""
echo -e "${YELLOW}Documentação:${NC}"
echo "📚 Instalação: docs/INSTALACAO.md"
echo "🏗️  Arquitetura: docs/ARQUITETURA.md"
echo "📚 API: docs/API.md"
echo "🔐 LGPD: docs/LGPD.md"
echo ""
