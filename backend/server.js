const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const ValidadorDocumento = require('./validador-documento');
const db = require('./database');
const app = express();
app.use(cors());
app.use(express.json());
const multer = require('multer');
const path = require('path');
// GET /notificacoes - retorna todas as notificações das ONGs
// GET /notificacoes - retorna notificações das ONGs, pode filtrar por ong_id
app.get('/notificacoes', async (req, res) => {
    try {
        const ongId = req.query.ong_id;
        let notificacoes;
        if (ongId) {
            notificacoes = await db.executarQuery('SELECT * FROM notificacoes_ong WHERE ong_id = ?', [ongId]);
        } else {
            notificacoes = await db.executarQuery('SELECT * FROM notificacoes_ong');
        }
        res.json(notificacoes);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar notificações', details: error.message });
    }
});

// PUT /admin/areas/:areaId/aprovar - aprova uma área
app.put('/admin/areas/:areaId/aprovar', async (req, res) => {
    const { areaId } = req.params;
    try {
        const result = await db.executarUpdate(
            "UPDATE areas_responsabilidade SET status = 'aprovada', data_aprovacao = NOW() WHERE id = ?",
            [areaId]
        );
        if (result.affectedRows > 0) {
            res.json({ success: true, id: areaId });
        } else {
            res.status(404).json({ error: 'Área não encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro ao aprovar área', details: error.message });
    }
});

// GET /admin/areas/pendentes - retorna áreas pendentes de aprovação
app.get('/admin/areas/pendentes', async (req, res) => {
    try {
        const areas = await db.executarQuery("SELECT * FROM areas_responsabilidade WHERE status = 'pendente'");
        res.json(areas);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar áreas pendentes', details: error.message });
    }
});

// GET /admin/areas - retorna todas as áreas para o painel admin
app.get('/admin/areas', async (req, res) => {
    try {
        const areas = await db.executarQuery('SELECT * FROM areas_responsabilidade');
        res.json(areas);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar todas as áreas', details: error.message });
    }
});

// GET /areas - retorna todas as áreas cadastradas
app.get('/areas', async (req, res) => {
    try {
        // No futuro: filtrar por ong_id do usuário autenticado
        const areas = await db.executarQuery('SELECT * FROM areas_responsabilidade');
        res.json(areas);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar áreas', details: error.message });
    }
});

// POST /areas - criar nova área de responsabilidade
app.post('/areas', async (req, res) => {
    try {
        const { ong_id, nome, descricao, coordenadas, status } = req.body;
        if (!ong_id || !nome || !coordenadas) {
            return res.status(400).json({ error: 'Campos obrigatórios: ong_id, nome, coordenadas' });
        }
        // status padrão: pendente, a não ser que seja explicitamente aprovado
        const statusArea = status || 'pendente';
        const sql = `INSERT INTO areas_responsabilidade (ong_id, nome, descricao, coordenadas, status, criada_em) VALUES (?, ?, ?, ?, ?, NOW())`;
        const params = [ong_id, nome, descricao || null, JSON.stringify(coordenadas), statusArea];
        const id = await db.inserir(sql, params);
        res.status(201).json({ success: true, id });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar área', details: error.message });
    }
});

// DELETE /lugares/:id - deletar marcador
app.delete('/lugares/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Verifica se o marcador existe
        const marcador = await db.buscarUm('SELECT * FROM lugares WHERE id = ?', [id]);
        if (!marcador) {
            return res.status(404).json({ error: 'Marcador não encontrado' });
        }
        // Deleta o marcador
        await db.executarUpdate('DELETE FROM lugares WHERE id = ?', [id]);
        res.json({ success: true, id });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar marcador', details: error.message });
    }
});

// Configuração do multer para salvar arquivos na pasta uploads/
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'images-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage });

// Rota para upload de imagens
app.post('/upload', upload.array('images', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Nenhuma imagem enviada' });
        }
        // Retorna os caminhos relativos das imagens salvas
        const files = req.files.map(file => ({
            filename: file.filename,
            path: '/uploads/' + file.filename
        }));
    res.status(201).json({ success: true, images: files });
    } catch (error) {
    // Erro no upload de imagens
        res.status(500).json({ error: 'Erro ao enviar imagens', details: error.message });
    }
});


// POST /lugares - cria um novo marcador
app.post('/lugares', async (req, res) => {
    try {
        const { nome, descricao, tipo, latitude, longitude, imagem } = req.body;
        if (!nome || !tipo || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ error: 'Campos obrigatórios: nome, tipo, latitude, longitude' });
        }


        // Garantir que imagem seja array de strings (caminhos)
        let imagensArray = null;
        if (Array.isArray(imagem)) {
            // Se for array de objetos, extrair o campo 'path', senão usar como está
            imagensArray = imagem.map(img => typeof img === 'object' && img.path ? img.path : img).filter(Boolean);
        } else if (typeof imagem === 'string') {
            imagensArray = [imagem];
        }
        let imagemStr = imagensArray && imagensArray.length > 0 ? JSON.stringify(imagensArray) : null;

        // Inserir marcador (apenas campos existentes na tabela)
        const sql = `INSERT INTO lugares (nome, descricao, tipo, latitude, longitude, imagem, criado_em)
                     VALUES (?, ?, ?, ?, ?, ?, NOW())`;
        const params = [nome, descricao || null, tipo, latitude, longitude, imagemStr];
        const id = await db.inserir(sql, params);

        res.status(201).json({ success: true, id });
    } catch (error) {
    // Erro ao criar marcador
        res.status(500).json({ error: 'Erro ao criar lugar', details: error.message });
    }
});

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static('uploads'));
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Log middleware
app.use((req, res, next) => {
    // Log middleware removido
    next();
});

// ================= ROTAS PÚBLICAS DE MARCADORES E ÁREAS =================

// GET /lugares - retorna todos os marcadores
app.get('/lugares', async (req, res) => {
    try {
        const lugares = await db.executarQuery('SELECT * FROM lugares');
    // Log removido

        // Garante que latitude/longitude sejam números
        const adaptados = lugares.map(lugar => ({
            ...lugar,
            latitude: lugar.latitude !== undefined && lugar.latitude !== null ? Number(lugar.latitude) : null,
            longitude: lugar.longitude !== undefined && lugar.longitude !== null ? Number(lugar.longitude) : null
        }));

    // Log removido
        res.json(adaptados);
    } catch (error) {
    // Erro ao buscar lugares
        res.status(500).json({ error: 'Erro ao buscar lugares', details: error.message });
    }
});

// GET /areas/publicas - retorna todas as áreas aprovadas

// PUT /lugares/:id/resolver - atualiza status de resolvido de um marcador
app.put('/lugares/:id/resolver', async (req, res) => {
    const { id } = req.params;
    const { resolvido } = req.body;
    try {
        const result = await db.executarUpdate(
            'UPDATE lugares SET resolvido = ? WHERE id = ?',
            [resolvido ? 1 : 0, id]
        );
        if (result.affectedRows > 0) {
            res.json({ success: true, id, resolvido: !!resolvido });
        } else {
            res.status(404).json({ error: 'Marcador não encontrado' });
        }
    } catch (error) {
    // Erro ao atualizar marcador
        res.status(500).json({ error: 'Erro ao atualizar marcador', details: error.message });
    }
});
app.get('/areas/publicas', async (req, res) => {
    try {
        const areas = await db.executarQuery("SELECT * FROM areas_responsabilidade WHERE status = 'aprovada'");
        res.json(areas);
    } catch (error) {
    // Erro ao buscar áreas públicas
        res.status(500).json({ error: 'Erro ao buscar áreas públicas', details: error.message });
    }
});

// Rota de teste
app.get('/test', (req, res) => {
    // Log removido
    res.json({ 
        message: 'Servidor funcionando!', 
        timestamp: new Date().toISOString() 
    });
});

// Rota de validação
app.post('/validar-documento', (req, res) => {
    // Log removido
    
    try {
        const { documento, tipo } = req.body;
        
        if (!documento) {
            // Log removido
            return res.status(400).json({ error: 'Documento é obrigatório' });
        }
        
    // Log removido
        
        const resultado = ValidadorDocumento.validarDocumento(documento, tipo);
    // Log removido
        
        res.json(resultado);
        
    } catch (error) {
    // Erro na validação
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
});

// =============================================================================
// ROTAS DE AUTENTICAÇÃO
// =============================================================================

// Rota de registro
app.post('/auth/registro', async (req, res) => {
    // Log removido
    
    try {
        const { nome, email, senha, tipo, documento } = req.body;
        
        // Validação básica dos campos obrigatórios
        if (!nome || !email || !senha || !tipo || !documento) {
            // Log removido
            return res.status(400).json({ 
                error: 'Todos os campos são obrigatórios',
                campos: { nome, email, senha: '***', tipo, documento }
            });
        }
        
        // Validar tipo de usuário
        if (!['usuario', 'ong'].includes(tipo)) {
            // Log removido
            return res.status(400).json({ 
                error: 'Tipo deve ser "usuario" ou "ong"' 
            });
        }
        
        // Validar documento baseado no tipo
        const documentoLimpo = documento.replace(/[^\d]/g, '');
        const tipoDocumentoEsperado = tipo === 'usuario' ? 'cpf' : 'cnpj';
        const validacao = ValidadorDocumento.validarDocumento(documentoLimpo);
        
        if (!validacao.valido || validacao.tipo !== tipoDocumentoEsperado) {
            // Log removido
            return res.status(400).json({ 
                error: `${tipoDocumentoEsperado.toUpperCase()} inválido para ${tipo}`,
                validacao 
            });
        }
        
        // Verificar se email já existe
        const emailExistente = await db.buscarUm(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );
        
        if (emailExistente) {
        // Log removido
            return res.status(400).json({ 
                error: 'Email já está cadastrado' 
            });
        }
        
        // Verificar se documento já existe
        const documentoExistente = await db.buscarUm(
            'SELECT id FROM usuarios WHERE documento = ?',
            [validacao.documentoLimpo]
        );
        
        if (documentoExistente) {
        // Log removido
            return res.status(400).json({ 
                error: 'Documento já está cadastrado' 
            });
        }
        
    // Log removido
        
        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 10);
        
        // Inserir usuário no banco de dados
        const userId = await db.inserir(
            `INSERT INTO usuarios (nome, email, senha, tipo, documento, criado_em) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [nome, email, senhaHash, tipo, validacao.documentoLimpo]
        );
        
        // Buscar usuário recém-criado
        const novoUsuario = await db.buscarUm(
            'SELECT id, nome, email, tipo, documento, criado_em FROM usuarios WHERE id = ?',
            [userId]
        );
        
    // Log removido
        
        res.status(201).json({
            success: true,
            message: 'Usuário registrado com sucesso!',
            usuario: {
                id: novoUsuario.id,
                nome: novoUsuario.nome,
                email: novoUsuario.email,
                tipo: novoUsuario.tipo,
                documento: validacao.documentoFormatado
            }
        });
        
    } catch (error) {
    // Erro no registro
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
});

// Rota de login
app.post('/auth/login', async (req, res) => {
    // Log removido
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            // Log removido
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }
    // Log removido

        // Buscar usuário real no banco de dados
        const usuario = await db.buscarUm(
            'SELECT id, nome, email, tipo, senha FROM usuarios WHERE email = ?',
            [email]
        );
        if (!usuario) {
            // Log removido
            return res.status(401).json({ error: 'Usuário ou senha inválidos' });
        }

        // Verificar senha usando bcrypt
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            // Log removido
            return res.status(401).json({ error: 'Usuário ou senha inválidos' });
        }

        // Montar objeto de retorno sem a senha
        const usuarioRetorno = {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            tipo: usuario.tipo
        };
    // Log removido
        res.json({
            success: true,
            message: 'Login realizado com sucesso!',
            usuario: usuarioRetorno,
            token: 'token_simulado_' + Date.now()
        });
    } catch (error) {
    // Erro no login
        res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    }
});

// POST /denuncias - registrar denúncia de marcador
app.post('/denuncias', async (req, res) => {
    try {
        const { marcador_id, motivo, descricao, denunciante_id } = req.body;
        if (!marcador_id || !motivo || !denunciante_id) {
            return res.status(400).json({ error: 'Campos obrigatórios: marcador_id, motivo, denunciante_id' });
        }

        // Buscar autor do marcador
        const marcador = await db.buscarUm('SELECT * FROM lugares WHERE id = ?', [marcador_id]);
        if (!marcador) {
            return res.status(404).json({ error: 'Marcador não encontrado' });
        }

        // Buscar ONG responsável (opcional)
        let ong_responsavel_id = null;
        if (marcador.area_ong_id) {
            ong_responsavel_id = marcador.area_ong_id;
        }

        // Buscar autor do marcador (usuário que criou)
        const autor_marcador_id = marcador.usuario_id || 1; // fallback para admin/teste

        const sql = `INSERT INTO denuncias (marcador_id, denunciante_id, autor_marcador_id, ong_responsavel_id, motivo, descricao) VALUES (?, ?, ?, ?, ?, ?)`;
        const params = [marcador_id, denunciante_id, autor_marcador_id, ong_responsavel_id, motivo, descricao || null];
        const result = await db.inserir(sql, params);
        res.json({ success: true, denuncia_id: result });
    } catch (error) {
    // Erro ao registrar denúncia
        res.status(500).json({ error: 'Erro ao registrar denúncia', details: error.message });
    }
});

app.listen(PORT, async () => {
    // Logs de inicialização removidos
    const conexaoOk = await db.testarConexao();
    // Log removido
});

module.exports = app;
