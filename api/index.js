// API consolidada para o MapCity
// Todos os métodos de API centralizados em um só lugar

const API_BASE_URL = 'http://localhost:3001';

// Função para obter o token do localStorage
const getToken = () => {
  const token = localStorage.getItem('mapcity_token');
  return token;
};

// Headers padrão com autenticação
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

// Função para fazer requisições autenticadas
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('mapcity_token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Se o token expirou, remover do localStorage
    if (response.status === 401) {
      localStorage.removeItem('mapcity_token');
      window.location.reload();
    }

    return response;
  } catch (error) {
    console.error('Erro na requisição:', error);
    throw error;
  }
}

// ========= LUGARES/MARCADORES API =========
export const lugaresAPI = {
  // Buscar todos os lugares
  buscarTodos: async () => {
    const response = await apiRequest('/lugares');
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Erro ao buscar lugares');
  },

  // Criar novo lugar
  criar: async (dadosLugar) => {
    const response = await apiRequest('/lugares', {
      method: 'POST',
      body: JSON.stringify(dadosLugar),
    });
    
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Erro ao criar lugar');
  },

  // Resolver lugar
  resolver: async (id, resolvido) => {
    const response = await apiRequest(`/lugares/${id}/resolver`, {
      method: 'PUT',
      body: JSON.stringify({ resolvido }),
    });
    
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Erro ao atualizar lugar');
  },

  // Deletar lugar (apenas admin)
  deletar: async (id) => {
    const response = await apiRequest(`/lugares/${id}`, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Erro ao deletar lugar');
  },
};

// ========= ÁREAS API =========
export const areasAPI = {
  // Buscar áreas da ONG
  buscarAreas: async () => {
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

  // Buscar áreas aprovadas públicas (não requer permissões especiais)
  buscarAreasAprovadas: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/areas/publicas`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar áreas aprovadas públicas:', error);
      throw error;
    }
  },

  // Criar nova área
  criarArea: async (dadosArea) => {
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
  atualizarArea: async (id, dadosArea) => {
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
  excluirArea: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/areas/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro ao excluir área:', error);
      throw error;
    }
  },

  // Buscar notificações
  buscarNotificacoes: async () => {
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
  marcarComoLida: async (id) => {
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

// ========= ADMIN API =========
export const adminAPI = {
  // Listar usuários (apenas admin)
  listarUsuarios: async () => {
    const response = await apiRequest('/admin/usuarios');
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Erro ao buscar usuários');
  },

  // Ativar/desativar usuário (apenas admin)
  alterarStatusUsuario: async (id, ativo) => {
    const response = await apiRequest(`/admin/usuarios/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ ativo }),
    });
    
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Erro ao alterar status do usuário');
  },

  // Buscar áreas pendentes de aprovação
  buscarAreasPendentes: async () => {
    const token = localStorage.getItem('mapcity_token');
    if (!token) {
      throw new Error('Token não encontrado');
    }

    const response = await fetch('http://localhost:3001/admin/areas/pendentes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao buscar áreas pendentes');
    }

    return await response.json();
  },

  // Buscar todas as áreas
  buscarTodasAreas: async () => {
    const token = localStorage.getItem('mapcity_token');
    if (!token) {
      throw new Error('Token não encontrado');
    }

    const response = await fetch('http://localhost:3001/admin/areas', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao buscar áreas');
    }

    return await response.json();
  },

  // Aprovar área
  aprovarArea: async (areaId) => {
    const token = localStorage.getItem('mapcity_token');
    
    if (!token) {
      throw new Error('Token não encontrado');
    }

    const url = `http://localhost:3001/admin/areas/${areaId}/aprovar`;

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao aprovar área');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Rejeitar área
  rejeitarArea: async (areaId, motivo) => {
    const token = localStorage.getItem('mapcity_token');
    if (!token) {
      throw new Error('Token não encontrado');
    }

    const response = await fetch(`http://localhost:3001/admin/areas/${areaId}/rejeitar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ motivo })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao rejeitar área');
    }

    return await response.json();
  },

  // Excluir área (Admin)
  excluirArea: async (areaId) => {
    const token = localStorage.getItem('mapcity_token');
    if (!token) {
      throw new Error('Token não encontrado');
    }

    const response = await fetch(`http://localhost:3001/admin/areas/${areaId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao excluir área');
    }

    return await response.json();
  }
};

// ========= USUÁRIOS API =========
export const usuariosAPI = {
  // Login
  login: async (email, senha) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, senha }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro no login');
    }

    return await response.json();
  },

  // Registro
  registrar: async (dadosUsuario) => {
    const response = await fetch(`${API_BASE_URL}/registrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosUsuario),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro no registro');
    }

    return await response.json();
  },

  // Verificar se usuário está logado
  verificarLogin: async () => {
    const token = getToken();
    if (!token) return null;

    try {
      const response = await apiRequest('/verificar-login');
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      return null;
    }
  }
};

// ========= DENÚNCIAS API =========
export const denunciasAPI = {
  // Criar uma denúncia
  criarDenuncia: async (denunciaData, token) => {
    const response = await fetch(`${API_BASE_URL}/denuncias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(denunciaData)
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar denúncia');
      } else {
        const text = await response.text();
        throw new Error(`Erro ${response.status}: ${text}`);
      }
    }

    return response.json();
  },

  // Listar denúncias (Admin/ONG)
  listarDenuncias: async (token) => {
    const response = await fetch(`${API_BASE_URL}/denuncias`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao buscar denúncias');
    }

    return response.json();
  },

  // Processar denúncia (aceitar ou rejeitar)
  processarDenuncia: async (denunciaId, acao, observacoes = '', token) => {
    const response = await fetch(`${API_BASE_URL}/denuncias/${denunciaId}/${acao}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ observacoes })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Erro ao ${acao} denúncia`);
    }

    const result = await response.json();
    return result;
  }
};

// ========= UPLOAD API =========
export const uploadAPI = {
  // Upload de imagens
  enviarImagens: async (arquivos) => {
    const token = localStorage.getItem('mapcity_token');
    
    const formData = new FormData();
    for (let i = 0; i < arquivos.length; i++) {
      formData.append('images', arquivos[i]);
    }

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.ok) {
      return await response.json();
    }
    throw new Error('Erro ao enviar imagens');
  },
};

// Exportação padrão com todas as APIs
export default {
  lugaresAPI,
  areasAPI,
  adminAPI,
  usuariosAPI,
  denunciasAPI,
  uploadAPI,
  apiRequest
};
