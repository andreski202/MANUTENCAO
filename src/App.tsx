import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar, TabType } from './components/Sidebar.tsx';
import { Navbar } from './components/Navbar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { ProductsTable } from './components/ProductsTable.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { StockOperationsModal, ModalType } from './components/StockOperationsModal.tsx';
import { EstoquesManager } from './components/EstoquesManager.tsx';
import { HistoricoTable } from './components/HistoricoTable.tsx';
import { UserManager } from './components/UserManager.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { ChangePasswordModal } from './components/ChangePasswordModal.tsx';
import { AuthView } from './components/AuthView.tsx';
import { api } from './services/api.ts';
import {
  User,
  Estoque,
  Produto,
  HistoricoItem,
  DashboardStats as DashboardStatsType
} from './types.ts';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('estoque_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('estoque_token');
  });

  // Navigation & Active View
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [activeEstoqueId, setActiveEstoqueId] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Data states
  const [estoques, setEstoques] = useState<Estoque[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStatsType | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDisponibilidade, setFilterDisponibilidade] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [filterPrateleira, setFilterPrateleira] = useState<string>('all');

  // Loading & sync states
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedProdutoForModal, setSelectedProdutoForModal] = useState<Produto | null>(null);
  const [selectedPrateleiraForModal, setSelectedPrateleiraForModal] = useState<string | undefined>(undefined);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Show toast notification
  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Fetch all estoques accessible to logged user
  const fetchEstoques = useCallback(async () => {
    if (!currentUser) return;
    try {
      const list = await api.getEstoques(currentUser.id);
      setEstoques(list);
      if (list.length > 0) {
        setActiveEstoqueId(prev => {
          if (prev && list.some(e => e.id === prev)) return prev;
          return list[0].id;
        });
      } else {
        setActiveEstoqueId('');
      }
    } catch (err: any) {
      console.error('Error fetching estoques:', err);
      showToast('error', err.message || 'Erro ao carregar estoques.');
    }
  }, [currentUser, showToast]);

  // Fetch products for current active stock with filters
  const fetchProdutos = useCallback(async () => {
    if (!currentUser || !activeEstoqueId) {
      setProdutos([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await api.getProdutos(currentUser.id, activeEstoqueId, {
        search: searchQuery,
        prateleira: filterPrateleira !== 'all' ? filterPrateleira : undefined,
        disponibilidade: filterDisponibilidade !== 'all' ? filterDisponibilidade : undefined
      });
      setProdutos(data);
    } catch (err: any) {
      console.error('Error fetching produtos:', err);
      showToast('error', err.message || 'Erro ao buscar produtos.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, activeEstoqueId, searchQuery, filterPrateleira, filterDisponibilidade, showToast]);

  // Fetch metrics & stats
  const fetchDashboardStats = useCallback(async () => {
    if (!currentUser) return;
    try {
      const stats = await api.getDashboard(currentUser.id, activeEstoqueId);
      setDashboardStats(stats);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  }, [currentUser, activeEstoqueId]);

  // Fetch historico
  const fetchHistorico = useCallback(async () => {
    if (!currentUser) return;
    try {
      const list = await api.getHistorico(currentUser.id, activeEstoqueId);
      setHistorico(list);
    } catch (err) {
      console.error('Error fetching historico:', err);
    }
  }, [currentUser, activeEstoqueId]);

  // Initial load on user login
  useEffect(() => {
    if (currentUser) {
      fetchEstoques();
    }
  }, [currentUser, fetchEstoques]);

  // Reload data when active stock changes or tab changes
  useEffect(() => {
    if (currentUser && activeEstoqueId) {
      fetchProdutos();
      fetchDashboardStats();
      fetchHistorico();
    }
  }, [currentUser, activeEstoqueId, fetchProdutos, fetchDashboardStats, fetchHistorico]);

  // Calculate unique shelf list across currently loaded products
  const allPrateleiras = useMemo(() => {
    const set = new Set<string>();
    (produtos || []).forEach(p => {
      (p.localizacoes || []).forEach(l => {
        if (l.prateleira) set.add(l.prateleira);
      });
    });
    return Array.from(set).sort();
  }, [produtos]);

  // Auth actions
  const handleLoginSuccess = (user: User, userToken: string) => {
    setCurrentUser(user);
    setToken(userToken);
    localStorage.setItem('estoque_user', JSON.stringify(user));
    localStorage.setItem('estoque_token', userToken);
    showToast('success', `Bem-vindo, ${user.nome}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('estoque_user');
    localStorage.removeItem('estoque_token');
  };

  // Synchronize active stock with Google Sheets
  const handleSyncActiveEstoque = async (estoqueIdToSync?: string) => {
    const targetId = estoqueIdToSync || activeEstoqueId;
    if (!currentUser || !targetId) return;
    setIsSyncing(true);

    try {
      const res = await api.syncEstoque(currentUser.id, targetId);
      showToast('success', `${res.message} (${res.importedCount} novos, ${res.updatedCount} atualizados)`);
      await fetchEstoques();
      await fetchProdutos();
      await fetchDashboardStats();
      await fetchHistorico();
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao sincronizar estoque com Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Stock operations handlers
  const handleConfirmNovoProduto = async (data: { codigo: string; produto: string; prateleira: string; quantidade: number }) => {
    if (!currentUser || !activeEstoqueId) return;
    const res = await api.createProduto(currentUser.id, activeEstoqueId, data);
    showToast('success', `Produto '${res.produto.codigo}' cadastrado com sucesso!`);
    await fetchProdutos();
    await fetchDashboardStats();
    await fetchHistorico();
  };

  const handleConfirmEditarProduto = async (
    id: string,
    data: { codigo: string; produto: string; localizacoes: Array<{ id?: string; prateleira: string; quantidade: number }> }
  ) => {
    if (!currentUser) return;
    const res = await api.updateProduto(currentUser.id, id, data);
    showToast('success', `Produto '${res.produto.codigo}' atualizado com sucesso!`);
    await fetchProdutos();
    await fetchDashboardStats();
    await fetchHistorico();
  };

  const handleConfirmEntrada = async (data: { codigoOrId: string; prateleira: string; quantidade: number }) => {
    if (!currentUser || !activeEstoqueId) return;
    const res = await api.entradaEstoque(currentUser.id, {
      estoqueId: activeEstoqueId,
      ...data
    });
    showToast('success', res.message);
    await fetchProdutos();
    await fetchDashboardStats();
    await fetchHistorico();
  };

  const handleConfirmSaida = async (data: { codigoOrId: string; prateleira: string; quantidade: number }) => {
    if (!currentUser || !activeEstoqueId) return;
    const res = await api.saidaEstoque(currentUser.id, {
      estoqueId: activeEstoqueId,
      ...data
    });
    showToast('success', res.message);
    await fetchProdutos();
    await fetchDashboardStats();
    await fetchHistorico();
  };

  const handleConfirmMover = async (data: { codigoOrId: string; prateleiraOrigem: string; prateleiraDestino: string; quantidade: number }) => {
    if (!currentUser || !activeEstoqueId) return;
    const res = await api.moverEstoque(currentUser.id, {
      estoqueId: activeEstoqueId,
      ...data
    });
    showToast('success', res.message);
    await fetchProdutos();
    await fetchDashboardStats();
    await fetchHistorico();
  };

  const handleConfirmExcluirProduto = async (id: string) => {
    if (!currentUser) return;
    const res = await api.deleteProduto(currentUser.id, id);
    showToast('success', res.message);
    await fetchProdutos();
    await fetchDashboardStats();
    await fetchHistorico();
  };

  // Inspect product handler
  const handleOpenProductDetail = (produto: Produto) => {
    setSelectedProdutoForModal(produto);
    setIsDetailModalOpen(true);
  };

  // If not logged in, render AuthView
  if (!currentUser) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  const activeEstoqueObj = estoques.find(e => e.id === activeEstoqueId);

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#111111] flex antialiased">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top duration-200">
          <div className="px-4 py-3 bg-[#111111] text-white rounded border border-black shadow-md flex items-center gap-2.5 text-xs font-semibold">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-white" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Sidebar (Desktop Fixed + Mobile Drawer) */}
      <Sidebar
        user={currentUser}
        estoques={estoques}
        activeEstoqueId={activeEstoqueId}
        onSelectEstoque={(id) => {
          if (id === '__new__') {
            setActiveTab('estoques');
          } else {
            setActiveEstoqueId(id);
          }
        }}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onLogout={handleLogout}
        onSync={() => handleSyncActiveEstoque()}
        isSyncing={isSyncing}
      />

      {/* Main Content Layout with md:pl-60 offset */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-60">
        
        {/* Top Header Bar */}
        <Navbar
          user={currentUser}
          estoques={estoques}
          activeEstoqueId={activeEstoqueId}
          onSelectEstoque={(id) => {
            if (id === '__new__') {
              setActiveTab('estoques');
            } else {
              setActiveEstoqueId(id);
            }
          }}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onSync={() => handleSyncActiveEstoque()}
          isSyncing={isSyncing}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          
          {/* Tab 1: Dashboard */}
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={dashboardStats}
              produtos={produtos}
              historico={historico}
              estoques={estoques}
              user={currentUser}
              onNavigateTab={setActiveTab}
              onSelectProduct={handleOpenProductDetail}
            />
          )}

          {/* Tab 2: Estoques & Planilhas */}
          {activeTab === 'estoques' && (
            <EstoquesManager
              user={currentUser}
              estoques={estoques}
              onSelectEstoque={(id) => {
                setActiveEstoqueId(id);
                setActiveTab('produtos');
              }}
              onRefreshList={fetchEstoques}
              onSyncEstoque={handleSyncActiveEstoque}
              isSyncing={isSyncing}
            />
          )}

          {/* Tab 3: Produtos & Prateleiras */}
          {activeTab === 'produtos' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="bg-white border border-[#E5E5E5] rounded p-12 text-center text-[#555555]">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#111111] mb-2" />
                  <span className="text-xs font-semibold text-[#111111]">Carregando produtos...</span>
                </div>
              ) : (
                <ProductsTable
                  produtos={produtos}
                  user={currentUser}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onNewProduct={() => {
                    setSelectedProdutoForModal(null);
                    setModalType('novo_produto');
                  }}
                  onViewProduct={handleOpenProductDetail}
                  onEntrada={(prod, shelf) => {
                    setSelectedProdutoForModal(prod || null);
                    setSelectedPrateleiraForModal(shelf);
                    setModalType('entrada');
                  }}
                  onSaida={(prod, shelf) => {
                    setSelectedProdutoForModal(prod || null);
                    setSelectedPrateleiraForModal(shelf);
                    setModalType('saida');
                  }}
                  onMover={(prod, shelf) => {
                    setSelectedProdutoForModal(prod || null);
                    setSelectedPrateleiraForModal(shelf);
                    setModalType('mover');
                  }}
                  onEditProduct={(prod) => {
                    setSelectedProdutoForModal(prod);
                    setModalType('editar_produto');
                  }}
                  onDeleteProduct={(prod) => {
                    setSelectedProdutoForModal(prod);
                    setModalType('excluir');
                  }}
                  filterDisponibilidade={filterDisponibilidade}
                  onFilterDisponibilidadeChange={setFilterDisponibilidade}
                  filterPrateleira={filterPrateleira}
                  onFilterPrateleiraChange={setFilterPrateleira}
                  allPrateleiras={allPrateleiras}
                />
              )}
            </div>
          )}

          {/* Tab 4: Histórico */}
          {activeTab === 'historico' && (
            <HistoricoTable
              historico={historico}
              estoques={estoques}
              activeEstoqueId={activeEstoqueId}
              onEstoqueChange={(id) => {
                if (id !== 'all') {
                  setActiveEstoqueId(id);
                }
              }}
            />
          )}

          {/* Tab 5: Usuários & Permissões (ADMIN only) */}
          {activeTab === 'usuarios' && currentUser.perfil === 'ADMIN' && (
            <UserManager
              currentUser={currentUser}
            />
          )}

          {/* Tab 6: Configurações (ADMIN only) */}
          {activeTab === 'configuracoes' && currentUser.perfil === 'ADMIN' && (
            <SettingsView
              user={currentUser}
              estoques={estoques}
              onOpenChangePassword={() => setIsChangePasswordOpen(true)}
              onRefreshList={fetchEstoques}
            />
          )}

        </main>

      </div>

      {/* Product Detail Modal (9. PRODUTO) */}
      <ProductDetailModal
        produto={selectedProdutoForModal}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        user={currentUser}
        onEntrada={(prod, shelf) => {
          setSelectedProdutoForModal(prod);
          setSelectedPrateleiraForModal(shelf);
          setModalType('entrada');
        }}
        onSaida={(prod, shelf) => {
          setSelectedProdutoForModal(prod);
          setSelectedPrateleiraForModal(shelf);
          setModalType('saida');
        }}
        onMover={(prod, shelf) => {
          setSelectedProdutoForModal(prod);
          setSelectedPrateleiraForModal(shelf);
          setModalType('mover');
        }}
        onEdit={(prod) => {
          setSelectedProdutoForModal(prod);
          setModalType('editar_produto');
        }}
      />

      {/* Stock Operations Modal (Novo, Editar, Entrada, Saída, Mover, Excluir) */}
      <StockOperationsModal
        type={modalType}
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        produtos={produtos}
        selectedProduto={selectedProdutoForModal}
        selectedPrateleira={selectedPrateleiraForModal}
        onConfirmNovo={handleConfirmNovoProduto}
        onConfirmEditar={handleConfirmEditarProduto}
        onConfirmEntrada={handleConfirmEntrada}
        onConfirmSaida={handleConfirmSaida}
        onConfirmMover={handleConfirmMover}
        onConfirmExcluir={handleConfirmExcluirProduto}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        user={currentUser}
      />

    </div>
  );
}
