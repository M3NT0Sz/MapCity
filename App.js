import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapCityMap from './MapCityMap';
import { AuthProvider, useAuth, LoginModal, RegisterModal, UserInfo } from './AuthComponents';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';

const Stack = createNativeStackNavigator();


function AppNavbar({ onLogin, onRegister }) {
  const { estaLogado } = useAuth();
  return (
    <View style={styles.navbar}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('./public/logoMap.png')} 
          style={styles.logoImage}
        />
        <Text style={styles.logo}>MapCity</Text>
      </View>
      {!estaLogado ? (
        <View style={styles.authLinks}>
          <Text style={styles.link} onPress={onLogin}>
            Entrar
          </Text>
          <Text style={styles.link} onPress={onRegister}>
            Cadastrar
          </Text>
        </View>
      ) : (
        <UserInfo />
      )}
    </View>
  );
}

function MainMapScreen() {
  const { carregando } = useAuth();
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [showRegisterModal, setShowRegisterModal] = React.useState(false);

  const handleSwitchToRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  if (carregando) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppNavbar onLogin={() => setShowLoginModal(true)} onRegister={() => setShowRegisterModal(true)} />
      <View style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <MapCityMap />
      </View>
      <LoginModal 
        visible={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={handleSwitchToRegister}
      />
      <RegisterModal 
        visible={showRegisterModal} 
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </View>
  );
}


function AppContent() {
  // Apenas uma tela: o mapa com a navbar
  return <MainMapScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50, // espaço para a navbar fixa
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 30,
    height: 30,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  authLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 70,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1F2937',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  mapButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  loginButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  registerButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
  },
  authButtons: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#3B82F6',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  loginPrompt: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loginPromptText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 5,
  },
});
