-- Script para criar tabela de denúncias
-- Execute este script no seu banco de dados MySQL

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
    criada_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (marcador_id) REFERENCES lugares(id) ON DELETE CASCADE,
    FOREIGN KEY (denunciante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (autor_marcador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (ong_responsavel_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (processado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_status (status),
    INDEX idx_marcador (marcador_id),
    INDEX idx_denunciante (denunciante_id),
    INDEX idx_autor (autor_marcador_id),
    INDEX idx_ong (ong_responsavel_id),
    INDEX idx_criada_em (criada_em)
);

-- Adicionar coluna para rastrear usuários banidos (se não existir)
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT 1,
ADD COLUMN IF NOT EXISTS banido_em DATETIME NULL;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_banido_em ON usuarios(banido_em);
