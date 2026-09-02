import React from 'react';
import {
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Edit2,
  Trash2,
  Eye,
  Layers
} from 'lucide-react';
import { Produto, User } from '../types.ts';

interface ProductsTableProps {
  produtos: Produto[];
  user: User;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewProduct: () => void;
  onViewProduct: (produto: Produto) => void;
  onEntrada: (produto?: Produto, prateleira?: string) => void;
  onSaida: (produto?: Produto, prateleira?: string) => void;
  onMover: (produto?: Produto, prateleiraOrigem?: string) => void;
  onEditProduct: (produto: Produto) => void;
  onDeleteProduct: (produto: Produto) => void;
  filterDisponibilidade: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  onFilterDisponibilidadeChange: (val: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') => void;
  filterPrateleira: string;
  onFilterPrateleiraChange: (val: string) => void;
  allPrateleiras: string[];
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  produtos,
  user,
  searchQuery,
  onSearchChange,
  onNewProduct,
  onViewProduct,
  onEntrada,
  onSaida,
  onMover,
  onEditProduct,
  onDeleteProduct,
  filterDisponibilidade,
  onFilterDisponibilidadeChange,
  filterPrateleira,
  onFilterPrateleiraChange,
  allPrateleiras
}) => {
  const isAdmin = user.perfil === 'ADMIN';

  return (
    <div className="space-y-4">
      
      {/* 8. PESQUISA & AÇÕES DE TOPO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Campo de pesquisa largo e simples */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#555555] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar produto, código ou prateleira..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white border border-[#E5E5E5] rounded pl-10 pr-4 py-2.5 text-sm text-[#111111] placeholder-[#555555] focus:border-[#111111] focus:outline-none transition shadow-2xs"
          />
        </div>

        {/* Botão Novo Produto (ADMIN) */}
        {isAdmin && (
          <button
            id="btn-add-product"
            onClick={onNewProduct}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        )}
      </div>

      {/* FILTROS ABAIXO DA PESQUISA */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onFilterDisponibilidadeChange('all')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
              filterDisponibilidade === 'all'
                ? 'bg-[#111111] text-white'
                : 'bg-white border border-[#E5E5E5] text-[#555555] hover:bg-[#F7F7F7]'
            }`}
          >
            Todos ({produtos.length})
          </button>

          <button
            onClick={() => onFilterDisponibilidadeChange('in_stock')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
              filterDisponibilidade === 'in_stock'
                ? 'bg-[#111111] text-white'
                : 'bg-white border border-[#E5E5E5] text-[#555555] hover:bg-[#F7F7F7]'
            }`}
          >
            Em Estoque
          </button>

          <button
            onClick={() => onFilterDisponibilidadeChange('low_stock')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
              filterDisponibilidade === 'low_stock'
                ? 'bg-[#111111] text-white'
                : 'bg-white border border-[#E5E5E5] text-[#555555] hover:bg-[#F7F7F7]'
            }`}
          >
            Baixo Estoque (≤5)
          </button>

          <button
            onClick={() => onFilterDisponibilidadeChange('out_of_stock')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
              filterDisponibilidade === 'out_of_stock'
                ? 'bg-[#111111] text-white'
                : 'bg-white border border-[#E5E5E5] text-[#555555] hover:bg-[#F7F7F7]'
            }`}
          >
            Sem Estoque
          </button>

          {allPrateleiras && allPrateleiras.length > 0 && (
            <select
              value={filterPrateleira}
              onChange={(e) => onFilterPrateleiraChange(e.target.value)}
              className="bg-white border border-[#E5E5E5] text-xs text-[#111111] font-medium rounded px-2.5 py-1.5 focus:border-[#111111] focus:outline-none cursor-pointer"
            >
              <option value="all">Todas as Prateleiras</option>
              {(allPrateleiras || []).map(s => (
                <option key={s} value={s}>Prateleira: {s}</option>
              ))}
            </select>
          )}
        </div>

        {/* Botões Rápidos Globais de Movimentação (ADMIN) */}
        {isAdmin && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEntrada()}
              className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] text-xs font-medium rounded transition cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Entrada</span>
            </button>
            <button
              onClick={() => onSaida()}
              className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] text-xs font-medium rounded transition cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Saída</span>
            </button>
            <button
              onClick={() => onMover()}
              className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] text-xs font-medium rounded transition cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Mover</span>
            </button>
          </div>
        )}
      </div>

      {/* 7. TABELA PRINCIPAL */}
      <div className="bg-white border border-[#E5E5E5] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F7F7F7] text-[#555555] font-semibold border-b border-[#E5E5E5]">
              <tr>
                <th className="py-3 px-4 w-28">Código</th>
                <th className="py-3 px-4 min-w-[200px]">Produto</th>
                <th className="py-3 px-4 w-28 text-center">Estoque</th>
                <th className="py-3 px-4 w-28 text-center">Prateleiras</th>
                <th className="py-3 px-4 w-40 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5] bg-white">
              {(!produtos || produtos.length === 0) ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#555555]">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Layers className="w-6 h-6 text-[#999999]" />
                      <span className="font-medium text-[#111111] text-xs">Nenhum produto encontrado</span>
                      <span className="text-[11px] text-[#555555]">
                        Ajuste os filtros ou adicione novos produtos.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                (produtos || []).map((prod) => {
                  const uniqueShelvesCount = (prod.localizacoes || []).length;
                  const isOutOfStock = prod.estoqueTotal === 0;

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-[#F7F7F7] transition cursor-pointer"
                      onClick={() => onViewProduct(prod)}
                    >
                      {/* Código */}
                      <td className="py-3 px-4 font-mono font-medium text-[#111111]">
                        {prod.codigo}
                      </td>

                      {/* Produto */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#111111] block">
                          {prod.produto}
                        </span>
                      </td>

                      {/* Estoque Total */}
                      <td className="py-3 px-4 text-center">
                        <span className={`font-mono font-bold ${isOutOfStock ? 'text-red-700' : 'text-[#111111]'}`}>
                          {prod.estoqueTotal}
                        </span>
                      </td>

                      {/* Prateleiras (quantidade de prateleiras onde o item está) */}
                      <td className="py-3 px-4 text-center text-[#555555] font-mono">
                        {uniqueShelvesCount}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          
                          {/* Botão Visualizar */}
                          <button
                            onClick={() => onViewProduct(prod)}
                            className="px-2.5 py-1 bg-white hover:bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] text-xs font-medium rounded transition cursor-pointer"
                          >
                            Visualizar
                          </button>

                          {/* Se for ADMIN, opções adicionais discretas */}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => onEditProduct(prod)}
                                title="Editar Produto"
                                className="p-1 text-[#555555] hover:text-[#111111] hover:bg-[#F7F7F7] rounded transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onDeleteProduct(prod)}
                                title="Excluir Produto"
                                className="p-1 text-[#555555] hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
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
