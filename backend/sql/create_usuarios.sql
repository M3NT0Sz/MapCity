-- Criar tabela de usuários
USE mapcity;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  tipo ENUM('usuario', 'ong', 'admin') DEFAULT 'usuario',
  ong_id INT NULL, -- Para usuários do tipo 'ong', referência à ONG
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Criar tabela de ONGs
CREATE TABLE IF NOT EXISTS ongs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  email VARCHAR(100) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  endereco TEXT,
  area_atuacao VARCHAR(100), -- ex: meio ambiente, infraestrutura, etc
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de sessões (opcional, para controle de sessões)
CREATE TABLE IF NOT EXISTS sessoes (
  id VARCHAR(255) PRIMARY KEY,
  usuario_id INT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Adicionar chave estrangeira para ong_id na tabela usuarios
ALTER TABLE usuarios 
ADD CONSTRAINT fk_usuario_ong 
FOREIGN KEY (ong_id) REFERENCES ongs(id) ON DELETE SET NULL;

-- Inserir usuário administrador padrão (senha: 123456)
INSERT IGNORE INTO usuarios (nome, email, senha, tipo) VALUES 
('Administrador', 'admin@mapcity.com', '$2b$10$W2xqRbCzdQgyH1lCSqLU8u80mhiJAlhYNJ7HrCLGdT.QWZswIE6G.', 'admin');

-- Inserir usuário teste (senha: 123456)
INSERT IGNORE INTO usuarios (nome, email, senha, tipo) VALUES 
('Usuário Teste', 'usuario@teste.com', '$2b$10$W2xqRbCzdQgyH1lCSqLU8u80mhiJAlhYNJ7HrCLGdT.QWZswIE6G.', 'usuario');

-- Inserir ONG teste
INSERT IGNORE INTO ongs (nome, descricao, email, area_atuacao) VALUES 
('EcoVerde', 'ONG focada em meio ambiente e sustentabilidade', 'contato@ecoverde.org', 'meio ambiente');

-- Inserir usuário ONG teste (senha: 123456)
INSERT IGNORE INTO usuarios (nome, email, senha, tipo, ong_id) VALUES 
('Gestor EcoVerde', 'gestor@ecoverde.org', '$2b$10$W2xqRbCzdQgyH1lCSqLU8u80mhiJAlhYNJ7HrCLGdT.QWZswIE6G.', 'ong', 1);
