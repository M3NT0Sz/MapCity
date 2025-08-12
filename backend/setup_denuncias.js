const mysql = require('mysql2');

// Configuração do banco de dados
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // Coloque sua senha do MySQL aqui se necessário
  database: 'mapcity',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Criar tabela de denúncias
const createDenunciasTable = `
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
    
    INDEX idx_status (status),
    INDEX idx_marcador (marcador_id),
    INDEX idx_denunciante (denunciante_id),
    INDEX idx_autor (autor_marcador_id),
    INDEX idx_ong (ong_responsavel_id),
    INDEX idx_criada_em (criada_em)
)`;

// Adicionar colunas para usuários banidos
const addUserColumns = `
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT 1,
ADD COLUMN IF NOT EXISTS banido_em DATETIME NULL
`;

console.log('🔧 Criando tabela de denúncias...');

pool.query(createDenunciasTable, (error, results) => {
  if (error) {
    console.error('❌ Erro ao criar tabela denuncias:', error);
  } else {
    console.log('✅ Tabela denuncias criada com sucesso!');
  }

  console.log('🔧 Adicionando colunas de usuários banidos...');
  
  pool.query(addUserColumns, (error, results) => {
    if (error) {
      console.error('❌ Erro ao adicionar colunas de usuários banidos:', error);
    } else {
      console.log('✅ Colunas de usuários banidos adicionadas com sucesso!');
    }

    console.log('🎉 Configuração do banco concluída!');
    process.exit(0);
  });
});
