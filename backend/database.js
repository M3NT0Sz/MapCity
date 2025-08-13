const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuração da conexão
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mapcity',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    timezone: '+00:00'
};

console.log('🔧 Configuração do banco:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    password: dbConfig.password ? '***' : '(vazio)'
});

// Pool de conexões
const pool = mysql.createPool(dbConfig);

// Função para testar conexão
async function testarConexao() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexão com MySQL estabelecida');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar com MySQL:', error.message);
        return false;
    }
}

// Função para executar queries
async function executarQuery(sql, params = []) {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('❌ Erro na query:', error.message);
        console.error('SQL:', sql);
        console.error('Params:', params);
        throw error;
    }
}

// Função para buscar um registro
async function buscarUm(sql, params = []) {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows[0] || null;
    } catch (error) {
        console.error('❌ Erro ao buscar registro:', error.message);
        throw error;
    }
}

// Função para inserir e retornar o ID
async function inserir(sql, params = []) {
    try {
        const [result] = await pool.execute(sql, params);
        return result.insertId;
    } catch (error) {
        console.error('❌ Erro ao inserir registro:', error.message);
        throw error;
    }
}

module.exports = {
    pool,
    testarConexao,
    executarQuery,
    buscarUm,
    inserir
};
