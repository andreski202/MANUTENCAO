import React from 'react';
import { DashboardStats as StatsType } from '../types.ts';

interface DashboardStatsProps {
  stats: StatsType | null;
  onFilterClick?: (filter: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, onFilterClick }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      
      {/* 1. Produtos */}
      <div
        id="stat-card-produtos"
        onClick={() => onFilterClick && onFilterClick('all')}
        className="bg-white border border-[#E5E5E5] rounded p-4 cursor-pointer hover:border-[#111111] transition"
      >
        <div className="text-xs font-medium text-[#555555] mb-1">
          Produtos
        </div>
        <div className="text-2xl font-bold text-[#111111] tracking-tight">
          {stats.totalProdutos.toLocaleString('pt-BR')}
        </div>
      </div>

      {/* 2. Estoque Total */}
      <div
        id="stat-card-estoque-total"
        onClick={() => onFilterClick && onFilterClick('all')}
        className="bg-white border border-[#E5E5E5] rounded p-4 cursor-pointer hover:border-[#111111] transition"
      >
        <div className="text-xs font-medium text-[#555555] mb-1">
          Estoque total
        </div>
        <div className="text-2xl font-bold text-[#111111] tracking-tight">
          {stats.totalQuantidadeEstoque.toLocaleString('pt-BR')}
        </div>
      </div>

      {/* 3. Sem Estoque */}
      <div
        id="stat-card-sem-estoque"
        onClick={() => onFilterClick && onFilterClick('out_of_stock')}
        className="bg-white border border-[#E5E5E5] rounded p-4 cursor-pointer hover:border-[#111111] transition"
      >
        <div className="text-xs font-medium text-[#555555] mb-1">
          Sem estoque
        </div>
        <div className={`text-2xl font-bold tracking-tight ${stats.produtosSemEstoque > 0 ? 'text-red-700' : 'text-[#111111]'}`}>
          {stats.produtosSemEstoque.toLocaleString('pt-BR')}
        </div>
      </div>

      {/* 4. Prateleiras */}
      <div
        id="stat-card-prateleiras"
        className="bg-white border border-[#E5E5E5] rounded p-4 hover:border-[#111111] transition"
      >
        <div className="text-xs font-medium text-[#555555] mb-1">
          Prateleiras
        </div>
        <div className="text-2xl font-bold text-[#111111] tracking-tight">
          {stats.totalPrateleirasUsadas.toLocaleString('pt-BR')}
        </div>
      </div>

    </div>
  );
};
