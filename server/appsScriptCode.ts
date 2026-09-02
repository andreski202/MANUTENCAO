/**
 * Generates the full Google Apps Script (GAS) code template
 * which can be embedded in Google Sheets via Extensões > Apps Script.
 */
export function generateGoogleAppsScriptCode(): string {
  return `/**
 * =========================================================================
 * SISTEMA DE CONTROLE DE ESTOQUE - GOOGLE APPS SCRIPT BACKEND
 * =========================================================================
 * 
 * COMO INSTALAR:
 * 1. Na sua planilha Google Sheets, acesse: Extensões > Apps Script
 * 2. Cole este código no arquivo "Código.gs" (substituindo qualquer código existente)
 * 3. Para criar um Web App (Webhook de sincronização automática):
 *    - Clique em "Implantar" > "Nova implantação"
 *    - Tipo: "App da Web"
 *    - Executar como: "Eu"
 *    - Quem tem acesso: "Qualquer pessoa" (ou sua organização)
 *    - Copie a URL do Web App gerada
 * 4. Salve e aprove as permissões solicitadas.
 */

// Configuração dos nomes padrão das abas
const SHEETS_CONFIG = {
  ESTOQUE: 'ESTOQUE',
  HISTORICO: 'HISTORICO',
  USUARIOS: 'USUARIOS',
  ESTOQUES: 'ESTOQUES'
};

/**
 * Menu customizado adicionado automaticamente ao abrir a planilha
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📦 Controle de Estoque')
    .addItem('⚡ Consolidar e Atualizar Estoque', 'menuConsolidarEstoque')
    .addItem('📥 Registrar Entrada Rápida', 'menuRegistrarEntrada')
    .addItem('📤 Registrar Saída Rápida', 'menuRegistrarSaida')
    .addSeparator()
    .addItem('⚙️ Inicializar Estrutura Padrão', 'inicializarEstruturaPlanilha')
    .addToUi();
}

/**
 * Inicializa a estrutura de abas e colunas padrão caso não existam
 */
function inicializarEstruturaPlanilha() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Aba ESTOQUE
  let sheetEstoque = ss.getSheetByName(SHEETS_CONFIG.ESTOQUE);
  if (!sheetEstoque) {
    sheetEstoque = ss.insertSheet(SHEETS_CONFIG.ESTOQUE);
    sheetEstoque.appendRow(['Código', 'Produto', 'Prateleira', 'Quantidade', 'Última Atualização']);
    sheetEstoque.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#E8F0FE');
  }

  // 2. Aba HISTORICO (Tabela estrita: Data, Usuário, Item, Valor anterior, Novo valor)
  let sheetHist = ss.getSheetByName(SHEETS_CONFIG.HISTORICO);
  if (!sheetHist) {
    sheetHist = ss.insertSheet(SHEETS_CONFIG.HISTORICO);
    sheetHist.appendRow(['Data', 'Usuário', 'Item', 'Valor anterior', 'Novo valor']);
    sheetHist.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#FEF3D6');
  }

  SpreadsheetApp.getUi().alert('Estrutura de estoque inicializada com sucesso!');
}

/**
 * Endpoint Web App (GET): Retorna dados consolidados em JSON
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS_CONFIG.ESTOQUE) || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        headers: [],
        rows: [],
        produtosConsolidados: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const headers = data[0].map(h => String(h).trim());
    const rows = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx];
      });
      rows.push(obj);
    }

    const consolidados = consolidarDadosEstoque(headers, rows);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      sheetName: sheet.getName(),
      headers: headers,
      rows: rows,
      produtosConsolidados: consolidados
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Endpoint Web App (POST): Processa operações de Entrada, Saída, Movimentação ou Sync
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action; // 'entrada' | 'saida' | 'mover' | 'sync'
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'entrada') {
      const res = executarEntrada(ss, payload.codigo, payload.produto, payload.prateleira, Number(payload.quantidade), payload.usuario || 'Sistema Web');
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'saida') {
      const res = executarSaida(ss, payload.codigo, payload.prateleira, Number(payload.quantidade), payload.usuario || 'Sistema Web');
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'mover') {
      const res = executarMovimentacao(ss, payload.codigo, payload.prateleiraOrigem, payload.prateleiraDestino, Number(payload.quantidade), payload.usuario || 'Sistema Web');
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Ação não reconhecida' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Regra Fundamental: 1 SKU = 1 PRODUTO
 * Chave de consolidação: CÓDIGO + PRATELEIRA
 */
function consolidarDadosEstoque(headers, rows) {
  // Identifica colunas
  const colCod = headers.find(h => /codigo|cod|sku/i.test(h)) || headers[0];
  const colProd = headers.find(h => /produto|nome|descricao/i.test(h)) || headers[1];
  const colPrat = headers.find(h => /prateleira|local|endereco/i.test(h));
  const colQtd = headers.find(h => /quantidade|qtd|saldo|estoque/i.test(h)) || headers[2];

  const map = {};

  rows.forEach(r => {
    const cod = String(r[colCod] || '').trim();
    if (!cod) return;

    const prodNome = String(r[colProd] || '').trim() || ('Produto ' + cod);
    const prateleira = colPrat && r[colPrat] ? String(r[colPrat]).trim() : 'SEM LOCALIZAÇÃO';
    const qtd = Number(r[colQtd]) || 0;

    if (!map[cod]) {
      map[cod] = {
        codigo: cod,
        produto: prodNome,
        localizacoes: {}
      };
    }

    if (!map[cod].localizacoes[prateleira]) {
      map[cod].localizacoes[prateleira] = 0;
    }
    map[cod].localizacoes[prateleira] += qtd;
  });

  const resultado = [];
  for (const cod in map) {
    const item = map[cod];
    const locArray = [];
    let total = 0;
    for (const p in item.localizacoes) {
      locArray.push({ prateleira: p, quantidade: item.localizacoes[p] });
      total += item.localizacoes[p];
    }
    resultado.push({
      codigo: item.codigo,
      produto: item.produto,
      estoqueTotal: total,
      distribuicao: locArray
    });
  }

  return resultado;
}

/**
 * Registra movimentação no Histórico estrito: Data | Usuário | Item | Valor anterior | Novo valor
 */
function registrarHistorico(ss, usuario, item, valorAnterior, novoValor) {
  let sheetHist = ss.getSheetByName(SHEETS_CONFIG.HISTORICO);
  if (!sheetHist) {
    sheetHist = ss.insertSheet(SHEETS_CONFIG.HISTORICO);
    sheetHist.appendRow(['Data', 'Usuário', 'Item', 'Valor anterior', 'Novo valor']);
  }
  const dataFormatada = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  sheetHist.appendRow([dataFormatada, usuario, item, valorAnterior, novoValor]);
}

function executarEntrada(ss, codigo, produto, prateleira, quantidade, usuario) {
  const sheet = ss.getSheetByName(SHEETS_CONFIG.ESTOQUE) || ss.getSheets()[0];
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colCodIdx = headers.findIndex(h => /codigo|cod|sku/i.test(h));
  const colPratIdx = headers.findIndex(h => /prateleira|local/i.test(h));
  const colQtdIdx = headers.findIndex(h => /quantidade|qtd|saldo/i.test(h));

  const targetPrateleira = prateleira || 'SEM LOCALIZAÇÃO';
  let foundRow = -1;
  let valorAnterior = 0;

  for (let i = 1; i < data.length; i++) {
    const rowCod = String(data[i][colCodIdx] || '').trim();
    const rowPrat = colPratIdx >= 0 ? String(data[i][colPratIdx] || '').trim() : 'SEM LOCALIZAÇÃO';
    if (rowCod === String(codigo).trim() && rowPrat.toLowerCase() === targetPrateleira.toLowerCase()) {
      foundRow = i + 1;
      valorAnterior = Number(data[i][colQtdIdx]) || 0;
      break;
    }
  }

  const novoValor = valorAnterior + quantidade;

  if (foundRow > 0) {
    sheet.getRange(foundRow, colQtdIdx + 1).setValue(novoValor);
  } else {
    sheet.appendRow([codigo, produto, targetPrateleira, quantidade, new Date()]);
  }

  registrarHistorico(ss, usuario, produto + ' (' + targetPrateleira + ')', valorAnterior, novoValor);
  return { success: true, valorAnterior: valorAnterior, novoValor: novoValor };
}

function executarSaida(ss, codigo, prateleira, quantidade, usuario) {
  const sheet = ss.getSheetByName(SHEETS_CONFIG.ESTOQUE) || ss.getSheets()[0];
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colCodIdx = headers.findIndex(h => /codigo|cod|sku/i.test(h));
  const colProdIdx = headers.findIndex(h => /produto|nome|descricao/i.test(h));
  const colPratIdx = headers.findIndex(h => /prateleira|local/i.test(h));
  const colQtdIdx = headers.findIndex(h => /quantidade|qtd|saldo/i.test(h));

  const targetPrateleira = prateleira || 'SEM LOCALIZAÇÃO';
  let foundRow = -1;
  let valorAnterior = 0;
  let produtoNome = 'Produto ' + codigo;

  for (let i = 1; i < data.length; i++) {
    const rowCod = String(data[i][colCodIdx] || '').trim();
    const rowPrat = colPratIdx >= 0 ? String(data[i][colPratIdx] || '').trim() : 'SEM LOCALIZAÇÃO';
    if (rowCod === String(codigo).trim() && rowPrat.toLowerCase() === targetPrateleira.toLowerCase()) {
      foundRow = i + 1;
      valorAnterior = Number(data[i][colQtdIdx]) || 0;
      if (colProdIdx >= 0) produtoNome = data[i][colProdIdx];
      break;
    }
  }

  if (foundRow < 0) {
    return { success: false, error: 'Produto/Prateleira não encontrados.' };
  }

  if (valorAnterior < quantidade) {
    return { success: false, error: 'Quantidade insuficiente nesta prateleira.' };
  }

  const novoValor = valorAnterior - quantidade;
  sheet.getRange(foundRow, colQtdIdx + 1).setValue(novoValor);
  registrarHistorico(ss, usuario, produtoNome + ' (' + targetPrateleira + ')', valorAnterior, novoValor);
  return { success: true, valorAnterior: valorAnterior, novoValor: novoValor };
}

function executarMovimentacao(ss, codigo, prateleiraOrigem, prateleiraDestino, quantidade, usuario) {
  const resSaida = executarSaida(ss, codigo, prateleiraOrigem, quantidade, usuario);
  if (!resSaida.success) return resSaida;
  return executarEntrada(ss, codigo, 'Produto ' + codigo, prateleiraDestino, quantidade, usuario);
}

function menuConsolidarEstoque() {
  SpreadsheetApp.getUi().alert('Estoque consolidado com sucesso no Sistema Web!');
}
`;
}
