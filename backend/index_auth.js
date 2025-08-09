const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const session = require('express-session');

const app = express();

// Configurações
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura_aqui';
const SALT_ROUNDS = 10;

// Middleware
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:3000', 'http://localhost:8083'], // URLs do frontend
  credentials: true, // Habilitar credentials para cookies/sessões
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Middleware de log para debug
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Configurar sessões
app.use(session({
  secret: 'sua_chave_de_sessao_aqui',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // true apenas para HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

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

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
  }
}));

// Configuração do banco de dados
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'mapcity',
  connectionLimit: 10,
  waitForConnections: true,
  acquireTimeout: 60000,
  queueLimit: 0
});

// =============================================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// =============================================================================

// Middleware para verificar JWT
const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar permissões
const verificarPermissao = (tiposPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (tiposPermitidos.includes(req.usuario.tipo)) {
      next();
    } else {
      return res.status(403).json({ error: 'Permissão insuficiente' });
    }
  };
};

// =============================================================================
// ROTAS DE AUTENTICAÇÃO
// =============================================================================

// Rota de teste
app.get('/test', (req, res) => {
  res.json({ message: 'Servidor funcionando!', timestamp: new Date().toISOString() });
});

// Rota de login
app.post('/auth/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  pool.query(
    'SELECT u.*, o.nome as ong_nome FROM usuarios u LEFT JOIN ongs o ON u.ong_id = o.id WHERE u.email = ? AND u.ativo = true',
    [email],
    async (err, results) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }

      if (results.length === 0) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const usuario = results[0];

      try {
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        
        if (!senhaValida) {
          return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Gerar JWT
        const token = jwt.sign(
          { 
            id: usuario.id, 
            email: usuario.email, 
            tipo: usuario.tipo,
            ong_id: usuario.ong_id 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Retornar dados do usuário (sem senha)
        const dadosUsuario = {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          tipo: usuario.tipo,
          ong_id: usuario.ong_id,
          ong_nome: usuario.ong_nome
        };

        res.json({
          message: 'Login realizado com sucesso',
          token,
          usuario: dadosUsuario
        });

      } catch (error) {
        console.error('Erro ao verificar senha:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }
  );
});

// Rota de registro
app.post('/auth/registro', async (req, res) => {
  const { nome, email, senha, tipo = 'usuario', ong_id = null } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    pool.query(
      'INSERT INTO usuarios (nome, email, senha, tipo, ong_id) VALUES (?, ?, ?, ?, ?)',
      [nome, email, senhaHash, tipo, ong_id],
      (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Email já cadastrado' });
          }
          console.error('Erro ao criar usuário:', err);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }

        res.status(201).json({
          message: 'Usuário criado com sucesso',
          id: result.insertId
        });
      }
    );
  } catch (error) {
    console.error('Erro ao hash da senha:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para verificar token
app.get('/auth/verificar', verificarToken, (req, res) => {
  res.json({
    valido: true,
    usuario: req.usuario
  });
});

// Rota de logout
app.post('/auth/logout', (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
});

// =============================================================================
// ROTAS DE ÁREAS DE RESPONSABILIDADE (ONGs)
// =============================================================================

// Buscar áreas de responsabilidade da ONG
app.get('/areas', verificarToken, verificarPermissao(['ong']), (req, res) => {
  console.log('🗺️ Buscando áreas de responsabilidade para ONG:', req.usuario.email);
  
  pool.query(
    'SELECT * FROM areas_responsabilidade WHERE ong_id = ? AND ativa = true ORDER BY criada_em DESC',
    [req.usuario.id],
    (err, results) => {
      if (err) {
        console.error('Erro ao buscar áreas:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      console.log('✅ Áreas encontradas:', results.length);
      res.json(results);
    }
  );
});

// Criar nova área de responsabilidade
app.post('/areas', verificarToken, verificarPermissao(['ong']), (req, res) => {
  const { nome, descricao, coordenadas } = req.body;
  
  if (!nome || !coordenadas || !Array.isArray(coordenadas) || coordenadas.length < 3) {
    return res.status(400).json({ error: 'Nome e coordenadas (mínimo 3 pontos) são obrigatórios' });
  }
  
  console.log('🗺️ Criando nova área para ONG:', req.usuario.email);
  
  pool.query(
    'INSERT INTO areas_responsabilidade (ong_id, nome, descricao, coordenadas) VALUES (?, ?, ?, ?)',
    [req.usuario.id, nome, descricao, JSON.stringify(coordenadas)],
    (err, result) => {
      if (err) {
        console.error('Erro ao criar área:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      console.log('✅ Área criada com ID:', result.insertId);
      res.status(201).json({
        message: 'Área criada com sucesso',
        id: result.insertId
      });
    }
  );
});

// Atualizar área de responsabilidade
app.put('/areas/:id', verificarToken, verificarPermissao(['ong']), (req, res) => {
  const { id } = req.params;
  const { nome, descricao, coordenadas } = req.body;
  
  console.log('🗺️ Atualizando área', id, 'para ONG:', req.usuario.email);
  
  pool.query(
    'UPDATE areas_responsabilidade SET nome = ?, descricao = ?, coordenadas = ? WHERE id = ? AND ong_id = ?',
    [nome, descricao, JSON.stringify(coordenadas), id, req.usuario.id],
    (err, result) => {
      if (err) {
        console.error('Erro ao atualizar área:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Área não encontrada' });
      }
      
      console.log('✅ Área atualizada');
      res.json({ message: 'Área atualizada com sucesso' });
    }
  );
});

// Excluir área de responsabilidade
app.delete('/areas/:id', verificarToken, verificarPermissao(['ong']), (req, res) => {
  const { id } = req.params;
  
  console.log('🗺️ Excluindo área', id, 'para ONG:', req.usuario.email);
  
  pool.query(
    'UPDATE areas_responsabilidade SET ativa = false WHERE id = ? AND ong_id = ?',
    [id, req.usuario.id],
    (err, result) => {
      if (err) {
        console.error('Erro ao excluir área:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Área não encontrada' });
      }
      
      console.log('✅ Área desativada');
      res.json({ message: 'Área removida com sucesso' });
    }
  );
});

// Buscar notificações da ONG
app.get('/notificacoes', verificarToken, verificarPermissao(['ong']), (req, res) => {
  console.log('🔔 Buscando notificações para ONG:', req.usuario.email);
  
  pool.query(
    `SELECT n.*, a.nome as area_nome, l.descricao as marcador_descricao 
     FROM notificacoes_ong n 
     JOIN areas_responsabilidade a ON n.area_id = a.id 
     JOIN lugares l ON n.lugar_id = l.id 
     WHERE n.ong_id = ? 
     ORDER BY n.criada_em DESC 
     LIMIT 50`,
    [req.usuario.id],
    (err, results) => {
      if (err) {
        console.error('Erro ao buscar notificações:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      console.log('✅ Notificações encontradas:', results.length);
      res.json(results);
    }
  );
});

// Marcar notificação como lida
app.put('/notificacoes/:id/lida', verificarToken, verificarPermissao(['ong']), (req, res) => {
  const { id } = req.params;
  
  pool.query(
    'UPDATE notificacoes_ong SET lida = true WHERE id = ? AND ong_id = ?',
    [id, req.usuario.id],
    (err, result) => {
      if (err) {
        console.error('Erro ao marcar notificação como lida:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      res.json({ message: 'Notificação marcada como lida' });
    }
  );
});

// =============================================================================
// ROTAS DE LUGARES (COM AUTENTICAÇÃO)
// =============================================================================

// Buscar todos os lugares (todos os usuários autenticados podem ver)
app.get('/lugares', verificarToken, (req, res) => {
  console.log('📍 Buscando todos os lugares para usuário:', req.usuario.email);
  
  pool.query('SELECT * FROM lugares ORDER BY criado_em DESC', (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar lugares:', err);
      return res.status(500).json({ error: 'Erro ao buscar lugares' });
    }

    const lugaresParsed = results.map(lugar => {
      let images = [];
      
      if (lugar.imagem) {
        try {
          if (typeof lugar.imagem === 'string') {
            const imagemTrimmed = lugar.imagem.trim();
            if (imagemTrimmed !== '') {
              const parsed = JSON.parse(imagemTrimmed);
              images = Array.isArray(parsed) ? parsed : [];
            }
          }
        } catch (e) {
          console.error('Erro ao parsear imagem para lugar', lugar.id, ':', e);
          images = [];
        }
      }
      
      return {
        ...lugar,
        imagem: JSON.stringify(images)
      };
    });

    console.log('✅ Lugares encontrados:', lugaresParsed.length);
    res.json(lugaresParsed);
  });
});

// Buscar lugar específico
app.get('/lugares/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  
  pool.query('SELECT * FROM lugares WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Erro ao buscar lugar:', err);
      return res.status(500).json({ error: 'Erro ao buscar lugar' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Lugar não encontrado' });
    }

    res.json(results[0]);
  });
});

// Função para verificar se um ponto está dentro de um polígono (algoritmo ray casting)
function pontoNaArea(ponto, coordenadas) {
  const x = ponto.lat;
  const y = ponto.lng;
  let dentro = false;
  
  for (let i = 0, j = coordenadas.length - 1; i < coordenadas.length; j = i++) {
    const xi = coordenadas[i].lat;
    const yi = coordenadas[i].lng;
    const xj = coordenadas[j].lat;
    const yj = coordenadas[j].lng;
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      dentro = !dentro;
    }
  }
  
  return dentro;
}

// Função para criar notificação para ONGs quando um novo marcador é criado em sua área
function criarNotificacaoNovoMarcador(lugarId, latitude, longitude) {
  // Buscar todas as áreas ativas
  pool.query(
    'SELECT id, ong_id, nome, coordenadas FROM areas_responsabilidade WHERE ativa = true',
    (err, areas) => {
      if (err) {
        console.error('Erro ao buscar áreas para notificação:', err);
        return;
      }
      
      areas.forEach(area => {
        try {
          const coordenadas = JSON.parse(area.coordenadas);
          const ponto = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
          
          if (pontoNaArea(ponto, coordenadas)) {
            console.log('📍 Novo marcador na área', area.nome, 'da ONG', area.ong_id);
            
            // Criar notificação
            pool.query(
              `INSERT INTO notificacoes_ong (ong_id, area_id, lugar_id, tipo, titulo, mensagem) 
               VALUES (?, ?, ?, 'novo_marcador', ?, ?)`,
              [
                area.ong_id,
                area.id,
                lugarId,
                'Novo problema reportado',
                `Um novo problema foi reportado na sua área de responsabilidade: ${area.nome}`
              ],
              (err) => {
                if (err) {
                  console.error('Erro ao criar notificação:', err);
                } else {
                  console.log('✅ Notificação criada para ONG:', area.ong_id);
                }
              }
            );
          }
        } catch (e) {
          console.error('Erro ao processar coordenadas da área:', e);
        }
      });
    }
  );
}

// Criar novo lugar (apenas usuários e ONGs)
app.post('/lugares', verificarToken, verificarPermissao(['usuario', 'ong']), (req, res) => {
  console.log('📝 Criando novo lugar para usuário:', req.usuario.email);
  
  const { nome, descricao, tipo, latitude, longitude, imagem } = req.body;

  if (!nome || !latitude || !longitude) {
    return res.status(400).json({ error: 'Nome, latitude e longitude são obrigatórios' });
  }

  const imagemString = Array.isArray(imagem) ? JSON.stringify(imagem) : (imagem || '[]');

  pool.query(
    'INSERT INTO lugares (nome, descricao, tipo, latitude, longitude, imagem) VALUES (?, ?, ?, ?, ?, ?)',
    [nome, descricao, tipo || 'outro', latitude, longitude, imagemString],
    (err, result) => {
      if (err) {
        console.error('❌ Erro ao criar lugar:', err);
        return res.status(500).json({ error: 'Erro ao criar lugar' });
      }

      console.log('✅ Lugar criado com ID:', result.insertId);
      
      // Verificar se o novo marcador está em alguma área de responsabilidade e criar notificações
      criarNotificacaoNovoMarcador(result.insertId, latitude, longitude);
      
      res.status(201).json({
        message: 'Lugar criado com sucesso',
        id: result.insertId
      });
    }
  );
});

// Resolver lugar (usuários, ONGs e admin)
app.put('/lugares/:id/resolver', verificarToken, verificarPermissao(['usuario', 'ong', 'admin']), (req, res) => {
  const { id } = req.params;
  const { resolvido } = req.body;

  pool.query(
    'UPDATE lugares SET resolvido = ?, resolvido_em = NOW() WHERE id = ?',
    [resolvido, id],
    (err, result) => {
      if (err) {
        console.error('Erro ao atualizar lugar:', err);
        return res.status(500).json({ error: 'Erro ao atualizar lugar' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Lugar não encontrado' });
      }

      res.json({ message: 'Status atualizado com sucesso' });
    }
  );
});

// Deletar lugar (admin ou ONG responsável pela área)
app.delete('/lugares/:id', verificarToken, verificarPermissao(['admin', 'ong']), (req, res) => {
  const { id } = req.params;
  console.log('🗑️ Usuário', req.usuario.email, 'tentando deletar lugar:', id);

  // Se for admin, pode deletar qualquer lugar
  if (req.usuario.tipo === 'admin') {
    console.log('👑 Admin deletando lugar');
    deletarLugar(id, res);
    return;
  }

  // Se for ONG, verificar se o lugar está em sua área de responsabilidade
  if (req.usuario.tipo === 'ong') {
    // Primeiro buscar o lugar
    pool.query('SELECT latitude, longitude FROM lugares WHERE id = ?', [id], (err, lugarResults) => {
      if (err) {
        console.error('Erro ao buscar lugar:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }

      if (lugarResults.length === 0) {
        return res.status(404).json({ error: 'Lugar não encontrado' });
      }

      const lugar = lugarResults[0];
      
      // Buscar áreas da ONG
      pool.query(
        'SELECT coordenadas FROM areas_responsabilidade WHERE ong_id = ? AND ativa = true',
        [req.usuario.id],
        (err, areaResults) => {
          if (err) {
            console.error('Erro ao buscar áreas da ONG:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
          }

          // Verificar se o lugar está em alguma área da ONG
          let podeExcluir = false;
          const ponto = { lat: parseFloat(lugar.latitude), lng: parseFloat(lugar.longitude) };

          for (const area of areaResults) {
            try {
              const coordenadas = JSON.parse(area.coordenadas);
              if (pontoNaArea(ponto, coordenadas)) {
                podeExcluir = true;
                break;
              }
            } catch (e) {
              console.error('Erro ao processar coordenadas:', e);
            }
          }

          if (!podeExcluir) {
            return res.status(403).json({ error: 'Lugar fora da sua área de responsabilidade' });
          }

          console.log('🏢 ONG deletando lugar em sua área de responsabilidade');
          deletarLugar(id, res);
        }
      );
    });
    return;
  }

  return res.status(403).json({ error: 'Permissão insuficiente' });
});

// Função auxiliar para deletar lugar
function deletarLugar(id, res) {
  // Primeiro buscar as imagens para deletar os arquivos
  pool.query('SELECT imagem FROM lugares WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Erro ao buscar lugar para deletar:', err);
      return res.status(500).json({ error: 'Erro ao buscar lugar' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Lugar não encontrado' });
    }

    // Deletar arquivos de imagem
    const lugar = results[0];
    if (lugar.imagem) {
      try {
        const images = JSON.parse(lugar.imagem);
        if (Array.isArray(images)) {
          images.forEach(imagePath => {
            const fullPath = path.join(__dirname, imagePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
              console.log('🗑️ Arquivo deletado:', fullPath);
            }
          });
        }
      } catch (e) {
        console.error('Erro ao parsear imagens para deletar:', e);
      }
    }

    // Deletar do banco
    pool.query('DELETE FROM lugares WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error('Erro ao deletar lugar:', err);
        return res.status(500).json({ error: 'Erro ao deletar lugar' });
      }

      console.log('✅ Lugar deletado com sucesso');
      res.json({ message: 'Lugar deletado com sucesso' });
    });
  });
}

// =============================================================================
// ROTAS DE UPLOAD (COM AUTENTICAÇÃO)
// =============================================================================

app.post('/upload', verificarToken, verificarPermissao(['usuario', 'ong']), upload.array('images', 5), (req, res) => {
  console.log('📤 Upload de imagens para usuário:', req.usuario.email);
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
  
  console.log('✅ Imagens enviadas:', imagePaths);
  res.json({
    message: 'Imagens enviadas com sucesso',
    images: imagePaths
  });
});

// =============================================================================
// ROTAS DE ADMINISTRAÇÃO
// =============================================================================

// Listar usuários (apenas admin)
app.get('/admin/usuarios', verificarToken, verificarPermissao(['admin']), (req, res) => {
  pool.query(
    'SELECT u.id, u.nome, u.email, u.tipo, u.ativo, u.criado_em, o.nome as ong_nome FROM usuarios u LEFT JOIN ongs o ON u.ong_id = o.id ORDER BY u.criado_em DESC',
    (err, results) => {
      if (err) {
        console.error('Erro ao buscar usuários:', err);
        return res.status(500).json({ error: 'Erro ao buscar usuários' });
      }
      res.json(results);
    }
  );
});

// Ativar/desativar usuário (apenas admin)
app.put('/admin/usuarios/:id/status', verificarToken, verificarPermissao(['admin']), (req, res) => {
  const { id } = req.params;
  const { ativo } = req.body;

  pool.query(
    'UPDATE usuarios SET ativo = ? WHERE id = ?',
    [ativo, id],
    (err, result) => {
      if (err) {
        console.error('Erro ao atualizar status do usuário:', err);
        return res.status(500).json({ error: 'Erro ao atualizar status' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json({ message: 'Status atualizado com sucesso' });
    }
  );
});

// =============================================================================
// INICIALIZAÇÃO DO SERVIDOR
// =============================================================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('🚀 Servidor rodando na porta', PORT);
  console.log('🔐 Sistema de autenticação ativo');
  console.log('📍 Endpoints disponíveis:');
  console.log('   POST /auth/login - Fazer login');
  console.log('   POST /auth/registro - Registrar usuário');
  console.log('   GET  /auth/verificar - Verificar token');
  console.log('   GET  /lugares - Listar lugares');
  console.log('   POST /lugares - Criar lugar');
  console.log('   PUT  /lugares/:id/resolver - Resolver lugar');
  console.log('   DELETE /lugares/:id - Deletar lugar (admin)');
  console.log('   POST /upload - Upload de imagens');
  console.log('   GET  /admin/usuarios - Listar usuários (admin)');
});

module.exports = app;
