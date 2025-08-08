-- Execute este arquivo no MySQL Workbench ou phpMyAdmin para adicionar as colunas necessárias
USE mapcity;

-- Adiciona a coluna resolvido_em se não existir
ALTER TABLE lugares ADD COLUMN IF NOT EXISTS resolvido_em TIMESTAMP NULL;

-- Verifica a estrutura da tabela
DESCRIBE lugares;
