@echo off
REM Script de setup para Windows

echo.
echo ========================================
echo Workflow de Pagamentos - Setup
echo ========================================
echo.

REM Verificar Node.js
echo [1/4] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo Erro: Node.js nao encontrado
    echo Baixe em: https://nodejs.org/
    pause
    exit /b 1
)
echo OK

REM Verificar npm
echo [2/4] Verificando npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo Erro: npm nao encontrado
    pause
    exit /b 1
)
echo OK

REM Instalar dependências
echo [3/4] Instalando dependencias...
call npm install
if errorlevel 1 (
    echo Erro ao instalar dependencias
    pause
    exit /b 1
)
echo OK

REM Criar .env
echo [4/4] Configurando ambiente...
if not exist .env (
    copy .env.example .env
    echo Arquivo .env criado. Configure as variaveis!
)
echo OK

echo.
echo ========================================
echo Setup concluido com sucesso!
echo ========================================
echo.
echo Proximos passos:
echo 1. Configure o arquivo .env
echo 2. Execute: npm run dev
echo.
pause
