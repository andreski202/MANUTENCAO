export type UserRole = 'ADMIN' | 'VISUALIZADOR';
export type UserStatus = 'ATIVO' | 'INATIVO';
export type EstoqueStatus = 'CONECTADO' | 'DESCONECTADO' | 'ERRO';

export interface User {
  id: string;
  nome: string;
  email: string;
  perfil: UserRole;
  status: UserStatus;
  dataCadastro: string;
  ultimoAcesso?: string;
  passwordHash?: string; // used internally on server
}

export interface ColumnMapping {
  codigo: string;
  produto: string;
  prateleira: string;
  quantidade: string;
}

export interface Estoque {
  id: string;
  nome: string;
  spreadsheetId: string;
  url: string;
  status: EstoqueStatus;
  dataCadastro: string;
  ultimoSincronizacao?: string;
  sheetName?: string;
  availableSheets?: string[];
  columnMapping?: ColumnMapping;
  isDemo?: boolean;
}

export interface ProdutoLocalizacao {
  id: string;
  produtoId: string;
  codigo: string;
  produto: string;
  prateleira: string;
  quantidade: number;
}

export interface Produto {
  id: string;
  estoqueId: string;
  codigo: string;
  produto: string;
  estoqueTotal: number;
  localizacoes: ProdutoLocalizacao[];
  dataCadastro?: string;
  dataAtualizacao?: string;
}

export interface Permissao {
  id: string;
  usuarioId: string;
  estoqueId: string;
}

// O Histórico contém SOMENTE: Data, Usuário, Item, Valor anterior, Novo valor
export interface HistoricoItem {
  id: string;
  estoqueId: string;
  data: string;          // Formato: DD/MM/AAAA HH:mm
  usuario: string;       // Nome do usuário
  item: string;          // Nome ou Código do produto (ou Produto + Prateleira)
  valorAnterior: number; // Quantidade anterior
  novoValor: number;     // Nova quantidade
}

export interface DashboardStats {
  totalProdutos: number;
  totalQuantidadeEstoque: number;
  produtosSemEstoque: number;
  produtosBaixoEstoque: number;
  totalPrateleirasUsadas: number;
  estoquesConectados: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface SheetImportPreview {
  spreadsheetId: string;
  sheetName: string;
  availableSheets: string[];
  headers: string[];
  suggestedMapping: ColumnMapping;
  previewRows: Array<Record<string, any>>;
  consolidatedPreview: Array<{
    codigo: string;
    produto: string;
    estoqueTotal: number;
    localizacoes: Array<{ prateleira: string; quantidade: number }>;
  }>;
  totalRawRows: number;
  totalUniqueProducts: number;
}
