import React from 'react';
import { DashboardStats } from './DashboardStats.tsx';
import { DashboardStats as StatsType, Produto, HistoricoItem, Estoque, User } from '../types.ts';
import { TabType } from './Sidebar.tsx';
import { ArrowRight, Package, History } from 'lucide-react';

interface DashboardViewProps {
  stats: StatsType | null;
  produtos: Produto[];
  historico: HistoricoItem[];
  estoques: Estoque[];
  user: User;
  onNavigateTab: (tab: TabType) => void;
  onSelectProduct: (produto: Produto) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  produtos = [],
  historico = [],
  estoques = [],
  user,
  onNavigateTab,
  onSelectProduct
}) => {
  const safeProdutos = produtos || [];
  const safeHistorico = historico || [];
  const produtosSemEstoque = safeProdutos.filter(p => p.estoqueTotal === 0).slice(0, 5);
  const ultimasMovimentacoes = safeHistorico.slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* 4 Cards Principais */}
      <DashboardStats
        stats={stats}
        onFilterClick={() => onNavigateTab('produtos')}
      />

      {/* Grid de 2 Colunas: Itens que precisam de atenção & Últimas Movimentações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card: Produtos Sem Estoque / Baixo */}
        <div className="bg-white border border-[#E5E5E5] rounded p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5] mb-3">
            <div>
              <h2 className="text-sm font-bold text-[#111111]">
                Itens Sem Estoque
              </h2>
              <p className="text-xs text-[#555555]">
                Produtos com saldo zerado no estoque ativo
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('produtos')}
              className="text-xs text-[#111111] hover:underline font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {produtosSemEstoque.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#555555]">
              Nenhum produto sem estoque no momento.
            </div>
          ) : (
            <div className="divide-y divide-[#E5E5E5]">
              {produtosSemEstoque.map(p => (
                <div
                  key={p.id}
                  onClick={() => onSelectProduct(p)}
                  className="py-2.5 flex items-center justify-between hover:bg-[#F7F7F7] px-2 rounded cursor-pointer transition"
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-[#111111] mr-2">
                      {p.codigo}
                    </span>
                    <span className="text-xs text-[#222222]">
                      {p.produto}
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F3F3F3] text-red-700 border border-red-200">
                    0 un
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card: Últimas Movimentações */}
        <div className="bg-white border border-[#E5E5E5] rounded p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5] mb-3">
            <div>
              <h2 className="text-sm font-bold text-[#111111]">
                Últimas Movimentações
              </h2>
              <p className="text-xs text-[#555555]">
                Registro recente de alterações
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('historico')}
              className="text-xs text-[#111111] hover:underline font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Ver histórico</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {ultimasMovimentacoes.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#555555]">
              Nenhuma movimentação registrada.
            </div>
          ) : (
            <div className="divide-y divide-[#E5E5E5]">
              {ultimasMovimentacoes.map(h => {
                const diff = h.novoValor - h.valorAnterior;
                return (
                  <div key={h.id} className="py-2.5 flex items-center justify-between px-2">
                    <div className="truncate pr-2">
                      <div className="text-xs font-medium text-[#111111] truncate">
                        {h.item}
                      </div>
                      <div className="text-[11px] text-[#555555]">
                        {h.data} • {h.usuario}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-[#111111]">
                        {h.novoValor} un
                      </span>
                      <span className="text-[10px] text-[#555555] block">
                        (ant: {h.valorAnterior})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
