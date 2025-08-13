const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Carregar variáveis de ambiente
require('dotenv').config();

const app = express();

// Configurações seguras usando variáveis de ambiente
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 10;
const PORT = process.env.PORT || 3001;

// Verificação de segurança
if (!JWT_SECRET || JWT_SECRET === 'sua_chave_secreta_super_segura_aqui') {
  console.error('❌ ERRO DE SEGURANÇA: JWT_SECRET não está configurado adequadamente!');
  console.error('🔧 Configure a variável JWT_SECRET no arquivo .env');
  process.exit(1);
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Middleware de log
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Configurar multer para upload de arquivos
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB padrão

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
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
  limits: { fileSize: maxFileSize },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
    }
  }
});

// Servir arquivos estáticos
app.use('/uploads', express.static(uploadDir));

// =============================================================================
// BANCO DE DADOS
// =============================================================================

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mapcity',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  waitForConnections: true,
  queueLimit: 0
});

// =============================================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// =============================================================================

const verificarToken = (req, res, next) => {
  console.log('🔐 Verificando token para:', req.method, req.path);
  const token = req.headers.authorization?.split(' ')[1];
  console.log('🔑 Token recebido:', token ? 'Presente' : 'Ausente');
  
  if (!token) {
    console.log('❌ Token não fornecido');
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token válido para usuário:', decoded.id, decoded.tipo);
    req.usuario = decoded;
    next();
  } catch (error) {
    console.log('❌ Token inválido:', error.message);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

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
// FUNÇÕES AUXILIARES
// =============================================================================

// Função para verificar se um ponto está dentro de um polígono
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

// Função para criar notificação para ONGs
function criarNotificacaoNovoMarcador(lugarId, latitude, longitude) {
  pool.query(
    'SELECT id, ong_id, nome, coordenadas FROM areas_responsabilidade WHERE ativa = true AND status = ?',
    ['aprovada'],
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

// Função para deletar lugar
function deletarLugar(id, res) {
  pool.query('SELECT imagem FROM lugares WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Erro ao buscar lugar para deletar:', err);
      return res.status(500).json({ error: 'Erro ao buscar lugar' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Lugar não encontrado' });
    }

    const lugar = results[0];
    if (lugar.imagem) {
      try {
        const images = JSON.parse(lugar.imagem);
        if (Array.isArray(images)) {
          images.forEach(imagePath => {
            const fullPath = path.join(__dirname, imagePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          });
        }
      } catch (e) {
        console.error('Erro ao parsear imagens para deletar:', e);
      }
    }

    pool.query('DELETE FROM lugares WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error('Erro ao deletar lugar:', err);
        return res.status(500).json({ error: 'Erro ao deletar lugar' });
      }

      res.json({ message: 'Lugar deletado com sucesso' });
    });
  });
}

// =============================================================================
// ROTAS DE TESTE
// =============================================================================

app.get('/test', (req, res) => {
  res.json({ message: 'Servidor funcionando!', timestamp: new Date().toISOString() });
});

// Endpoint de debug temporário para verificar usuários
app.get('/debug/users', (req, res) => {
  pool.query('SELECT id, nome, email, tipo FROM usuarios LIMIT 10', (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Erro de banco', details: err.message });
    }
    res.json({ users: results, count: results.length });
  });
});

// =============================================================================
// ROTAS DE AUTENTICAÇÃO
// =============================================================================

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

app.get('/auth/verificar', verificarToken, (req, res) => {
  res.json({
    valido: true,
    usuario: req.usuario
  });
});

app.post('/auth/logout', (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
});

// =============================================================================
// ROTAS DE LUGARES
// =============================================================================

app.get('/lugares', verificarToken, (req, res) => {
  pool.query('SELECT * FROM lugares ORDER BY criado_em DESC', (err, results) => {
    if (err) {
      console.error('Erro ao buscar lugares:', err);
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

    res.json(lugaresParsed);
  });
});

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

app.post('/lugares', verificarToken, verificarPermissao(['usuario', 'ong']), (req, res) => {
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
        console.error('Erro ao criar lugar:', err);
        return res.status(500).json({ error: 'Erro ao criar lugar' });
      }

      criarNotificacaoNovoMarcador(result.insertId, latitude, longitude);
      
      res.status(201).json({
        message: 'Lugar criado com sucesso',
        id: result.insertId
      });
    }
  );
});

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

app.delete('/lugares/:id', verificarToken, verificarPermissao(['admin', 'ong']), (req, res) => {
  const { id } = req.params;

  if (req.usuario.tipo === 'admin') {
    deletarLugar(id, res);
    return;
  }

  if (req.usuario.tipo === 'ong') {
    pool.query('SELECT latitude, longitude FROM lugares WHERE id = ?', [id], (err, lugarResults) => {
      if (err) {
        console.error('Erro ao buscar lugar:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }

      if (lugarResults.length === 0) {
        return res.status(404).json({ error: 'Lugar não encontrado' });
      }

      const lugar = lugarResults[0];
      
      pool.query(
        'SELECT coordenadas FROM areas_responsabilidade WHERE ong_id = ? AND ativa = true',
        [req.usuario.ong_id],
        (err, areaResults) => {
          if (err) {
            console.error('Erro ao buscar áreas da ONG:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
          }

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

          deletarLugar(id, res);
        }
      );
    });
    return;
  }

  return res.status(403).json({ error: 'Permissão insuficiente' });
});

// =============================================================================
// ROTAS DE ÁREAS 
// =============================================================================

// Endpoint público para visualizar áreas aprovadas (todos os usuários)
app.get('/areas/publicas', verificarToken, (req, res) => {
  pool.query(
    `SELECT ar.*, u.nome as ong_nome, 
            ar.criada_em as data_criacao
     FROM areas_responsabilidade ar 
     LEFT JOIN usuarios u ON ar.ong_id = u.id 
     WHERE ar.status = 'aprovada' AND ar.ativa = true 
     ORDER BY ar.criada_em DESC`,
    (err, results) => {
      if (err) {
        console.error('Erro ao buscar áreas públicas:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      console.log('📊 Dados de áreas públicas:', results.length, 'registros');
      if (results.length > 0) {
        console.log('📊 Primeiro registro:', JSON.stringify(results[0], null, 2));
      }
      
      res.json(results);
    }
  );
});

// ROTAS DE ÁREAS (ONGs)
app.get('/areas', verificarToken, verificarPermissao(['ong']), (req, res) => {
  console.log('🔍 GET /areas chamado por usuário:', req.usuario);
  
  pool.query(
    `SELECT ar.*, u.nome as ong_nome, ar.criada_em as data_criacao 
     FROM areas_responsabilidade ar
     LEFT JOIN usuarios u ON ar.ong_id = u.id
     WHERE ar.ong_id = ? AND ar.ativa = true 
     ORDER BY ar.criada_em DESC`,
    [req.usuario.ong_id],
    (err, results) => {
      if (err) {
        console.error('❌ Erro ao buscar áreas:', err);
        console.error('❌ SQL Error Code:', err.code);
        console.error('❌ SQL Error Message:', err.sqlMessage);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      console.log('✅ Áreas encontradas:', results.length);
      res.json(results);
    }
  );
});

app.post('/areas', verificarToken, verificarPermissao(['ong']), (req, res) => {
  const { nome, descricao, coordenadas } = req.body;
  
  if (!nome || !coordenadas || !Array.isArray(coordenadas) || coordenadas.length < 3) {
    return res.status(400).json({ error: 'Nome e coordenadas (mínimo 3 pontos) são obrigatórios' });
  }
  
  pool.query(
    'INSERT INTO areas_responsabilidade (ong_id, nome, descricao, coordenadas, status) VALUES (?, ?, ?, ?, ?)',
    [req.usuario.ong_id, nome, descricao, JSON.stringify(coordenadas), 'pendente'],
    (err, result) => {
      if (err) {
        console.error('Erro ao criar área:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      res.status(201).json({
        message: 'Área enviada para aprovação do administrador',
        id: result.insertId,
        status: 'pendente'
      });
    }
  );
});

app.put('/areas/:id', verificarToken, verificarPermissao(['ong']), (req, res) => {
  const { id } = req.params;
  const { nome, descricao, coordenadas } = req.body;
  
  pool.query(
    'UPDATE areas_responsabilidade SET nome = ?, descricao = ?, coordenadas = ? WHERE id = ? AND ong_id = ?',
    [nome, descricao, JSON.stringify(coordenadas), id, req.usuario.ong_id],
    (err, result) => {
      if (err) {
        console.error('Erro ao atualizar área:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Área não encontrada' });
      }
      
      res.json({ message: 'Área atualizada com sucesso' });
    }
  );
});

// Endpoint para ONG excluir suas próprias áreas
app.delete('/areas/:id', verificarToken, verificarPermissao(['ong']), (req, res) => {
  const { id } = req.params;
  console.log('🔄 ONG tentando excluir área:', id, 'ONG ID:', req.usuario.ong_id);
  
  pool.query(
    'DELETE FROM areas_responsabilidade WHERE id = ? AND ong_id = ?',
    [id, req.usuario.ong_id],
    (err, result) => {
      if (err) {
        console.error('❌ Erro da ONG ao excluir área:', err);
        return res.status(500).json({ error: 'Erro ao excluir área' });
      }
      
      if (result.affectedRows === 0) {
        console.log('⚠️ Área não encontrada ou sem permissão:', id, 'ONG:', req.usuario.ong_id);
        return res.status(404).json({ error: 'Área não encontrada ou você não tem permissão para excluí-la' });
      }
      
      console.log('✅ Área excluída com sucesso pela ONG:', id);
      res.json({ message: 'Área excluída com sucesso' });
    }
  );
});

// =============================================================================
// ROTAS DE NOTIFICAÇÕES (ONGs)
// =============================================================================

app.get('/notificacoes', verificarToken, verificarPermissao(['ong']), (req, res) => {
  console.log('🔍 GET /notificacoes chamado por usuário:', req.usuario);
  
  pool.query(
    `SELECT n.*, a.nome as area_nome, l.descricao as marcador_descricao,
            n.criada_em as data_criacao
     FROM notificacoes_ong n 
     JOIN areas_responsabilidade a ON n.area_id = a.id 
     JOIN lugares l ON n.lugar_id = l.id 
     WHERE n.ong_id = ? 
     ORDER BY n.criada_em DESC 
     LIMIT 50`,
    [req.usuario.ong_id],
    (err, results) => {
      if (err) {
        console.error('❌ Erro ao buscar notificações:', err);
        console.error('❌ SQL Error Code:', err.code);
        console.error('❌ SQL Error Message:', err.sqlMessage);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      console.log('📊 Dados de notificações:', results.length, 'registros');
      if (results.length > 0) {
        console.log('📊 Primeira notificação:', JSON.stringify(results[0], null, 2));
      }
      
      res.json(results);
    }
  );
});

app.put('/notificacoes/:id/lida', verificarToken, verificarPermissao(['ong', 'admin']), (req, res) => {
  const { id } = req.params;
  
  // Para admin, permitir marcar qualquer notificação
  // Para ONG, só permitir suas próprias notificações
  let query, params;
  
  if (req.usuario.tipo === 'admin') {
    query = 'UPDATE notificacoes_ong SET lida = true WHERE id = ?';
    params = [id];
  } else {
    query = 'UPDATE notificacoes_ong SET lida = true WHERE id = ? AND ong_id = ?';
    params = [id, req.usuario.ong_id];
  }
  
  pool.query(query, params, (err, result) => {
    if (err) {
      console.error('Erro ao marcar notificação como lida:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada ou sem permissão' });
    }
    
    res.json({ message: 'Notificação marcada como lida' });
  });
});

// =============================================================================
// ROTAS DE UPLOAD
// =============================================================================

app.post('/upload', verificarToken, verificarPermissao(['usuario', 'ong']), upload.array('images', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
  
  res.json({
    message: 'Imagens enviadas com sucesso',
    images: imagePaths
  });
});

// =============================================================================
// ROTAS DE ADMINISTRAÇÃO
// =============================================================================

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

// Buscar áreas pendentes de aprovação (apenas admin)
app.get('/admin/areas/pendentes', verificarToken, verificarPermissao(['admin']), (req, res) => {
  pool.query(
    `SELECT a.*, u.nome as ong_nome, u.email as ong_email 
     FROM areas_responsabilidade a 
     JOIN usuarios u ON a.ong_id = u.id 
     WHERE a.status = 'pendente' AND a.ativa = true 
     ORDER BY a.criada_em ASC`,
    (err, results) => {
      if (err) {
        console.error('Erro ao buscar áreas pendentes:', err);
        return res.status(500).json({ error: 'Erro ao buscar áreas pendentes' });
      }
      res.json(results);
    }
  );
});

// Aprovar área de responsabilidade (apenas admin)
app.put('/admin/areas/:id/aprovar', verificarToken, verificarPermissao(['admin']), (req, res) => {
  const { id } = req.params;
  console.log('🔄 Admin tentando aprovar área:', id, 'Usuario:', req.usuario.tipo);

  pool.query(
    'UPDATE areas_responsabilidade SET status = ?, aprovada_por = ?, data_aprovacao = NOW() WHERE id = ?',
    ['aprovada', req.usuario.id, id],
    (err, result) => {
      if (err) {
        console.error('❌ Erro ao aprovar área:', err);
        return res.status(500).json({ error: 'Erro ao aprovar área' });
      }

      if (result.affectedRows === 0) {
        console.log('⚠️ Área não encontrada para aprovar:', id);
        return res.status(404).json({ error: 'Área não encontrada' });
      }

      console.log('✅ Área aprovada com sucesso:', id);
      res.json({ message: 'Área aprovada com sucesso' });
    }
  );
});

// Rejeitar área de responsabilidade (apenas admin)
app.put('/admin/areas/:id/rejeitar', verificarToken, verificarPermissao(['admin']), (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;

  if (!motivo) {
    return res.status(400).json({ error: 'Motivo da rejeição é obrigatório' });
  }

  pool.query(
    'UPDATE areas_responsabilidade SET status = ?, motivo_rejeicao = ? WHERE id = ?',
    ['rejeitada', motivo, id],
    (err, result) => {
      if (err) {
        console.error('Erro ao rejeitar área:', err);
        return res.status(500).json({ error: 'Erro ao rejeitar área' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Área não encontrada' });
      }

      res.json({ message: 'Área rejeitada com sucesso' });
    }
  );
});

// Listar todas as áreas (apenas admin)
app.get('/admin/areas', verificarToken, verificarPermissao(['admin']), (req, res) => {
  console.log('🔍 GET /admin/areas chamado por admin');
  
  pool.query(
    `SELECT a.*, u.nome as ong_nome, u.email as ong_email,
            admin.nome as aprovador_nome
     FROM areas_responsabilidade a 
     JOIN usuarios u ON a.ong_id = u.id 
     LEFT JOIN usuarios admin ON a.aprovada_por = admin.id
     ORDER BY a.criada_em DESC`,
    (err, results) => {
      if (err) {
        console.error('❌ Erro ao buscar todas as áreas:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      console.log(`✅ Encontradas ${results.length} áreas`);
      res.json(results);
    }
  );
});

// Endpoint para admin excluir área
app.delete('/admin/areas/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  console.log('🔄 Admin tentando excluir área:', id, 'Usuario:', req.usuario.tipo);
  
  if (req.usuario.tipo !== 'admin') {
    console.log('❌ Acesso negado - usuário não é admin:', req.usuario.tipo);
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem excluir áreas.' });
  }

  pool.query(
    'DELETE FROM areas_responsabilidade WHERE id = ?',
    [id],
    (err, result) => {
      if (err) {
        console.error('❌ Erro ao excluir área:', err);
        return res.status(500).json({ error: 'Erro ao excluir área' });
      }
      
      if (result.affectedRows === 0) {
        console.log('⚠️ Área não encontrada para excluir:', id);
        return res.status(404).json({ error: 'Área não encontrada' });
      }
      
      console.log('✅ Área excluída com sucesso pelo admin:', id);
      res.json({ message: 'Área excluída com sucesso' });
    }
  );
});

// Endpoint para usuário excluir sua própria conta
app.delete('/auth/conta', verificarToken, (req, res) => {
  const usuarioId = req.usuario.id;
  const usuarioTipo = req.usuario.tipo;

  // Começar uma transação para garantir consistência
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Erro ao obter conexão:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error('Erro ao iniciar transação:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }

      // Se for ONG, excluir todas as áreas primeiro
      if (usuarioTipo === 'ong') {
        connection.query(
          'DELETE FROM areas_responsabilidade WHERE ong_id = ?',
          [usuarioId],
          (err, result) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error('Erro ao excluir áreas da ONG:', err);
                res.status(500).json({ error: 'Erro ao excluir áreas' });
              });
            }

            console.log(`🗑️ ${result.affectedRows} áreas excluídas da ONG ${usuarioId}`);
            
            // Agora excluir o usuário
            excluirUsuario(connection, usuarioId, res);
          }
        );
      } else {
        // Para usuários normais e admins, apenas excluir a conta
        excluirUsuario(connection, usuarioId, res);
      }
    });
  });

  function excluirUsuario(connection, usuarioId, res) {
    connection.query(
      'DELETE FROM usuarios WHERE id = ?',
      [usuarioId],
      (err, result) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            console.error('Erro ao excluir usuário:', err);
            res.status(500).json({ error: 'Erro ao excluir conta' });
          });
        }

        if (result.affectedRows === 0) {
          return connection.rollback(() => {
            connection.release();
            res.status(404).json({ error: 'Usuário não encontrado' });
          });
        }

        connection.commit((err) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error('Erro ao confirmar transação:', err);
              res.status(500).json({ error: 'Erro ao confirmar exclusão' });
            });
          }

          connection.release();
          console.log(`🗑️ Conta excluída: ${usuarioId}`);
          res.json({ message: 'Conta excluída com sucesso' });
        });
      }
    );
  }
});

// =============================================================================
// SISTEMA DE DENÚNCIAS
// =============================================================================

// Criar denúncia de marcador
app.post('/denuncias', verificarToken, (req, res) => {
  console.log('🚨 Iniciando criação de denúncia');
  console.log('📝 Dados recebidos:', req.body);
  console.log('👤 Usuário logado:', req.usuario);
  
  const { marcador_id, motivo, descricao } = req.body;
  const denunciante_id = req.usuario.id;

  if (!marcador_id || !motivo) {
    console.log('❌ Dados incompletos:', { marcador_id, motivo });
    return res.status(400).json({ error: 'Marcador ID e motivo são obrigatórios' });
  }

  // Verificar se o usuário já denunciou este marcador
  console.log('🔍 Verificando denúncia existente para marcador:', marcador_id, 'usuário:', denunciante_id);
  pool.query(
    'SELECT id FROM denuncias WHERE marcador_id = ? AND denunciante_id = ?',
    [marcador_id, denunciante_id],
    (error, existingResults) => {
      if (error) {
        console.error('❌ Erro ao verificar denúncia existente:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }

      console.log('📊 Denúncias existentes encontradas:', existingResults.length);
      if (existingResults.length > 0) {
        console.log('⚠️ Usuário já denunciou este marcador');
        return res.status(400).json({ error: 'Você já denunciou este marcador' });
      }

      // Buscar informações do marcador
      console.log('🎯 Buscando informações do marcador:', marcador_id);
      pool.query(
        'SELECT * FROM lugares WHERE id = ?',
        [marcador_id],
        (error, markerResults) => {
          if (error) {
            console.error('❌ Erro ao buscar marcador:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
          }

          console.log('📍 Marcadores encontrados:', markerResults.length);
          if (markerResults.length === 0) {
            console.log('⚠️ Marcador não encontrado:', marcador_id);
            return res.status(404).json({ error: 'Marcador não encontrado' });
          }

          const marcador = markerResults[0];
          console.log('✅ Marcador encontrado:', { id: marcador.id, nome: marcador.nome, tipo: marcador.tipo });

          // Buscar ONG responsável pela área onde o marcador está localizado
          console.log('🔍 Buscando ONG responsável pela área do marcador...');
          pool.query(
            'SELECT id, ong_id, nome, coordenadas FROM areas_responsabilidade WHERE ativa = true AND status = ?',
            ['aprovada'],
            (areaError, areas) => {
              if (areaError) {
                console.error('❌ Erro ao buscar áreas responsáveis:', areaError);
                // Continuar sem ONG responsável
                criarDenunciaSemONG();
                return;
              }

              let ongResponsavelId = null;
              let areaNome = null;

              // Verificar se o marcador está dentro de alguma área
              areas.forEach(area => {
                try {
                  const coordenadas = JSON.parse(area.coordenadas);
                  const ponto = { lat: parseFloat(marcador.latitude), lng: parseFloat(marcador.longitude) };
                  
                  if (pontoNaArea(ponto, coordenadas)) {
                    ongResponsavelId = area.ong_id;
                    areaNome = area.nome;
                    console.log(`✅ ONG responsável encontrada: ${ongResponsavelId} (Área: ${areaNome})`);
                  }
                } catch (e) {
                  console.error('Erro ao processar coordenadas da área:', e);
                }
              });

              if (!ongResponsavelId) {
                console.log('⚠️ Nenhuma ONG responsável encontrada para este marcador');
              }

              // Criar a denúncia com ou sem ONG responsável
              console.log('💾 Criando denúncia no banco de dados...');
              console.log('📝 Parâmetros:', { marcador_id, denunciante_id, ong_responsavel_id: ongResponsavelId, motivo, descricao });
              pool.query(
                `INSERT INTO denuncias (marcador_id, denunciante_id, autor_marcador_id, ong_responsavel_id, motivo, descricao, status, criada_em) 
                 VALUES (?, ?, NULL, ?, ?, ?, 'pendente', NOW())`,
                [marcador_id, denunciante_id, ongResponsavelId, motivo, descricao || null],
                (error, result) => {
                  if (error) {
                    console.error('❌ Erro ao criar denúncia:', error);
                    return res.status(500).json({ error: 'Erro ao criar denúncia' });
                  }

                  console.log(`✅ Nova denúncia criada com sucesso: ${result.insertId} para marcador ${marcador_id}`);
                  res.status(201).json({ 
                    message: 'Denúncia enviada com sucesso',
                    denunciaId: result.insertId 
                  });
                }
              );
            }
          );

          // Função auxiliar para criar denúncia sem ONG
          function criarDenunciaSemONG() {
            console.log('💾 Criando denúncia no banco de dados (sem ONG responsável)...');
            pool.query(
              `INSERT INTO denuncias (marcador_id, denunciante_id, autor_marcador_id, ong_responsavel_id, motivo, descricao, status, criada_em) 
               VALUES (?, ?, NULL, NULL, ?, ?, 'pendente', NOW())`,
              [marcador_id, denunciante_id, motivo, descricao || null],
              (error, result) => {
                if (error) {
                  console.error('❌ Erro ao criar denúncia:', error);
                  return res.status(500).json({ error: 'Erro ao criar denúncia' });
                }

                console.log(`✅ Nova denúncia criada com sucesso: ${result.insertId} para marcador ${marcador_id}`);
                res.status(201).json({ 
                  message: 'Denúncia enviada com sucesso',
                  denunciaId: result.insertId 
                });
              }
            );
          }
        }
      );
    }
  );
});

// Listar denúncias (Admin e ONGs)
app.get('/denuncias', verificarToken, (req, res) => {
  let query = `
    SELECT d.*, 
           l.nome as marcador_titulo,
           l.descricao as marcador_descricao,
           l.latitude,
           l.longitude,
           u_denunciante.nome as denunciante_nome,
           u_denunciante.email as denunciante_email,
           u_autor.nome as autor_nome,
           u_autor.email as autor_email
    FROM denuncias d
    JOIN lugares l ON d.marcador_id = l.id
    JOIN usuarios u_denunciante ON d.denunciante_id = u_denunciante.id
    LEFT JOIN usuarios u_autor ON d.autor_marcador_id = u_autor.id
  `;
  let queryParams = [];

  if (req.usuario.tipo === 'ong') {
    // ONGs veem apenas denúncias de suas áreas
    query += ' WHERE d.ong_responsavel_id = ?';
    queryParams.push(req.usuario.ong_id);
  } else if (req.usuario.tipo !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  query += ' ORDER BY d.criada_em DESC';

  pool.query(query, queryParams, (error, results) => {
    if (error) {
      console.error('Erro ao buscar denúncias:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    console.log(`📋 Denúncias encontradas: ${results.length}`);
    res.json(results);
  });
});

// Processar denúncia (Admin e ONGs)
app.put('/denuncias/:id/:acao', verificarToken, (req, res) => {
  const { id, acao } = req.params;
  const { observacoes } = req.body;
  const processado_por = req.usuario.id;

  if (!['aceitar', 'rejeitar'].includes(acao)) {
    return res.status(400).json({ error: 'Ação deve ser "aceitar" ou "rejeitar"' });
  }

  // Verificar se a denúncia existe e se o usuário tem permissão
  let checkQuery = `
    SELECT d.*
    FROM denuncias d
    JOIN lugares l ON d.marcador_id = l.id
    WHERE d.id = ?
  `;
  let checkParams = [id];

  if (req.usuario.tipo === 'ong') {
    checkQuery += ' AND d.ong_responsavel_id = ?';
    checkParams.push(req.usuario.ong_id);
  } else if (req.usuario.tipo !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  pool.query(checkQuery, checkParams, (error, results) => {
    if (error) {
      console.error('Erro ao verificar denúncia:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Denúncia não encontrada' });
    }

    const denuncia = results[0];

    if (denuncia.status !== 'pendente') {
      return res.status(400).json({ error: 'Denúncia já foi processada' });
    }

    const novoStatus = acao === 'aceitar' ? 'aceita' : 'rejeitada';
    console.log(`🔄 Processando denúncia ID ${id} - Ação: ${acao} - Novo status: ${novoStatus}`);

    // Atualizar denúncia
    pool.query(
      'UPDATE denuncias SET status = ?, processado_por = ?, processado_em = NOW(), observacoes = ? WHERE id = ?',
      [novoStatus, processado_por, observacoes || null, id],
      (error, result) => {
        if (error) {
          console.error('❌ Erro ao processar denúncia:', error);
          return res.status(500).json({ error: 'Erro ao processar denúncia' });
        }

        console.log(`✅ Denúncia atualizada no banco - ID: ${id}, Status: ${novoStatus}`);

        if (acao === 'aceitar') {
          console.log(`🔄 Processando aceitação da denúncia para marcador: ${denuncia.marcador_id}`);
          // Remover o marcador denunciado
          pool.query(
            'DELETE FROM lugares WHERE id = ?',
            [denuncia.marcador_id],
            (error, deleteResult) => {
              if (error) {
                console.error('❌ Erro ao remover marcador:', error);
              } else {
                console.log(`🗑️ Marcador removido: ${denuncia.marcador_id}`);
              }
            }
          );

          // Verificar se o autor do marcador deve ser banido (apenas se soubermos quem é o autor)
          if (denuncia.autor_marcador_id) {
            pool.query(
              'SELECT COUNT(*) as total_denuncias FROM denuncias WHERE autor_marcador_id = ? AND status = "aceita"',
              [denuncia.autor_marcador_id],
              (error, countResults) => {
                if (error) {
                  console.error('Erro ao contar denúncias:', error);
                  return;
                }

                const totalDenuncias = countResults[0].total_denuncias;
                console.log(`📊 Total de denúncias aceitas para usuário ${denuncia.autor_marcador_id}: ${totalDenuncias}`);

                if (totalDenuncias >= 3) {
                  // Banir usuário
                  pool.query(
                    'UPDATE usuarios SET ativo = 0, banido_em = NOW() WHERE id = ?',
                    [denuncia.autor_marcador_id],
                    (error, banResult) => {
                      if (error) {
                        console.error('Erro ao banir usuário:', error);
                      } else {
                        console.log(`🚫 Usuário banido: ${denuncia.autor_marcador_id} (3 denúncias aceitas)`);
                      }
                    }
                  );
                }
              }
            );
          } else {
            console.log('ℹ️ Autor do marcador desconhecido - não é possível aplicar banimento');
          }
        }

        console.log(`✅ Denúncia ${acao === 'aceitar' ? 'aceita' : 'rejeitada'}: ${id}`);
        res.json({ 
          message: `Denúncia ${acao === 'aceitar' ? 'aceita' : 'rejeitada'} com sucesso` 
        });
      }
    );
  });
});

// =============================================================================
// INICIALIZAÇÃO DO SERVIDOR
// =============================================================================

app.listen(PORT, () => {
  console.log('🚀 Servidor MapCity rodando na porta', PORT);
  console.log('🔐 Sistema de autenticação ativo');
  console.log('📍 Endpoints disponíveis:');
  console.log('   GET  /test - Teste de funcionamento');
  console.log('   POST /auth/login - Login');
  console.log('   POST /auth/registro - Registro');
  console.log('   GET  /auth/verificar - Verificar token');
  console.log('   GET  /lugares - Listar lugares');
  console.log('   POST /lugares - Criar lugar');
  console.log('   PUT  /lugares/:id/resolver - Resolver lugar');
  console.log('   DELETE /lugares/:id - Deletar lugar');
  console.log('   GET  /areas/publicas - Áreas aprovadas (Público)');
  console.log('   GET  /areas - Listar áreas (ONG)');
  console.log('   POST /areas - Criar área (ONG) - Enviada para aprovação');
  console.log('   GET  /notificacoes - Listar notificações (ONG)');
  console.log('   PUT  /notificacoes/:id/lida - Marcar notificação como lida (Admin/ONG)');
  console.log('   POST /upload - Upload de imagens');
  console.log('   GET  /admin/usuarios - Listar usuários (Admin)');
  console.log('   GET  /admin/areas/pendentes - Áreas pendentes (Admin)');
  console.log('   PUT  /admin/areas/:id/aprovar - Aprovar área (Admin)');
  console.log('   PUT  /admin/areas/:id/rejeitar - Rejeitar área (Admin)');
  console.log('   GET  /admin/areas - Todas as áreas (Admin)');
  console.log('   DELETE /admin/areas/:id - Excluir área (Admin)');
  console.log('   DELETE /areas/:id - Excluir própria área (ONG)');
  console.log('   DELETE /auth/conta - Excluir própria conta');
  console.log('   POST /denuncias - Criar denúncia de marcador');
  console.log('   GET  /denuncias - Listar denúncias (Admin/ONG)');
  console.log('   PUT  /denuncias/:id/aceitar - Aceitar denúncia (Admin/ONG)');
  console.log('   PUT  /denuncias/:id/rejeitar - Rejeitar denúncia (Admin/ONG)');
});

module.exports = app;
