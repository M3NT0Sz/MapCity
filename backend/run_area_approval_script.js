const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Configuração do banco
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'mapcity'
});

// Ler o arquivo SQL
const sqlFile = path.join(__dirname, 'add_area_approval_system.sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

// Dividir em comandos individuais
const commands = sqlContent
  .split(';')
  .map(cmd => cmd.trim())
  .filter(cmd => cmd.length > 0);

console.log('Executando script de aprovação de áreas...');

// Executar cada comando
async function executeCommands() {
  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    console.log(`Executando comando ${i + 1}/${commands.length}: ${command.substring(0, 50)}...`);
    
    try {
      await new Promise((resolve, reject) => {
        connection.query(command, (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        });
      });
      console.log(`✅ Comando ${i + 1} executado com sucesso`);
    } catch (error) {
      console.error(`❌ Erro no comando ${i + 1}:`, error.message);
    }
  }
  
  connection.end();
  console.log('Script concluído!');
}

executeCommands();
