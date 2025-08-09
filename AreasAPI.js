// API para gerenciamento de áreas de responsabilidade das ONGs
const API_BASE_URL = 'http://localhost:3001';

// Função para obter o token do localStorage
const getToken = () => localStorage.getItem('mapcity_token');

// Headers padrão com autenticação
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

export const areasAPI = {
  // Buscar áreas da ONG
  async buscarAreas() {
    try {
      const response = await fetch(`${API_BASE_URL}/areas`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar áreas:', error);
      throw error;
    }
  },

  // Criar nova área
  async criarArea(dadosArea) {
    try {
      const response = await fetch(`${API_BASE_URL}/areas`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(dadosArea),
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao criar área:', error);
      throw error;
    }
  },

  // Atualizar área
  async atualizarArea(id, dadosArea) {
    try {
      const response = await fetch(`${API_BASE_URL}/areas/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(dadosArea),
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar área:', error);
      throw error;
    }
  },

  // Excluir área
  async excluirArea(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/areas/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao excluir área:', error);
      throw error;
    }
  },

  // Buscar notificações
  async buscarNotificacoes() {
    try {
      const response = await fetch(`${API_BASE_URL}/notificacoes`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      throw error;
    }
  },

  // Marcar notificação como lida
  async marcarComoLida(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/notificacoes/${id}/lida`, {
        method: 'PUT',
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }
};
