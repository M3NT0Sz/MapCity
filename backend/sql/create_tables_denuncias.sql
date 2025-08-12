-- Execute estas queries no seu cliente MySQL (phpMyAdmin, Workbench, etc.)
-- Banco de dados: mapcity

-- Criar tabela de denúncias
CREATE TABLE IF NOT EXISTS denuncias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    marcador_id INT NOT NULL,
    denunciante_id INT NOT NULL,
    autor_marcador_id INT NOT NULL,
    ong_responsavel_id INT NULL,
    motivo VARCHAR(100) NOT NULL,
    descricao TEXT NULL,
    status ENUM('pendente', 'aceita', 'rejeitada') DEFAULT 'pendente',
    processado_por INT NULL,
    processado_em DATETIME NULL,
    observacoes TEXT NULL,
    criada_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar colunas para usuários banidos (se não existirem)
ALTER TABLE usuarios 
ADD COLUMN ativo BOOLEAN DEFAULT 1,
ADD COLUMN banido_em DATETIME NULL;
