import React, { useState } from 'react';
import { Search, Download, Layers, Database } from 'lucide-react';
import { HistoricoItem, Estoque } from '../types.ts';

interface HistoricoTableProps {
  historico?: HistoricoItem[];
  logs?: HistoricoItem[];
  estoques?: Estoque[];
  activeEstoqueId?: string;
  onEstoqueChange?: (id: string) => void;
  estoqueNome?: string;
}

export const HistoricoTable: React.FC<HistoricoTableProps> = ({
  historico,
  logs,
  estoques,
  activeEstoqueId,
  onEstoqueChange
}) => {
  const items = historico || logs || [];
  const [search, setSearch] = useState('');

  const filteredLogs = items.filter((log) => {
    const term = search.toLowerCase();
    return (
      (log.usuario && log.usuario.toLowerCase().includes(term)) ||
      (log.item && log.item.toLowerCase().includes(term)) ||
      (log.data && log.data.toLowerCase().includes(term))
    );
  });

  const handleExportCSV = () => {
    const headers = ['Data', 'Usuario', 'Item', 'Valor_Anterior', 'Novo_Valor'];
    const rows = (filteredLogs || []).map(l => [
      `"${l.data}"`,
      `"${l.usuario}"`,
      `"${l.item ? l.item.replace(/"/g, '""') : ''}"`,
      l.valorAnterior,
      l.novoValor
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `historico_estoque_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      
      {/* Controles de Busca e Exportação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#555555] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por item, usuário ou data..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#E5E5E5] rounded pl-10 pr-4 py-2.5 text-sm text-[#111111] placeholder-[#555555] focus:border-[#111111] focus:outline-none transition shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {estoques && estoques.length > 1 && onEstoqueChange && (
            <div className="flex items-center gap-1.5 bg-white border border-[#E5E5E5] rounded px-3 py-2">
              <Database className="w-3.5 h-3.5 text-[#555555]" />
              <select
                value={activeEstoqueId || 'all'}
                onChange={(e) => onEstoqueChange(e.target.value)}
                className="bg-transparent text-xs text-[#111111] font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">Todos os Estoques</option>
                {(estoques || []).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-white hover:bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] text-xs font-medium rounded transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#555555]" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Tabela com exatamente as 5 colunas requeridas:
          1. Data
          2. Usuário
          3. Item
          4. Valor Anterior
          5. Novo Valor
      */}
      <div className="bg-white border border-[#E5E5E5] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table id="table-historico" className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F7F7F7] text-[#555555] font-semibold border-b border-[#E5E5E5]">
              <tr>
                <th className="py-3 px-4 w-44">Data</th>
                <th className="py-3 px-4 w-48">Usuário</th>
                <th className="py-3 px-4 min-w-[200px]">Item</th>
                <th className="py-3 px-4 w-32 text-center">Valor Anterior</th>
                <th className="py-3 px-4 w-32 text-center">Novo Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5] bg-white">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#555555]">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Layers className="w-6 h-6 text-[#999999]" />
                      <span className="font-medium text-[#111111] text-xs">Nenhum registro encontrado</span>
                      <span className="text-[11px] text-[#555555]">
                        As movimentações de estoque serão listadas aqui.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const diff = log.novoValor - log.valorAnterior;
                  return (
                    <tr key={log.id} className="hover:bg-[#F7F7F7] transition">
                      {/* 1. Data */}
                      <td className="py-3 px-4 font-mono text-[#555555]">
                        {log.data}
                      </td>

                      {/* 2. Usuário */}
                      <td className="py-3 px-4 font-medium text-[#111111]">
                        {log.usuario}
                      </td>

                      {/* 3. Item */}
                      <td className="py-3 px-4 text-[#111111]">
                        {log.item}
                      </td>

                      {/* 4. Valor Anterior */}
                      <td className="py-3 px-4 text-center font-mono text-[#555555]">
                        {log.valorAnterior} un
                      </td>

                      {/* 5. Novo Valor */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-mono font-bold text-[#111111]">
                            {log.novoValor} un
                          </span>
                          {diff !== 0 && (
                            <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-[#F3F3F3] text-[#555555] border border-[#E5E5E5]">
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
