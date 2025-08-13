# Configuração do Banco de Dados - MapCity

## Estrutura Simplificada

A estrutura do banco de dados foi consolidada em um único arquivo para facilitar a manutenção e deployment.

### Arquivos SQL

- **`database_setup.sql`** - Arquivo principal que contém:
  - Criação do banco de dados `mapcity`
  - Todas as tabelas necessárias (lugares, usuarios, ongs, areas_responsabilidade, notificacoes_ong, denuncias, sessoes)
  - Índices para otimização de performance
  - Dados iniciais para desenvolvimento
  - Constraints e relacionamentos entre tabelas

### Como usar

#### Opção 1: Script completo automático (RECOMENDADO)
```bash
# Windows
.\setup.bat

# Linux/Mac
./setup.sh
```
*Este script faz tudo: instala dependências, configura .env e banco de dados*

#### Opção 2: Setup manual do banco apenas
```bash
mysql -u root -p < sql/database_setup.sql
```

#### Opção 3: phpMyAdmin/MySQL Workbench
1. Abra o arquivo `sql/database_setup.sql`
2. Execute o script completo

### Estrutura das Tabelas

#### lugares
- Armazena marcadores de problemas/locais no mapa
- Campos: id, nome, descricao, tipo, latitude, longitude, resolvido, imagem, resolvido_em, criado_em

#### usuarios
- Gerencia usuários, ONGs e administradores
- Tipos: 'usuario', 'ong', 'admin'
- Campos: id, nome, email, senha, tipo, ong_id, ativo, banido_em, criado_em, atualizado_em

#### ongs
- Informações das ONGs parceiras
- Campos: id, nome, descricao, email, telefone, endereco, area_atuacao, ativo, criado_em

#### areas_responsabilidade
- Define áreas geográficas sob responsabilidade de ONGs
- Suporte a polígonos através de coordenadas JSON
- Sistema de aprovação (pendente/aprovada/rejeitada)

#### denuncias
- Sistema de denúncias de marcadores inadequados
- Campos: motivo, status, processamento, observações

#### notificacoes_ong
- Notificações automáticas para ONGs sobre atividade em suas áreas

#### sessoes
- Controle de sessões de usuários (opcional)

### Dados de Desenvolvimento

O arquivo inclui dados iniciais para desenvolvimento:

- **Admin**: admin@localhost.dev (senha: 123456)
- **Usuário Teste**: teste@localhost.dev (senha: 123456)
- **ONG Teste**: EcoVerde com gestor@ecoverde.org (senha: 123456)

⚠️ **IMPORTANTE**: Remova ou altere essas credenciais em produção!

### Migração de Versões Anteriores

Se você tinha versões anteriores dos arquivos SQL separados, eles foram consolidados neste arquivo único. Não é necessário executar múltiplos scripts.

### Performance

O arquivo inclui índices otimizados para:
- Consultas por localização (latitude/longitude)
- Filtros por tipo e status
- Relacionamentos entre tabelas
- Consultas de notificações e denúncias
