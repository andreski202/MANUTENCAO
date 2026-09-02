import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { api } from '../services/api.ts';
import { User } from '../types.ts';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  if (!isOpen) return null;

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg('A nova senha e a confirmação não coincidem.');
      return;
    }

    if (newPassword.length < 5) {
      setErrorMsg('A nova senha deve ter no mínimo 5 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.changePassword(user.id, oldPassword, newPassword);
      setSuccessMsg('Senha alterada com sucesso!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao alterar senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/40 backdrop-blur-xs">
      <div className="bg-white border border-[#E5E5E5] rounded w-full max-w-md overflow-hidden shadow-sm animate-in fade-in duration-150">
        
        <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#111111]">
            Alterar Minha Senha
          </h3>
          <button
            onClick={onClose}
            className="text-[#555555] hover:text-[#111111] p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-[#F7F7F7] border border-[#E5E5E5] text-xs text-[#111111] rounded">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-[#111111] text-white rounded flex items-center gap-2 text-xs font-medium">
            <Check className="w-4 h-4 shrink-0 text-white" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#555555] mb-1">
                Senha Atual
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#555555] mb-1">
                Nova Senha
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#555555] mb-1">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
              />
            </div>
          </div>

          <div className="p-4 border-t border-[#E5E5E5] bg-[#F7F7F7] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#F3F3F3] border border-[#E5E5E5] text-[#111111] text-xs font-medium rounded transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Alterando...' : 'Salvar Nova Senha'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
