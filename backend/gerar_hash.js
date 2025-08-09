const bcrypt = require('bcrypt');

async function gerarSenhasHash() {
  const senhaSimples = '123456';
  const saltRounds = 10;
  
  try {
    const hash = await bcrypt.hash(senhaSimples, saltRounds);
    console.log('Senha:', senhaSimples);
    console.log('Hash:', hash);
    console.log('\nUse este hash no arquivo create_usuarios.sql');
  } catch (error) {
    console.error('Erro ao gerar hash:', error);
  }
}

gerarSenhasHash();
