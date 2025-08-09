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
  const [carregando, setCarregando] = useState(false);

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

    setCarregando(true);

    try {
      const response = await fetch('http://localhost:3001/auth/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome,
          email,
          senha,
          tipo
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Sucesso',
          'Cadastro realizado com sucesso! Você pode fazer login agora.',
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
                // Fechar modal de registro e abrir login
                onClose();
                onSwitchToLogin();
              }
            }
          ]
        );
      } else {
        Alert.alert('Erro', data.error || 'Erro ao criar conta');
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
                onPress={() => setTipo('usuario')}
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
};
