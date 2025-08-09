-- Criação da tabela de áreas de responsabilidade para ONGs
CREATE TABLE IF NOT EXISTS areas_responsabilidade (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ong_id INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    coordenadas JSON NOT NULL, -- Array de coordenadas definindo o polígono da área
    ativa BOOLEAN DEFAULT TRUE,
    criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ong_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_ong_id (ong_id),
    INDEX idx_ativa (ativa)
);

-- Criação da tabela de notificações para ONGs
CREATE TABLE IF NOT EXISTS notificacoes_ong (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ong_id INT NOT NULL,
    area_id INT NOT NULL,
    lugar_id INT NOT NULL,
    tipo ENUM('novo_marcador', 'marcador_resolvido', 'marcador_removido') NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ong_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas_responsabilidade(id) ON DELETE CASCADE,
    FOREIGN KEY (lugar_id) REFERENCES lugares(id) ON DELETE CASCADE,
    INDEX idx_ong_id (ong_id),
    INDEX idx_lida (lida),
    INDEX idx_criada_em (criada_em)
);

-- Inserir uma área de exemplo para a ONG de teste
INSERT INTO areas_responsabilidade (ong_id, nome, descricao, coordenadas) 
SELECT 
    id,
    'Área Central - EcoVerde',
    'Área de responsabilidade da ONG EcoVerde no centro da cidade',
    JSON_ARRAY(
        JSON_OBJECT('lat', -22.115, 'lng', -51.385),
        JSON_OBJECT('lat', -22.115, 'lng', -51.390),
        JSON_OBJECT('lat', -22.125, 'lng', -51.390),
        JSON_OBJECT('lat', -22.125, 'lng', -51.385)
    )
FROM usuarios 
WHERE email = 'gestor@ecoverde.org' 
AND NOT EXISTS (
    SELECT 1 FROM areas_responsabilidade WHERE ong_id = usuarios.id
);
