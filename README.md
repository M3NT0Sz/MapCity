# 🗺️ MapCity - Plataforma de Reportagem de Problemas Urbanos

MapCity é uma aplicação web/mobile desenvolvida com **React Native + Expo** que permite aos cidadãos reportar problemas urbanos de forma interativa através de um mapa. Os usuários podem marcar localizações, adicionar fotos, descrições e acompanhar o status dos problemas reportados.

![MapCity Preview](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20iOS%20%7C%20Android-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.79.3-blue)
![Expo](https://img.shields.io/badge/Expo-53.0.11-black)

## ✨ Funcionalidades

### 🎯 **Principais Recursos**
- **Mapa Interativo**: Interface baseada em Leaflet/OpenStreetMap
- **Reportagem de Problemas**: Clique no mapa para reportar problemas urbanos
- **Múltiplas Imagens**: Adicione até 5 fotos por problema
- **Categorização**: Tipos de problemas (Lixo, Buracos, Iluminação, Outros)
- **Status de Resolução**: Marque problemas como resolvidos
- **Carrossel de Imagens**: Navegue entre múltiplas fotos nos detalhes
- **Interface Responsiva**: Funciona em web, iOS e Android

### 📱 **Tipos de Problemas Suportados**
- 🗑️ **Lixo na Rua** - Acúmulo de lixo e sujeira
- 🕳️ **Buracos** - Problemas na pavimentação
- 💡 **Iluminação** - Problemas com iluminação pública
- ❗ **Outros** - Demais problemas urbanos

## 🚀 Instalação e Configuração

### 📋 **Pré-requisitos**

Certifique-se de ter instalado:
- **Node.js** (versão 18 ou superior) - [Download](https://nodejs.org/)
- **npm** ou **yarn** (gerenciador de pacotes)
- **Git** - [Download](https://git-scm.com/)

### 📦 **Clonando o Repositório**

```bash
# Clone o repositório
git clone https://github.com/M3NT0Sz/MapCity.git

# Entre no diretório
cd MapCity
```

### ⚙️ **Instalação das Dependências**

```bash
# Usando npm
npm install

# OU usando yarn
yarn install
```

### 🌐 **Executando o Projeto**

#### **Para Web (Desenvolvimento)**
```bash
# Inicia o servidor web na porta 8081
npm run web

# Abra no navegador
# http://localhost:8081
```

#### **Para Mobile (iOS/Android)**
```bash
# Inicia o servidor Expo
npm start

# Opções disponíveis:
# - Pressione 'w' para abrir no navegador
# - Pressione 'i' para iOS Simulator
# - Pressione 'a' para Android Emulator
# - Escaneie o QR Code com o app Expo Go
```

### 📱 **Testando no Dispositivo Mobile**

1. **Instale o Expo Go**:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Execute o projeto**:
   ```bash
   npm start
   ```

3. **Escaneie o QR Code** com o app Expo Go

## 🛠️ **Stack Tecnológica**

### **Frontend**
- **React Native** - Framework cross-platform
- **Expo** - Plataforma de desenvolvimento
- **Leaflet** - Biblioteca de mapas
- **OpenStreetMap** - Dados de mapas (gratuito)

### **Dependências Principais**
```json
{
  "expo": "^53.0.11",
  "react": "18.3.1",
  "react-native": "0.79.3",
  "@react-navigation/native": "^6.0.0",
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.0.0"
}
```

## 📁 **Estrutura do Projeto**

```
MapCity/
├── 📁 assets/           # Ícones e imagens
├── 📄 App.js           # Componente principal + navegação
├── 📄 MapCityMap.js    # Componente principal do mapa
├── 📄 index.js         # Ponto de entrada
├── 📄 app.json         # Configurações do Expo
├── 📄 package.json     # Dependências e scripts
└── 📄 README.md        # Este arquivo
```

## 🎮 **Como Usar**

### **1. Reportar um Problema**
1. Abra a aplicação
2. Clique em qualquer local do mapa
3. Selecione o tipo de problema
4. Adicione uma descrição detalhada
5. (Opcional) Adicione até 5 fotos
6. Clique em "Reportar Problema"

### **2. Visualizar Problemas**
1. Clique em qualquer marcador no mapa
2. Veja os detalhes do problema
3. Navegue pelas fotos (se houver múltiplas)
4. Marque como resolvido se aplicável

### **3. Marcar como Resolvido**
1. Abra os detalhes de um problema
2. Clique em "✓ Marcar como Resolvido"
3. O marcador ficará opaco com um ícone de check

## 🔧 **Scripts Disponíveis**

```bash
# Desenvolvimento
npm start          # Inicia Expo
npm run web        # Apenas web
npm run android    # Apenas Android  
npm run ios        # Apenas iOS

# Build
npm run build      # Build para produção
```

## 🐛 **Solução de Problemas**

### **Problemas Comuns**

**1. Erro "Metro bundler crashed"**
```bash
npm start -- --reset-cache
```

**2. Problemas com dependências**
```bash
rm -rf node_modules
npm install
```

**3. Erro de porta em uso**
```bash
# O Expo automaticamente sugerirá uma porta alternativa
# Ou force uma porta específica:
npm start -- --port 8082
```

**4. Mapa não carrega**
- Verifique sua conexão com a internet
- O mapa usa OpenStreetMap (não requer API key)

## 📈 **Roadmap**

### **Próximas Funcionalidades**
- [ ] 🔐 Sistema de autenticação de usuários
- [ ] 📊 Dashboard administrativo
- [ ] 🔔 Notificações push
- [ ] 📍 Geolocalização automática
- [ ] 🌙 Modo escuro
- [ ] 📱 App nativo (sem Expo)
- [ ] 🗂️ Filtros por categoria/status
- [ ] 📈 Estatísticas e relatórios

## 🤝 **Contribuindo**

1. **Fork** o projeto
2. Crie sua **feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

## 📄 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 **Autores**

- **M3NT0Sz** - *Desenvolvedor Principal* - [@M3NT0Sz](https://github.com/M3NT0Sz)

## 📞 **Suporte**

Se você encontrar algum problema ou tiver sugestões:

1. **Issues**: [GitHub Issues](https://github.com/M3NT0Sz/MapCity/issues)
2. **Discussions**: [GitHub Discussions](https://github.com/M3NT0Sz/MapCity/discussions)

---

<div align="center">

**🏙️ Feito com ❤️ para melhorar nossas cidades**

[⭐ Star](https://github.com/M3NT0Sz/MapCity) • [🐛 Report Bug](https://github.com/M3NT0Sz/MapCity/issues) • [💡 Request Feature](https://github.com/M3NT0Sz/MapCity/issues)

</div>
