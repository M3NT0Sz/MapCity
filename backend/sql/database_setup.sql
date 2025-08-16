CREATE DATABASE IF NOT EXISTS mapcity;
USE mapcity;

CREATE TABLE IF NOT EXISTS ongs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  email VARCHAR(100) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  endereco TEXT,
  area_atuacao VARCHAR(100),
  ativo TINYINT(1) DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ativo (ativo),
  INDEX idx_area_atuacao (area_atuacao)
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  tipo ENUM('usuario', 'ong', 'admin') DEFAULT 'usuario',
  documento VARCHAR(20) UNIQUE,
  ong_id INT NULL,
  ativo TINYINT(1) DEFAULT 1,
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

CREATE TABLE IF NOT EXISTS lugares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) DEFAULT 'outro',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  resolvido TINYINT(1) DEFAULT 0,
  imagem TEXT,
  resolvido_em TIMESTAMP NULL,
  area_ong_id INT NULL,
  usuario_id INT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (area_ong_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_tipo (tipo),
  INDEX idx_resolvido (resolvido),
  INDEX idx_criado_em (criado_em),
  INDEX idx_localizacao (latitude, longitude),
  INDEX idx_area_ong_id (area_ong_id),
  INDEX idx_usuario_id_lugares (usuario_id)
);

CREATE TABLE IF NOT EXISTS areas_responsabilidade (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ong_id INT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  coordenadas JSON NOT NULL,
  ativa TINYINT(1) DEFAULT 1,
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

CREATE TABLE IF NOT EXISTS notificacoes_ong (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ong_id INT NOT NULL,
  area_id INT NOT NULL,
  lugar_id INT NULL,
  tipo ENUM('novo_marcador', 'marcador_resolvido', 'marcador_removido') NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  lida TINYINT(1) DEFAULT 0,
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ong_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (area_id) REFERENCES areas_responsabilidade(id) ON DELETE CASCADE,
  FOREIGN KEY (lugar_id) REFERENCES lugares(id) ON DELETE CASCADE,
  INDEX idx_ong_id (ong_id),
  INDEX idx_lida (lida),
  INDEX idx_criada_em (criada_em),
  INDEX idx_tipo (tipo)
);

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

CREATE TABLE IF NOT EXISTS sessoes (
  id VARCHAR(255) PRIMARY KEY,
  usuario_id INT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_expires_at (expires_at)
);

INSERT IGNORE INTO ongs (nome, descricao, email, area_atuacao) VALUES 
('EcoVerde', 'ONG focada em meio ambiente e sustentabilidade', 'contato@ecoverde.org', 'meio ambiente');

INSERT IGNORE INTO usuarios (nome, email, senha, tipo) VALUES 
('Admin Desenvolvimento', 'admin@mapcity.com', '$2b$10$W2xqRbCzdQgyH1lCSqLU8u80mhiJAlhYNJ7HrCLGdT.QWZswIE6G.', 'admin');

INSERT IGNORE INTO usuarios (nome, email, senha, tipo) VALUES 
('Usuario Teste', 'usuario@teste.com', '$2b$10$W2xqRbCzdQgyH1lCSqLU8u80mhiJAlhYNJ7HrCLGdT.QWZswIE6G.', 'usuario');

INSERT IGNORE INTO usuarios (nome, email, senha, tipo, ong_id) VALUES 
('Gestor EcoVerde', 'gestor@ecoverde.org', '$2b$10$W2xqRbCzdQgyH1lCSqLU8u80mhiJAlhYNJ7HrCLGdT.QWZswIE6G.', 'ong', 1);

COMMIT;
