const mysql = require('mysql2');

// Configuração do banco de dados
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'mapcity'
});

async function setupLugares() {
  try {
    console.log('🔄 Criando tabela lugares...');
    await new Promise((resolve, reject) => {
      connection.query(`
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
          criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('✅ Tabela lugares criada com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar tabela lugares:', error);
  } finally {
    connection.end();
  }
}

setupLugares();
