import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { User, UserRole } from '../types.ts';
import { api } from '../services/api.ts';

interface UserManagerProps {
  currentUser: User;
  users?: User[];
  onRefreshUsers?: () => Promise<void>;
}

export const UserManager: React.FC<UserManagerProps> = ({
  currentUser,
  users: initialUsers,
  onRefreshUsers
}) => {
  const [userList, setUserList] = useState<User[]>(initialUsers || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [perfil, setPerfil] = useState<UserRole>('VISUALIZADOR');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await api.getUsuarios(currentUser.id);
      setUserList(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, [currentUser.id]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenNewUserModal = () => {
    setNome('');
    setEmail('');
    setPassword('');
    setPerfil('VISUALIZADOR');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (!nome.trim() || !email.trim() || !password.trim()) {
        throw new Error('Todos os campos são obrigatórios.');
      }
      await api.createUsuario(currentUser.id, {
        nome: nome.trim(),
        email: email.trim(),
        password: password.trim(),
        perfil
      });
      await fetchUsers();
      if (onRefreshUsers) await onRefreshUsers();
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, userName: string) => {
    if (id === currentUser.id) {
      alert('Você não pode excluir sua própria conta.');
      return;
    }
    if (!window.confirm(`Deseja realmente remover o usuário "${userName}"?`)) {
      return;
    }

    try {
      await api.deleteUsuario(currentUser.id, id);
      await fetchUsers();
      if (onRefreshUsers) await onRefreshUsers();
    } catch (err: any) {
      alert(err.message || 'Erro ao remover usuário.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-[#111111]">
            Usuários e Acessos
          </h2>
          <p className="text-xs text-[#555555]">
            Gerenciamento de operadores e permissões de acesso ao sistema
          </p>
        </div>

        <button
          id="btn-add-user"
          onClick={handleOpenNewUserModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white border border-[#E5E5E5] rounded overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#F7F7F7] text-[#555555] font-semibold border-b border-[#E5E5E5]">
            <tr>
              <th className="py-3 px-4">Nome</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Perfil</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5] bg-white">
            {userList.map((u) => (
              <tr key={u.id} className="hover:bg-[#F7F7F7] transition">
                <td className="py-3 px-4 font-semibold text-[#111111]">
                  {u.nome}
                  {u.id === currentUser.id && (
                    <span className="ml-2 text-[10px] text-[#555555] font-normal font-mono">
                      (você)
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-[#555555] font-mono">
                  {u.email}
                </td>
                <td className="py-3 px-4">
                  <span className="inline-block text-[10px] font-mono uppercase font-medium px-2 py-0.5 rounded bg-[#F3F3F3] text-[#111111] border border-[#E5E5E5]">
                    {u.perfil}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-[#F3F3F3] text-[#555555] border border-[#E5E5E5]">
                    {u.status === 'ATIVO' ? 'ATIVO' : 'INATIVO'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  {u.id !== currentUser.id && (
                    <button
                      onClick={() => handleDeleteUser(u.id, u.nome)}
                      title="Excluir usuário"
                      className="p-1 text-[#555555] hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Novo Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E5E5] rounded w-full max-w-md shadow-sm overflow-hidden animate-in fade-in duration-150">
            
            <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111111]">
                Novo Usuário
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#555555] hover:text-[#111111] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mx-6 mt-4 p-3 bg-[#F7F7F7] border border-[#E5E5E5] text-xs text-[#111111] rounded">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveUser}>
              <div className="p-6 space-y-4">
                
                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="carlos@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1">
                    Senha Provisória
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#555555] mb-1">
                    Perfil de Acesso
                  </label>
                  <select
                    value={perfil}
                    onChange={(e) => setPerfil(e.target.value as UserRole)}
                    className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none cursor-pointer"
                  >
                    <option value="VISUALIZADOR">VISUALIZADOR (Apenas consulta e histórico)</option>
                    <option value="ADMIN">ADMIN (Acesso total e movimentações)</option>
                  </select>
                </div>

              </div>

              <div className="p-4 border-t border-[#E5E5E5] bg-[#F7F7F7] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-[#F3F3F3] border border-[#E5E5E5] text-[#111111] text-xs font-medium rounded transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Usuário'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
