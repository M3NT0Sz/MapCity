const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Permitir todas as origens durante desenvolvimento
  credentials: false, // Desabilitar credentials quando origin é *
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limite
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
    }
  }
});

// Servir arquivos estáticos da pasta uploads com CORS
app.use('/uploads', (req, res, next) => {
  console.log('📁 Solicitação de arquivo estático:', req.url);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Conexão com banco de dados
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'mapcity',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Rota de teste básica
app.get('/test', (req, res) => {
  console.log('✅ Rota de teste funcionando');
  res.json({ message: 'Backend funcionando!' });
});

// Rota de teste para arquivos
app.get('/test-upload/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', filename);
  
  console.log('🧪 Teste de arquivo:', filePath);
  console.log('📁 Arquivo existe?', fs.existsSync(filePath));
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Arquivo não encontrado' });
  }
});

// Rota para upload de imagens
app.post('/upload', upload.single('image'), (req, res) => {
  console.log('📁 Upload de imagem solicitado');
  
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }
  
  const imagePath = `/uploads/${req.file.filename}`;
  console.log('✅ Imagem salva em:', imagePath);
  
  res.json({ imagePath });
});

// Rota para buscar todos os lugares
app.get('/lugares', (req, res) => {
  console.log('📍 Buscando todos os lugares');
  
  pool.query('SELECT * FROM lugares ORDER BY criado_em DESC', (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar lugares:', err);
      return res.status(500).json({ error: 'Erro ao buscar lugares' });
    }
    
    const lugaresParsed = results.map(lugar => {
      if (lugar.imagem) {
        try {
          // Verificar se é uma string vazia ou apenas espaços
          const imagemTrimmed = lugar.imagem.trim();
          if (imagemTrimmed === '') {
            console.log('⚠️ Campo imagem vazio para lugar', lugar.id, '- definindo como array vazio');
            lugar.imagem = [];
          } else {
            lugar.imagem = JSON.parse(imagemTrimmed);
          }
        } catch (e) {
          console.warn('⚠️ JSON inválido para lugar', lugar.id, '- definindo como array vazio');
          console.warn('Conteúdo corrompido:', lugar.imagem);
          lugar.imagem = [];
          
          // Corrigir no banco de dados
          pool.query(
            'UPDATE lugares SET imagem = ? WHERE id = ?',
            [JSON.stringify([]), lugar.id],
            (updateErr) => {
              if (updateErr) {
                console.error('❌ Erro ao corrigir dado corrompido:', updateErr);
              } else {
                console.log('✅ Dado corrompido corrigido para lugar:', lugar.id);
              }
            }
          );
        }
      } else {
        lugar.imagem = [];
        
        // Se imagem é null, definir como array vazio no banco
        pool.query(
          'UPDATE lugares SET imagem = ? WHERE id = ?',
          [JSON.stringify([]), lugar.id],
          (updateErr) => {
            if (updateErr) {
              console.error('❌ Erro ao definir array vazio:', updateErr);
            } else {
              console.log('✅ Array vazio definido para lugar:', lugar.id);
            }
          }
        );
      }
      return lugar;
    });
    
    console.log('✅ Lugares encontrados:', lugaresParsed.length);
    res.json(lugaresParsed);
  });
});

// Rota para buscar um lugar específico
app.get('/lugares/:id', (req, res) => {
  const { id } = req.params;
  console.log('📍 Buscando lugar ID:', id);
  
  pool.query('SELECT * FROM lugares WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar lugar:', err);
      return res.status(500).json({ error: 'Erro ao buscar lugar' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Lugar não encontrado' });
    }
    
    const lugar = results[0];
    if (lugar.imagem) {
      try {
        lugar.imagem = JSON.parse(lugar.imagem);
      } catch (e) {
        console.error('⚠️ Erro ao parsear imagens:', e);
        lugar.imagem = [];
      }
    } else {
      lugar.imagem = [];
    }
    
    console.log('✅ Lugar encontrado:', lugar.id);
    res.json(lugar);
  });
});

// Rota para criar novo lugar
app.post('/lugares', (req, res) => {
  console.log('🆕 Criando novo lugar');
  console.log('📦 Dados recebidos:', req.body);
  
  const { nome, descricao, tipo, latitude, longitude, imagePaths } = req.body;
  
  if (!nome || !latitude || !longitude) {
    return res.status(400).json({ error: 'Campos obrigatórios: nome, latitude, longitude' });
  }
  
  const tipoFinal = tipo || 'outro';
  let imagensJson = JSON.stringify([]);
  
  if (imagePaths && Array.isArray(imagePaths) && imagePaths.length > 0) {
    imagensJson = JSON.stringify(imagePaths);
    console.log('🖼️ Imagens a serem salvas:', imagePaths);
  }
  
  pool.query(
    'INSERT INTO lugares (nome, descricao, tipo, latitude, longitude, imagem) VALUES (?, ?, ?, ?, ?, ?)',
    [nome, descricao, tipoFinal, latitude, longitude, imagensJson],
    (err, result) => {
      if (err) {
        console.error('❌ Erro ao salvar lugar:', err);
        return res.status(500).json({ error: 'Erro ao salvar lugar' });
      }
      
      const novoLugar = { 
        id: result.insertId, 
        nome, 
        descricao, 
        tipo: tipoFinal, 
        latitude, 
        longitude, 
        imagem: imagePaths || [],
        resolvido: false
      };
      
      console.log('✅ Lugar criado:', novoLugar.id);
      res.status(201).json(novoLugar);
    }
  );
});

// Rota para marcar lugar como resolvido
app.put('/lugares/:id/resolver', (req, res) => {
  const { id } = req.params;
  console.log('✅ Marcando lugar como resolvido:', id);
  
  pool.query(
    'UPDATE lugares SET resolvido = ?, resolvido_em = NOW() WHERE id = ?',
    [true, id],
    (err, result) => {
      if (err) {
        console.error('❌ Erro ao resolver lugar:', err);
        return res.status(500).json({ error: 'Erro ao marcar como resolvido' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Lugar não encontrado' });
      }
      
      console.log('✅ Lugar resolvido:', id);
      res.json({ message: 'Lugar marcado como resolvido' });
    }
  );
});

// Rota para deletar lugar
app.delete('/lugares/:id', (req, res) => {
  const { id } = req.params;
  console.log('🗑️ Deletando lugar:', id);
  
  // Primeiro buscar as imagens para deletar os arquivos
  pool.query('SELECT imagem FROM lugares WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar lugar para deletar:', err);
      return res.status(500).json({ error: 'Erro ao deletar lugar' });
    }
    
    if (results.length > 0 && results[0].imagem) {
      try {
        const imagens = JSON.parse(results[0].imagem);
        // Deletar arquivos de imagem
        imagens.forEach(imagePath => {
          if (imagePath && imagePath.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, imagePath);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log('🗑️ Arquivo deletado:', filePath);
            }
          }
        });
      } catch (e) {
        console.error('⚠️ Erro ao processar imagens para deletar:', e);
      }
    }
    
    // Deletar do banco
    pool.query('DELETE FROM lugares WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error('❌ Erro ao deletar lugar do banco:', err);
        return res.status(500).json({ error: 'Erro ao deletar lugar' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Lugar não encontrado' });
      }
      
      console.log('✅ Lugar deletado:', id);
      res.json({ message: 'Lugar deletado com sucesso' });
    });
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log('📁 Pasta de uploads configurada');
  console.log('🗄️ Conexão com banco de dados estabelecida');
});
