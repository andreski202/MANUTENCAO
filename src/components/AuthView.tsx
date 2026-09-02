import React, { useState } from 'react';
import { api } from '../services/api.ts';
import { User } from '../types.ts';

interface AuthViewProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('andreskiryan@gmail.com');
  const [password, setPassword] = useState('adm12345');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await api.login(email.trim(), password);
      onLoginSuccess(res.user, res.token);
    } catch (err: any) {
      setErrorMsg(err.message || 'Credenciais inválidas.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-sm">
        
        {/* Painel Centralizado */}
        <div className="bg-white border border-[#E5E5E5] rounded p-8">
          
          <div className="text-center mb-6">
            <h1 className="text-base font-bold text-[#111111] tracking-wider uppercase">
              CONTROLE DE ESTOQUE
            </h1>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-[#F7F7F7] border border-[#E5E5E5] text-xs text-[#111111] rounded">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#555555] mb-1">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-sm text-[#111111] placeholder-[#999999] focus:border-[#111111] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#555555] mb-1">
                Senha
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#E5E5E5] rounded px-3 py-2 text-sm text-[#111111] placeholder-[#999999] focus:border-[#111111] focus:outline-none transition"
              />
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2 px-4 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Perfis de teste rápidos (discreto) */}
          <div className="mt-6 pt-5 border-t border-[#E5E5E5]">
            <span className="block text-[11px] text-[#555555] mb-2 font-medium">
              Contas para teste:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-quick-admin"
                onClick={() => handleQuickSelect('andreskiryan@gmail.com', 'adm12345')}
                className={`p-2 rounded text-left border text-xs transition cursor-pointer ${
                  email === 'andreskiryan@gmail.com'
                    ? 'bg-[#F3F3F3] border-[#111111] text-[#111111] font-semibold'
                    : 'bg-white border-[#E5E5E5] text-[#555555] hover:bg-[#F7F7F7]'
                }`}
              >
                <div className="font-semibold text-[#111111]">ADMIN</div>
                <div className="text-[10px] text-[#555555] font-mono">adm12345</div>
              </button>

              <button
                type="button"
                id="btn-quick-visualizador"
                onClick={() => handleQuickSelect('joao.consulta@empresa.com', 'vis12345')}
                className={`p-2 rounded text-left border text-xs transition cursor-pointer ${
                  email === 'joao.consulta@empresa.com'
                    ? 'bg-[#F3F3F3] border-[#111111] text-[#111111] font-semibold'
                    : 'bg-white border-[#E5E5E5] text-[#555555] hover:bg-[#F7F7F7]'
                }`}
              >
                <div className="font-semibold text-[#111111]">VISUALIZADOR</div>
                <div className="text-[10px] text-[#555555] font-mono">vis12345</div>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
