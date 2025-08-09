const mysql = require('mysql2');

const pool = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'mapcity'
});

// Criar tabela de áreas de responsabilidade
const createAreasTable = `
CREATE TABLE IF NOT EXISTS areas_responsabilidade (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ong_id INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    coordenadas JSON NOT NULL,
    ativa BOOLEAN DEFAULT TRUE,
    criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ong_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_ong_id (ong_id),
    INDEX idx_ativa (ativa)
);
`;

// Criar tabela de notificações
const createNotificacoesTable = `
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
`;

// Inserir área de exemplo
const insertExampleArea = `
INSERT IGNORE INTO areas_responsabilidade (ong_id, nome, descricao, coordenadas) 
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
WHERE email = 'gestor@ecoverde.org';
`;

async function executarScripts() {
  try {
    console.log('🗄️ Criando tabela de áreas de responsabilidade...');
    await new Promise((resolve, reject) => {
      pool.query(createAreasTable, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    console.log('✅ Tabela areas_responsabilidade criada');

    console.log('🗄️ Criando tabela de notificações...');
    await new Promise((resolve, reject) => {
      pool.query(createNotificacoesTable, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    console.log('✅ Tabela notificacoes_ong criada');

    console.log('📍 Inserindo área de exemplo...');
    await new Promise((resolve, reject) => {
      pool.query(insertExampleArea, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    console.log('✅ Área de exemplo criada');

    console.log('🎉 Todas as tabelas foram criadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    pool.end();
  }
}

executarScripts();
