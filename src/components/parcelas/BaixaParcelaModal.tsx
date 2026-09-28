import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, FileText, CheckCircle2, AlertCircle, CreditCard, Save } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ParcelaReceber } from '../../types';
import { api } from '../../services/api';

interface BaixaParcelaModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcela: ParcelaReceber | null;
  onSuccess: (updated: ParcelaReceber) => void;
  onError: (msg: string) => void;
}

export const BaixaParcelaModal: React.FC<BaixaParcelaModalProps> = ({
  isOpen,
  onClose,
  parcela,
  onSuccess,
  onError,
}) => {
  const [dataRecebimento, setDataRecebimento] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [valorReceber, setValorReceber] = useState<number>(0);
  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (parcela) {
      const saldoRestante = Number(parcela.saldo ?? parcela.valor_original ?? 0);
      setValorReceber(saldoRestante);
      setDataRecebimento(new Date().toISOString().split('T')[0]);
      setFormaPagamento('PIX');
      setObservacao('');
    }
  }, [parcela]);

  if (!parcela) return null;

  const saldoAtual = Number(parcela.saldo ?? parcela.valor_original ?? 0);
  const saldoRestanteAposBaixa = Math.max(0, saldoAtual - valorReceber);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (valorReceber <= 0) {
      onError('O valor a receber deve ser maior que zero.');
      return;
    }

    if (valorReceber > saldoAtual + 0.01) {
      onError('O valor a receber não pode ser superior ao saldo devedor.');
      return;
    }

    setLoading(true);
    try {
      const updated = await api.parcelas.baixar(parcela.id, {
        valorRecebido: valorReceber,
        dataRecebimento,
        formaPagamento,
        observacao,
      });
      onSuccess(updated);
    } catch (err: any) {
      onError(err.message || 'Erro ao efetuar a baixa.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Baixa de Recebimento Financeiro"
      subtitle={`Título #${parcela.id} • NF-e ${parcela.numero_nota || 'S/N'} • ${parcela.cliente_nome || 'Cliente'}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Resumo do Título */}
        <div className="grid grid-cols-3 gap-3 p-3.5 bg-gray-50 dark:bg-gray-900/60 rounded-md border border-gray-200 dark:border-gray-700 text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400 block text-[10px] uppercase font-bold">
              Valor Original
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
              {formatCurrency(parcela.valor_original)}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block text-[10px] uppercase font-bold">
              Já Recebido
            </span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {formatCurrency(parcela.valor_recebido || 0)}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block text-[10px] uppercase font-bold">
              Saldo Devedor Atual
            </span>
            <span className="font-bold text-[#2563EB] dark:text-blue-400 tabular-nums">
              {formatCurrency(saldoAtual)}
            </span>
          </div>
        </div>

        {/* Campos de Baixa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Valor a Baixar (R$) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-xs font-semibold">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={saldoAtual}
                required
                value={valorReceber}
                onChange={(e) => setValorReceber(parseFloat(e.target.value) || 0)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Data do Recebimento *
            </label>
            <input
              type="date"
              required
              value={dataRecebimento}
              onChange={(e) => setDataRecebimento(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Forma de Pagamento
            </label>
            <select
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="PIX">PIX / Transferência Instantânea</option>
              <option value="BOLETO">Boleto Bancário</option>
              <option value="CARTAO_CREDITO">Cartão de Crédito</option>
              <option value="CARTAO_DEBITO">Cartão de Débito</option>
              <option value="TED_DOC">TED / DOC Bancário</option>
              <option value="DINHEIRO">Dinheiro em Espécie</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Saldo Restante Previsto
            </label>
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-md text-xs font-bold text-gray-800 dark:text-gray-200 tabular-nums">
              {formatCurrency(saldoRestanteAposBaixa)}
              <span className="text-[11px] font-normal text-gray-500 ml-2">
                ({saldoRestanteAposBaixa === 0 ? 'Liquidação Total' : 'Baixa Parcial'})
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Observações do Recebimento (Opcional)
          </label>
          <textarea
            rows={2}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex: Comprovante autenticado no banco, desconto concedido, etc."
            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#059669] hover:bg-emerald-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Confirmando Baixa...' : 'Confirmar Recebimento'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
