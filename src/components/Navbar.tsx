import React from 'react';
import { Menu, Database, RefreshCw } from 'lucide-react';
import { Estoque, User } from '../types.ts';
import { TabType } from './Sidebar.tsx';

interface NavbarProps {
  user: User;
  estoques: Estoque[];
  activeEstoqueId: string;
  onSelectEstoque: (id: string) => void;
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onSync: () => void;
  isSyncing: boolean;
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  estoques,
  activeEstoqueId,
  onSelectEstoque,
  activeTab,
  onChangeTab,
  onSync,
  isSyncing,
  onToggleMobileSidebar
}) => {
  const isAdmin = user.perfil === 'ADMIN';

  const getPageInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Dashboard',
          description: 'Visão geral e indicadores do estoque'
        };
      case 'estoques':
        return {
          title: 'Estoques',
          description: 'Gerenciamento de planilhas e estoques integrados'
        };
      case 'produtos':
        return {
          title: 'Produtos',
          description: 'Controle de saldo, prateleiras e movimentações'
        };
      case 'historico':
        return {
          title: 'Histórico',
          description: 'Registro cronológico auditável de movimentações'
        };
      case 'usuarios':
        return {
          title: 'Usuários',
          description: 'Controle de operadores e permissões de acesso'
        };
      case 'configuracoes':
        return {
          title: 'Configurações',
          description: 'Integração Google Apps Script e preferências do sistema'
        };
      default:
        return {
          title: 'Estoque',
          description: ''
        };
    }
  };

  const pageInfo = getPageInfo();
  const currentEstoque = estoques.find(e => e.id === activeEstoqueId);

  return (
    <header
      id="main-header"
      className="bg-white border-b border-[#E5E5E5] sticky top-0 z-20 h-16 flex items-center px-4 sm:px-8"
    >
      <div className="w-full flex items-center justify-between gap-4">
        
        {/* Lado Esquerdo: Botão Mobile + Título da Página */}
        <div className="flex items-center gap-3">
          <button
            id="btn-mobile-menu"
            type="button"
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 text-[#555555] hover:text-[#111111] hover:bg-[#F7F7F7] rounded transition cursor-pointer"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-base font-bold text-[#111111] tracking-tight leading-tight">
              {pageInfo.title}
            </h1>
            {pageInfo.description && (
              <p className="text-[11px] text-[#555555] hidden sm:block">
                {pageInfo.description}
              </p>
            )}
          </div>
        </div>

        {/* Lado Direito: Seletor de Estoque, Sincronizar, Usuário & Perfil */}
        <div className="flex items-center gap-3">
          
          {/* Seletor rápido de estoque */}
          {estoques && estoques.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 bg-[#F7F7F7] border border-[#E5E5E5] rounded px-2.5 py-1">
              <Database className="w-3.5 h-3.5 text-[#555555]" />
              <select
                id="header-estoque-select"
                value={activeEstoqueId}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    onChangeTab('estoques');
                  } else {
                    onSelectEstoque(e.target.value);
                  }
                }}
                className="bg-transparent text-xs text-[#111111] font-medium focus:outline-none cursor-pointer"
              >
                {(estoques || []).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome}
                  </option>
                ))}
                {isAdmin && <option value="__new__">+ Conectar Planilha...</option>}
              </select>

              {isAdmin && activeEstoqueId && (
                <button
                  onClick={onSync}
                  disabled={isSyncing}
                  title="Sincronizar com Planilha Google"
                  className="ml-1 p-1 text-[#555555] hover:text-[#111111] rounded transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          )}

          {/* Usuário e Perfil */}
          <div className="text-right flex flex-col items-end pl-2 border-l border-[#E5E5E5]">
            <span className="text-xs font-semibold text-[#111111]">
              {user.nome}
            </span>
            <span className="text-[10px] text-[#555555] font-mono uppercase">
              {user.perfil}
            </span>
          </div>

        </div>

      </div>
    </header>
  );
};
