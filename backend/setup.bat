@echo off
echo ============================================================================
echo 🚀 MAPCITY - SETUP COMPLETO
echo ============================================================================
echo.
echo Este script configurará o ambiente completo do MapCity
echo - Configurações de segurança (.env)
echo - Banco de dados MySQL
echo - Dependências Node.js
echo.
pause

:: Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js não encontrado. Instale Node.js primeiro.
    pause
    exit /b 1
)

:: Instalar dependências
echo 📦 Instalando dependências...
call npm install
if errorlevel 1 (
    echo ❌ Erro ao instalar dependências
    pause
    exit /b 1
)

:: Configurar segurança (.env)
echo.
echo 🔑 Configurando segurança...
if exist ".env" (
    echo ⚠️  Arquivo .env já existe, pulando configuração de segurança
) else (
    echo 🔑 Gerando JWT Secret seguro...
    for /f %%i in ('node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"') do set JWT_SECRET=%%i
    
    echo 📝 Criando arquivo .env...
    (
    echo # Configuração MapCity - %date% %time%
    echo JWT_SECRET=%%JWT_SECRET%%
    echo SALT_ROUNDS=12
    echo DB_HOST=localhost
    echo DB_USER=root
    echo DB_PASSWORD=
    echo DB_NAME=mapcity
    echo PORT=3001
    echo NODE_ENV=development
    ) > .env
    echo ✅ Arquivo .env criado!
)

:: Configurar banco de dados
echo.
echo 🗄️ Configurando banco de dados...
echo.
echo ⚠️  Certifique-se de que o MySQL esteja rodando
pause

mysql -u root -p < sql\database_setup.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================================
    echo ✅ SETUP CONCLUÍDO COM SUCESSO!
    echo ============================================================================
    echo.
    echo 🔑 Credenciais de desenvolvimento:
    echo    Admin: admin@localhost.dev ^(senha: 123456^)
    echo    Usuario: teste@localhost.dev ^(senha: 123456^)
    echo    ONG: gestor@ecoverde.org ^(senha: 123456^)
    echo.
    echo 🚀 Para iniciar o servidor:
    echo    npm start
    echo    ou
    echo    node server.js
    echo.
    echo ⚠️  IMPORTANTE: Configure a senha do banco em .env ^(DB_PASSWORD^)
    echo ⚠️  Para produção: altere as senhas padrão!
    echo ============================================================================
) else (
    echo.
    echo ❌ Erro ao configurar banco de dados
    echo Verifique se o MySQL está rodando e tente novamente
)

echo.
pause
