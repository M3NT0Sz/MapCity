@echo off
:: 🔒 Script de Configuração Segura - MapCity (Windows)
:: Execute este script para configurar o ambiente de forma segura

echo 🔒 Configuração Segura do MapCity
echo ==================================
echo.

:: Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js não encontrado. Instale Node.js primeiro.
    pause
    exit /b 1
)

:: Ir para diretório do backend
cd backend

:: Verificar se o arquivo .env existe
if exist ".env" (
    echo ⚠️  Arquivo .env já existe.
    set /p confirm=Deseja sobrescrever? (y/N): 
    if /I not "%confirm%"=="y" (
        echo Configuração cancelada.
        pause
        exit /b 0
    )
)

echo 🔑 Gerando JWT Secret seguro...
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"') do set JWT_SECRET=%%i

echo 📝 Criando arquivo .env...
(
echo # Configuração segura gerada automaticamente - %date% %time%
echo JWT_SECRET=%JWT_SECRET%
echo SALT_ROUNDS=12
echo DB_HOST=localhost
echo DB_USER=root
echo DB_PASSWORD=
echo DB_NAME=mapcity
echo DB_CONNECTION_LIMIT=10
echo PORT=3001
echo ALLOWED_ORIGINS=http://localhost:8081,http://localhost:3000
echo UPLOAD_DIR=./uploads
echo MAX_FILE_SIZE=5242880
echo NODE_ENV=development
echo DEBUG_LOGS=true
) > .env

echo ✅ Arquivo .env criado com JWT_SECRET seguro!
echo.
echo 🔧 Próximos passos:
echo 1. Configure a senha do banco de dados em DB_PASSWORD
echo 2. Ajuste DB_USER se necessário
echo 3. Para produção, altere ALLOWED_ORIGINS para seus domínios
echo 4. Para produção, mude NODE_ENV para 'production'
echo.
echo ⚠️  IMPORTANTE: Nunca commite o arquivo .env para o git!
echo 📖 Leia o arquivo SECURITY.md para mais informações.
echo.
echo 🚀 Configuração concluída!
pause
