// Utilitários para API com autenticação

const API_BASE_URL = 'http://localhost:3001';

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
      window.location.reload(); // Recarregar para mostrar tela de login
    }

    return response;
  } catch (error) {
    console.error('Erro na requisição:', error);
    throw error;
  }
}

// Funções específicas da API

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
};
