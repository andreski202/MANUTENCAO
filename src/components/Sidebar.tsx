import React from 'react';
import {
  LayoutDashboard,
  Box,
  Package,
  History,
  Users,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { Estoque, User } from '../types.ts';

export type TabType = 'dashboard' | 'estoques' | 'produtos' | 'historico' | 'usuarios' | 'configuracoes';

interface SidebarProps {
  user: User;
  estoques: Estoque[];
  activeEstoqueId: string;
  onSelectEstoque: (id: string) => void;
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenChangePassword: () => void;
  onLogout: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  onChangeTab,
  isOpenMobile,
  onCloseMobile,
  onLogout,
}) => {
  const isAdmin = user.perfil === 'ADMIN';

  const menuItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: LayoutDashboard,
      testId: 'tab-dashboard'
    },
    {
      id: 'estoques' as TabType,
      label: 'Estoques',
      icon: Box,
      testId: 'tab-estoques'
    },
    {
      id: 'produtos' as TabType,
      label: 'Produtos',
      icon: Package,
      testId: 'tab-produtos'
    },
    {
      id: 'historico' as TabType,
      label: 'Histórico',
      icon: History,
      testId: 'tab-historico'
    },
    ...(isAdmin
      ? [
          {
            id: 'usuarios' as TabType,
            label: 'Usuários',
            icon: Users,
            testId: 'tab-usuarios'
          },
          {
            id: 'configuracoes' as TabType,
            label: 'Configurações',
            icon: Settings,
            testId: 'tab-configuracoes'
          }
        ]
      : [])
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-[#111111] border-r border-[#E5E5E5] select-none">
      
      {/* Top Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-[#E5E5E5]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-[#111111] rounded flex items-center justify-center text-white font-bold text-xs">
            E
          </div>
          <span className="font-bold text-sm tracking-tight text-[#111111]">
            Estoque
          </span>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 text-[#555555] hover:text-[#111111] hover:bg-[#F7F7F7] rounded"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={item.testId}
              onClick={() => {
                onChangeTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition cursor-pointer text-left ${
                isActive
                  ? 'bg-[#111111] text-white'
                  : 'text-[#555555] hover:text-[#111111] hover:bg-[#F7F7F7]'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#555555]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Rodapé: Nome do usuário, Perfil, Sair */}
      <div className="p-4 border-t border-[#E5E5E5] bg-white">
        <div className="mb-3">
          <div className="text-xs font-semibold text-[#111111] truncate">
            {user.nome}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#F3F3F3] text-[#555555] border border-[#E5E5E5]">
              {user.perfil}
            </span>
          </div>
        </div>

        <button
          id="sidebar-btn-logout"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-white hover:bg-[#F7F7F7] border border-[#E5E5E5] text-[#222222] text-xs font-medium rounded transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-[#555555]" />
          <span>Sair</span>
        </button>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-[#111111]/30 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
