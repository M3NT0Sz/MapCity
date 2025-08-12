-- Execute este comando no MySQL para verificar e adicionar a coluna imagem
USE mapcity;

-- Verifica a estrutura atual da tabela
DESCRIBE lugares;

-- Adiciona a coluna imagem se não existir
ALTER TABLE lugares ADD COLUMN IF NOT EXISTS imagem TEXT;

-- Adiciona a coluna resolvido_em se não existir  
ALTER TABLE lugares ADD COLUMN IF NOT EXISTS resolvido_em TIMESTAMP NULL;

-- Verifica a estrutura final
DESCRIBE lugares;

-- Mostra alguns registros para debug
SELECT id, nome, tipo, imagem, resolvido, resolvido_em FROM lugares LIMIT 5;
