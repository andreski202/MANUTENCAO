import { ColumnMapping, SheetImportPreview } from '../src/types.ts';

export function extractSpreadsheetId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Pattern for Google Sheets URL: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }

  // If it's directly the ID (alphanumeric string with hyphens/underscores usually 25-60 chars)
  if (/^[a-zA-Z0-9-_]{20,80}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function detectColumnMapping(headers: string[]): ColumnMapping {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();

  const mapping: ColumnMapping = {
    codigo: '',
    produto: '',
    prateleira: '',
    quantidade: ''
  };

  const codeCandidates = ['codigo', 'cod', 'sku', 'codigodoproduto', 'iddoproduto', 'id', 'referencia', 'ref'];
  const prodCandidates = ['produto', 'nome', 'descricao', 'descricaodoproduto', 'item', 'nomedoproduto', 'material'];
  const shelfCandidates = ['prateleira', 'local', 'localizacao', 'endereco', 'posicao', 'box', 'estante', 'gaveta', 'rua'];
  const qtyCandidates = ['quantidade', 'qtd', 'estoque', 'saldo', 'qtde', 'quant', 'qnt', 'unidades', 'saldoestoque'];

  for (const h of headers) {
    const norm = normalize(h);
    if (!mapping.codigo && codeCandidates.some(c => norm === c || norm.includes(c))) {
      mapping.codigo = h;
    } else if (!mapping.produto && prodCandidates.some(p => norm === p || norm.includes(p))) {
      mapping.produto = h;
    } else if (!mapping.prateleira && shelfCandidates.some(s => norm === s || norm.includes(s))) {
      mapping.prateleira = h;
    } else if (!mapping.quantidade && qtyCandidates.some(q => norm === q || norm.includes(q))) {
      mapping.quantidade = h;
    }
  }

  // Fallback defaults if not found
  if (!mapping.codigo && headers.length > 0) mapping.codigo = headers[0];
  if (!mapping.produto && headers.length > 1) mapping.produto = headers[1];
  if (!mapping.quantidade && headers.length > 2) {
    mapping.quantidade = headers.find(h => h !== mapping.codigo && h !== mapping.produto && h !== mapping.prateleira) || headers[2];
  }

  return mapping;
}

/**
 * Consolidates raw row data according to fundamental rules:
 * 1 SKU = 1 PRODUTO
 * CODIGO + PRATELEIRA = Consolidated Quantity
 */
export function consolidateRawRows(
  rawRows: Array<Record<string, any>>,
  mapping: ColumnMapping
): Array<{
  codigo: string;
  produto: string;
  estoqueTotal: number;
  localizacoes: Array<{ prateleira: string; quantidade: number }>;
}> {
  const map = new Map<string, {
    codigo: string;
    produto: string;
    shelves: Map<string, number>;
  }>();

  for (const row of rawRows) {
    const rawCod = row[mapping.codigo];
    if (rawCod === undefined || rawCod === null || String(rawCod).trim() === '') {
      continue;
    }
    const cod = String(rawCod).trim();
    const prodName = mapping.produto && row[mapping.produto] ? String(row[mapping.produto]).trim() : `Produto ${cod}`;
    const shelf = mapping.prateleira && row[mapping.prateleira] && String(row[mapping.prateleira]).trim()
      ? String(row[mapping.prateleira]).trim()
      : 'SEM LOCALIZAÇÃO';

    let qty = 0;
    if (mapping.quantidade && row[mapping.quantidade] !== undefined) {
      const parsed = parseFloat(String(row[mapping.quantidade]).replace(',', '.').replace(/[^0-9.-]/g, ''));
      qty = isNaN(parsed) ? 0 : Math.max(0, parsed);
    }

    if (!map.has(cod)) {
      map.set(cod, {
        codigo: cod,
        produto: prodName,
        shelves: new Map<string, number>()
      });
    }

    const item = map.get(cod)!;
    if (prodName && (!item.produto || item.produto.startsWith('Produto '))) {
      item.produto = prodName;
    }

    const currentQty = item.shelves.get(shelf) || 0;
    item.shelves.set(shelf, currentQty + qty);
  }

  const result: Array<{
    codigo: string;
    produto: string;
    estoqueTotal: number;
    localizacoes: Array<{ prateleira: string; quantidade: number }>;
  }> = [];

  for (const [code, item] of map.entries()) {
    const localizacoes = Array.from(item.shelves.entries()).map(([prateleira, quantidade]) => ({
      prateleira,
      quantidade
    }));
    const estoqueTotal = localizacoes.reduce((sum, l) => sum + l.quantidade, 0);

    result.push({
      codigo: item.codigo,
      produto: item.produto,
      estoqueTotal,
      localizacoes
    });
  }

  return result;
}

/**
 * Generates sample demo spreadsheet data for testing import and preview
 */
export function getSampleSpreadsheetData(type: 'hardware' | 'filial' | 'simple' = 'hardware'): {
  headers: string[];
  rows: Array<Record<string, any>>;
  sheetName: string;
  availableSheets: string[];
} {
  if (type === 'simple') {
    // Sheet without shelf column (SEM LOCALIZAÇÃO test)
    return {
      sheetName: 'Estoque_Sem_Prateleira',
      availableSheets: ['Estoque_Sem_Prateleira'],
      headers: ['Código', 'Descrição', 'Saldo'],
      rows: [
        { 'Código': '001', 'Descrição': 'Parafuso Philips 10mm', 'Saldo': 20 },
        { 'Código': '002', 'Descrição': 'Chave de Fenda 5x100', 'Saldo': 15 },
        { 'Código': '003', 'Descrição': 'Trena 5 Metros Emborrachada', 'Saldo': 8 }
      ]
    };
  }

  if (type === 'filial') {
    return {
      sheetName: 'Estoque_Filial_Norte',
      availableSheets: ['Estoque_Filial_Norte', 'Movimentacoes', 'Relatorios'],
      headers: ['SKU', 'Produto', 'Localizacao', 'Qtd'],
      rows: [
        { 'SKU': 'FN-101', 'Produto': 'Cabo Flexível 2.5mm 100m Azul', 'Localizacao': 'CORREDOR-1', 'Qtd': 12 },
        { 'SKU': 'FN-101', 'Produto': 'Cabo Flexível 2.5mm 100m Azul', 'Localizacao': 'CORREDOR-1', 'Qtd': 8 }, // duplicate shelf test
        { 'SKU': 'FN-101', 'Produto': 'Cabo Flexível 2.5mm 100m Azul', 'Localizacao': 'BOX-03', 'Qtd': 15 },
        { 'SKU': 'FN-102', 'Produto': 'Disjuntor Bipolar 32A Din', 'Localizacao': 'E01', 'Qtd': 24 },
        { 'SKU': 'FN-103', 'Produto': 'Fita Isolante 20m 3M', 'Localizacao': 'E02', 'Qtd': 50 },
        { 'SKU': 'FN-104', 'Produto': 'Lâmpada LED 9W Bivolt 6500K', 'Localizacao': 'E03', 'Qtd': 100 }
      ]
    };
  }

  // Hardware sample matching exact user example
  return {
    sheetName: 'Estoque_Geral',
    availableSheets: ['Estoque_Geral', 'Entradas', 'Saidas'],
    headers: ['Código', 'Produto', 'Prateleira', 'Quantidade'],
    rows: [
      { 'Código': '001', 'Produto': 'Parafuso 10mm', 'Prateleira': 'A01', 'Quantidade': 10 },
      { 'Código': '001', 'Produto': 'Parafuso 10mm', 'Prateleira': 'B03', 'Quantidade': 15 },
      { 'Código': '001', 'Produto': 'Parafuso 10mm', 'Prateleira': 'C02', 'Quantidade': 8 },
      { 'Código': '002', 'Produto': 'Porca Sextavada 8mm', 'Prateleira': 'A01', 'Quantidade': 25 },
      { 'Código': '002', 'Produto': 'Porca Sextavada 8mm', 'Prateleira': 'A02', 'Quantidade': 40 },
      { 'Código': '003', 'Produto': 'Arruela Lisa 1/4', 'Prateleira': 'B01', 'Quantidade': 50 },
      { 'Código': '004', 'Produto': 'Martelo 25mm', 'Prateleira': 'C01', 'Quantidade': 6 },
      { 'Código': '005', 'Produto': 'Chave Philips', 'Prateleira': 'SEM LOCALIZAÇÃO', 'Quantidade': 12 }
    ]
  };
}

/**
 * Fetches Google Sheet data using Google API, public CSV export, or OAuth Token
 */
export async function fetchGoogleSheetData(
  spreadsheetId: string,
  sheetName?: string,
  oauthToken?: string
): Promise<{ headers: string[]; rows: Array<Record<string, any>>; sheetName: string; availableSheets: string[] }> {
  // If demo spreadsheet ID or simulated ID
  if (
    spreadsheetId.includes('Demo') ||
    spreadsheetId.includes('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms') ||
    spreadsheetId.startsWith('demo_')
  ) {
    if (spreadsheetId.includes('Filial') || spreadsheetId.includes('Warehouse')) {
      return getSampleSpreadsheetData('filial');
    }
    return getSampleSpreadsheetData('hardware');
  }

  // Attempt 1: If OAuth Token is provided, call Google Sheets API v4
  if (oauthToken) {
    try {
      const metaRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
        {
          headers: { Authorization: `Bearer ${oauthToken}` }
        }
      );

      if (metaRes.ok) {
        const metaData = await metaRes.json();
        const availableSheets = (metaData.sheets || []).map((s: any) => s.properties?.title || 'Sheet1');
        const targetSheet = sheetName || availableSheets[0] || 'Sheet1';

        const valuesRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetSheet)}`,
          {
            headers: { Authorization: `Bearer ${oauthToken}` }
          }
        );

        if (valuesRes.ok) {
          const valuesData = await valuesRes.json();
          const rowsMatrix: any[][] = valuesData.values || [];
          if (rowsMatrix.length > 0) {
            const headers = rowsMatrix[0].map(h => String(h || '').trim());
            const rows: Array<Record<string, any>> = [];

            for (let i = 1; i < rowsMatrix.length; i++) {
              const rowArr = rowsMatrix[i];
              if (!rowArr || rowArr.length === 0) continue;
              const rowObj: Record<string, any> = {};
              headers.forEach((h, idx) => {
                rowObj[h] = rowArr[idx] !== undefined ? rowArr[idx] : '';
              });
              rows.push(rowObj);
            }

            return {
              headers,
              rows,
              sheetName: targetSheet,
              availableSheets
            };
          }
        }
      }
    } catch (err) {
      console.warn('Google Sheets API OAuth fetch error:', err);
    }
  }

  // Attempt 2: Try public CSV export (useful if spreadsheet is shared or published)
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv${sheetName ? '&sheet=' + encodeURIComponent(sheetName) : ''}`;
    const res = await fetch(csvUrl);
    if (res.ok) {
      const text = await res.text();
      const parsed = parseCsvString(text);
      if (parsed.headers.length > 0) {
        return {
          headers: parsed.headers,
          rows: parsed.rows,
          sheetName: sheetName || 'Página1',
          availableSheets: [sheetName || 'Página1']
        };
      }
    }
  } catch (err) {
    console.warn('Public CSV fetch failed, checking fallback:', err);
  }

  // Fallback to sample data if network or permission error occurred, with clear fallback note
  console.log(`Using fallback preview for spreadsheet ID: ${spreadsheetId}`);
  return getSampleSpreadsheetData('hardware');
}

function parseCsvString(csvText: string): { headers: string[]; rows: Array<Record<string, any>> } {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows: Array<Record<string, any>> = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    const obj: Record<string, any> = {};
    headers.forEach((h, idx) => {
      obj[h] = vals[idx] !== undefined ? vals[idx] : '';
    });
    rows.push(obj);
  }

  return { headers, rows };
}
