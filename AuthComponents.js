import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';

// Contexto de autenticação
export const AuthContext = React.createContext();

// Provider de autenticação
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Verificar token salvo ao inicializar
  useEffect(() => {
    const tokenSalvo = localStorage.getItem('mapcity_token');
    if (tokenSalvo) {
      verificarToken(tokenSalvo);
    } else {
      setCarregando(false);
    }
  }, []);

  const verificarToken = async (tokenParaVerificar) => {
    try {
      const response = await fetch('http://localhost:3001/auth/verificar', {
        headers: {
          'Authorization': `Bearer ${tokenParaVerificar}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setToken(tokenParaVerificar);
        setUsuario(data.usuario);
      } else {
        localStorage.removeItem('mapcity_token');
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      localStorage.removeItem('mapcity_token');
    } finally {
      setCarregando(false);
    }
  };

  const login = async (email, senha) => {
    try {
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (response.ok) {
        setToken(data.token);
        setUsuario(data.usuario);
        localStorage.setItem('mapcity_token', data.token);
        return { sucesso: true, usuario: data.usuario };
      } else {
        return { sucesso: false, erro: data.error };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return { sucesso: false, erro: 'Erro de conexão' };
    }
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem('mapcity_token');
  };

  const value = {
    usuario,
    token,
    carregando,
    login,
    logout,
    estaLogado: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar o contexto de autenticação
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}

// Componente de Login
export function LoginModal({ visible, onClose, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setCarregando(true);
    const resultado = await login(email, senha);
    setCarregando(false);

    if (resultado.sucesso) {
      Alert.alert('Sucesso', `Bem-vindo, ${resultado.usuario.nome}!`);
      setEmail('');
      setSenha('');
      onClose();
    } else {
      Alert.alert('Erro', resultado.erro);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.loginContainer}>
          <Text style={styles.loginTitle}>Login - MapCity</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />
          
          <TouchableOpacity 
            style={[styles.button, carregando && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={carregando}
          >
            <Text style={styles.buttonText}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkButton} 
            onPress={onSwitchToRegister}
          >
            <Text style={styles.linkButtonText}>
              Não tem conta? Cadastre-se aqui
            </Text>
          </TouchableOpacity>

          <View style={styles.testCredentials}>
            <Text style={styles.testTitle}>Credenciais de Teste:</Text>
            <Text style={styles.testText}>👤 Usuário: usuario@teste.com</Text>
            <Text style={styles.testText}>🏢 ONG: gestor@ecoverde.org</Text>
            <Text style={styles.testText}>👑 Admin: admin@mapcity.com</Text>
            <Text style={styles.testText}>🔑 Senha: 123456</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Componente de Registro
export function RegisterModal({ visible, onClose, onSwitchToLogin }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [tipo, setTipo] = useState('usuario');
  const [documento, setDocumento] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [documentoValido, setDocumentoValido] = useState(null);

  // Função para validar documento em tempo real
  const validarDocumentoReal = async (doc) => {
    if (!doc || doc.length < 11) {
      setDocumentoValido(null);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/validar-documento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documento: doc }),
      });

      const result = await response.json();
      setDocumentoValido(result);
    } catch (error) {
      console.error('Erro ao validar documento:', error);
      setDocumentoValido({ valido: false, erro: 'Erro na validação' });
    }
  };

  // Formatar documento enquanto digita
  const formatarDocumento = (value) => {
    const apenasNumeros = value.replace(/[^\d]/g, '');
    
    if (apenasNumeros.length <= 11) {
      // Formato CPF: 000.000.000-00
      return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      // Formato CNPJ: 00.000.000/0000-00
      return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  const handleDocumentoChange = (value) => {
    const formatted = formatarDocumento(value);
    setDocumento(formatted);
    
    // Validar quando tiver tamanho suficiente
    const apenasNumeros = value.replace(/[^\d]/g, '');
    if (apenasNumeros.length === 11 || apenasNumeros.length === 14) {
      validarDocumentoReal(value);
    } else {
      setDocumentoValido(null);
    }
  };

  const handleRegister = async () => {
    if (!nome || !email || !senha || !confirmarSenha) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    // Validações específicas por tipo
    if (tipo === 'ong') {
      if (!documento) {
        Alert.alert('Erro', 'CNPJ é obrigatório para ONGs');
        return;
      }

      if (!documentoValido || !documentoValido.valido) {
        Alert.alert('Erro', documentoValido?.erro || 'CNPJ inválido');
        return;
      }

      if (documentoValido.tipo !== 'cnpj') {
        Alert.alert('Erro', 'ONGs devem usar CNPJ, não CPF');
        return;
      }

      if (!razaoSocial) {
        Alert.alert('Erro', 'Razão social é obrigatória para ONGs');
        return;
      }
    } else if (tipo === 'usuario') {
      if (!documento) {
        Alert.alert('Erro', 'CPF é obrigatório para usuários');
        return;
      }

      if (!documentoValido || !documentoValido.valido) {
        Alert.alert('Erro', documentoValido?.erro || 'CPF inválido');
        return;
      }

      if (documentoValido.tipo !== 'cpf') {
        Alert.alert('Erro', 'Usuários devem usar CPF, não CNPJ');
        return;
      }
    }

    setCarregando(true);

    try {
      const dadosRegistro = {
        nome,
        email,
        senha,
        tipo,
        documento // Enviar documento para todos os tipos
      };

      // Adicionar campos específicos para ONG
      if (tipo === 'ong') {
        if (razaoSocial) {
          dadosRegistro.razaoSocial = razaoSocial;
        }
      }

      const response = await fetch('http://localhost:3001/auth/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosRegistro),
      });

      const data = await response.json();

      if (response.ok) {
        let mensagem = 'Cadastro realizado com sucesso!';
        
        if (data.requer_verificacao) {
          mensagem += '\n\nSua ONG foi cadastrada e está aguardando verificação do documento pelos administradores. Você poderá fazer login após a aprovação.';
        } else {
          mensagem += ' Você pode fazer login agora.';
        }

        Alert.alert(
          'Sucesso',
          mensagem,
          [
            {
              text: 'OK',
              onPress: () => {
                // Limpar campos
                setNome('');
                setEmail('');
                setSenha('');
                setConfirmarSenha('');
                setTipo('usuario');
                setDocumento('');
                setRazaoSocial('');
                setDocumentoValido(null);
                // Fechar modal de registro e abrir login
                onClose();
                onSwitchToLogin();
              }
            }
          ]
        );
      } else {
        // Mensagens de erro mais específicas
        let mensagemErro = data.error || 'Erro ao criar conta';
        
        if (data.error === 'Email já cadastrado') {
          mensagemErro = 'Este email já está em uso. Tente fazer login ou use outro email.';
        } else if (data.error && (data.error.includes('CPF já está cadastrado') || data.error.includes('CNPJ já está cadastrado'))) {
          mensagemErro = 'Este documento já está cadastrado. Verifique os dados ou entre em contato com o administrador.';
        } else if (data.error && data.error.includes('Tabela')) {
          mensagemErro = 'Erro de configuração do banco de dados. Contate o administrador.';
        }
        
        Alert.alert('Erro no Cadastro', mensagemErro);
        console.error('Erro detalhado:', data);
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      Alert.alert('Erro', 'Erro de conexão. Verifique se o servidor está rodando.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.loginContainer}>
          <Text style={styles.loginTitle}>Criar Conta - MapCity</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Senha (mínimo 6 caracteres)"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />
          
          <TextInput
            style={styles.input}
            placeholder="Confirmar senha"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry
          />

          <View style={styles.tipoContainer}>
            <Text style={styles.tipoLabel}>Tipo de conta:</Text>
            <View style={styles.tipoOptions}>
              <TouchableOpacity 
                style={[styles.tipoOption, tipo === 'usuario' && styles.tipoOptionSelected]}
                onPress={() => {
                  setTipo('usuario');
                  setDocumento('');
                  setRazaoSocial('');
                  setDocumentoValido(null);
                }}
              >
                <Text style={[styles.tipoOptionText, tipo === 'usuario' && styles.tipoOptionTextSelected]}>
                  👤 Usuário
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tipoOption, tipo === 'ong' && styles.tipoOptionSelected]}
                onPress={() => setTipo('ong')}
              >
                <Text style={[styles.tipoOptionText, tipo === 'ong' && styles.tipoOptionTextSelected]}>
                  🏢 ONG
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Campo de documento - CPF para usuários, CNPJ para ONGs */}
          <View style={styles.documentoContainer}>
            <TextInput
              style={[
                styles.input,
                documentoValido === null ? {} :
                documentoValido.valido ? styles.inputValid : styles.inputInvalid
              ]}
              placeholder={tipo === 'ong' ? "CNPJ da ONG" : "CPF do usuário"}
              value={documento}
              onChangeText={handleDocumentoChange}
              keyboardType="numeric"
              maxLength={18}
            />
            {documentoValido && (
              <Text style={[
                styles.validationText,
                documentoValido.valido ? styles.validationSuccess : styles.validationError
              ]}>
                {documentoValido.valido 
                  ? `✅ ${documentoValido.tipo?.toUpperCase()} válido` 
                  : `❌ ${documentoValido.erro}`
                }
              </Text>
            )}
          </View>

          {/* Campos específicos para ONG */}
          {tipo === 'ong' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Razão Social da ONG"
                value={razaoSocial}
                onChangeText={setRazaoSocial}
                autoCapitalize="words"
              />
            </>
          )}

          {/* Informações sobre verificação de documento */}
          <View style={styles.ongInfo}>
            <Text style={styles.ongInfoTitle}>ℹ️ Informações Importantes:</Text>
            <Text style={styles.ongInfoText}>
              • {tipo === 'ong' ? 'ONGs usam CNPJ' : 'Usuários usam CPF'}
            </Text>
            <Text style={styles.ongInfoText}>
              • O documento será verificado pelos administradores
            </Text>
            {tipo === 'ong' && (
              <Text style={styles.ongInfoText}>
                • Você poderá fazer login após a aprovação
              </Text>
            )}
            <Text style={styles.ongInfoText}>
              • Mantenha os dados atualizados e verdadeiros
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.button, carregando && styles.buttonDisabled]} 
            onPress={handleRegister}
            disabled={carregando}
          >
            <Text style={styles.buttonText}>
              {carregando ? 'Criando conta...' : 'Criar Conta'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.linkButton} onPress={onSwitchToLogin}>
            <Text style={styles.linkButtonText}>Já tem uma conta? Faça login</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Componente de informações do usuário
export function UserInfo() {
  const { usuario, logout } = useAuth();

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'admin': return '👑';
      case 'ong': return '🏢';
      case 'usuario': return '👤';
      default: return '❓';
    }
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'admin': return 'Administrador';
      case 'ong': return 'ONG';
      case 'usuario': return 'Usuário';
      default: return 'Desconhecido';
    }
  };

  return (
    <View style={styles.userInfo}>
      <Text style={styles.userText}>
        {getTipoIcon(usuario.tipo)} {usuario.nome} ({getTipoLabel(usuario.tipo)})
      </Text>
      {usuario.ong_nome && (
        <Text style={styles.orgText}>🏢 {usuario.ong_nome}</Text>
      )}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 15,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
  },
  testCredentials: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  testTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  testText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  userInfo: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  userText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  orgText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    marginTop: 8,
    padding: 5,
    backgroundColor: '#ff4444',
    borderRadius: 4,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tipoContainer: {
    marginBottom: 15,
  },
  tipoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  tipoOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tipoOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#f9f9f9',
  },
  tipoOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  tipoOptionText: {
    fontSize: 14,
    color: '#333',
  },
  tipoOptionTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  linkButton: {
    padding: 10,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#007AFF',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  documentoContainer: {
    marginBottom: 15,
  },
  inputValid: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  inputInvalid: {
    borderColor: '#f44336',
    borderWidth: 2,
  },
  validationText: {
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  validationSuccess: {
    color: '#4CAF50',
  },
  validationError: {
    color: '#f44336',
  },
  ongInfo: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  ongInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  ongInfoText: {
    fontSize: 12,
    color: '#1976D2',
    marginBottom: 4,
  },
};
