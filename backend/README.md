# MapCity Backend - Estrutura Final

## 📁 Estrutura do Projeto

```
backend/
├── server.js              # Servidor principal Express
├── database.js            # Módulo de conexão MySQL
├── validador-documento.js  # Validação CPF/CNPJ
├── package.json           # Dependências Node.js
├── .env                   # Configurações ambiente (dev)
├── .env.example           # Exemplo de configurações
├── sql/
│   ├── database_setup.sql # Estrutura completa do banco
│   ├── update_cpf_cnpj.sql# Script de atualização
│   └── README.md          # Documentação SQL
├── uploads/               # Pasta para uploads (vazia)
└── start-server.bat       # Script de inicialização Windows
```

## 🚀 Como Executar

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar banco MySQL:**
   - Execute `sql/database_setup.sql` no MySQL
   - Configure as credenciais no arquivo `.env`

3. **Iniciar servidor:**
   ```bash
   node server.js
   ```
   Ou no Windows:
   ```bash
   start-server.bat
   ```

## 📡 Rotas Disponíveis

- `GET /test` - Teste de conectividade
- `POST /validar-documento` - Validação CPF/CNPJ em tempo real
- `POST /auth/registro` - Registro de usuários/ONGs
- `POST /auth/login` - Login de usuários

## 🔧 Configuração

Edite o arquivo `.env` com suas configurações:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=mapcity
PORT=3001
```

## ✅ Status

- ✅ Conexão MySQL funcionando
- ✅ Validação CPF/CNPJ implementada
- ✅ Sistema de autenticação operacional
- ✅ Registro de usuários no banco
- ✅ Validação de duplicatas
- ✅ Hash de senhas com bcrypt
