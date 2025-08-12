#!/bin/bash

# 🔒 Script de Configuração Segura - MapCity
# Execute este script para configurar o ambiente de forma segura

echo "🔒 Configuração Segura do MapCity"
echo "=================================="
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js primeiro."
    exit 1
fi

# Ir para diretório do backend
cd backend

# Verificar se o arquivo .env existe
if [ -f ".env" ]; then
    echo "⚠️  Arquivo .env já existe."
    read -p "Deseja sobrescrever? (y/N): " confirm
    if [[ $confirm != [yY] ]]; then
        echo "Configuração cancelada."
        exit 0
    fi
fi

echo "🔑 Gerando JWT Secret seguro..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

echo "📝 Criando arquivo .env..."
cat > .env << EOF
# Configuração segura gerada automaticamente - $(date)
JWT_SECRET=$JWT_SECRET
SALT_ROUNDS=12
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=mapcity
DB_CONNECTION_LIMIT=10
PORT=3001
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:3000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
NODE_ENV=development
DEBUG_LOGS=true
EOF

echo "✅ Arquivo .env criado com JWT_SECRET seguro!"
echo ""
echo "🔧 Próximos passos:"
echo "1. Configure a senha do banco de dados em DB_PASSWORD"
echo "2. Ajuste DB_USER se necessário"
echo "3. Para produção, altere ALLOWED_ORIGINS para seus domínios"
echo "4. Para produção, mude NODE_ENV para 'production'"
echo ""
echo "⚠️  IMPORTANTE: Nunca commite o arquivo .env para o git!"
echo "📖 Leia o arquivo SECURITY.md para mais informações."
echo ""
echo "🚀 Configuração concluída!"
