import fs from 'fs';
import path from 'path';
import { Estoque, Produto, ProdutoLocalizacao, User, Permissao, HistoricoItem, DashboardStats } from '../src/types.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'inventory_db.json');

export interface DatabaseSchema {
  users: User[];
  estoques: Estoque[];
  produtos: Produto[];
  permissoes: Permissao[];
  historico: HistoricoItem[];
}

function formatDate(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

const INITIAL_DB: DatabaseSchema = {
  users: [
    {
      id: 'usr_admin_1',
      nome: 'Administrador Principal',
      email: 'andreskiryan@gmail.com',
      perfil: 'ADMIN',
      status: 'ATIVO',
      dataCadastro: '01/09/2026 08:00',
      ultimoAcesso: '02/09/2026 07:15',
      passwordHash: 'adm12345'
    },
    {
      id: 'usr_vis_1',
      nome: 'João Visualizador',
      email: 'joao.consulta@empresa.com',
      perfil: 'VISUALIZADOR',
      status: 'ATIVO',
      dataCadastro: '01/09/2026 09:30',
      ultimoAcesso: '02/09/2026 06:40',
      passwordHash: 'vis12345'
    }
  ],
  estoques: [
    {
      id: 'est_loja_principal',
      nome: 'Loja Principal',
      spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      url: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      status: 'CONECTADO',
      dataCadastro: '01/09/2026 08:30',
      ultimoSincronizacao: '02/09/2026 07:00',
      sheetName: 'Estoque_Geral',
      availableSheets: ['Estoque_Geral', 'Entradas', 'Saidas'],
      columnMapping: {
        codigo: 'Código',
        produto: 'Produto',
        prateleira: 'Prateleira',
        quantidade: 'Quantidade'
      },
      isDemo: true
    },
    {
      id: 'est_deposito_central',
      nome: 'Depósito Central',
      spreadsheetId: '1AbcXYZ_987654321_DemoSheetsIdForWarehouse01',
      url: 'https://docs.google.com/spreadsheets/d/1AbcXYZ_987654321_DemoSheetsIdForWarehouse01/edit',
      status: 'CONECTADO',
      dataCadastro: '01/09/2026 10:15',
      ultimoSincronizacao: '02/09/2026 06:30',
      sheetName: 'Inventario',
      availableSheets: ['Inventario'],
      columnMapping: {
        codigo: 'SKU',
        produto: 'Descricao',
        prateleira: 'Local',
        quantidade: 'Saldo'
      },
      isDemo: true
    }
  ],
  produtos: [
    // Loja Principal - Demonstrating fundamental 1 SKU = 1 PRODUTO rule with multiple shelves
    {
      id: 'prod_001',
      estoqueId: 'est_loja_principal',
      codigo: '001',
      produto: 'Parafuso 10mm Zincado',
      estoqueTotal: 33,
      localizacoes: [
        { id: 'loc_001_1', produtoId: 'prod_001', codigo: '001', produto: 'Parafuso 10mm Zincado', prateleira: 'A01', quantidade: 10 },
        { id: 'loc_001_2', produtoId: 'prod_001', codigo: '001', produto: 'Parafuso 10mm Zincado', prateleira: 'B03', quantidade: 15 },
        { id: 'loc_001_3', produtoId: 'prod_001', codigo: '001', produto: 'Parafuso 10mm Zincado', prateleira: 'C02', quantidade: 8 }
      ],
      dataCadastro: '01/09/2026 08:35',
      dataAtualizacao: '02/09/2026 07:00'
    },
    {
      id: 'prod_002',
      estoqueId: 'est_loja_principal',
      codigo: '002',
      produto: 'Porca Sextavada 8mm',
      estoqueTotal: 65,
      localizacoes: [
        { id: 'loc_002_1', produtoId: 'prod_002', codigo: '002', produto: 'Porca Sextavada 8mm', prateleira: 'A01', quantidade: 25 },
        { id: 'loc_002_2', produtoId: 'prod_002', codigo: '002', produto: 'Porca Sextavada 8mm', prateleira: 'A02', quantidade: 40 }
      ],
      dataCadastro: '01/09/2026 08:40',
      dataAtualizacao: '02/09/2026 07:00'
    },
    {
      id: 'prod_003',
      estoqueId: 'est_loja_principal',
      codigo: '003',
      produto: 'Arruela Lisa 1/4 Aço',
      estoqueTotal: 50,
      localizacoes: [
        { id: 'loc_003_1', produtoId: 'prod_003', codigo: '003', produto: 'Arruela Lisa 1/4 Aço', prateleira: 'B01', quantidade: 50 }
      ],
      dataCadastro: '01/09/2026 08:45',
      dataAtualizacao: '02/09/2026 07:00'
    },
    {
      id: 'prod_004',
      estoqueId: 'est_loja_principal',
      codigo: '004',
      produto: 'Martelo de Unha 25mm Cabo Fibra',
      estoqueTotal: 6,
      localizacoes: [
        { id: 'loc_004_1', produtoId: 'prod_004', codigo: '004', produto: 'Martelo de Unha 25mm Cabo Fibra', prateleira: 'C01', quantidade: 6 }
      ],
      dataCadastro: '01/09/2026 08:50',
      dataAtualizacao: '02/09/2026 07:00'
    },
    {
      id: 'prod_005',
      estoqueId: 'est_loja_principal',
      codigo: '005',
      produto: 'Chave Philips 6x150 Cr-V',
      estoqueTotal: 12,
      localizacoes: [
        { id: 'loc_005_1', produtoId: 'prod_005', codigo: '005', produto: 'Chave Philips 6x150 Cr-V', prateleira: 'SEM LOCALIZAÇÃO', quantidade: 12 }
      ],
      dataCadastro: '01/09/2026 09:00',
      dataAtualizacao: '02/09/2026 07:00'
    },
    {
      id: 'prod_006',
      estoqueId: 'est_loja_principal',
      codigo: '006',
      produto: 'Broca Aço Rápido 6mm HSS',
      estoqueTotal: 0,
      localizacoes: [
        { id: 'loc_006_1', produtoId: 'prod_006', codigo: '006', produto: 'Broca Aço Rápido 6mm HSS', prateleira: 'A03', quantidade: 0 }
      ],
      dataCadastro: '01/09/2026 09:10',
      dataAtualizacao: '02/09/2026 07:00'
    },
    // Depósito Central
    {
      id: 'prod_dep_001',
      estoqueId: 'est_deposito_central',
      codigo: '001',
      produto: 'Parafuso 10mm Zincado (Caixa 500un)',
      estoqueTotal: 120,
      localizacoes: [
        { id: 'loc_dep_001_1', produtoId: 'prod_dep_001', codigo: '001', produto: 'Parafuso 10mm Zincado (Caixa 500un)', prateleira: 'DEP-R1', quantidade: 80 },
        { id: 'loc_dep_001_2', produtoId: 'prod_dep_001', codigo: '001', produto: 'Parafuso 10mm Zincado (Caixa 500un)', prateleira: 'DEP-R2', quantidade: 40 }
      ],
      dataCadastro: '01/09/2026 10:20',
      dataAtualizacao: '02/09/2026 06:30'
    },
    {
      id: 'prod_dep_007',
      estoqueId: 'est_deposito_central',
      codigo: '007',
      produto: 'Disco de Corte 4.1/2 Inox',
      estoqueTotal: 150,
      localizacoes: [
        { id: 'loc_dep_007_1', produtoId: 'prod_dep_007', codigo: '007', produto: 'Disco de Corte 4.1/2 Inox', prateleira: 'DEP-P05', quantidade: 150 }
      ],
      dataCadastro: '01/09/2026 10:30',
      dataAtualizacao: '02/09/2026 06:30'
    }
  ],
  permissoes: [
    {
      id: 'perm_1',
      usuarioId: 'usr_vis_1',
      estoqueId: 'est_loja_principal'
    }
  ],
  historico: [
    {
      id: 'hist_1',
      estoqueId: 'est_loja_principal',
      data: '01/09/2026 08:35',
      usuario: 'Administrador Principal',
      item: 'Parafuso 10mm Zincado (A01)',
      valorAnterior: 0,
      novoValor: 10
    },
    {
      id: 'hist_2',
      estoqueId: 'est_loja_principal',
      data: '01/09/2026 08:36',
      usuario: 'Administrador Principal',
      item: 'Parafuso 10mm Zincado (B03)',
      valorAnterior: 0,
      novoValor: 15
    },
    {
      id: 'hist_3',
      estoqueId: 'est_loja_principal',
      data: '01/09/2026 08:37',
      usuario: 'Administrador Principal',
      item: 'Parafuso 10mm Zincado (C02)',
      valorAnterior: 0,
      novoValor: 8
    },
    {
      id: 'hist_4',
      estoqueId: 'est_loja_principal',
      data: '02/09/2026 06:15',
      usuario: 'Administrador Principal',
      item: 'Porca Sextavada 8mm (A02)',
      valorAnterior: 30,
      novoValor: 40
    }
  ]
};

class DBManager {
  private db: DatabaseSchema;

  constructor() {
    this.db = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error reading database file, using initial dataset:', err);
    }
    this.save(INITIAL_DB);
    return JSON.parse(JSON.stringify(INITIAL_DB));
  }

  private save(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing database file:', err);
    }
  }

  public getRawDB(): DatabaseSchema {
    return this.db;
  }

  // --- Users & Auth ---
  public getUsers(): User[] {
    return this.db.users.map(({ passwordHash, ...u }) => u as User);
  }

  public getUserById(id: string): User | undefined {
    const u = this.db.users.find(x => x.id === id);
    if (!u) return undefined;
    const { passwordHash, ...rest } = u;
    return rest as User;
  }

  public getUserByEmail(email: string): User | undefined {
    return this.db.users.find(x => x.email.toLowerCase() === email.toLowerCase().trim());
  }

  public authenticate(email: string, password: string): User | null {
    const user = this.db.users.find(
      x => x.email.toLowerCase() === email.toLowerCase().trim() && x.passwordHash === password
    );
    if (!user || user.status !== 'ATIVO') return null;
    user.ultimoAcesso = formatDate();
    this.save(this.db);
    const { passwordHash, ...safeUser } = user;
    return safeUser as User;
  }

  public changePassword(userId: string, oldPass: string, newPass: string): boolean {
    const user = this.db.users.find(x => x.id === userId);
    if (!user || user.passwordHash !== oldPass) return false;
    user.passwordHash = newPass;
    this.save(this.db);
    return true;
  }

  public createUser(userData: { nome: string; email: string; perfil: 'ADMIN' | 'VISUALIZADOR'; password?: string; allowedEstoques?: string[] }): User {
    const id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newUser: User = {
      id,
      nome: userData.nome.trim(),
      email: userData.email.toLowerCase().trim(),
      perfil: userData.perfil,
      status: 'ATIVO',
      dataCadastro: formatDate(),
      passwordHash: userData.password || (userData.perfil === 'ADMIN' ? 'adm12345' : 'vis12345')
    };
    this.db.users.push(newUser);

    if (userData.perfil === 'VISUALIZADOR' && userData.allowedEstoques && userData.allowedEstoques.length > 0) {
      for (const estId of userData.allowedEstoques) {
        this.db.permissoes.push({
          id: 'perm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          usuarioId: id,
          estoqueId: estId
        });
      }
    }

    this.save(this.db);
    const { passwordHash, ...safe } = newUser;
    return safe as User;
  }

  public updateUser(id: string, updates: Partial<User & { password?: string; allowedEstoques?: string[] }>): User | null {
    const user = this.db.users.find(x => x.id === id);
    if (!user) return null;
    if (updates.nome) user.nome = updates.nome.trim();
    if (updates.email) user.email = updates.email.toLowerCase().trim();
    if (updates.perfil) user.perfil = updates.perfil;
    if (updates.status) user.status = updates.status;
    if (updates.password) user.passwordHash = updates.password;

    if (updates.allowedEstoques !== undefined) {
      this.db.permissoes = this.db.permissoes.filter(p => p.usuarioId !== id);
      for (const estId of updates.allowedEstoques) {
        this.db.permissoes.push({
          id: 'perm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          usuarioId: id,
          estoqueId: estId
        });
      }
    }

    this.save(this.db);
    const { passwordHash, ...safe } = user;
    return safe as User;
  }

  public deleteUser(id: string): boolean {
    const initialLen = this.db.users.length;
    this.db.users = this.db.users.filter(x => x.id !== id);
    this.db.permissoes = this.db.permissoes.filter(p => p.usuarioId !== id);
    if (this.db.users.length !== initialLen) {
      this.save(this.db);
      return true;
    }
    return false;
  }

  // --- Permissões ---
  public getPermissoesForUser(userId: string): string[] {
    return this.db.permissoes.filter(p => p.usuarioId === userId).map(p => p.estoqueId);
  }

  public canUserAccessEstoque(user: User, estoqueId: string): boolean {
    if (user.perfil === 'ADMIN') return true;
    const permitted = this.getPermissoesForUser(user.id);
    return permitted.includes(estoqueId);
  }

  // --- Estoques ---
  public getEstoques(user?: User): Estoque[] {
    if (!user || user.perfil === 'ADMIN') {
      return this.db.estoques;
    }
    const permitted = this.getPermissoesForUser(user.id);
    return this.db.estoques.filter(e => permitted.includes(e.id));
  }

  public getEstoqueById(id: string): Estoque | undefined {
    return this.db.estoques.find(e => e.id === id);
  }

  public createEstoque(data: Omit<Estoque, 'id' | 'dataCadastro' | 'status'> & { status?: Estoque['status'] }): Estoque {
    const id = 'est_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newEstoque: Estoque = {
      id,
      nome: data.nome.trim(),
      spreadsheetId: data.spreadsheetId,
      url: data.url,
      status: data.status || 'CONECTADO',
      dataCadastro: formatDate(),
      ultimoSincronizacao: formatDate(),
      sheetName: data.sheetName || 'Estoque',
      availableSheets: data.availableSheets || [data.sheetName || 'Estoque'],
      columnMapping: data.columnMapping || {
        codigo: 'Código',
        produto: 'Produto',
        prateleira: 'Prateleira',
        quantidade: 'Quantidade'
      },
      isDemo: false
    };
    this.db.estoques.push(newEstoque);
    this.save(this.db);
    return newEstoque;
  }

  public updateEstoque(id: string, updates: Partial<Estoque>): Estoque | null {
    const est = this.db.estoques.find(e => e.id === id);
    if (!est) return null;
    Object.assign(est, updates);
    this.save(this.db);
    return est;
  }

  public disconnectEstoque(id: string): boolean {
    const est = this.db.estoques.find(e => e.id === id);
    if (!est) return false;
    est.status = 'DESCONECTADO';
    this.save(this.db);
    return true;
  }

  public deleteEstoque(id: string): boolean {
    const initialLen = this.db.estoques.length;
    this.db.estoques = this.db.estoques.filter(e => e.id !== id);
    this.db.produtos = this.db.produtos.filter(p => p.estoqueId !== id);
    this.db.historico = this.db.historico.filter(h => h.estoqueId !== id);
    this.db.permissoes = this.db.permissoes.filter(p => p.estoqueId !== id);
    if (this.db.estoques.length !== initialLen) {
      this.save(this.db);
      return true;
    }
    return false;
  }

  // --- Produtos & Localizações ---
  public getProdutosByEstoque(estoqueId: string): Produto[] {
    return this.db.produtos.filter(p => p.estoqueId === estoqueId);
  }

  public getProdutoById(id: string): Produto | undefined {
    return this.db.produtos.find(p => p.id === id);
  }

  public getProdutoByCodigo(estoqueId: string, codigo: string): Produto | undefined {
    return this.db.produtos.find(
      p => p.estoqueId === estoqueId && p.codigo.trim().toLowerCase() === codigo.trim().toLowerCase()
    );
  }

  /**
   * Recalculates total stock for a product from its locations
   */
  public recalculateTotal(produto: Produto): number {
    const total = produto.localizacoes.reduce((sum, loc) => sum + (Number(loc.quantidade) || 0), 0);
    produto.estoqueTotal = Math.max(0, total);
    produto.dataAtualizacao = formatDate();
    return produto.estoqueTotal;
  }

  /**
   * Adds or registers a product respecting the rule:
   * 1 SKU = 1 PRODUTO
   * Key: CODIGO + PRATELEIRA
   */
  public addOrUpdateProduto(
    estoqueId: string,
    data: { codigo: string; produto: string; prateleira: string; quantidade: number },
    userName: string = 'Sistema'
  ): Produto {
    const codigoClean = data.codigo.trim();
    const nomeClean = data.produto.trim();
    const prateleiraClean = (data.prateleira || '').trim() || 'SEM LOCALIZAÇÃO';
    const qtdNumber = Number(data.quantidade) || 0;

    let existingProd = this.getProdutoByCodigo(estoqueId, codigoClean);

    if (!existingProd) {
      const prodId = 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const locId = 'loc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const newLoc: ProdutoLocalizacao = {
        id: locId,
        produtoId: prodId,
        codigo: codigoClean,
        produto: nomeClean,
        prateleira: prateleiraClean,
        quantidade: Math.max(0, qtdNumber)
      };

      existingProd = {
        id: prodId,
        estoqueId,
        codigo: codigoClean,
        produto: nomeClean,
        estoqueTotal: Math.max(0, qtdNumber),
        localizacoes: [newLoc],
        dataCadastro: formatDate(),
        dataAtualizacao: formatDate()
      };
      this.db.produtos.push(existingProd);

      this.addHistoricoEntry({
        estoqueId,
        usuario: userName,
        item: `${nomeClean} (${prateleiraClean})`,
        valorAnterior: 0,
        novoValor: Math.max(0, qtdNumber)
      });
    } else {
      // Product exists. Update name if changed
      if (nomeClean) {
        existingProd.produto = nomeClean;
        existingProd.localizacoes.forEach(l => l.produto = nomeClean);
      }

      // Check if shelf exists
      const loc = existingProd.localizacoes.find(
        l => l.prateleira.toLowerCase() === prateleiraClean.toLowerCase()
      );

      if (loc) {
        const oldVal = loc.quantidade;
        const newVal = Math.max(0, oldVal + qtdNumber);
        loc.quantidade = newVal;
        this.addHistoricoEntry({
          estoqueId,
          usuario: userName,
          item: `${existingProd.produto} (${prateleiraClean})`,
          valorAnterior: oldVal,
          novoValor: newVal
        });
      } else {
        const locId = 'loc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        existingProd.localizacoes.push({
          id: locId,
          produtoId: existingProd.id,
          codigo: existingProd.codigo,
          produto: existingProd.produto,
          prateleira: prateleiraClean,
          quantidade: Math.max(0, qtdNumber)
        });
        this.addHistoricoEntry({
          estoqueId,
          usuario: userName,
          item: `${existingProd.produto} (${prateleiraClean})`,
          valorAnterior: 0,
          novoValor: Math.max(0, qtdNumber)
        });
      }

      this.recalculateTotal(existingProd);
    }

    this.save(this.db);
    return existingProd;
  }

  public editProduto(
    produtoId: string,
    data: { codigo: string; produto: string; localizacoes: Array<{ id?: string; prateleira: string; quantidade: number }> },
    userName: string
  ): Produto | null {
    const prod = this.getProdutoById(produtoId);
    if (!prod) return null;

    const oldCodigo = prod.codigo;
    const oldNome = prod.produto;
    prod.codigo = data.codigo.trim();
    prod.produto = data.produto.trim();

    // Reconcile locations and record history for any quantity changes
    const newLocs: ProdutoLocalizacao[] = [];

    // Map existing locations for comparison
    const oldLocMap = new Map<string, number>();
    prod.localizacoes.forEach(l => {
      oldLocMap.set(l.prateleira.trim().toLowerCase(), l.quantidade);
    });

    for (const locItem of data.localizacoes) {
      const shelf = (locItem.prateleira || '').trim() || 'SEM LOCALIZAÇÃO';
      const qty = Math.max(0, Number(locItem.quantidade) || 0);
      const oldQty = oldLocMap.get(shelf.toLowerCase()) ?? 0;

      if (oldQty !== qty) {
        this.addHistoricoEntry({
          estoqueId: prod.estoqueId,
          usuario: userName,
          item: `${prod.produto} (${shelf})`,
          valorAnterior: oldQty,
          novoValor: qty
        });
      }

      newLocs.push({
        id: locItem.id || ('loc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)),
        produtoId: prod.id,
        codigo: prod.codigo,
        produto: prod.produto,
        prateleira: shelf,
        quantidade: qty
      });
    }

    prod.localizacoes = newLocs;
    this.recalculateTotal(prod);
    this.save(this.db);
    return prod;
  }

  public deleteProduto(produtoId: string, userName: string): boolean {
    const prod = this.getProdutoById(produtoId);
    if (!prod) return false;

    // Record history of removal
    this.addHistoricoEntry({
      estoqueId: prod.estoqueId,
      usuario: userName,
      item: `${prod.produto} (Excluído)`,
      valorAnterior: prod.estoqueTotal,
      novoValor: 0
    });

    this.db.produtos = this.db.produtos.filter(p => p.id !== produtoId);
    this.save(this.db);
    return true;
  }

  // --- Operações: Entrada, Saída, Mover ---
  public entradaEstoque(
    estoqueId: string,
    codigoOrId: string,
    prateleira: string,
    quantidade: number,
    userName: string
  ): { success: boolean; message: string; produto?: Produto } {
    if (quantidade <= 0) {
      return { success: false, message: 'Quantidade deve ser maior que zero.' };
    }

    let prod = this.getProdutoById(codigoOrId) || this.getProdutoByCodigo(estoqueId, codigoOrId);
    if (!prod) {
      return { success: false, message: 'Este produto não existe no estoque selecionado.' };
    }

    const shelfClean = (prateleira || '').trim() || 'SEM LOCALIZAÇÃO';
    const loc = prod.localizacoes.find(l => l.prateleira.toLowerCase() === shelfClean.toLowerCase());

    if (loc) {
      const oldVal = loc.quantidade;
      const newVal = oldVal + quantidade;
      loc.quantidade = newVal;
      this.addHistoricoEntry({
        estoqueId,
        usuario: userName,
        item: `${prod.produto} (${shelfClean})`,
        valorAnterior: oldVal,
        novoValor: newVal
      });
    } else {
      const locId = 'loc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      prod.localizacoes.push({
        id: locId,
        produtoId: prod.id,
        codigo: prod.codigo,
        produto: prod.produto,
        prateleira: shelfClean,
        quantidade: quantidade
      });
      this.addHistoricoEntry({
        estoqueId,
        usuario: userName,
        item: `${prod.produto} (${shelfClean})`,
        valorAnterior: 0,
        novoValor: quantidade
      });
    }

    this.recalculateTotal(prod);
    this.save(this.db);
    return { success: true, message: `Entrada de ${quantidade} itens em '${shelfClean}' realizada com sucesso.`, produto: prod };
  }

  public saidaEstoque(
    estoqueId: string,
    codigoOrId: string,
    prateleira: string,
    quantidade: number,
    userName: string
  ): { success: boolean; message: string; produto?: Produto } {
    if (quantidade <= 0) {
      return { success: false, message: 'Quantidade deve ser maior que zero.' };
    }

    let prod = this.getProdutoById(codigoOrId) || this.getProdutoByCodigo(estoqueId, codigoOrId);
    if (!prod) {
      return { success: false, message: 'Este produto não existe.' };
    }

    const shelfClean = (prateleira || '').trim() || 'SEM LOCALIZAÇÃO';
    const loc = prod.localizacoes.find(l => l.prateleira.toLowerCase() === shelfClean.toLowerCase());

    if (!loc) {
      return { success: false, message: `Prateleira '${shelfClean}' não encontrada para este produto.` };
    }

    if (loc.quantidade < quantidade) {
      return {
        success: false,
        message: `Quantidade insuficiente nesta prateleira. Disponível: ${loc.quantidade}, solicitado: ${quantidade}.`
      };
    }

    const oldVal = loc.quantidade;
    const newVal = oldVal - quantidade;
    loc.quantidade = newVal;

    this.addHistoricoEntry({
      estoqueId,
      usuario: userName,
      item: `${prod.produto} (${shelfClean})`,
      valorAnterior: oldVal,
      novoValor: newVal
    });

    this.recalculateTotal(prod);
    this.save(this.db);
    return { success: true, message: `Saída de ${quantidade} itens de '${shelfClean}' realizada com sucesso.`, produto: prod };
  }

  public moverEstoque(
    estoqueId: string,
    codigoOrId: string,
    prateleiraOrigem: string,
    prateleiraDestino: string,
    quantidade: number,
    userName: string
  ): { success: boolean; message: string; produto?: Produto } {
    if (quantidade <= 0) {
      return { success: false, message: 'Quantidade deve ser maior que zero.' };
    }

    const srcShelf = (prateleiraOrigem || '').trim() || 'SEM LOCALIZAÇÃO';
    const dstShelf = (prateleiraDestino || '').trim() || 'SEM LOCALIZAÇÃO';

    if (srcShelf.toLowerCase() === dstShelf.toLowerCase()) {
      return { success: false, message: 'A prateleira de origem e destino devem ser diferentes.' };
    }

    let prod = this.getProdutoById(codigoOrId) || this.getProdutoByCodigo(estoqueId, codigoOrId);
    if (!prod) {
      return { success: false, message: 'Este produto não existe.' };
    }

    const locOrigem = prod.localizacoes.find(l => l.prateleira.toLowerCase() === srcShelf.toLowerCase());
    if (!locOrigem) {
      return { success: false, message: `Prateleira de origem '${srcShelf}' não encontrada para este produto.` };
    }

    if (locOrigem.quantidade < quantidade) {
      return {
        success: false,
        message: `Quantidade insuficiente na prateleira '${srcShelf}'. Disponível: ${locOrigem.quantidade}, solicitado: ${quantidade}.`
      };
    }

    // Deduct from source
    const oldSrc = locOrigem.quantidade;
    const newSrc = oldSrc - quantidade;
    locOrigem.quantidade = newSrc;
    this.addHistoricoEntry({
      estoqueId,
      usuario: userName,
      item: `${prod.produto} (${srcShelf})`,
      valorAnterior: oldSrc,
      novoValor: newSrc
    });

    // Add to destination
    let locDest = prod.localizacoes.find(l => l.prateleira.toLowerCase() === dstShelf.toLowerCase());
    if (locDest) {
      const oldDst = locDest.quantidade;
      const newDst = oldDst + quantidade;
      locDest.quantidade = newDst;
      this.addHistoricoEntry({
        estoqueId,
        usuario: userName,
        item: `${prod.produto} (${dstShelf})`,
        valorAnterior: oldDst,
        novoValor: newDst
      });
    } else {
      const locId = 'loc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      prod.localizacoes.push({
        id: locId,
        produtoId: prod.id,
        codigo: prod.codigo,
        produto: prod.produto,
        prateleira: dstShelf,
        quantidade: quantidade
      });
      this.addHistoricoEntry({
        estoqueId,
        usuario: userName,
        item: `${prod.produto} (${dstShelf})`,
        valorAnterior: 0,
        novoValor: quantidade
      });
    }

    this.recalculateTotal(prod);
    this.save(this.db);
    return {
      success: true,
      message: `Movimentados ${quantidade} itens de '${srcShelf}' para '${dstShelf}' com sucesso.`,
      produto: prod
    };
  }

  // --- Histórico ---
  // Tabela contém SOMENTE: Data, Usuário, Item, Valor anterior, Novo valor
  public getHistorico(estoqueId?: string): HistoricoItem[] {
    if (estoqueId && estoqueId !== 'all') {
      return this.db.historico.filter(h => h.estoqueId === estoqueId).reverse();
    }
    return [...this.db.historico].reverse();
  }

  public addHistoricoEntry(entry: { estoqueId: string; usuario: string; item: string; valorAnterior: number; novoValor: number }) {
    const newHist: HistoricoItem = {
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      estoqueId: entry.estoqueId,
      data: formatDate(),
      usuario: entry.usuario,
      item: entry.item,
      valorAnterior: entry.valorAnterior,
      novoValor: entry.novoValor
    };
    this.db.historico.push(newHist);
  }

  // --- Dashboard Stats ---
  public getDashboardStats(estoqueId?: string, user?: User): DashboardStats {
    let prods = this.db.produtos;
    let estoquesList = this.getEstoques(user);

    if (estoqueId && estoqueId !== 'all') {
      prods = prods.filter(p => p.estoqueId === estoqueId);
      estoquesList = estoquesList.filter(e => e.id === estoqueId);
    } else if (user && user.perfil === 'VISUALIZADOR') {
      const allowed = this.getPermissoesForUser(user.id);
      prods = prods.filter(p => allowed.includes(p.estoqueId));
    }

    const totalProdutos = prods.length;
    const totalQuantidadeEstoque = prods.reduce((sum, p) => sum + (p.estoqueTotal || 0), 0);
    const produtosSemEstoque = prods.filter(p => (p.estoqueTotal || 0) === 0).length;
    const produtosBaixoEstoque = prods.filter(p => (p.estoqueTotal || 0) > 0 && (p.estoqueTotal || 0) <= 5).length;

    const shelvesSet = new Set<string>();
    prods.forEach(p => {
      p.localizacoes.forEach(l => {
        if (l.quantidade > 0 && l.prateleira) {
          shelvesSet.add(l.prateleira.toLowerCase());
        }
      });
    });

    return {
      totalProdutos,
      totalQuantidadeEstoque,
      produtosSemEstoque,
      produtosBaixoEstoque,
      totalPrateleirasUsadas: shelvesSet.size,
      estoquesConectados: estoquesList.filter(e => e.status === 'CONECTADO').length
    };
  }

  /**
   * Bulk import / replace / sync products for a stock
   */
  public syncEstoqueProducts(
    estoqueId: string,
    rawRows: Array<{ codigo: string; produto: string; prateleira: string; quantidade: number }>,
    userName: string = 'Sincronização Sheets'
  ): { importedCount: number; updatedCount: number } {
    const est = this.getEstoqueById(estoqueId);
    if (!est) throw new Error('Estoque não encontrado');

    // Rule: Consolidate by CÓDIGO + PRATELEIRA
    // 1 SKU = 1 Produto
    const consolidatedMap = new Map<string, {
      codigo: string;
      produto: string;
      localizacoesMap: Map<string, number>;
    }>();

    for (const row of rawRows) {
      const cod = (row.codigo || '').trim();
      if (!cod) continue;

      const prodName = (row.produto || '').trim() || `Produto ${cod}`;
      const shelf = (row.prateleira || '').trim() || 'SEM LOCALIZAÇÃO';
      const qty = Math.max(0, Number(row.quantidade) || 0);

      if (!consolidatedMap.has(cod)) {
        consolidatedMap.set(cod, {
          codigo: cod,
          produto: prodName,
          localizacoesMap: new Map<string, number>()
        });
      }

      const entry = consolidatedMap.get(cod)!;
      // If product name is more detailed, use it
      if (prodName && !entry.produto) entry.produto = prodName;

      // Same code + same shelf => sum
      const currentShelfQty = entry.localizacoesMap.get(shelf) || 0;
      entry.localizacoesMap.set(shelf, currentShelfQty + qty);
    }

    let importedCount = 0;
    let updatedCount = 0;

    const existingProds = this.getProdutosByEstoque(estoqueId);
    const existingCodeMap = new Map(existingProds.map(p => [p.codigo.toLowerCase(), p]));

    for (const [code, item] of consolidatedMap.entries()) {
      const existing = existingCodeMap.get(code.toLowerCase());

      const locs: ProdutoLocalizacao[] = [];
      const prodId = existing ? existing.id : ('prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));

      for (const [shelf, qty] of item.localizacoesMap.entries()) {
        locs.push({
          id: 'loc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          produtoId: prodId,
          codigo: item.codigo,
          produto: item.produto,
          prateleira: shelf,
          quantidade: qty
        });
      }

      const totalQty = locs.reduce((s, l) => s + l.quantidade, 0);

      if (existing) {
        // Compare values for history
        if (existing.estoqueTotal !== totalQty) {
          this.addHistoricoEntry({
            estoqueId,
            usuario: userName,
            item: `${item.produto} (Sincronizado)`,
            valorAnterior: existing.estoqueTotal,
            novoValor: totalQty
          });
        }

        existing.produto = item.produto;
        existing.localizacoes = locs;
        existing.estoqueTotal = totalQty;
        existing.dataAtualizacao = formatDate();
        updatedCount++;
      } else {
        const newProd: Produto = {
          id: prodId,
          estoqueId,
          codigo: item.codigo,
          produto: item.produto,
          estoqueTotal: totalQty,
          localizacoes: locs,
          dataCadastro: formatDate(),
          dataAtualizacao: formatDate()
        };
        this.db.produtos.push(newProd);

        this.addHistoricoEntry({
          estoqueId,
          usuario: userName,
          item: `${item.produto} (Importado)`,
          valorAnterior: 0,
          novoValor: totalQty
        });
        importedCount++;
      }
    }

    est.ultimoSincronizacao = formatDate();
    this.save(this.db);
    return { importedCount, updatedCount };
  }
}

export const dbManager = new DBManager();
