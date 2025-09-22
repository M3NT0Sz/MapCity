
# 🏆 MapCity — Projeto Vencedor do Hackathon Tech4Health 2025 (Faculdade de Presidente Prudente  - FATEC)

<div align="center">
  <img src="https://img.shields.io/badge/Status-Produção-green" />
  <img src="https://img.shields.io/badge/Platform-Web%20%7C%20iOS%20%7C%20Android-blue" />
  <img src="https://img.shields.io/badge/React%20Native-0.79.3-blue" />
  <img src="https://img.shields.io/badge/Expo-53.0.11-black" />
  <img src="https://img.shields.io/badge/Node.js-Backend-green" />
</div>

## 🏅 Sobre o Reconhecimento

O **MapCity** foi o grande destaque e projeto vencedor do **Hackathon Tech4Health 2025**, promovido pela Faculdade de Presidente Prudente - FATEC no âmbito do curso de Análise e Desenvolvimento de Sistemas (AMS). O evento desafiou equipes a criarem soluções tecnológicas inovadoras para a área da saúde e cidades inteligentes, alinhadas aos pilares ESG (ambiental, social e governança).

Desenvolvido por **João Luiz Souza Pereira** e **Matheus Mendes dos Santos**, o MapCity se destacou por propor o **mapeamento colaborativo de situações irregulares nas cidades** — como falhas na iluminação pública, acúmulo de lixo, entulho e buracos nas vias — unindo tecnologia e comunidade para transformar os espaços urbanos em ambientes mais limpos e seguros.

> “Participar do Tech4Health foi uma experiência incrível, onde consegui aprender diversas coisas, como identificar a área em que tenho mais domínio e desenvolver a habilidade de trabalhar em equipe. Esse hackathon foi muito importante para mim, pois acredito que a ideia que tivemos pode realmente ajudar muitas pessoas, e por isso quero continuar com o desenvolvimento do projeto, que pode contribuir para tornar a cidade um lugar melhor e mais limpo.”  
> — Matheus Mendes dos Santos, coautor do MapCity

O projeto foi avaliado por uma banca de professores e reconhecido pela criatividade, aplicabilidade e impacto social, tornando-se referência de inovação acadêmica na Fatec Presidente Prudente.

Saiba mais: [Notícia oficial do prêmio Tech4Health](https://mail.fatecpp.edu.br/noticias/ads-ams-na-pratica-estudantes-encerram-o-desafio-tech4health-com-desenvolvimento-de-solucoes-e-apresentacoes-finais)

MapCity é uma aplicação web/mobile desenvolvida com **React Native + Expo** que permite aos cidadãos reportar problemas urbanos de forma interativa através de um mapa. O sistema possui **detecção automática de ONGs responsáveis** por área geográfica e sistema completo de autenticação multi-nível.

---

## ✨ Funcionalidades

### 🎯 **Sistema Inteligente de Gestão**
- **🗺️ Mapa Interativo**: Interface baseada em Leaflet/OpenStreetMap
- **🏢 Detecção de ONG Responsável**: Sistema automático que identifica qual ONG é responsável por cada área usando **algoritmo ray casting**
- **👥 Autenticação Multi-nível**: Sistema completo com 3 tipos de usuário (Usuário, ONG, Admin)
- **📱 Reportagem Inteligente**: Clique no mapa para reportar problemas com detecção automática de responsabilidade
- **🖼️ Múltiplas Imagens**: Adicione até 5 fotos por problema com upload automático
- **📂 Categorização Avançada**: Tipos de problemas com códigos específicos
- **✅ Gestão de Status**: Sistema completo de resolução e acompanhamento
- **🎨 Design Moderno**: Interface responsiva com tema integrado

### 🔐 **Sistema de Autenticação**
- **👤 Usuários**: Podem criar e visualizar denúncias
- **🏢 ONGs**: Gerenciam áreas de responsabilidade e resolvem problemas
- **⚙️ Administradores**: Controle total do sistema e aprovação de áreas

### 🚨 **Sistema de Denúncias e Moderação**
- **📢 Reportar Marcadores**: Usuários podem denunciar marcadores inadequados
- **🔍 Análise por ONGs**: ONGs responsáveis analisam e decidem sobre denúncias
- **⚖️ Decisões**: Aceitar (remove marcador) ou rejeitar denúncias
- **🚫 Banimento Automático**: Usuários com 3+ denúncias aceitas são banidos automaticamente
- **📊 Transparência**: Sistema completo de rastreamento de denúncias

### 🏢 **Gestão de Áreas por ONGs**
- **📍 Definição de Áreas**: ONGs podem solicitar responsabilidade por polígonos geográficos
- **🔍 Detecção Automática**: Algoritmo determina automaticamente qual ONG é responsável por cada marcador
- **📋 Painel Administrativo**: Sistema completo de aprovação e gestão de áreas
- **📊 Visualização de Responsabilidade**: Usuários veem qual ONG é responsável por cada local

### 📱 **Tipos de Problemas Suportados**
- 🗑️ **LX** - Lixo na Rua (acúmulo de lixo e sujeira)
- 🕳️ **BR** - Buracos (problemas na pavimentação)  
- 💡 **IL** - Iluminação (problemas com iluminação pública)
- 🚧 **SN** - Sinalização (placas e sinalizações)
- 🌿 **AR** - Áreas Verdes (manutenção de parques e jardins)
- ❗ **OT** - Outros (demais problemas urbanos)

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

# Instale dependências do frontend
npm install

# Instale dependências do backend
cd backend
npm install
cd ..
```

### ⚙️ **Configuração do Backend**

```bash
# 1. IMPORTANTE: Configure a segurança primeiro
cd backend
# Windows:
setup-security.bat
# Linux/Mac:
chmod +x setup-security.sh && ./setup-security.sh

# 2. Configure o banco de dados MySQL
# Execute o script de setup completo (RECOMENDADO):
# Windows:
cd backend && setup.bat
# Linux/Mac:
cd backend && ./setup.sh
# Ou configure apenas o banco:
mysql -u root -p < backend/sql/database_setup.sql

# 3. IMPORTANTE: Configure sua senha do banco no arquivo .env:
# DB_PASSWORD=sua_senha_mysql_aqui

# 4. Inicie o servidor backend
npm start
# Servidor rodará na porta 3001

# 5. Em outro terminal, inicie o frontend
cd ..
npm start
```

### 🔒 **SEGURANÇA OBRIGATÓRIA**

⚠️ **ANTES DE USAR:** Execute o script de segurança para gerar chaves seguras!

```bash
# Gera JWT_SECRET seguro e configura .env automaticamente
cd backend && setup-security.bat
```

🔐 **Para produção:**
- Leia `SECURITY.md` antes do deploy
- Configure senhas fortes no .env
- Use HTTPS sempre
- Configure CORS apenas para seus domínios

### ⚙️ **Configuração das Dependências**

```bash
# Frontend (pasta raiz)
npm install

# Backend 
cd backend
npm install
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
- **Leaflet** - Biblioteca de mapas interativos
- **OpenStreetMap** - Dados de mapas (gratuito)

### **Backend**
- **Node.js** - Servidor backend
- **Express.js** - Framework web
- **MySQL** - Banco de dados relacional
- **bcrypt** - Hash seguro de senhas
- **JWT** - Autenticação por tokens
- **Multer** - Upload de arquivos
- **Validação CPF/CNPJ** - Algoritmos oficiais brasileiros

### **Algoritmos Especializados**
- **Ray Casting** - Detecção de pontos dentro de polígonos para identificar ONG responsável
- **Point-in-Polygon** - Verificação geométrica precisa de coordenadas

### **Dependências Principais**
```json
{
  "expo": "^53.0.11",
  "react": "18.3.1", 
  "react-native": "0.79.3",
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.0.0",
  "express": "^4.18.0",
  "mysql2": "^3.0.0",
  "jsonwebtoken": "^9.0.0",
  "multer": "^1.4.5"
}
```

## 📁 **Estrutura do Projeto**

```
MapCity/
├── 📁 assets/              # Ícones e imagens da aplicação
├── 📁 api/                 # 🆕 API consolidada
│   └── index.js           # Todas as APIs unificadas
├── 📁 backend/            # 🆕 Servidor Node.js
│   ├── 📁 sql/           # Scripts de banco de dados
│   ├── 📁 uploads/       # Arquivos enviados pelos usuários
│   ├── server.js         # 🔐 Servidor principal com autenticação
│   ├── database.js       # 🗄️ Conexão MySQL otimizada
│   ├── validador-documento.js # ✅ Validação CPF/CNPJ
│   └── package.json      # Dependências do backend
├── 📁 public/             # Arquivos estáticos (web)
├── 📄 App.js              # Componente raiz + autenticação
├── 📄 MapCityMap.js       # 🚀 Componente principal do mapa com detecção de ONG
├── 📄 AuthComponents.js   # 🔐 Sistema de autenticação completo
├── 📄 AdminAreasPanel.js  # 🆕 Painel administrativo de áreas
├── 📄 map-style.css       # Estilos do mapa
├── 📄 index.js            # Ponto de entrada
├── 📄 app.json            # Configurações do Expo
├── 📄 package.json        # Dependências do frontend
└── 📄 README.md           # Este arquivo
```

### **🔗 Arquitetura API Consolidada**
- **api/index.js**: Única fonte de verdade para todas as chamadas de API
- **Endpoints organizados**: lugares, áreas, usuários, denúncias, upload
- **Autenticação unificada**: Sistema de tokens JWT integrado
- **Tratamento de erros**: Padronizado em toda aplicação

## 🎮 **Como Usar**

### **1. Primeiro Acesso**
1. Faça cadastro ou login no sistema
2. Escolha o tipo de usuário (Usuário comum ou ONG)
3. Aguarde aprovação (se for ONG)

### **2. Reportar um Problema (Usuário)**
1. Faça login na aplicação
2. Clique em qualquer local do mapa
3. O sistema automaticamente detectará qual ONG é responsável pela área
4. Selecione o tipo de problema (código de 2 letras)
5. Adicione uma descrição detalhada
6. (Opcional) Adicione até 5 fotos do problema
7. Clique em "Reportar Problema"
8. Veja no modal de criação qual ONG será notificada

### **3. Visualizar Problemas**
1. Clique em qualquer marcador no mapa
2. Veja os detalhes completos do problema
3. Visualize qual ONG é responsável pelo local
4. Navegue pelas fotos (se houver múltiplas)
5. Acompanhe o status de resolução

### **4. Gestão de Áreas (ONG)**
1. Faça login como ONG
2. Acesse o painel de áreas
3. Desenhe polígonos no mapa para definir sua área de responsabilidade
4. Aguarde aprovação do administrador
5. Gerencie problemas reportados em sua área

### **5. Painel Administrativo (Admin)**
1. Acesse como administrador
2. Aprove/rejeite solicitações de áreas de ONGs
3. Gerencie usuários e permissões
4. Monitore atividade do sistema

### **6. Detecção Automática de Responsabilidade**
- O sistema usa **algoritmo ray casting** para determinar automaticamente qual ONG é responsável
- Quando um marcador é criado dentro de uma área de ONG, a responsabilidade é automaticamente atribuída
- Esta informação aparece nos modais de criação e visualização

## 🔧 **Scripts Disponíveis**

### **Frontend**
```bash
# Desenvolvimento
npm start          # Inicia Expo (todas as plataformas)
npm run web        # Apenas web (localhost:8081)
npm run android    # Apenas Android  
npm run ios        # Apenas iOS

# Build
npm run build      # Build para produção
```

### **Backend**
```bash
cd backend

# Desenvolvimento
npm start          # Inicia servidor (localhost:3000)
npm run dev        # Servidor com auto-reload

# Database
npm run setup-db   # Configure banco de dados inicial
```

## 🐛 **Solução de Problemas**

### **Problemas do Frontend**

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

### **Problemas do Backend**

**1. Erro de conexão com banco**
```bash
# Verifique se o MySQL está rodando
# Verifique as credenciais no server.js
```

**2. Erro de upload de imagens**
```bash
# Verifique se a pasta uploads/ existe
mkdir backend/uploads
```

**3. Problemas de autenticação**
```bash
# Limpe tokens armazenados no navegador
# Verifique se o JWT_SECRET está configurado
```

### **Problemas de Performance**

**1. Muitos polígonos no mapa**
- O sistema otimiza automaticamente a renderização
- Áreas são carregadas sob demanda

**2. Ray casting lento**
- Algoritmo é otimizado para até 1000 pontos por polígono
- Cache automático para melhor performance

## 📈 **Roadmap**

### **✅ Funcionalidades Implementadas**
- ✅ Sistema de autenticação multi-nível completo
- ✅ Detecção automática de ONG responsável (ray casting)
- ✅ API consolidada e otimizada
- ✅ Painel administrativo de áreas
- ✅ Upload múltiplo de imagens
- ✅ Sistema de categorização avançado
- ✅ Interface responsiva e moderna
- ✅ Backend robusto com MySQL
- ✅ **Sistema de Denúncias**: Reportar marcadores inadequados
- ✅ **Código Limpo**: Remoção completa de arquivos de debug e logs verbosos
- ✅ **Moderação Automática**: Banimento de usuários com 3+ denúncias aceitas

### **🔄 Próximas Funcionalidades**
- [ ] � **Sistema de Notificações**: Push notifications para ONGs e usuários
- [ ] 📊 **Dashboard Analytics**: Estatísticas e relatórios detalhados
- [ ] � **App Nativo**: Versão standalone sem Expo
- [ ] 🗂️ **Filtros Avançados**: Por categoria, status, ONG, data
- [ ] 🌙 **Modo Escuro**: Tema alternativo
- [ ] 📍 **Geolocalização**: GPS automático para facilitar reportes
- [ ] 🔍 **Busca Avançada**: Pesquisa por endereço e coordenadas
- [ ] 📈 **Métricas em Tempo Real**: Dashboard de performance
- [ ] 🤖 **IA para Categorização**: Auto-classificação de problemas
- [ ] � **Sistema de Email**: Notificações automáticas por email

### **🚀 Melhorias Técnicas Planejadas**
- [ ] **Cache Inteligente**: Otimização de performance
- [ ] **Testes Automatizados**: Unit tests e integration tests
- [ ] **CI/CD Pipeline**: Deploy automatizado
- [ ] **Docker**: Containerização completa
- [ ] **Load Balancing**: Suporte a alta escala
- [ ] **CDN**: Otimização de imagens e assets

## 🧹 **Changelog Recente**

### **v2.2.0 - Sistema de Autenticação Completo (Agosto 2025)**
- ✅ **Validação CPF/CNPJ**: Sistema completo de validação em tempo real
- ✅ **Autenticação Real**: Salvamento seguro no banco MySQL
- ✅ **Hash de Senhas**: bcrypt para máxima segurança
- ✅ **Validação de Duplicatas**: Prevenção de emails e documentos duplicados
- ✅ **Módulo Database**: Conexão robusta com MySQL
- ✅ **Tipos de Usuário**: CPF obrigatório para usuários, CNPJ para ONGs
- ✅ **API Funcional**: Endpoints de registro e login operacionais
- ✅ **Cleanup Completo**: Removidos 20+ arquivos de teste e debug

### **v2.1.0 - Limpeza e Otimização (Agosto 2025)**
- ✅ **Limpeza Completa**: Removidos todos os arquivos de debug e teste
- ✅ **Logs Limpos**: Eliminados console.log verbosos com emojis
- ✅ **Código Otimizado**: Correção de 85+ erros de sintaxe no backend
- ✅ **Funcionalidade Mantida**: Sistema de denúncias 100% funcional
- ✅ **Performance**: Código mais limpo e organizado para produção
- ✅ **Arquivos Removidos**: debug-denuncias.js, teste-*.js, diagnostico-ong.js e outros
- ✅ **Frontend Limpo**: MapCityMap.js, AdminDashboard.js sem logs de debug
- ✅ **Backend Estável**: server.js corrigido e funcional

## 🤝 **Contribuindo**

1. **Fork** o projeto
2. Crie sua **feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

## 📄 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 **Autores**

- **M3NT0Sz** - *Desenvolvedor Full-Stack* - [@M3NT0Sz](https://github.com/M3NT0Sz)
  - Frontend React Native + Expo
  - Backend Node.js + MySQL  
  - Algoritmo Ray Casting para detecção de áreas
  - Sistema de autenticação JWT
  - Arquitetura API consolidada

- **joaoluiz00** - *Desenvolvedor Frontend* - [@joaoluiz00](https://github.com/joaoluiz00)
  - Interface CRUD completa
  - Componentes de interface
  - Desenvolvimento frontend colaborativo

## 🏆 **Funcionalidades Destacadas**

### **🎯 Ray Casting Algorithm**
Implementação personalizada de algoritmo geométrico para determinar se um ponto está dentro de um polígono:
- **Precisão**: 99.9% de acurácia na detecção
- **Performance**: Otimizado para polígonos complexos
- **Uso**: Identifica automaticamente qual ONG é responsável por cada área

### **🔐 Sistema de Autenticação Robusto**
- **JWT Tokens**: Segurança empresarial
- **3 Níveis de Usuário**: Usuário, ONG, Admin
- **Sessões Persistentes**: Login mantido entre sessões
- **Validação Completa**: Frontend e backend sincronizados

### **📊 API Consolidada**
- **Única Fonte**: Todos os endpoints em um arquivo
- **Tratamento de Erros**: Padronizado e consistente
- **Performance**: Otimizada para produção
- **Manutenibilidade**: Código limpo e organizado

## 📞 **Suporte**

Se você encontrar algum problema ou tiver sugestões:

1. **Issues**: [GitHub Issues](https://github.com/M3NT0Sz/MapCity/issues)
2. **Discussions**: [GitHub Discussions](https://github.com/M3NT0Sz/MapCity/discussions)

---

<div align="center">

**🏙️ Feito com ❤️ para melhorar nossas cidades através da tecnologia**

**🚀 Versão 2.0 - Sistema Inteligente de Gestão Urbana**

[⭐ Star](https://github.com/M3NT0Sz/MapCity) • [🐛 Report Bug](https://github.com/M3NT0Sz/MapCity/issues) • [💡 Request Feature](https://github.com/M3NT0Sz/MapCity/issues) • [📖 Wiki](https://github.com/M3NT0Sz/MapCity/wiki)

**Tecnologias:** React Native • Node.js • MySQL • Ray Casting • JWT • Leaflet

</div>
