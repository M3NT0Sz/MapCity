import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }) {
  const [userType, setUserType] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [foundationDate, setFoundationDate] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#4B5563" />
      </TouchableOpacity>
      
      <Text style={styles.title}>Criar Conta</Text>
      
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

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={userType === 'ong' ? "Nome da ONG" : "Nome completo"}
          value={name}
          onChangeText={setName}
        />
        {userType === 'ong' ? (
          <TextInput
            style={styles.input}
            placeholder="CNPJ (apenas números)"
            value={cnpj}
            onChangeText={text => {
              const cleaned = text.replace(/[^0-9]/g, '');
              if (cleaned.length <= 14) setCnpj(cleaned);
            }}
            keyboardType="numeric"
            maxLength={14}
          />
        ) : (
          <TextInput
            style={styles.input}
            placeholder="CPF (apenas números)"
            value={cpf}
            onChangeText={text => {
              const cleaned = text.replace(/[^0-9]/g, '');
              if (cleaned.length <= 11) setCpf(cleaned);
            }}
            keyboardType="numeric"
            maxLength={11}
          />
        )}
        {userType === 'ong' ? (
          <TextInput
            style={styles.input}
            placeholder="Data de fundação (DD/MM/AAAA)"
            value={foundationDate}
            onChangeText={text => {
              const cleaned = text.replace(/[^0-9]/g, '');
              if (cleaned.length <= 8) {
                let formatted = cleaned;
                if (cleaned.length > 4) {
                  formatted = cleaned.replace(/(\d{2})(\d{2})(\d{0,4})/, '$1/$2/$3');
                } else if (cleaned.length > 2) {
                  formatted = cleaned.replace(/(\d{2})(\d{0,2})/, '$1/$2');
                }
                setFoundationDate(formatted);
              }
            }}
            keyboardType="numeric"
          />
        ) : (
          <TextInput
            style={styles.input}
            placeholder="Data de nascimento (DD/MM/AAAA)"
            value={birthDate}
            onChangeText={text => {
              const cleaned = text.replace(/[^0-9]/g, '');
              if (cleaned.length <= 8) {
                let formatted = cleaned;
                if (cleaned.length > 4) {
                  formatted = cleaned.replace(/(\d{2})(\d{2})(\d{0,4})/, '$1/$2/$3');
                } else if (cleaned.length > 2) {
                  formatted = cleaned.replace(/(\d{2})(\d{0,2})/, '$1/$2');
                }
                setBirthDate(formatted);
              }
            }}
            keyboardType="numeric"
          />
        )}
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
          placeholder="Telefone (opcional)"
          value={phone}
          onChangeText={text => {
            const cleaned = text.replace(/[^0-9]/g, '');
            if (cleaned.length <= 11) {
              let formatted = cleaned;
              if (cleaned.length > 2) {
                formatted = cleaned.replace(/(\d{2})(\d{0,5})(\d{0,4})/, '($1) $2-$3');
              }
              setPhone(formatted);
            }
          }}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmar senha"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity 
        style={styles.registerButton}
        onPress={() => {
          // Validações
          setError('');
          
          const isOng = userType === 'ong';
          
          if (!userType) {
            setError('Selecione um tipo de conta');
            return;
          }

          if (!name || !email || !password || !confirmPassword || 
              (!isOng && !cpf) || (!isOng && !birthDate) ||
              (isOng && !cnpj) || (isOng && !foundationDate)) {
            setError('Preencha todos os campos obrigatórios');
            return;
          }

          if (!isOng && cpf.length !== 11) {
            setError('CPF inválido');
            return;
          }

          if (isOng && cnpj.length !== 14) {
            setError('CNPJ inválido');
            return;
          }

          if (!isOng) {
            // Validar data de nascimento
            const [day, month, year] = birthDate.split('/');
            const birthDateObj = new Date(year, month - 1, day);
            const today = new Date();
            let age = today.getFullYear() - birthDateObj.getFullYear();
            const m = today.getMonth() - birthDateObj.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
              age--;
            }

            if (age < 14) {
              setError('Idade mínima permitida é 14 anos');
              return;
            }
          } else {
            // Validar data de fundação
            const [day, month, year] = foundationDate.split('/');
            const foundationDateObj = new Date(year, month - 1, day);
            const today = new Date();
            
            if (foundationDateObj > today) {
              setError('Data de fundação não pode ser futura');
              return;
            }
          }

          if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
          }

          // Se passou por todas as validações
          console.log('Registro:', { 
            userType, 
            name, 
            ...(userType === 'ong' ? {
              cnpj,
              foundationDate
            } : {
              cpf,
              birthDate
            }),
            email, 
            phone: phone || undefined,
            password 
          });
        }}
      >
        <Text style={styles.registerButtonText}>Criar conta</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.loginLink}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.loginText}>
          Já tem uma conta? <Text style={styles.loginTextBold}>Faça login</Text>
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
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  registerButton: {
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    marginTop: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  loginText: {
    fontSize: 14,
    color: '#4B5563',
  },
  loginTextBold: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});
