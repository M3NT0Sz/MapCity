# 🔒 Guia de Segurança - MapCity

## ⚠️ CONFIGURAÇÃO OBRIGATÓRIA DE SEGURANÇA

### 🔐 Antes de usar em produção:

1. **Configure o JWT Secret**:
   ```bash
   # Gere uma chave segura
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   
   # Coloque no arquivo .env
   JWT_SECRET=sua_chave_gerada_aqui
   ```

2. **Configure o banco de dados**:
   ```bash
   DB_HOST=seu_host_mysql
   DB_USER=seu_usuario_mysql  
   DB_PASSWORD=sua_senha_forte_mysql
   DB_NAME=mapcity
   ```

3. **Configure CORS adequadamente**:
   ```bash
   ALLOWED_ORIGINS=https://seudominio.com,https://app.seudominio.com
   ```

## 🛡️ Checklist de Segurança

### ✅ Obrigatório para produção:
- [ ] JWT_SECRET configurado com valor complexo (64+ caracteres)
- [ ] Senha do banco de dados forte e única
- [ ] CORS configurado apenas para domínios necessários
- [ ] HTTPS habilitado em produção
- [ ] Variáveis de ambiente nunca commitadas
- [ ] Logs não expõem informações sensíveis
- [ ] Upload de arquivos limitado (tipo e tamanho)

### ✅ Recomendado:
- [ ] Rate limiting implementado
- [ ] Backup automático do banco de dados
- [ ] Monitoramento de logs de segurança
- [ ] Validação rigorosa de inputs
- [ ] Headers de segurança configurados

## 🚨 NUNCA COMMITAR:

### ❌ Arquivos proibidos no git:
- `.env` (qualquer arquivo de ambiente)
- `config/secrets.js`
- `uploads/` (arquivos de usuário)
- `backup/` (backups de banco)
- Arquivos com senhas hardcoded
- Tokens de API reais

### ❌ Informações proibidas no código:
- Senhas em plain text
- Chaves API reais
- Tokens de acesso
- Dados de conexão real do banco
- Informações pessoais de usuários

## 🔧 Configuração de Ambiente

### Desenvolvimento (.env):
```env
JWT_SECRET=desenvolvimento_local_nao_usar_em_producao
DB_PASSWORD=
NODE_ENV=development
DEBUG_LOGS=true
```

### Produção (.env):
```env
JWT_SECRET=chave_complexa_64_caracteres_minimo_gerada_crypto
DB_PASSWORD=senha_super_forte_unica
NODE_ENV=production
DEBUG_LOGS=false
ALLOWED_ORIGINS=https://seuapp.com
```

## 🚀 Deploy Seguro

### 1. Servidor de produção:
```bash
# Nunca suba o .env para o git
# Configure as variáveis direto no servidor:

export JWT_SECRET="sua_chave_super_secreta"
export DB_PASSWORD="senha_forte_banco"
export NODE_ENV="production"
```

### 2. Plataformas de hosting:
- **Vercel**: Configure nas Environment Variables
- **Heroku**: Use `heroku config:set`
- **AWS**: Use Systems Manager Parameter Store
- **Railway**: Configure no dashboard

### 3. Docker:
```dockerfile
# Use secrets do Docker
ENV JWT_SECRET_FILE=/run/secrets/jwt_secret
ENV DB_PASSWORD_FILE=/run/secrets/db_password
```

## 🔍 Auditoria de Segurança

### Comando para verificar vazamentos:
```bash
# Verificar se há informações sensíveis commitadas
git log -p | grep -i "password\|secret\|key\|token"

# Verificar arquivos atuais
grep -r "password\|secret\|key" . --exclude-dir=node_modules --exclude-dir=.git
```

### Ferramentas recomendadas:
- `git-secrets` - Previne commits de segredos
- `truffleHog` - Encontra segredos em repos
- `detect-secrets` - Scanner de segredos

## 📋 Rotinas de Segurança

### Diária:
- [ ] Verificar logs de acesso suspeito
- [ ] Monitorar tentativas de login falhadas

### Semanal:
- [ ] Backup do banco de dados
- [ ] Auditoria de usuários ativos
- [ ] Verificar dependências com vulnerabilidades

### Mensal:
- [ ] Rotacionar JWT secrets
- [ ] Atualizar dependências
- [ ] Review de permissões de usuário

## 🆘 Em caso de vazamento:

### Ação imediata:
1. **Revogar credenciais comprometidas**
2. **Gerar novas chaves/senhas**
3. **Forçar logout de todos usuários**
4. **Verificar logs de acesso**
5. **Notificar usuários se necessário**

### Limpeza do git:
```bash
# Remover arquivo com secrets do histórico
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch arquivo_com_secrets.js' \
  --prune-empty --tag-name-filter cat -- --all

# Forçar push limpo
git push origin --force --all
git push origin --force --tags
```

---

**⚠️ LEMBRE-SE: Segurança é responsabilidade de todos os desenvolvedores!**
