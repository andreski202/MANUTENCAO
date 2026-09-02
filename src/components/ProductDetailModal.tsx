import React from 'react';
import { Produto, User } from '../types.ts';
import { X, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Edit2 } from 'lucide-react';

interface ProductDetailModalProps {
  produto: Produto | null;
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onEntrada?: (produto: Produto, prateleira?: string) => void;
  onSaida?: (produto: Produto, prateleira?: string) => void;
  onMover?: (produto: Produto, prateleiraOrigem?: string) => void;
  onEdit?: (produto: Produto) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  produto,
  isOpen,
  onClose,
  user,
  onEntrada,
  onSaida,
  onMover,
  onEdit
}) => {
  if (!isOpen || !produto) return null;

  const isAdmin = user.perfil === 'ADMIN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/40 backdrop-blur-xs">
      <div className="bg-white border border-[#E5E5E5] rounded w-full max-w-lg shadow-sm overflow-hidden animate-in fade-in duration-150">
        
        {/* Header: Produto & Código */}
        <div className="p-6 border-b border-[#E5E5E5] flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#111111] leading-tight">
              {produto.produto}
            </h2>
            <div className="text-xs text-[#555555] font-mono mt-0.5">
              Código: {produto.codigo}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#555555] hover:text-[#111111] p-1 rounded transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Destaque Principal: Estoque Total */}
          <div className="bg-[#F7F7F7] border border-[#E5E5E5] rounded p-5 text-center">
            <span className="block text-xs font-medium uppercase tracking-wider text-[#555555] mb-1">
              Estoque Total
            </span>
            <div className="text-3xl font-bold text-[#111111] tracking-tight">
              {produto.estoqueTotal}{' '}
              <span className="text-sm font-normal text-[#555555]">
                {produto.estoqueTotal === 1 ? 'unidade' : 'unidades'}
              </span>
            </div>
          </div>

          {/* Distribuição por prateleira */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] mb-2.5">
              Distribuição por Prateleira
            </h3>

            <div className="border border-[#E5E5E5] rounded overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F7F7F7] text-[#555555] font-semibold border-b border-[#E5E5E5]">
                  <tr>
                    <th className="py-2.5 px-4">Prateleira</th>
                    <th className="py-2.5 px-4 text-right">Quantidade</th>
                    {isAdmin && <th className="py-2.5 px-4 text-right w-28">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5] bg-white">
                  {(!produto.localizacoes || produto.localizacoes.length === 0) ? (
                    <tr>
                      <td colSpan={isAdmin ? 3 : 2} className="py-4 px-4 text-center text-[#555555]">
                        Nenhuma prateleira cadastrada.
                      </td>
                    </tr>
                  ) : (
                    (produto.localizacoes || []).map((loc) => (
                      <tr key={loc.id || loc.prateleira} className="hover:bg-[#F7F7F7] transition">
                        <td className="py-2.5 px-4 font-mono font-medium text-[#111111]">
                          {loc.prateleira}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-[#111111]">
                          {loc.quantidade} un
                        </td>
                        {isAdmin && (
                          <td className="py-2 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  onClose();
                                  if (onEntrada) onEntrada(produto, loc.prateleira);
                                }}
                                title="Entrada nesta prateleira"
                                className="p-1 bg-white hover:bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] rounded cursor-pointer transition"
                              >
                                <ArrowDownLeft className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => {
                                  onClose();
                                  if (onSaida) onSaida(produto, loc.prateleira);
                                }}
                                title="Saída desta prateleira"
                                className="p-1 bg-white hover:bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] rounded cursor-pointer transition"
                              >
                                <ArrowUpRight className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => {
                                  onClose();
                                  if (onMover) onMover(produto, loc.prateleira);
                                }}
                                title="Mover a partir desta prateleira"
                                className="p-1 bg-white hover:bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] rounded cursor-pointer transition"
                              >
                                <ArrowLeftRight className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer: Botão Secundário Fechar & Ações Rápidas se Admin */}
        <div className="p-4 border-t border-[#E5E5E5] bg-[#F7F7F7] flex items-center justify-between">
          <div>
            {isAdmin && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(produto);
                }}
                className="px-3 py-1.5 bg-white border border-[#E5E5E5] hover:bg-[#F3F3F3] text-[#111111] text-xs font-medium rounded transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar Produto</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-[#F3F3F3] border border-[#E5E5E5] text-[#111111] text-xs font-medium rounded transition cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
