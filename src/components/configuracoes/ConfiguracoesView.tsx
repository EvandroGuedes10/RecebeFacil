import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Building, ShieldCheck, DollarSign, Bell, Trash2, AlertTriangle, RotateCcw } from 'lucide-react';
import { ConfiguracoesApp, Empresa } from '../../types';
import { api } from '../../services/api';

interface ConfiguracoesViewProps {
  empresa: Empresa | null;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', msg: string) => void;
  onOpenZerarDados?: () => void;
}

export const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({ empresa, onToast, onOpenZerarDados }) => {
  const [config, setConfig] = useState<ConfiguracoesApp>({
    diasAvisoVencimento: 3,
    notificarAtraso: true,
    jurosMoraMensal: 1.0,
    multaAtraso: 2.0,
    modoAuditoriaEstrito: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.configuracoes
      .obter()
      .then((data) => setConfig(data))
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.configuracoes.salvar(config);
      onToast('success', 'Parâmetros corporativos salvos com sucesso.');
    } catch (err: any) {
      onToast('error', err.message || 'Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Parâmetros & Configurações do ERP
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Definições financeiras, regras de negócio de cobrança e políticas de auditoria.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Parâmetros Financeiros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Políticas de Cobrança e Juros de Mora
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Dias de antecedência para aviso de vencimento
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={config.diasAvisoVencimento}
                onChange={(e) =>
                  setConfig({ ...config, diasAvisoVencimento: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Títulos com vencimento dentro desta janela são destacados no painel.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Taxa de Juros de Mora Mensal (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={config.jurosMoraMensal}
                onChange={(e) =>
                  setConfig({ ...config, jurosMoraMensal: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Calculado pro-rata die em títulos em atraso.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Multa por Atraso (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={config.multaAtraso}
                onChange={(e) =>
                  setConfig({ ...config, multaAtraso: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Aplicada após o primeiro dia de atraso.
              </span>
            </div>
          </div>
        </div>

        {/* Governança e Auditoria */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Governança e Trilha de Auditoria
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.notificarAtraso}
                onChange={(e) => setConfig({ ...config, notificarAtraso: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div>
                <span className="font-semibold text-gray-900 dark:text-gray-200 block">
                  Notificações de títulos vencidos no dashboard
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-[11px]">
                  Exibir alerta visual para a equipe financeira quando houver títulos não liquidados.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.modoAuditoriaEstrito}
                onChange={(e) => setConfig({ ...config, modoAuditoriaEstrito: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div>
                <span className="font-semibold text-gray-900 dark:text-gray-200 block">
                  Registro estrito de auditoria em operações de baixa e estorno
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-[11px]">
                  Gravar IP, timestamp preciso e autor do evento na tabela imutável do PostgreSQL.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Zona de Manutenção / Zerar Dados */}
        <div className="bg-red-50/40 dark:bg-red-950/20 rounded-lg p-5 border border-red-200 dark:border-red-900/60 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-red-100 dark:border-red-900/40 pb-3">
            <Trash2 className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-bold text-red-900 dark:text-red-300">
              Zona de Manutenção: Zerar Dados do Sistema
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <p className="text-gray-600 dark:text-gray-400 text-[11px] max-w-xl">
              Limpe todas as informações de teste, títulos a receber, contas a pagar ou notas fiscais importadas para inicializar o ERP com os dados reais da sua empresa.
            </p>

            {onOpenZerarDados && (
              <button
                type="button"
                onClick={onOpenZerarDados}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Zerar Dados Agora</span>
              </button>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Salvando Parâmetros...' : 'Salvar Configurações'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
