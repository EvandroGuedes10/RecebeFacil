import React, { useState } from 'react';
import { Trash2, AlertTriangle, Building2, Check, RefreshCw, Sparkles } from 'lucide-react';
import { Modal } from './Modal';
import { Empresa } from '../../types';
import { api } from '../../services/api';

interface ZerarDadosModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresaAtiva: Empresa | null;
  onSucesso: (empresaAtualizada?: Empresa) => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', msg: string) => void;
}

export const ZerarDadosModal: React.FC<ZerarDadosModalProps> = ({
  isOpen,
  onClose,
  empresaAtiva,
  onSucesso,
  onToast,
}) => {
  const [zerarMovimentacoes, setZerarMovimentacoes] = useState(true);
  const [zerarCadastros, setZerarCadastros] = useState(true);
  const [zerarEmpresa, setZerarEmpresa] = useState(false);

  // Campos para personalização imediata da empresa
  const [razaoSocial, setRazaoSocial] = useState(empresaAtiva?.razao_social || '');
  const [cnpj, setCnpj] = useState(empresaAtiva?.cnpj || '');
  const [nomeFantasia, setNomeFantasia] = useState(empresaAtiva?.nome_fantasia || '');

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirmar = async () => {
    if (!zerarMovimentacoes && !zerarCadastros && !zerarEmpresa) {
      onToast('warning', 'Selecione ao menos uma opção para zerar ou atualizar.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sistema.zerarDados({
        empresaId: empresaAtiva?.id,
        zerarMovimentacoes,
        zerarCadastros,
        zerarEmpresa,
        novaEmpresa: zerarEmpresa
          ? {
              razao_social: razaoSocial.trim() || 'Minha Empresa',
              cnpj: cnpj.trim() || '',
              nome_fantasia: nomeFantasia.trim() || '',
            }
          : undefined,
      });

      onToast('success', res.mensagem || 'Dados zerados com sucesso!');
      onSucesso(res.empresa);
      onClose();
    } catch (err: any) {
      onToast('error', err.message || 'Erro ao zerar dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Zerar Dados do ERP"
      subtitle="Limpe as movimentações, cadastros ou redefina a empresa para começar do zero"
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Banner de Aviso */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-xs">Atenção ao Zerar Dados</span>
            <p className="text-[11px] leading-relaxed">
              Esta ação removerá os dados selecionados da empresa ativa{' '}
              <strong>{empresaAtiva?.razao_social || 'selecionada'}</strong>. Use esta opção para
              limpar testes, títulos e notas antes de utilizar o sistema em produção com seus dados reais.
            </p>
          </div>
        </div>

        {/* Opções de Zeramento */}
        <div className="space-y-2.5 bg-gray-50 dark:bg-gray-800/60 p-3.5 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
            Escolha o que deseja zerar:
          </span>

          {/* Opção 1: Movimentações */}
          <label className="flex items-start gap-2.5 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer">
            <input
              type="checkbox"
              checked={zerarMovimentacoes}
              onChange={(e) => setZerarMovimentacoes(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-red-600 border-gray-300 focus:ring-red-500"
            />
            <div>
              <span className="font-bold text-gray-900 dark:text-gray-100 block">
                Zerar Lançamentos & NF-e (Recomendado)
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-[11px]">
                Exclui todas as parcelas a receber, contas a pagar, notas fiscais e XMLs importados.
              </span>
            </div>
          </label>

          {/* Opção 2: Cadastros */}
          <label className="flex items-start gap-2.5 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer">
            <input
              type="checkbox"
              checked={zerarCadastros}
              onChange={(e) => setZerarCadastros(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-red-600 border-gray-300 focus:ring-red-500"
            />
            <div>
              <span className="font-bold text-gray-900 dark:text-gray-100 block">
                Zerar Cadastros de Parceiros
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-[11px]">
                Exclui clientes e fornecedores cadastrados na empresa.
              </span>
            </div>
          </label>

          {/* Opção 3: Redefinir Empresa */}
          <label className="flex items-start gap-2.5 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer">
            <input
              type="checkbox"
              checked={zerarEmpresa}
              onChange={(e) => setZerarEmpresa(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div>
              <span className="font-bold text-gray-900 dark:text-gray-100 block">
                Redefinir Dados da Empresa Ativa
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-[11px]">
                Altere a Razão Social e o CNPJ da empresa para colocar os dados reais do seu negócio.
              </span>
            </div>
          </label>
        </div>

        {/* Campos para preenchimento se marcou Redefinir Empresa */}
        {zerarEmpresa && (
          <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 rounded-lg space-y-3">
            <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-bold text-xs">
              <Building2 className="w-3.5 h-3.5" />
              <span>Novos Dados da Empresa</span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                  Razão Social da Sua Empresa
                </label>
                <input
                  type="text"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Ex: Minha Empresa Comercial Ltda"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                    CNPJ Real
                  </label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    placeholder="Ex: Minha Loja"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rodapé / Botões */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmar}
            disabled={loading}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Zerando Dados...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmar e Zerar Dados</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
