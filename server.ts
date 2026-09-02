import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { dbManager } from './server/db.ts';
import {
  extractSpreadsheetId,
  detectColumnMapping,
  consolidateRawRows,
  fetchGoogleSheetData
} from './server/googleSheets.ts';
import { generateGoogleAppsScriptCode } from './server/appsScriptCode.ts';
import { User, ColumnMapping } from './src/types.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper middleware to extract logged user
  const getUserFromHeader = (req: express.Request): User | undefined => {
    const userId = req.headers['x-user-id'] as string;
    if (userId) {
      return dbManager.getUserById(userId);
    }
    return undefined;
  };

  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = getUserFromHeader(req);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }
    if (user.status !== 'ATIVO') {
      return res.status(403).json({ error: 'Usuário inativo. Contate o administrador.' });
    }
    (req as any).user = user;
    next();
  };

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = getUserFromHeader(req);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }
    if (user.perfil !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado: Somente administradores podem realizar esta operação.' });
    }
    (req as any).user = user;
    next();
  };

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const user = dbManager.authenticate(email, password);
    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    res.json({
      success: true,
      user,
      token: 'tok_' + user.id + '_' + Date.now()
    });
  });

  // Auth: Change Password
  app.post('/api/auth/change-password', requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Informe a senha atual e a nova senha.' });
    }
    if (newPassword.length < 5) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 5 caracteres.' });
    }

    const changed = dbManager.changePassword(user.id, oldPassword, newPassword);
    if (!changed) {
      return res.status(400).json({ error: 'A senha atual informada está incorreta.' });
    }

    res.json({ success: true, message: 'Senha alterada com sucesso.' });
  });

  // Dashboard Stats
  app.get('/api/dashboard', requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const estoqueId = (req.query.estoqueId as string) || undefined;
    const stats = dbManager.getDashboardStats(estoqueId, user);
    res.json(stats);
  });

  // Estoques: List
  app.get('/api/estoques', requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const estoques = dbManager.getEstoques(user);
    res.json(estoques);
  });

  // Estoques: Preview spreadsheet import before confirming
  app.post('/api/estoques/preview', requireAdmin, async (req, res) => {
    const { url, sheetName, oauthToken } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'A URL ou ID da planilha é obrigatório.' });
    }

    const spreadsheetId = extractSpreadsheetId(url);
    if (!spreadsheetId) {
      return res.status(400).json({ error: 'URL da planilha inválida. Forneça uma URL válida do Google Sheets ou ID de planilha.' });
    }

    try {
      const sheetData = await fetchGoogleSheetData(spreadsheetId, sheetName, oauthToken);
      if (sheetData.headers.length === 0) {
        return res.status(400).json({ error: 'Não foi possível ler os cabeçalhos da planilha.' });
      }

      const suggestedMapping = detectColumnMapping(sheetData.headers);
      const consolidatedPreview = consolidateRawRows(sheetData.rows, suggestedMapping);

      res.json({
        success: true,
        spreadsheetId,
        sheetName: sheetData.sheetName,
        availableSheets: sheetData.availableSheets,
        headers: sheetData.headers,
        suggestedMapping,
        previewRows: sheetData.rows.slice(0, 10),
        consolidatedPreview: consolidatedPreview.slice(0, 10),
        totalRawRows: sheetData.rows.length,
        totalUniqueProducts: consolidatedPreview.length
      });
    } catch (err: any) {
      console.error('Error fetching sheet preview:', err);
      res.status(500).json({ error: 'Não foi possível acessar a planilha: ' + (err.message || 'Erro desconhecido') });
    }
  });

  // Estoques: Create new stock (ADMIN only)
  app.post('/api/estoques', requireAdmin, async (req, res) => {
    const { nome, url, sheetName, columnMapping, oauthToken } = req.body;
    if (!nome || !url) {
      return res.status(400).json({ error: 'Nome do estoque e URL da planilha são obrigatórios.' });
    }

    const spreadsheetId = extractSpreadsheetId(url);
    if (!spreadsheetId) {
      return res.status(400).json({ error: 'URL da planilha inválida.' });
    }

    try {
      const sheetData = await fetchGoogleSheetData(spreadsheetId, sheetName, oauthToken);
      const headers = sheetData.headers;
      const finalMapping: ColumnMapping = columnMapping || detectColumnMapping(headers);

      const newEstoque = dbManager.createEstoque({
        nome: nome.trim(),
        spreadsheetId,
        url: url.trim(),
        sheetName: sheetData.sheetName,
        availableSheets: sheetData.availableSheets,
        columnMapping: finalMapping
      });

      // Import initial data
      if (sheetData.rows.length > 0) {
        const rawProducts = sheetData.rows.map(row => ({
          codigo: String(row[finalMapping.codigo] || '').trim(),
          produto: finalMapping.produto && row[finalMapping.produto] ? String(row[finalMapping.produto]).trim() : `Produto ${row[finalMapping.codigo]}`,
          prateleira: finalMapping.prateleira && row[finalMapping.prateleira] ? String(row[finalMapping.prateleira]).trim() : 'SEM LOCALIZAÇÃO',
          quantidade: finalMapping.quantidade && row[finalMapping.quantidade] ? parseFloat(String(row[finalMapping.quantidade]).replace(',', '.')) || 0 : 0
        }));

        dbManager.syncEstoqueProducts(newEstoque.id, rawProducts, (req as any).user.nome);
      }

      res.status(201).json({
        success: true,
        estoque: newEstoque,
        message: 'Estoque conectado e importado com sucesso.'
      });
    } catch (err: any) {
      console.error('Error creating estoque:', err);
      res.status(500).json({ error: 'Não foi possível conectar a planilha: ' + (err.message || 'Erro desconhecido') });
    }
  });

  // Estoques: Disconnect / Delete (ADMIN only)
  app.delete('/api/estoques/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const est = dbManager.getEstoqueById(id);
    if (!est) {
      return res.status(404).json({ error: 'Estoque não encontrado.' });
    }

    dbManager.deleteEstoque(id);
    res.json({ success: true, message: `Conexão com o estoque '${est.nome}' removida com sucesso. A planilha original não foi modificada.` });
  });

  // Estoques: Sync with Google Sheets (ADMIN only)
  app.post('/api/estoques/:id/sync', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { oauthToken, manualMapping } = req.body;

    const est = dbManager.getEstoqueById(id);
    if (!est) {
      return res.status(404).json({ error: 'Estoque não encontrado.' });
    }

    try {
      const sheetData = await fetchGoogleSheetData(est.spreadsheetId, est.sheetName, oauthToken);
      const mapping = manualMapping || est.columnMapping || detectColumnMapping(sheetData.headers);

      const rawProducts = sheetData.rows.map(row => ({
        codigo: String(row[mapping.codigo] || '').trim(),
        produto: mapping.produto && row[mapping.produto] ? String(row[mapping.produto]).trim() : `Produto ${row[mapping.codigo]}`,
        prateleira: mapping.prateleira && row[mapping.prateleira] ? String(row[mapping.prateleira]).trim() : 'SEM LOCALIZAÇÃO',
        quantidade: mapping.quantidade && row[mapping.quantidade] ? parseFloat(String(row[mapping.quantidade]).replace(',', '.')) || 0 : 0
      }));

      const syncStats = dbManager.syncEstoqueProducts(est.id, rawProducts, (req as any).user.nome);
      dbManager.updateEstoque(est.id, {
        columnMapping: mapping,
        status: 'CONECTADO'
      });

      res.json({
        success: true,
        message: 'Sincronização concluída com sucesso.',
        ...syncStats
      });
    } catch (err: any) {
      console.error('Error syncing estoque:', err);
      dbManager.updateEstoque(est.id, { status: 'ERRO' });
      res.status(500).json({ error: 'Erro ao sincronizar com a planilha: ' + (err.message || 'Erro de conexão') });
    }
  });

  // Produtos: List (with fast search, filtering by stock, shelf, availability)
  app.get('/api/produtos', requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const { estoqueId, search, prateleira, disponibilidade } = req.query as {
      estoqueId?: string;
      search?: string;
      prateleira?: string;
      disponibilidade?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
    };

    let targetEstoqueId = estoqueId;
    const userEstoques = dbManager.getEstoques(user);

    if (!targetEstoqueId || targetEstoqueId === 'all') {
      if (userEstoques.length > 0) {
        targetEstoqueId = userEstoques[0].id;
      } else {
        return res.json([]);
      }
    }

    // Check permission
    if (!dbManager.canUserAccessEstoque(user, targetEstoqueId)) {
      return res.status(403).json({ error: 'Você não possui permissão para acessar este estoque.' });
    }

    let prods = dbManager.getProdutosByEstoque(targetEstoqueId);

    // Filter by search query (código, produto/nome/descrição, prateleira)
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      prods = prods.filter(p => {
        const matchCode = p.codigo.toLowerCase().includes(q);
        const matchName = p.produto.toLowerCase().includes(q);
        const matchShelf = p.localizacoes.some(l => l.prateleira.toLowerCase().includes(q));
        return matchCode || matchName || matchShelf;
      });
    }

    // Filter by shelf
    if (prateleira && prateleira.trim() && prateleira !== 'all') {
      const shelfNorm = prateleira.toLowerCase().trim();
      prods = prods.filter(p => p.localizacoes.some(l => l.prateleira.toLowerCase() === shelfNorm && l.quantidade > 0));
    }

    // Filter by availability
    if (disponibilidade) {
      if (disponibilidade === 'in_stock') {
        prods = prods.filter(p => p.estoqueTotal > 0);
      } else if (disponibilidade === 'low_stock') {
        prods = prods.filter(p => p.estoqueTotal > 0 && p.estoqueTotal <= 5);
      } else if (disponibilidade === 'out_of_stock') {
        prods = prods.filter(p => p.estoqueTotal === 0);
      }
    }

    res.json(prods);
  });

  // Produtos: Create (ADMIN only)
  app.post('/api/produtos', requireAdmin, (req, res) => {
    const { estoqueId, codigo, produto, prateleira, quantidade } = req.body;
    if (!estoqueId || !codigo || !produto) {
      return res.status(400).json({ error: 'Estoque, Código e Produto são obrigatórios.' });
    }

    const est = dbManager.getEstoqueById(estoqueId);
    if (!est) {
      return res.status(404).json({ error: 'Estoque não encontrado.' });
    }

    const prod = dbManager.addOrUpdateProduto(
      estoqueId,
      {
        codigo,
        produto,
        prateleira: prateleira || 'SEM LOCALIZAÇÃO',
        quantidade: Number(quantidade) || 0
      },
      (req as any).user.nome
    );

    res.status(201).json({ success: true, produto: prod });
  });

  // Produtos: Edit (ADMIN only)
  app.put('/api/produtos/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { codigo, produto, localizacoes } = req.body;

    if (!codigo || !produto || !Array.isArray(localizacoes)) {
      return res.status(400).json({ error: 'Código, Produto e Localizações são obrigatórios.' });
    }

    const updated = dbManager.editProduto(
      id,
      { codigo, produto, localizacoes },
      (req as any).user.nome
    );

    if (!updated) {
      return res.status(404).json({ error: 'Este produto não existe.' });
    }

    res.json({ success: true, produto: updated });
  });

  // Produtos: Delete (ADMIN only)
  app.delete('/api/produtos/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const deleted = dbManager.deleteProduto(id, (req as any).user.nome);
    if (!deleted) {
      return res.status(404).json({ error: 'Este produto não existe.' });
    }
    res.json({ success: true, message: 'Produto removido com sucesso.' });
  });

  // Operações: Entrada de Estoque (ADMIN only)
  app.post('/api/operacoes/entrada', requireAdmin, (req, res) => {
    const { estoqueId, codigoOrId, prateleira, quantidade } = req.body;
    if (!estoqueId || !codigoOrId || quantidade === undefined) {
      return res.status(400).json({ error: 'Estoque, Produto e Quantidade são obrigatórios.' });
    }

    const result = dbManager.entradaEstoque(
      estoqueId,
      codigoOrId,
      prateleira || 'SEM LOCALIZAÇÃO',
      Number(quantidade),
      (req as any).user.nome
    );

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json(result);
  });

  // Operações: Saída de Estoque (ADMIN only)
  app.post('/api/operacoes/saida', requireAdmin, (req, res) => {
    const { estoqueId, codigoOrId, prateleira, quantidade } = req.body;
    if (!estoqueId || !codigoOrId || quantidade === undefined) {
      return res.status(400).json({ error: 'Estoque, Produto e Quantidade são obrigatórios.' });
    }

    const result = dbManager.saidaEstoque(
      estoqueId,
      codigoOrId,
      prateleira || 'SEM LOCALIZAÇÃO',
      Number(quantidade),
      (req as any).user.nome
    );

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json(result);
  });

  // Operações: Mover entre Prateleiras (ADMIN only)
  app.post('/api/operacoes/mover', requireAdmin, (req, res) => {
    const { estoqueId, codigoOrId, prateleiraOrigem, prateleiraDestino, quantidade } = req.body;
    if (!estoqueId || !codigoOrId || !prateleiraOrigem || !prateleiraDestino || quantidade === undefined) {
      return res.status(400).json({ error: 'Estoque, Produto, Prateleira Origem, Prateleira Destino e Quantidade são obrigatórios.' });
    }

    const result = dbManager.moverEstoque(
      estoqueId,
      codigoOrId,
      prateleiraOrigem,
      prateleiraDestino,
      Number(quantidade),
      (req as any).user.nome
    );

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json(result);
  });

  // Histórico: Retorna tabela estrita: Data | Usuário | Item | Valor anterior | Novo valor
  app.get('/api/historico', requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const { estoqueId } = req.query as { estoqueId?: string };

    if (estoqueId && estoqueId !== 'all') {
      if (!dbManager.canUserAccessEstoque(user, estoqueId)) {
        return res.status(403).json({ error: 'Você não possui permissão para acessar o histórico deste estoque.' });
      }
    }

    const historico = dbManager.getHistorico(estoqueId);
    res.json(historico);
  });

  // Usuários: List (ADMIN only)
  app.get('/api/usuarios', requireAdmin, (req, res) => {
    const users = dbManager.getUsers();
    const rawDB = dbManager.getRawDB();
    const usersWithPerms = users.map(u => ({
      ...u,
      allowedEstoques: rawDB.permissoes.filter(p => p.usuarioId === u.id).map(p => p.estoqueId)
    }));
    res.json(usersWithPerms);
  });

  // Usuários: Create (ADMIN only)
  app.post('/api/usuarios', requireAdmin, (req, res) => {
    const { nome, email, perfil, password, allowedEstoques } = req.body;
    if (!nome || !email || !perfil) {
      return res.status(400).json({ error: 'Nome, E-mail e Perfil são obrigatórios.' });
    }

    const existing = dbManager.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Já existe um usuário cadastrado com este e-mail.' });
    }

    const created = dbManager.createUser({
      nome,
      email,
      perfil,
      password: password || (perfil === 'ADMIN' ? 'adm12345' : 'vis12345'),
      allowedEstoques: allowedEstoques || []
    });

    res.status(201).json({ success: true, user: created });
  });

  // Usuários: Update (ADMIN only)
  app.put('/api/usuarios/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { nome, email, perfil, status, password, allowedEstoques } = req.body;

    const updated = dbManager.updateUser(id, {
      nome,
      email,
      perfil,
      status,
      password,
      allowedEstoques
    });

    if (!updated) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json({ success: true, user: updated });
  });

  // Usuários: Delete (ADMIN only)
  app.delete('/api/usuarios/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const currentAdmin = (req as any).user as User;
    if (currentAdmin.id === id) {
      return res.status(400).json({ error: 'Você não pode excluir o seu próprio usuário administrador.' });
    }

    const deleted = dbManager.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    res.json({ success: true, message: 'Usuário removido com sucesso.' });
  });

  // Google Apps Script code generator endpoint
  app.get('/api/apps-script-code', requireAuth, (req, res) => {
    const code = generateGoogleAppsScriptCode();
    res.json({ code });
  });

  // --- Vite Dev & Static Serving Setup ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
