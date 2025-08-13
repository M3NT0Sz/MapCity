#!/bin/bash

echo "============================================================================"
echo "🚀 MAPCITY - SETUP COMPLETO"
echo "============================================================================"
echo ""
echo "Este script configurará o ambiente completo do MapCity"
echo "- Configurações de segurança (.env)"
echo "- Banco de dados MySQL"
echo "- Dependências Node.js"
echo ""
read -p "Pressione Enter para continuar..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js primeiro."
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

# Configurar segurança (.env)
echo ""
echo "🔑 Configurando segurança..."
if [ -f ".env" ]; then
    echo "⚠️  Arquivo .env já existe, pulando configuração de segurança"
else
    echo "🔑 Gerando JWT Secret seguro..."
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    
    echo "📝 Criando arquivo .env..."
    cat > .env << EOF
# Configuração MapCity - $(date)
JWT_SECRET=$JWT_SECRET
SALT_ROUNDS=12
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=mapcity
PORT=3001
NODE_ENV=development
EOF
    echo "✅ Arquivo .env criado!"
fi

# Configurar banco de dados
echo ""
echo "🗄️ Configurando banco de dados..."
echo ""
echo "⚠️  Certifique-se de que o MySQL esteja rodando"
read -p "Pressione Enter para continuar..."

mysql -u root -p < sql/database_setup.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================================================"
    echo "✅ SETUP CONCLUÍDO COM SUCESSO!"
    echo "============================================================================"
    echo ""
    echo "🔑 Credenciais de desenvolvimento:"
    echo "   Admin: admin@localhost.dev (senha: 123456)"
    echo "   Usuario: teste@localhost.dev (senha: 123456)"
    echo "   ONG: gestor@ecoverde.org (senha: 123456)"
    echo ""
    echo "🚀 Para iniciar o servidor:"
    echo "   npm start"
    echo "   ou"
    echo "   node server.js"
    echo ""
    echo "⚠️  IMPORTANTE: Configure a senha do banco em .env (DB_PASSWORD)"
    echo "⚠️  Para produção: altere as senhas padrão!"
    echo "============================================================================"
else
    echo ""
    echo "❌ Erro ao configurar banco de dados"
    echo "Verifique se o MySQL está rodando e tente novamente"
fi

echo ""
read -p "Pressione Enter para sair..."
