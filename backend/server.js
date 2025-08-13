const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const ValidadorDocumento = require('./validador-documento');
const db = require('./database');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Log middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Body:', req.body);
    next();
});

// Rota de teste
app.get('/test', (req, res) => {
    console.log('✅ GET /test executado');
    res.json({ 
        message: 'Servidor funcionando!', 
        timestamp: new Date().toISOString() 
    });
});

// Rota de validação
app.post('/validar-documento', (req, res) => {
    console.log('✅ POST /validar-documento executado');
    
    try {
        const { documento, tipo } = req.body;
        
        if (!documento) {
            console.log('❌ Documento não fornecido');
            return res.status(400).json({ error: 'Documento é obrigatório' });
        }
        
        console.log('📄 Validando documento:', documento, 'tipo:', tipo);
        
        const resultado = ValidadorDocumento.validarDocumento(documento, tipo);
        console.log('✅ Resultado:', resultado);
        
        res.json(resultado);
        
    } catch (error) {
        console.error('❌ Erro na validação:', error.message);
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
    console.log('✅ POST /auth/registro executado');
    
    try {
        const { nome, email, senha, tipo, documento } = req.body;
        
        // Validação básica dos campos obrigatórios
        if (!nome || !email || !senha || !tipo || !documento) {
            console.log('❌ Campos obrigatórios faltando');
            return res.status(400).json({ 
                error: 'Todos os campos são obrigatórios',
                campos: { nome, email, senha: '***', tipo, documento }
            });
        }
        
        // Validar tipo de usuário
        if (!['usuario', 'ong'].includes(tipo)) {
            console.log('❌ Tipo de usuário inválido:', tipo);
            return res.status(400).json({ 
                error: 'Tipo deve ser "usuario" ou "ong"' 
            });
        }
        
        // Validar documento baseado no tipo
        const documentoLimpo = documento.replace(/[^\d]/g, '');
        const tipoDocumentoEsperado = tipo === 'usuario' ? 'cpf' : 'cnpj';
        const validacao = ValidadorDocumento.validarDocumento(documentoLimpo);
        
        if (!validacao.valido || validacao.tipo !== tipoDocumentoEsperado) {
            console.log('❌ Documento inválido para o tipo:', tipo, validacao);
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
            console.log('❌ Email já cadastrado:', email);
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
            console.log('❌ Documento já cadastrado:', validacao.documentoLimpo);
            return res.status(400).json({ 
                error: 'Documento já está cadastrado' 
            });
        }
        
        console.log('📝 Dados do registro válidos:', { nome, email, tipo, documento: validacao.documentoFormatado });
        
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
        
        console.log('✅ Usuário salvo no banco com sucesso:', {
            id: novoUsuario.id,
            nome: novoUsuario.nome,
            email: novoUsuario.email,
            tipo: novoUsuario.tipo,
            documento: validacao.documentoFormatado
        });
        
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
        console.error('❌ Erro no registro:', error.message);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
});

// Rota de login
app.post('/auth/login', (req, res) => {
    console.log('✅ POST /auth/login executado');
    
    try {
        const { email, senha } = req.body;
        
        if (!email || !senha) {
            console.log('❌ Email ou senha faltando');
            return res.status(400).json({ 
                error: 'Email e senha são obrigatórios' 
            });
        }
        
        console.log('🔐 Tentativa de login:', email);
        
        // Por enquanto, simular login bem-sucedido
        // TODO: Implementar verificação no banco de dados
        const usuario = {
            id: 1,
            nome: 'Usuário Teste',
            email: email,
            tipo: 'usuario'
        };
        
        console.log('✅ Login realizado com sucesso:', usuario);
        
        res.json({
            success: true,
            message: 'Login realizado com sucesso!',
            usuario: usuario,
            token: 'token_simulado_' + Date.now()
        });
        
    } catch (error) {
        console.error('❌ Erro no login:', error.message);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
});

app.listen(PORT, async () => {
    console.log(`🚀 Servidor MapCity rodando na porta ${PORT}`);
    console.log(`📝 Rotas disponíveis:`);
    console.log(`   GET  http://localhost:${PORT}/test`);
    console.log(`   POST http://localhost:${PORT}/validar-documento`);
    console.log(`   POST http://localhost:${PORT}/auth/registro`);
    console.log(`   POST http://localhost:${PORT}/auth/login`);
    
    // Testar conexão com banco de dados
    console.log('\n🔍 Testando conexão com banco de dados...');
    const conexaoOk = await db.testarConexao();
    if (conexaoOk) {
        console.log('✅ Banco de dados conectado e pronto!');
    } else {
        console.log('⚠️ Problemas na conexão com banco - verifique configurações');
    }
});

module.exports = app;
