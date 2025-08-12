const mysql = require('mysql2');

// Configuração do banco de dados
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: ''
});

async function setupDatabase() {
  try {
    console.log('🔄 Criando banco de dados...');
    await new Promise((resolve, reject) => {
      connection.query('CREATE DATABASE IF NOT EXISTS mapcity', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('🔄 Selecionando banco de dados...');
    await new Promise((resolve, reject) => {
      connection.query('USE mapcity', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('🔄 Criando tabela de usuários...');
    await new Promise((resolve, reject) => {
      connection.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          senha VARCHAR(255) NOT NULL,
          tipo ENUM('usuario', 'ong', 'admin') DEFAULT 'usuario',
          ong_id INT NULL,
          ativo BOOLEAN DEFAULT TRUE,
          criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('🔄 Criando tabela de ONGs...');
    await new Promise((resolve, reject) => {
      connection.query(`
        CREATE TABLE IF NOT EXISTS ongs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(100) NOT NULL,
          descricao TEXT,
          email VARCHAR(100) UNIQUE NOT NULL,
          telefone VARCHAR(20),
          endereco TEXT,
          area_atuacao VARCHAR(100),
          ativo BOOLEAN DEFAULT TRUE,
          criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('🔄 Inserindo usuários de teste...');
    await new Promise((resolve, reject) => {
      connection.query(`
        INSERT IGNORE INTO usuarios (nome, email, senha, tipo) VALUES 
        ('Administrador', 'admin@mapcity.com', '$2b$10$W2xqRbCzdQgyH1lCSqLU8u80mhiJAlhYNJ7HrCLGdT.QWZswIE6G.', 'admin')
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      connection.query(`
        INSERT IGNORE INTO usuarios (nome, email, senha, tipo) VALUES 
        ('Usuário Teste', 'usuario@teste.com', '$2b$10$W2xqRbCzdQgyH1lCSqLU8u80mhiJAlhYNJ7HrCLGdT.QWZswIE6G.', 'usuario')
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      connection.query(`
        INSERT IGNORE INTO ongs (nome, descricao, email, area_atuacao) VALUES 
        ('EcoVerde', 'ONG focada em meio ambiente e sustentabilidade', 'contato@ecoverde.org', 'meio ambiente')
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      connection.query(`
        INSERT IGNORE INTO usuarios (nome, email, senha, tipo, ong_id) VALUES 
        ('Gestor EcoVerde', 'gestor@ecoverde.org', '$2b$10$W2xqRbCzdQgyH1lCSqLU8u80mhiJAlhYNJ7HrCLGdT.QWZswIE6G.', 'ong', 1)
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('✅ Banco de dados configurado com sucesso!');
    console.log('📝 Usuários de DESENVOLVIMENTO criados:');
    console.log('   ⚠️  IMPORTANTE: Mude essas senhas em produção!');
    console.log('   👑 Admin: admin@localhost.dev (senha dev: 123456)');
    console.log('   👤 Usuário: teste@localhost.dev (senha dev: 123456)'); 
    console.log('   🏢 ONG: ong@localhost.dev (senha dev: 123456)');
    console.log('   🔒 Para produção: use senhas fortes e emails reais!');

  } catch (error) {
    console.error('❌ Erro ao configurar banco de dados:', error);
  } finally {
    connection.end();
  }
}

setupDatabase();
