import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Produto } from '../types.ts';

export type ModalType = 'novo_produto' | 'editar_produto' | 'entrada' | 'saida' | 'mover' | 'excluir' | null;

interface StockOperationsModalProps {
  type: ModalType;
  isOpen: boolean;
  onClose: () => void;
  produtos: Produto[];
  selectedProduto: Produto | null;
  selectedPrateleira?: string;
  onConfirmNovo: (data: { codigo: string; produto: string; prateleira: string; quantidade: number }) => Promise<void>;
  onConfirmEditar: (id: string, data: { codigo: string; produto: string; localizacoes: Array<{ id?: string; prateleira: string; quantidade: number }> }) => Promise<void>;
  onConfirmEntrada: (data: { codigoOrId: string; prateleira: string; quantidade: number }) => Promise<void>;
  onConfirmSaida: (data: { codigoOrId: string; prateleira: string; quantidade: number }) => Promise<void>;
  onMover: (data: { codigoOrId: string; prateleiraOrigem: string; prateleiraDestino: string; quantidade: number }) => Promise<void>;
  onConfirmExcluir: (id: string) => Promise<void>;
}

export const StockOperationsModal: React.FC<StockOperationsModalProps> = ({
  type,
  isOpen,
  onClose,
  produtos,
  selectedProduto,
  selectedPrateleira,
  onConfirmNovo,
  onConfirmEditar,
  onConfirmEntrada,
  onConfirmSaida,
  onMover,
  onConfirmExcluir
}) => {
  if (!isOpen || !type) return null;

  // Form states
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [prateleira, setPrateleira] = useState('');
  const [prateleiraOrigem, setPrateleiraOrigem] = useState('');
  const [prateleiraDestino, setPrateleiraDestino] = useState('');
  const [quantidade, setQuantidade] = useState<number | ''>(1);
  const [selectedProdId, setSelectedProdId] = useState<string>('');
  const [editLocalizacoes, setEditLocalizacoes] = useState<Array<{ id?: string; prateleira: string; quantidade: number }>>([]);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setErrorMsg(null);
    setIsSubmitting(false);

    if (type === 'novo_produto') {
      setCodigo('');
      setNome('');
      setPrateleira('A01');
      setQuantidade(1);
    } else if (type === 'editar_produto' && selectedProduto) {
      setCodigo(selectedProduto.codigo || '');
      setNome(selectedProduto.produto || '');
      setEditLocalizacoes((selectedProduto.localizacoes || []).map(l => ({ ...l })));
    } else if (type === 'entrada') {
      const prod = selectedProduto || (produtos && produtos[0]);
      if (prod) {
        setSelectedProdId(prod.id);
        setPrateleira(selectedPrateleira || (prod.localizacoes?.[0]?.prateleira || 'A01'));
      }
      setQuantidade(1);
    } else if (type === 'saida') {
      const prod = selectedProduto || (produtos && produtos[0]);
      if (prod) {
        setSelectedProdId(prod.id);
        setPrateleira(selectedPrateleira || (prod.localizacoes?.[0]?.prateleira || ''));
      }
      setQuantidade(1);
    } else if (type === 'mover') {
      const prod = selectedProduto || (produtos && produtos[0]);
      if (prod) {
        setSelectedProdId(prod.id);
        setPrateleiraOrigem(selectedPrateleira || (prod.localizacoes?.[0]?.prateleira || ''));
        const nextShelf = (prod.localizacoes || []).find(l => l.prateleira !== (selectedPrateleira || prod.localizacoes?.[0]?.prateleira))?.prateleira || 'B01';
        setPrateleiraDestino(nextShelf);
      }
      setQuantidade(1);
    }
  }, [type, selectedProduto, selectedPrateleira, produtos]);

  const activeSelectedProduct = (produtos || []).find(p => p.id === selectedProdId) || selectedProduto;

  const getAvailableQuantityOnShelf = (shelf: string): number => {
    if (!activeSelectedProduct || !activeSelectedProduct.localizacoes) return 0;
    const loc = activeSelectedProduct.localizacoes.find(l => l.prateleira && l.prateleira.toLowerCase() === shelf.toLowerCase());
    return loc ? loc.quantidade : 0;
  };

  const getModalTitle = () => {
    switch (type) {
      case 'novo_produto':
        return 'Novo Produto';
      case 'editar_produto':
        return 'Editar Produto';
      case 'entrada':
        return 'Entrada de Estoque';
      case 'saida':
        return 'Saída de Estoque';
      case 'mover':
        return 'Mover Entre Prateleiras';
      case 'excluir':
        return 'Excluir Produto';
      default:
        return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (type === 'novo_produto') {
        if (!codigo.trim() || !nome.trim()) {
          throw new Error('Código e Produto são obrigatórios.');
        }
        await onConfirmNovo({
          codigo: codigo.trim(),
          produto: nome.trim(),
          prateleira: prateleira.trim() || 'SEM LOCALIZAÇÃO',
          quantidade: Number(quantidade) || 0
        });
      } else if (type === 'editar_produto' && selectedProduto) {
        if (!codigo.trim() || !nome.trim()) {
          throw new Error('Código e Produto são obrigatórios.');
        }
        await onConfirmEditar(selectedProduto.id, {
          codigo: codigo.trim(),
          produto: nome.trim(),
          localizacoes: editLocalizacoes
        });
      } else if (type === 'entrada') {
        if (!activeSelectedProduct) throw new Error('Selecione um produto.');
        if (!quantidade || Number(quantidade) <= 0) throw new Error('Informe uma quantidade válida.');
        await onConfirmEntrada({
          codigoOrId: activeSelectedProduct.id,
          prateleira: prateleira.trim() || 'SEM LOCALIZAÇÃO',
          quantidade: Number(quantidade)
        });
      } else if (type === 'saida') {
        if (!activeSelectedProduct) throw new Error('Selecione um produto.');
        if (!prateleira) throw new Error('Selecione a prateleira de saída.');
        const maxAvailable = getAvailableQuantityOnShelf(prateleira);
        if (Number(quantidade) > maxAvailable) {
          throw new Error(`Quantidade insuficiente nesta prateleira. Saldo: ${maxAvailable}, solicitado: ${quantidade}.`);
        }
        await onConfirmSaida({
          codigoOrId: activeSelectedProduct.id,
          prateleira,
          quantidade: Number(quantidade)
        });
      } else if (type === 'mover') {
        if (!activeSelectedProduct) throw new Error('Selecione um produto.');
        if (!prateleiraOrigem || !prateleiraDestino) throw new Error('Informe as prateleiras de origem e destino.');
        if (prateleiraOrigem.trim().toLowerCase() === prateleiraDestino.trim().toLowerCase()) {
          throw new Error('A prateleira de origem e destino devem ser diferentes.');
        }
        const maxAvailable = getAvailableQuantityOnShelf(prateleiraOrigem);
        if (Number(quantidade) > maxAvailable) {
          throw new Error(`Quantidade insuficiente na prateleira de origem (${maxAvailable} un disponíveis).`);
        }
        await onMover({
          codigoOrId: activeSelectedProduct.id,
          prateleiraOrigem: prateleiraOrigem.trim(),
          prateleiraDestino: prateleiraDestino.trim(),
          quantidade: Number(quantidade)
        });
      } else if (type === 'excluir' && selectedProduto) {
        await onConfirmExcluir(selectedProduto.id);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar operação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEditLocationRow = () => {
    setEditLocalizacoes(prev => [...prev, { prateleira: '', quantidade: 0 }]);
  };

  const handleRemoveEditLocationRow = (index: number) => {
    setEditLocalizacoes(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateEditLocation = (index: number, field: 'prateleira' | 'quantidade', val: any) => {
    setEditLocalizacoes(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === 'quantidade' ? (val === '' ? '' : Number(val)) : val
      };
      return updated;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/40 backdrop-blur-xs">
      <div className="bg-white border border-[#E5E5E5] rounded w-full max-w-md shadow-sm overflow-hidden animate-in fade-in duration-150">
        
        {/* Título claro */}
        <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#111111]">
            {getModalTitle()}
          </h2>
          <button
            onClick={onClose}
            className="text-[#555555] hover:text-[#111111] p-1 rounded transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-[#F7F7F7] border border-[#E5E5E5] text-xs text-[#111111] rounded">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          {/* Corpo do Formulário: Campos organizados verticalmente */}
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            
            {/* 1. NOVO PRODUTO */}
            {type === 'novo_produto' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="001"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] placeholder-[#999999] focus:border-[#111111] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1">
                    Produto
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Parafuso 10mm"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] placeholder-[#999999] focus:border-[#111111] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1">
                    Prateleira
                  </label>
                  <input
                    type="text"
                    placeholder="A01"
                    value={prateleira}
                    onChange={(e) => setPrateleira(e.target.value)}
                    className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] placeholder-[#999999] focus:border-[#111111] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="10"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] placeholder-[#999999] focus:border-[#111111] focus:outline-none transition"
                  />
                </div>
              </>
            )}

            {/* 2. EDITAR PRODUTO */}
            {type === 'editar_produto' && selectedProduto && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    required
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1">
                    Produto
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-[#555555]">
                      Prateleiras e Quantidades
                    </label>
                    <button
                      type="button"
                      onClick={handleAddEditLocationRow}
                      className="text-[11px] font-medium text-[#111111] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar Prateleira</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {editLocalizacoes.map((loc, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Prateleira (ex: A01)"
                          value={loc.prateleira}
                          onChange={(e) => handleUpdateEditLocation(idx, 'prateleira', e.target.value)}
                          className="flex-1 bg-white border border-[#E5E5E5] rounded px-2.5 py-1.5 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="Qtd"
                          value={loc.quantidade}
                          onChange={(e) => handleUpdateEditLocation(idx, 'quantidade', e.target.value)}
                          className="w-20 bg-white border border-[#E5E5E5] rounded px-2.5 py-1.5 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveEditLocationRow(idx)}
                          className="p-1 text-[#555555] hover:text-red-700 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 3. ENTRADA */}
            {type === 'entrada' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1">
                    Produto
                  </label>
                  <select
                    value={selectedProdId}
                    onChange={(e) => {
                      setSelectedProdId(e.target.value);
                      const p = produtos.find(item => item.id === e.target.value);
                      if (p && p.localizacoes.length > 0) {
                        setPrateleira(p.localizacoes[0].prateleira);
                      }
                    }}
                    className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none cursor-pointer"
                  >
                    {produtos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.codigo} - {p.produto} (Saldo: {p.estoqueTotal})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1">
                    Prateleira de Entrada
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="A01"
                    value={prateleira}
                    onChange={(e) => setPrateleira(e.target.value)}
                    className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] placeholder-[#999999] focus:border-[#111111] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1">
                    Quantidade a Adicionar
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] placeholder-[#999999] focus:border-[#111111] focus:outline-none transition"
                  />
                </div>
              </>
            )}

            {/* 4. SAÍDA */}
            {type === 'saida' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1">
                    Produto
                  </label>
                  <select
                    value={selectedProdId}
                    onChange={(e) => {
                      setSelectedProdId(e.target.value);
                      const p = (produtos || []).find(item => item.id === e.target.value);
                      if (p && p.localizacoes && p.localizacoes.length > 0) {
                        setPrateleira(p.localizacoes[0].prateleira);
                      }
                    }}
                    className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none cursor-pointer"
                  >
                    {(produtos || []).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.codigo} - {p.produto} (Saldo: {p.estoqueTotal})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1">
                    Prateleira de Origem
                  </label>
                  {activeSelectedProduct && activeSelectedProduct.localizacoes && activeSelectedProduct.localizacoes.length > 0 ? (
                    <select
                      value={prateleira}
                      onChange={(e) => setPrateleira(e.target.value)}
                      className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none cursor-pointer"
                    >
                      {(activeSelectedProduct.localizacoes || []).map(loc => (
                        <option key={loc.id || loc.prateleira} value={loc.prateleira}>
                          Prateleira {loc.prateleira} ({loc.quantidade} un disponíveis)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={prateleira}
                      onChange={(e) => setPrateleira(e.target.value)}
                      className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1">
                    Quantidade a Retirar
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={prateleira ? getAvailableQuantityOnShelf(prateleira) : undefined}
                    required
                    placeholder="1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] placeholder-[#999999] focus:border-[#111111] focus:outline-none transition"
                  />
                  {prateleira && (
                    <p className="text-[11px] text-[#555555] mt-1">
                      Saldo na prateleira {prateleira}: <strong>{getAvailableQuantityOnShelf(prateleira)} un</strong>
                    </p>
                  )}
                </div>
              </>
            )}

            {/* 5. MOVER */}
            {type === 'mover' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1">
                    Produto
                  </label>
                  <select
                    value={selectedProdId}
                    onChange={(e) => {
                      setSelectedProdId(e.target.value);
                      const p = (produtos || []).find(item => item.id === e.target.value);
                      if (p && p.localizacoes && p.localizacoes.length > 0) {
                        setPrateleiraOrigem(p.localizacoes[0].prateleira);
                      }
                    }}
                    className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none cursor-pointer"
                  >
                    {(produtos || []).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.codigo} - {p.produto} (Saldo: {p.estoqueTotal})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1">
                    Prateleira de Origem
                  </label>
                  {activeSelectedProduct && activeSelectedProduct.localizacoes && activeSelectedProduct.localizacoes.length > 0 ? (
                    <select
                      value={prateleiraOrigem}
                      onChange={(e) => setPrateleiraOrigem(e.target.value)}
                      className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none cursor-pointer"
                    >
                      {(activeSelectedProduct.localizacoes || []).map(loc => (
                        <option key={loc.id || loc.prateleira} value={loc.prateleira}>
                          Prateleira {loc.prateleira} ({loc.quantidade} un disponíveis)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={prateleiraOrigem}
                      onChange={(e) => setPrateleiraOrigem(e.target.value)}
                      className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1">
                    Prateleira de Destino
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="B02"
                    value={prateleiraDestino}
                    onChange={(e) => setPrateleiraDestino(e.target.value)}
                    className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] placeholder-[#999999] focus:border-[#111111] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1">
                    Quantidade a Mover
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={prateleiraOrigem ? getAvailableQuantityOnShelf(prateleiraOrigem) : undefined}
                    required
                    placeholder="1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] placeholder-[#999999] focus:border-[#111111] focus:outline-none transition"
                  />
                  {prateleiraOrigem && (
                    <p className="text-[11px] text-[#555555] mt-1">
                      Saldo em {prateleiraOrigem}: <strong>{getAvailableQuantityOnShelf(prateleiraOrigem)} un</strong>
                    </p>
                  )}
                </div>
              </>
            )}

            {/* 6. EXCLUIR */}
            {type === 'excluir' && selectedProduto && (
              <div className="py-2">
                <p className="text-xs text-[#111111]">
                  Tem certeza que deseja excluir o produto <strong>{selectedProduto.produto}</strong> (Código: {selectedProduto.codigo})?
                </p>
                <p className="text-[11px] text-[#555555] mt-1">
                  Todas as prateleiras e registros de saldo deste produto serão removidos deste estoque.
                </p>
              </div>
            )}

          </div>

          {/* 10. BOTÕES NO RODAPÉ */}
          <div className="p-4 border-t border-[#E5E5E5] bg-[#F7F7F7] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-white hover:bg-[#F3F3F3] border border-[#E5E5E5] text-[#111111] text-xs font-medium rounded transition cursor-pointer"
            >
              Cancelar
            </button>

            {type === 'excluir' ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Excluindo...' : 'Excluir Produto'}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
};
