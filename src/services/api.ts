import {
  User,
  Estoque,
  Produto,
  HistoricoItem,
  DashboardStats,
  SheetImportPreview,
  ColumnMapping
} from '../types.ts';

const getHeaders = (token?: string | null, userId?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (userId) {
    headers['x-user-id'] = userId;
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ success: boolean; user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao realizar login.');
    return data;
  },

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: getHeaders(null, userId),
      body: JSON.stringify({ oldPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao alterar senha.');
    return data;
  },

  // Dashboard
  async getDashboard(userId: string, estoqueId?: string): Promise<DashboardStats> {
    const url = `/api/dashboard${estoqueId ? `?estoqueId=${encodeURIComponent(estoqueId)}` : ''}`;
    const res = await fetch(url, {
      headers: getHeaders(null, userId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar métricas.');
    return data;
  },

  // Estoques
  async getEstoques(userId: string): Promise<Estoque[]> {
    const res = await fetch('/api/estoques', {
      headers: getHeaders(null, userId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao listar estoques.');
    return data;
  },

  async previewSheet(userId: string, url: string, sheetName?: string, oauthToken?: string): Promise<SheetImportPreview> {
    const res = await fetch('/api/estoques/preview', {
      method: 'POST',
      headers: getHeaders(null, userId),
      body: JSON.stringify({ url, sheetName, oauthToken })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao ler dados da planilha.');
    return data;
  },

  async createEstoque(
    userId: string,
    params: {
      nome: string;
      url: string;
      sheetName?: string;
      columnMapping?: ColumnMapping;
      oauthToken?: string;
    }
  ): Promise<{ success: boolean; estoque: Estoque; message: string }> {
    const res = await fetch('/api/estoques', {
      method: 'POST',
      headers: getHeaders(null, userId),
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao conectar estoque.');
    return data;
  },

  async disconnectEstoque(userId: string, estoqueId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/estoques/${encodeURIComponent(estoqueId)}`, {
      method: 'DELETE',
      headers: getHeaders(null, userId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao desconectar estoque.');
    return data;
  },

  async syncEstoque(userId: string, estoqueId: string, oauthToken?: string): Promise<{ success: boolean; message: string; importedCount: number; updatedCount: number }> {
    const res = await fetch(`/api/estoques/${encodeURIComponent(estoqueId)}/sync`, {
      method: 'POST',
      headers: getHeaders(null, userId),
      body: JSON.stringify({ oauthToken })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao sincronizar com Google Sheets.');
    return data;
  },

  // Produtos
  async getProdutos(
    userId: string,
    estoqueId: string,
    filters?: { search?: string; prateleira?: string; disponibilidade?: string }
  ): Promise<Produto[]> {
    const params = new URLSearchParams();
    params.append('estoqueId', estoqueId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.prateleira) params.append('prateleira', filters.prateleira);
    if (filters?.disponibilidade) params.append('disponibilidade', filters.disponibilidade);

    const res = await fetch(`/api/produtos?${params.toString()}`, {
      headers: getHeaders(null, userId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao buscar produtos.');
    return data;
  },

  async createProduto(
    userId: string,
    estoqueId: string,
    data: { codigo: string; produto: string; prateleira: string; quantidade: number }
  ): Promise<{ success: boolean; produto: Produto }> {
    const res = await fetch('/api/produtos', {
      method: 'POST',
      headers: getHeaders(null, userId),
      body: JSON.stringify({ estoqueId, ...data })
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || 'Erro ao criar produto.');
    return resData;
  },

  async updateProduto(
    userId: string,
    produtoId: string,
    data: { codigo: string; produto: string; localizacoes: Array<{ id?: string; prateleira: string; quantidade: number }> }
  ): Promise<{ success: boolean; produto: Produto }> {
    const res = await fetch(`/api/produtos/${encodeURIComponent(produtoId)}`, {
      method: 'PUT',
      headers: getHeaders(null, userId),
      body: JSON.stringify(data)
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || 'Erro ao atualizar produto.');
    return resData;
  },

  async deleteProduto(userId: string, produtoId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/produtos/${encodeURIComponent(produtoId)}`, {
      method: 'DELETE',
      headers: getHeaders(null, userId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao excluir produto.');
    return data;
  },

  // Operações
  async entradaEstoque(
    userId: string,
    params: { estoqueId: string; codigoOrId: string; prateleira: string; quantidade: number }
  ): Promise<{ success: boolean; message: string; produto: Produto }> {
    const res = await fetch('/api/operacoes/entrada', {
      method: 'POST',
      headers: getHeaders(null, userId),
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao registrar entrada.');
    return data;
  },

  async saidaEstoque(
    userId: string,
    params: { estoqueId: string; codigoOrId: string; prateleira: string; quantidade: number }
  ): Promise<{ success: boolean; message: string; produto: Produto }> {
    const res = await fetch('/api/operacoes/saida', {
      method: 'POST',
      headers: getHeaders(null, userId),
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao registrar saída.');
    return data;
  },

  async moverEstoque(
    userId: string,
    params: { estoqueId: string; codigoOrId: string; prateleiraOrigem: string; prateleiraDestino: string; quantidade: number }
  ): Promise<{ success: boolean; message: string; produto: Produto }> {
    const res = await fetch('/api/operacoes/mover', {
      method: 'POST',
      headers: getHeaders(null, userId),
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao mover estoque.');
    return data;
  },

  // Histórico
  async getHistorico(userId: string, estoqueId?: string): Promise<HistoricoItem[]> {
    const url = `/api/historico${estoqueId ? `?estoqueId=${encodeURIComponent(estoqueId)}` : ''}`;
    const res = await fetch(url, {
      headers: getHeaders(null, userId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar histórico.');
    return data;
  },

  // Usuários
  async getUsuarios(userId: string): Promise<Array<User & { allowedEstoques?: string[] }>> {
    const res = await fetch('/api/usuarios', {
      headers: getHeaders(null, userId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao listar usuários.');
    return data;
  },

  async createUsuario(
    userId: string,
    user: { nome: string; email: string; perfil: 'ADMIN' | 'VISUALIZADOR'; password?: string; allowedEstoques?: string[] }
  ): Promise<{ success: boolean; user: User }> {
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: getHeaders(null, userId),
      body: JSON.stringify(user)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao criar usuário.');
    return data;
  },

  async updateUsuario(
    userId: string,
    targetUserId: string,
    updates: Partial<User & { password?: string; allowedEstoques?: string[] }>
  ): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`/api/usuarios/${encodeURIComponent(targetUserId)}`, {
      method: 'PUT',
      headers: getHeaders(null, userId),
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao atualizar usuário.');
    return data;
  },

  async deleteUsuario(userId: string, targetUserId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/usuarios/${encodeURIComponent(targetUserId)}`, {
      method: 'DELETE',
      headers: getHeaders(null, userId)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao remover usuário.');
    return data;
  },

  // Apps Script Code
  async getAppsScriptCode(userId: string): Promise<string> {
    const res = await fetch('/api/apps-script-code', {
      headers: getHeaders(null, userId)
    });
    const data = await res.json();
    return data.code || '';
  }
};
