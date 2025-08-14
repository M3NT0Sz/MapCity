-- ============================================================================
-- MAPCITY - CONFIGURAÇÃO COMPLETA DO BANCO DE DADOS
-- Este arquivo contém toda a estrutura necessária para o MapCity
-- Execute este arquivo para configurar o banco de dados completo
-- ============================================================================

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS mapcity;
USE mapcity;

-- ============================================================================
-- TABELA: lugares
-- Armazena os marcadores de problemas/locais no mapa
-- ============================================================================
CREATE TABLE IF NOT EXISTS lugares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) DEFAULT 'outro',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  resolvido BOOLEAN DEFAULT FALSE,
  imagem TEXT,
  resolvido_em TIMESTAMP NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_tipo (tipo),
  INDEX idx_resolvido (resolvido),
  INDEX idx_criado_em (criado_em),
  INDEX idx_localizacao (latitude, longitude)
);

-- ============================================================================
-- TABELA: ongs
-- Armazena informações das ONGs parceiras
-- ============================================================================
CREATE TABLE IF NOT EXISTS ongs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  email VARCHAR(100) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  endereco TEXT,
  area_atuacao VARCHAR(100), -- ex: meio ambiente, infraestrutura, etc
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_ativo (ativo),
  INDEX idx_area_atuacao (area_atuacao)
);

-- ============================================================================
-- TABELA: usuarios
-- Armazena informações de usuários, ONGs e administradores
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  tipo ENUM('usuario', 'ong', 'admin') DEFAULT 'usuario',
  documento VARCHAR(20) UNIQUE, -- CPF ou CNPJ, obrigatório para usuario/ong
  ong_id INT NULL, -- Para usuários do tipo 'ong', referência à ONG
  ativo BOOLEAN DEFAULT TRUE,
  banido_em DATETIME NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ong_id) REFERENCES ongs(id) ON DELETE SET NULL,
  
  INDEX idx_tipo (tipo),
  INDEX idx_ativo (ativo),
  INDEX idx_ong_id (ong_id),
  INDEX idx_banido_em (banido_em),
  INDEX idx_documento (documento)
);

-- ============================================================================
-- TABELA: areas_responsabilidade
-- Define áreas geográficas sob responsabilidade de ONGs
-- ============================================================================
CREATE TABLE IF NOT EXISTS areas_responsabilidade (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ong_id INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    coordenadas JSON NOT NULL, -- Array de coordenadas definindo o polígono da área
    ativa BOOLEAN DEFAULT TRUE,
    status ENUM('pendente', 'aprovada', 'rejeitada') DEFAULT 'pendente',
    aprovada_por INT NULL,
    data_aprovacao TIMESTAMP NULL,
    motivo_rejeicao TEXT NULL,
    criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ong_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (aprovada_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_ong_id (ong_id),
    INDEX idx_ativa (ativa),
    INDEX idx_status (status),
    INDEX idx_aprovada_por (aprovada_por)
);

-- ============================================================================
-- TABELA: notificacoes_ong
-- Sistema de notificações para ONGs sobre marcadores em suas áreas
-- ============================================================================
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
    INDEX idx_criada_em (criada_em),
    INDEX idx_tipo (tipo)
);

-- ============================================================================
-- TABELA: denuncias
-- Sistema de denúncias de marcadores inadequados
-- ============================================================================
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

-- ============================================================================
-- TABELA: sessoes
-- Controle de sessões de usuários (opcional)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessoes (
  id VARCHAR(255) PRIMARY KEY,
  usuario_id INT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_expires_at (expires_at)
);

-- ============================================================================
-- DADOS INICIAIS DE DESENVOLVIMENTO
-- ⚠️ IMPORTANTE: Estes são dados para DESENVOLVIMENTO apenas!
-- ❌ NUNCA use essas senhas em produção!
-- ✅ Para produção, crie usuários com senhas fortes através da aplicação
-- ============================================================================

-- Inserir ONG de exemplo
INSERT IGNORE INTO ongs (nome, descricao, email, area_atuacao) VALUES 
('EcoVerde', 'ONG focada em meio ambiente e sustentabilidade', 'contato@ecoverde.org', 'meio ambiente');

-- Usuário administrador padrão (senha desenvolvimento: 123456)
-- ⚠️ MUDE ESTA SENHA IMEDIATAMENTE em produção!
INSERT IGNORE INTO usuarios (nome, email, senha, tipo) VALUES 
('Admin Desenvolvimento', 'admin@localhost.dev', '$2b$10$W2xqRbCzdQgyH1lCSqLU8u80mhiJAlhYNJ7HrCLGdT.QWZswIE6G.', 'admin');

-- Usuário teste (senha desenvolvimento: 123456)  
-- ⚠️ REMOVA EM PRODUÇÃO!
INSERT IGNORE INTO usuarios (nome, email, senha, tipo) VALUES 
('Usuario Teste', 'teste@localhost.dev', '$2b$10$W2xqRbCzdQgyH1lCSqLU8u80mhiJAlhYNJ7HrCLGdT.QWZswIE6G.', 'usuario');

-- Inserir usuário ONG teste (senha: 123456)
INSERT IGNORE INTO usuarios (nome, email, senha, tipo, ong_id) VALUES 
('Gestor EcoVerde', 'gestor@ecoverde.org', '$2b$10$W2xqRbCzdQgyH1lCSqLU8u80mhiJAlhYNJ7HrCLGdT.QWZswIE6G.', 'ong', 1);

-- Inserir uma área de exemplo para a ONG de teste
INSERT IGNORE INTO areas_responsabilidade (ong_id, nome, descricao, coordenadas, status) 
SELECT 
    u.id,
    'Área Central - EcoVerde',
    'Área de responsabilidade da ONG EcoVerde no centro da cidade',
    JSON_ARRAY(
        JSON_OBJECT('lat', -22.115, 'lng', -51.385),
        JSON_OBJECT('lat', -22.115, 'lng', -51.390),
        JSON_OBJECT('lat', -22.125, 'lng', -51.390),
        JSON_OBJECT('lat', -22.125, 'lng', -51.385)
    ),
    'aprovada'
FROM usuarios u
JOIN ongs o ON u.ong_id = o.id
WHERE o.email = 'contato@ecoverde.org' 
AND NOT EXISTS (
    SELECT 1 FROM areas_responsabilidade WHERE ong_id = u.id
);

-- ============================================================================
-- FINALIZAÇÃO
-- ============================================================================
COMMIT;

-- Exibir resumo das tabelas criadas
SELECT 
    TABLE_NAME as 'Tabela',
    TABLE_ROWS as 'Registros',
    CREATE_TIME as 'Criada em'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'mapcity' 
ORDER BY TABLE_NAME;

-- Mensagem de sucesso
SELECT 'Banco de dados MapCity configurado com sucesso!' as 'Status';
