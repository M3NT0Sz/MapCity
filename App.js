import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapCityMap from './MapCityMap';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
  const [isLoggedIn] = React.useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('./public/logoMap.png')} 
            style={styles.logoImage}
          />
          <Text style={styles.logo}>MapCity</Text>
        </View>
        {!isLoggedIn && (
          <View style={styles.authLinks}>
            <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
              Logar
            </Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.link} onPress={() => navigation.navigate('Registro')}>
              Registrar-se
            </Text>
          </View>
        )}
      </View>

      <View style={styles.mainContent}>
        <Text style={styles.title}>Bem-vindo ao MapCity!</Text>
        <Text style={styles.description}>
          Uma plataforma que conecta cidadãos e autoridades, permitindo identificar 
          e reportar problemas urbanos para melhorar nossa cidade.
        </Text>
        
        <TouchableOpacity 
          style={styles.mapButton}
          onPress={() => navigation.navigate('Mapa')}
        >
          <Text style={styles.buttonText}>Ver Mapa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Início" 
          component={HomeScreen}
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen name="Mapa" component={MapCityMap} />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="Registro" 
          component={RegisterScreen}
          options={{
            headerShown: false
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10, // reduzido de 50 para 30
    paddingBottom: 10,
    height: 50, // reduzido de 90 para 70
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
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
    gap: 10,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 70, // reduzido de 70 para 40
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1F2937',
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
  separator: {
    color: '#9CA3AF',
    fontSize: 16,
  },
});
