import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const [userType, setUserType] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#4B5563" />
      </TouchableOpacity>
      
      <Text style={styles.title}>Login</Text>
      
      <View style={styles.userTypeContainer}>
        <Text style={styles.subtitle}>Selecione seu tipo de conta:</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={[styles.typeButton, userType === 'usuario' && styles.selectedType]}
            onPress={() => setUserType('usuario')}
          >
            <Text style={[styles.typeText, userType === 'usuario' && styles.selectedTypeText]}>Usuário</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.typeButton, userType === 'ong' && styles.selectedType]}
            onPress={() => setUserType('ong')}
          >
            <Text style={[styles.typeText, userType === 'ong' && styles.selectedTypeText]}>ONG</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.typeButton, userType === 'admin' && styles.selectedType]}
            onPress={() => setUserType('admin')}
          >
            <Text style={[styles.typeText, userType === 'admin' && styles.selectedTypeText]}>Administrador</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        {userType === 'usuario' && (
          <TextInput
            style={styles.input}
            placeholder="CPF"
            keyboardType="numeric"
            maxLength={11}
          />
        )}
        {userType === 'ong' && (
          <TextInput
            style={styles.input}
            placeholder="CNPJ"
            keyboardType="numeric"
            maxLength={14}
          />
        )}
        {userType === 'admin' && (
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity 
        style={styles.loginButton}
        onPress={() => {
          // Implementar lógica de login aqui
          let loginData = { userType, password };
          
          if (userType === 'usuario') {
            loginData.cpf = cpf;
          } else if (userType === 'ong') {
            loginData.cnpj = cnpj;
          } else if (userType === 'admin') {
            loginData.email = email;
          }
          
          console.log('Login:', loginData);
        }}
      >
        <Text style={styles.loginButtonText}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.registerLink}
        onPress={() => navigation.navigate('Registro')}
      >
        <Text style={styles.registerText}>
          Não tem uma conta? <Text style={styles.registerTextBold}>Registre-se</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    padding: 10,
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 50,
    marginBottom: 30,
    textAlign: 'center',
  },
  userTypeContainer: {
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    minWidth: '30%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  selectedType: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  typeText: {
    color: '#4B5563',
    fontSize: 14,
  },
  selectedTypeText: {
    color: '#fff',
  },
  inputContainer: {
    gap: 15,
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#4B5563',
  },
  registerTextBold: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});
