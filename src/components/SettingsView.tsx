import React, { useState, useEffect } from 'react';
import { User, Estoque } from '../types.ts';
import { api } from '../services/api.ts';
import { Copy, Check, FileSpreadsheet, ShieldCheck, Database, RefreshCw } from 'lucide-react';

interface SettingsViewProps {
  user: User;
  estoques: Estoque[];
  onOpenChangePassword: () => void;
  onRefreshList: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  estoques,
  onOpenChangePassword,
  onRefreshList
}) => {
  const [appsScriptCode, setAppsScriptCode] = useState<string>('');
  const [hasCopied, setHasCopied] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  useEffect(() => {
    api.getAppsScriptCode(user.id).then(code => setAppsScriptCode(code)).catch(() => {});
  }, [user.id]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* 1. Integração Google Apps Script */}
      <div className="bg-white border border-[#E5E5E5] rounded p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[#111111]">
            Integração Google Apps Script
          </h2>
          <p className="text-xs text-[#555555]">
            Código oficial para sincronização direta com suas planilhas no Google Sheets
          </p>
        </div>

        <div className="bg-[#F7F7F7] border border-[#E5E5E5] rounded p-4 text-xs text-[#111111] space-y-2">
          <p className="font-semibold">Como utilizar:</p>
          <ol className="list-decimal list-inside space-y-1 text-[#555555]">
            <li>Abra sua planilha no Google Sheets;</li>
            <li>No menu superior, clique em <strong>Extensões &gt; Apps Script</strong>;</li>
            <li>Cole o código abaixo substituindo o conteúdo do arquivo <code className="bg-white px-1 py-0.5 border border-[#E5E5E5] rounded">Código.gs</code>;</li>
            <li>Salve e clique em <strong>Implantar &gt; Nova Implantação &gt; App da Web</strong>.</li>
          </ol>
        </div>

        <div className="relative">
          <pre className="bg-[#F7F7F7] border border-[#E5E5E5] rounded p-4 text-[11px] font-mono text-[#111111] overflow-x-auto max-h-60">
            {appsScriptCode || '// Carregando código Apps Script...'}
          </pre>
          <button
            onClick={handleCopyCode}
            className="absolute top-3 right-3 px-3 py-1.5 bg-[#111111] text-white text-xs font-medium rounded hover:bg-black flex items-center gap-1.5 cursor-pointer"
          >
            {hasCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{hasCopied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>
      </div>

      {/* 2. Preferências de Sincronização */}
      <div className="bg-white border border-[#E5E5E5] rounded p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[#111111]">
            Preferências do Sistema
          </h2>
          <p className="text-xs text-[#555555]">
            Parâmetros operacionais e conexões ativas
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-[#E5E5E5]">
            <div>
              <span className="text-xs font-semibold text-[#111111] block">
                Sincronização Automática
              </span>
              <span className="text-[11px] text-[#555555]">
                Atualizar saldos ao abrir a tabela de produtos
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#E5E5E5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#D9D9D9] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#111111]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[#E5E5E5]">
            <div>
              <span className="text-xs font-semibold text-[#111111] block">
                Alteração de Senha
              </span>
              <span className="text-[11px] text-[#555555]">
                Redefinir credenciais do operador logado
              </span>
            </div>
            <button
              onClick={onOpenChangePassword}
              className="px-3 py-1.5 bg-white border border-[#E5E5E5] hover:bg-[#F7F7F7] text-xs font-medium text-[#111111] rounded cursor-pointer transition"
            >
              Alterar Senha
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
