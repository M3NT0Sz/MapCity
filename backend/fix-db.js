const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'mapcity',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('🔧 Iniciando correção do banco de dados...');

// Primeiro, vamos ver o estado atual
pool.query('SELECT id, nome, imagem FROM lugares', (err, results) => {
  if (err) {
    console.error('❌ Erro ao buscar dados:', err);
    return;
  }
  
  console.log('📊 Total de registros:', results.length);
  
  results.forEach((lugar, index) => {
    console.log(`\n🔍 Lugar ${index + 1}:`);
    console.log('ID:', lugar.id);
    console.log('Nome:', lugar.nome);
    console.log('Imagem (raw):', lugar.imagem);
    console.log('Tipo da imagem:', typeof lugar.imagem);
    console.log('Tamanho:', lugar.imagem ? lugar.imagem.length : 'null');
    
    // Tentar fazer parse para ver se é JSON válido
    if (lugar.imagem) {
      try {
        const parsed = JSON.parse(lugar.imagem);
        console.log('✅ JSON válido:', parsed);
      } catch (e) {
        console.log('❌ JSON inválido:', e.message);
        
        // Corrigir o registro
        console.log('🔧 Corrigindo registro ID:', lugar.id);
        pool.query(
          'UPDATE lugares SET imagem = ? WHERE id = ?',
          [JSON.stringify([]), lugar.id],
          (updateErr, updateResult) => {
            if (updateErr) {
              console.error('❌ Erro ao corrigir:', updateErr);
            } else {
              console.log('✅ Registro corrigido:', lugar.id);
            }
          }
        );
      }
    } else {
      // Se imagem é null, definir como array vazio
      console.log('🔧 Definindo array vazio para ID:', lugar.id);
      pool.query(
        'UPDATE lugares SET imagem = ? WHERE id = ?',
        [JSON.stringify([]), lugar.id],
        (updateErr, updateResult) => {
          if (updateErr) {
            console.error('❌ Erro ao definir array vazio:', updateErr);
          } else {
            console.log('✅ Array vazio definido para:', lugar.id);
          }
        }
      );
    }
  });
  
  setTimeout(() => {
    console.log('\n🏁 Correção finalizada!');
    process.exit(0);
  }, 2000);
});
