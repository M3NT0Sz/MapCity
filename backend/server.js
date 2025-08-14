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
// PUT /admin/areas/:areaId/rejeitar - rejeita uma área
app.put('/admin/areas/:areaId/rejeitar', async (req, res) => {
    const { areaId } = req.params;
    const { motivo_rejeicao } = req.body;
    try {
        // Atualiza status da área para rejeitada
        const result = await db.executarUpdate(
            "UPDATE areas_responsabilidade SET status = 'rejeitada', motivo_rejeicao = ?, data_aprovacao = NOW() WHERE id = ?",
            [motivo_rejeicao || null, areaId]
        );
        if (result.affectedRows > 0) {
            // Buscar a área para pegar o ong_id
            const area = await db.buscarUm('SELECT * FROM areas_responsabilidade WHERE id = ?', [areaId]);
            if (area && area.ong_id) {
                // Criar notificação para ONG (tipo 'marcador_removido' e lugar_id = NULL)
                await db.inserir(
                    'INSERT INTO notificacoes_ong (ong_id, area_id, lugar_id, tipo, titulo, mensagem, criada_em, lida) VALUES (?, ?, NULL, ?, ?, ?, NOW(), 0)',
                    [
                        area.ong_id,
                        area.id,
                        'marcador_removido', // ou outro tipo permitido pelo ENUM
                        'Área rejeitada',
                        `Sua área "${area.nome}" foi rejeitada pelo administrador.${motivo_rejeicao ? ' Motivo: ' + motivo_rejeicao : ''}`
                    ]
                );
            }
            res.json({ success: true, id: areaId });
        } else {
            res.status(404).json({ error: 'Área não encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro ao rejeitar área', details: error.message });
    }
});

// Middleware para autenticação de ONG ou admin (token_simulado_ID)
async function autenticarONGouAdmin(req, res, next) {
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer token_simulado_')) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    // Extrai o ID do token simulado: token_simulado_123456789
    const token = auth.replace('Bearer ', '').trim();
    const partes = token.split('_');
    const usuarioId = Number(partes[2]);
    if (!usuarioId) {
        return res.status(401).json({ error: 'Token inválido' });
    }
    req.usuarioId = usuarioId;
    try {
        const usuario = await db.buscarUm('SELECT * FROM usuarios WHERE id = ?', [usuarioId]);
        req.isAdmin = usuario && usuario.tipo === 'admin';
    } catch (e) {
        req.isAdmin = false;
    }
    next();
}

// DELETE /areas/:id - excluir área de responsabilidade (ONG ou admin)
app.delete('/areas/:id', autenticarONGouAdmin, async (req, res) => {
    console.log('[DELETE /areas/:id] chamada recebida', {
        params: req.params,
        headers: req.headers
    });
    const { id } = req.params;
    try {
        // Verifica se a área existe
        const area = await db.buscarUm('SELECT * FROM areas_responsabilidade WHERE id = ?', [id]);
        if (!area) {
            console.error(`[EXCLUIR ÁREA] Área não encontrada. ID: ${id}`);
            return res.status(404).json({ error: 'Área não encontrada' });
        }
        // Se não for admin, verifica se a área pertence à ONG autenticada
        if (!req.isAdmin && area.ong_id != req.usuarioId) {
            console.error(`[EXCLUIR ÁREA] ONG não autorizada. ONG da área: ${area.ong_id}, Usuário autenticado: ${req.usuarioId}`);
            return res.status(403).json({ error: 'Você só pode excluir áreas da sua própria ONG.' });
        }
        // Log detalhado para depuração
        console.log(`[EXCLUIR ÁREA] Tentando excluir área:`, area);
        // Permitir exclusão apenas se status for pendente, aprovada ou rejeitada
        if (area.status !== 'pendente' && area.status !== 'aprovada' && area.status !== 'rejeitada') {
            console.error(`[EXCLUIR ÁREA] Status inválido para exclusão. Status: ${area.status}, ID: ${id}`);
            return res.status(400).json({ error: 'Só é possível excluir áreas pendentes, aprovadas ou rejeitadas.' });
        }
        // Não criar notificação aqui! Apenas excluir.
        await db.executarUpdate('DELETE FROM areas_responsabilidade WHERE id = ?', [id]);
        console.log(`[EXCLUIR ÁREA] Área excluída com sucesso. ID: ${id}`);
        res.json({ success: true, id });
    } catch (error) {
        console.error(`[EXCLUIR ÁREA] Erro ao excluir área. ID: ${id}`, error);
        res.status(500).json({ error: 'Erro ao excluir área', details: error.message });
    }
});

// PUT /denuncias/:id/aceitar - aceita uma denúncia
app.put('/denuncias/:id/aceitar', async (req, res) => {
    const { id } = req.params;
    const { observacoes } = req.body;
    try {
        // Atualiza status da denúncia
        const result = await db.executarUpdate(
            "UPDATE denuncias SET status = 'aceita', observacoes = ? , processado_em = NOW() WHERE id = ?",
            [observacoes || null, id]
        );
        if (result.affectedRows > 0) {
            // Buscar denúncia para pegar o marcador_id
            const denuncia = await db.buscarUm('SELECT marcador_id FROM denuncias WHERE id = ?', [id]);
            if (denuncia && denuncia.marcador_id) {
                // Deletar o marcador denunciado
                await db.executarUpdate('DELETE FROM lugares WHERE id = ?', [denuncia.marcador_id]);
            }
            res.json({ success: true, id });
        } else {
            res.status(404).json({ error: 'Denúncia não encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro ao aceitar denúncia', details: error.message });
    }
});

// PUT /denuncias/:id/rejeitar - rejeita uma denúncia
app.put('/denuncias/:id/rejeitar', async (req, res) => {
    const { id } = req.params;
    const { observacoes } = req.body;
    try {
        const result = await db.executarUpdate(
            "UPDATE denuncias SET status = 'rejeitada', observacoes = ? , processado_em = NOW() WHERE id = ?",
            [observacoes || null, id]
        );
        if (result.affectedRows > 0) {
            res.json({ success: true, id });
        } else {
            res.status(404).json({ error: 'Denúncia não encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro ao rejeitar denúncia', details: error.message });
    }
});

// GET /denuncias - listar denúncias (admin/ong)
app.get('/denuncias', async (req, res) => {
    try {
        // Para ONGs, filtrar por ong_responsavel_id se usuário for ONG
        let denuncias;
        if (req.query.ong_id) {
            denuncias = await db.executarQuery('SELECT * FROM denuncias WHERE ong_responsavel_id = ?', [req.query.ong_id]);
        } else {
            denuncias = await db.executarQuery('SELECT * FROM denuncias');
        }
        res.json(denuncias);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar denúncias', details: error.message });
    }
});

// PUT /notificacoes/:id/lida - marcar notificação como lida
app.put('/notificacoes/:id/lida', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.executarUpdate('UPDATE notificacoes_ong SET lida = 1 WHERE id = ?', [id]);
        if (result.affectedRows > 0) {
            res.json({ success: true, id });
        } else {
            res.status(404).json({ error: 'Notificação não encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro ao marcar notificação como lida', details: error.message });
    }
});

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
        // Converter criada_em para ISO string, mesmo se vier como string
        notificacoes = notificacoes.map(n => {
            let criadaEmISO = n.criada_em;
            if (n.criada_em) {
                const d = new Date(n.criada_em);
                criadaEmISO = isNaN(d.getTime()) ? n.criada_em : d.toISOString();
            }
            return {
                ...n,
                criada_em: criadaEmISO
            };
        });
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
        // Busca áreas pendentes e faz JOIN para pegar nome da ONG responsável
        const sql = `
            SELECT 
                a.id, a.nome, a.descricao, a.coordenadas, a.ativa, a.status, a.criada_em, a.atualizada_em, 
                a.data_aprovacao, a.motivo_rejeicao, 
                u.nome AS ong_nome, u.email AS ong_email
            FROM areas_responsabilidade a
            JOIN usuarios u ON a.ong_id = u.id
            WHERE a.status = 'pendente'
        `;
        const areas = await db.executarQuery(sql);
        res.json(areas);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar áreas pendentes', details: error.message });
    }
});

// GET /admin/areas - retorna todas as áreas para o painel admin
app.get('/admin/areas', async (req, res) => {
    try {
        const areas = await db.executarQuery('SELECT * FROM areas_responsabilidade');
        res.json({ areas });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar todas as áreas', details: error.message });
    }
});

// GET /areas - retorna todas as áreas cadastradas
app.get('/areas', async (req, res) => {
    try {
        let areas;
        if (req.query.ong_id) {
            areas = await db.executarQuery('SELECT * FROM areas_responsabilidade WHERE ong_id = ?', [req.query.ong_id]);
        } else {
            areas = await db.executarQuery('SELECT * FROM areas_responsabilidade');
        }
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
        // Remover imagens associadas
        if (marcador.imagem) {
            let imagens = [];
            try {
                imagens = JSON.parse(marcador.imagem);
            } catch (e) {
                if (typeof marcador.imagem === 'string') imagens = [marcador.imagem];
            }
            const fs = require('fs');
            imagens.forEach(imgPath => {
                if (typeof imgPath === 'string' && imgPath.startsWith('/uploads/')) {
                    const absPath = path.join(__dirname, imgPath);
                    fs.unlink(absPath, err => {
                        if (err) console.error('Erro ao remover imagem:', absPath, err.message);
                    });
                }
            });
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
            imagensArray = imagem.map(img => typeof img === 'object' && img.path ? img.path : img).filter(Boolean);
        } else if (typeof imagem === 'string') {
            imagensArray = [imagem];
        }
        let imagemStr = imagensArray && imagensArray.length > 0 ? JSON.stringify(imagensArray) : null;

        // Inserir marcador
        const sql = `INSERT INTO lugares (nome, descricao, tipo, latitude, longitude, imagem, criado_em)
                     VALUES (?, ?, ?, ?, ?, ?, NOW())`;
        const params = [nome, descricao || null, tipo, latitude, longitude, imagemStr];
        const id = await db.inserir(sql, params);


        // Buscar áreas aprovadas com JOIN para pegar nome da ONG
        const areas = await db.executarQuery(`
            SELECT a.*, u.nome AS ong_nome
            FROM areas_responsabilidade a
            JOIN usuarios u ON a.ong_id = u.id
            WHERE a.status = 'aprovada'
        `);
        let areaEncontrada = null;
        for (const area of areas) {
            try {
                const coords = JSON.parse(area.coordenadas);
                if (Array.isArray(coords) && coords.length >= 3) {
                    // Função de ponto no polígono
                    const pontoNoPoligono = (lat, lng, poligono) => {
                        let dentro = false;
                        for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
                            const xi = parseFloat(poligono[i].lat), yi = parseFloat(poligono[i].lng);
                            const xj = parseFloat(poligono[j].lat), yj = parseFloat(poligono[j].lng);
                            const intersect = ((yi > lng) !== (yj > lng)) &&
                                (lat < (xj - xi) * (lng - yi) / (yj - yi + 0.0000001) + xi);
                            if (intersect) dentro = !dentro;
                        }
                        return dentro;
                    };
                    if (pontoNoPoligono(Number(latitude), Number(longitude), coords)) {
                        areaEncontrada = area;
                        break;
                    }
                }
            } catch (e) { /* ignora erro de parse */ }
        }

        if (areaEncontrada) {
            // Log temporário para depuração
            console.log('[NOTIFICAÇÃO] Tentando inserir notificação:', {
                ong_id: areaEncontrada.ong_id,
                area_id: areaEncontrada.id,
                lugar_id: id,
                tipo: 'novo_marcador',
                titulo: 'Novo marcador na sua área',
                mensagem: `Um novo marcador foi criado dentro da área "${areaEncontrada.nome}".`,
                ong_nome: areaEncontrada.ong_nome
            });
            try {
                await db.inserir(
                    `INSERT INTO notificacoes_ong (ong_id, area_id, lugar_id, tipo, titulo, mensagem) VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        areaEncontrada.ong_id,
                        areaEncontrada.id,
                        id,
                        'novo_marcador',
                        'Novo marcador na sua área',
                        `Um novo marcador foi criado dentro da área "${areaEncontrada.nome}".`
                    ]
                );
            } catch (notErr) {
                console.error('[NOTIFICAÇÃO] Erro ao inserir notificação:', notErr.message);
                res.status(500).json({ error: 'Erro ao criar notificação', details: notErr.message });
                return;
            }
        }

        res.status(201).json({ success: true, id });
    } catch (error) {
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
        const areas = await db.executarQuery(`
            SELECT a.*, u.nome AS ong_nome, u.email AS ong_email
            FROM areas_responsabilidade a
            JOIN usuarios u ON a.ong_id = u.id
            WHERE a.status = 'aprovada'
        `);
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

        // Gerar token simulado igual ao login
        const usuarioRetorno = {
            id: novoUsuario.id,
            nome: novoUsuario.nome,
            email: novoUsuario.email,
            tipo: novoUsuario.tipo
        };
        res.status(201).json({
            success: true,
            message: 'Usuário registrado com sucesso!',
            usuario: usuarioRetorno,
            token: 'token_simulado_' + novoUsuario.id
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
            token: 'token_simulado_' + usuario.id
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
