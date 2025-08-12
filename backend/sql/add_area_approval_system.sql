-- Adicionar sistema de aprovação para áreas de responsabilidade
ALTER TABLE areas_responsabilidade 
ADD COLUMN status ENUM('pendente', 'aprovada', 'rejeitada') DEFAULT 'pendente' AFTER ativa,
ADD COLUMN aprovada_por INT NULL AFTER status,
ADD COLUMN data_aprovacao TIMESTAMP NULL AFTER aprovada_por,
ADD COLUMN motivo_rejeicao TEXT NULL AFTER data_aprovacao,
ADD FOREIGN KEY (aprovada_por) REFERENCES usuarios(id) ON DELETE SET NULL;

-- Atualizar áreas existentes para aprovadas (compatibilidade)
UPDATE areas_responsabilidade 
SET status = 'aprovada' 
WHERE ativa = TRUE AND status = 'pendente';

-- Criar índices para melhor performance
CREATE INDEX idx_status ON areas_responsabilidade(status);
CREATE INDEX idx_aprovada_por ON areas_responsabilidade(aprovada_por);
