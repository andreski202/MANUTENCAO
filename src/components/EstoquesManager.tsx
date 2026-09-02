import React, { useState } from 'react';
import {
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  Code,
  Layers,
  FileSpreadsheet,
  AlertCircle,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';
import { Estoque, User, SheetImportPreview, ColumnMapping } from '../types.ts';
import { api } from '../services/api.ts';

interface EstoquesManagerProps {
  user: User;
  estoques: Estoque[];
  onSelectEstoque: (id: string) => void;
  onRefreshList: () => Promise<void>;
  onSyncEstoque: (id: string) => Promise<void>;
  isSyncing: boolean;
}

export const EstoquesManager: React.FC<EstoquesManagerProps> = ({
  user,
  estoques,
  onSelectEstoque,
  onRefreshList,
  onSyncEstoque,
  isSyncing
}) => {
  const isAdmin = user.perfil === 'ADMIN';

  // Add stock wizard states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [nomeEstoque, setNomeEstoque] = useState('');
  const [urlPlanilha, setUrlPlanilha] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<SheetImportPreview | null>(null);
  const [customMapping, setCustomMapping] = useState<ColumnMapping>({
    codigo: '',
    produto: '',
    prateleira: '',
    quantidade: ''
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Disconnect modal
  const [estoqueToDisconnect, setEstoqueToDisconnect] = useState<Estoque | null>(null);

  // Apps Script Code modal
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [appsScriptCode, setAppsScriptCode] = useState<string>('');
  const [hasCopiedCode, setHasCopiedCode] = useState(false);

  const handleStartAdd = () => {
    setNomeEstoque('');
    setUrlPlanilha('');
    setStep(1);
    setPreviewData(null);
    setErrorMsg(null);
    setIsAddModalOpen(true);
  };

  const handleFetchPreview = async () => {
    if (!nomeEstoque.trim() || !urlPlanilha.trim()) {
      setErrorMsg('Informe o nome do estoque e a URL da planilha Google Sheets.');
      return;
    }
    setErrorMsg(null);
    setIsLoadingPreview(true);

    try {
      const data = await api.previewSheet(user.id, urlPlanilha.trim());
      setPreviewData(data);
      setCustomMapping(data.suggestedMapping);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Não foi possível acessar a planilha.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleConfirmAddEstoque = async () => {
    if (!previewData) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await api.createEstoque(user.id, {
        nome: nomeEstoque.trim(),
        url: urlPlanilha.trim(),
        sheetName: previewData.sheetName,
        columnMapping: customMapping
      });
      await onRefreshList();
      setIsAddModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao conectar planilha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!estoqueToDisconnect) return;
    setIsSubmitting(true);
    try {
      await api.disconnectEstoque(user.id, estoqueToDisconnect.id);
      await onRefreshList();
      setEstoqueToDisconnect(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao desconectar estoque.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAppsScriptCode = async () => {
    try {
      const code = await api.getAppsScriptCode(user.id);
      setAppsScriptCode(code);
      setIsCodeModalOpen(true);
      setHasCopiedCode(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setHasCopiedCode(true);
    setTimeout(() => setHasCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-[#111111]">
            Planilhas e Estoques Conectados
          </h2>
          <p className="text-xs text-[#555555]">
            Conecte suas planilhas existentes do Google Sheets ao sistema
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={handleOpenAppsScriptCode}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] text-xs font-medium rounded transition cursor-pointer"
              >
                <Code className="w-3.5 h-3.5 text-[#555555]" />
                <span>Script Google Apps</span>
              </button>

              <button
                id="btn-add-estoque"
                onClick={handleStartAdd}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Conectar Nova Planilha</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Lista de Estoques Conectados em Tabela Limpa */}
      <div className="bg-white border border-[#E5E5E5] rounded overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#F7F7F7] text-[#555555] font-semibold border-b border-[#E5E5E5]">
            <tr>
              <th className="py-3 px-4">Nome do Estoque</th>
              <th className="py-3 px-4">Aba / Planilha</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Última Sincronização</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5] bg-white">
            {estoques.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#555555]">
                  Nenhum estoque conectado. Clique em "Conectar Nova Planilha".
                </td>
              </tr>
            ) : (
              estoques.map((est) => (
                <tr key={est.id} className="hover:bg-[#F7F7F7] transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#111111]">
                      {est.nome}
                    </div>
                    {est.url && (
                      <a
                        href={est.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#555555] hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <span>Abrir no Google Sheets</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[#555555]">
                    {est.sheetName || 'Página1'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F3F3F3] text-[#111111] border border-[#E5E5E5]">
                      {est.status === 'CONECTADO' ? 'ATIVO' : 'DESCONECTADO'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#555555] font-mono">
                    {est.ultimaSincronizacao || 'Nunca'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectEstoque(est.id)}
                        className="px-2.5 py-1 bg-white hover:bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] text-xs font-medium rounded transition cursor-pointer"
                      >
                        Selecionar
                      </button>

                      {isAdmin && (
                        <>
                          <button
                            onClick={() => onSyncEstoque(est.id)}
                            disabled={isSyncing}
                            title="Sincronizar agora"
                            className="p-1 text-[#555555] hover:text-[#111111] hover:bg-[#F7F7F7] rounded transition cursor-pointer"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                          </button>

                          <button
                            onClick={() => setEstoqueToDisconnect(est)}
                            title="Desconectar estoque"
                            className="p-1 text-[#555555] hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Assistente de Conexão de Planilha */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E5E5] rounded w-full max-w-lg shadow-sm overflow-hidden animate-in fade-in duration-150">
            
            <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#111111]">
                  Conectar Planilha Google Sheets
                </h3>
                <span className="text-[11px] text-[#555555]">
                  Passo {step} de 2
                </span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#555555] hover:text-[#111111] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="mx-6 mt-4 p-3 bg-[#F7F7F7] border border-[#E5E5E5] text-xs text-[#111111] rounded">
                {errorMsg}
              </div>
            )}

            <div className="p-6 space-y-4">
              
              {step === 1 ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[#555555] mb-1">
                      Nome para este Estoque
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Almoxarifado Principal, Loja Centro..."
                      value={nomeEstoque}
                      onChange={(e) => setNomeEstoque(e.target.value)}
                      className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#555555] mb-1">
                      Link / URL da Planilha Google Sheets
                    </label>
                    <input
                      type="text"
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XR..."
                      value={urlPlanilha}
                      onChange={(e) => setUrlPlanilha(e.target.value)}
                      className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                    />
                    <p className="text-[11px] text-[#555555] mt-1">
                      A planilha deve conter colunas para Código, Produto, Prateleira e Quantidade.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-[#F7F7F7] border border-[#E5E5E5] rounded p-3 text-xs text-[#111111]">
                    <div className="font-semibold mb-1">Mapeamento Automático de Colunas</div>
                    <p className="text-[#555555]">
                      Identificamos as seguintes colunas na aba <strong>{previewData?.sheetName}</strong>:
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[#555555] mb-1">
                        Coluna de Código (SKU)
                      </label>
                      <select
                        value={customMapping.codigo}
                        onChange={(e) => setCustomMapping({ ...customMapping, codigo: e.target.value })}
                        className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                      >
                        {(previewData?.headers || []).map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#555555] mb-1">
                        Coluna de Nome do Produto
                      </label>
                      <select
                        value={customMapping.produto}
                        onChange={(e) => setCustomMapping({ ...customMapping, produto: e.target.value })}
                        className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                      >
                        {(previewData?.headers || []).map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#555555] mb-1">
                        Coluna de Prateleira / Localização
                      </label>
                      <select
                        value={customMapping.prateleira}
                        onChange={(e) => setCustomMapping({ ...customMapping, prateleira: e.target.value })}
                        className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                      >
                        {(previewData?.headers || []).map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#555555] mb-1">
                        Coluna de Quantidade / Saldo
                      </label>
                      <select
                        value={customMapping.quantidade}
                        onChange={(e) => setCustomMapping({ ...customMapping, quantidade: e.target.value })}
                        className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                      >
                        {(previewData?.headers || []).map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

            </div>

            <div className="p-4 border-t border-[#E5E5E5] bg-[#F7F7F7] flex items-center justify-between">
              {step === 2 ? (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3 py-1.5 bg-white border border-[#E5E5E5] text-xs font-medium rounded hover:bg-[#F3F3F3]"
                >
                  Voltar
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-[#F3F3F3] border border-[#E5E5E5] text-[#111111] text-xs font-medium rounded transition cursor-pointer"
                >
                  Cancelar
                </button>

                {step === 1 ? (
                  <button
                    type="button"
                    onClick={handleFetchPreview}
                    disabled={isLoadingPreview}
                    className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded transition cursor-pointer disabled:opacity-50"
                  >
                    {isLoadingPreview ? 'Analisando Planilha...' : 'Avançar'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirmAddEstoque}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded transition cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Conectando...' : 'Concluir Conexão'}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal Desconectar */}
      {estoqueToDisconnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E5E5] rounded w-full max-w-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#111111]">
              Desconectar Estoque
            </h3>
            <p className="text-xs text-[#555555]">
              Tem certeza que deseja desconectar o estoque <strong>{estoqueToDisconnect.nome}</strong>?
              Os dados na planilha Google Sheets continuarão intactos.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEstoqueToDisconnect(null)}
                className="px-3 py-1.5 bg-white border border-[#E5E5E5] text-xs font-medium rounded hover:bg-[#F7F7F7]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isSubmitting}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded"
              >
                {isSubmitting ? 'Desconectando...' : 'Desconectar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Script Apps Script */}
      {isCodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E5E5] rounded w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111111]">
                Código Google Apps Script (Código.gs)
              </h3>
              <button
                onClick={() => setIsCodeModalOpen(false)}
                className="text-[#555555] hover:text-[#111111] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              <p className="text-xs text-[#555555]">
                Copie este código para o editor de script da sua planilha no Google Sheets (Extensões &gt; Apps Script):
              </p>
              <pre className="bg-[#F7F7F7] border border-[#E5E5E5] rounded p-4 text-[11px] font-mono text-[#111111] overflow-x-auto max-h-72">
                {appsScriptCode}
              </pre>
            </div>

            <div className="p-4 border-t border-[#E5E5E5] bg-[#F7F7F7] flex items-center justify-between">
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-[#111111] text-white text-xs font-medium rounded hover:bg-black flex items-center gap-1.5 cursor-pointer"
              >
                {hasCopiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{hasCopiedCode ? 'Código Copiado!' : 'Copiar Código'}</span>
              </button>

              <button
                onClick={() => setIsCodeModalOpen(false)}
                className="px-4 py-1.5 bg-white border border-[#E5E5E5] text-[#111111] text-xs font-medium rounded hover:bg-[#F3F3F3] cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
