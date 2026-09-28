import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, CheckCircle2, CreditCard, Save, Truck } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ContaPagar } from '../../types';
import { api } from '../../services/api';

interface BaixaPagamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  conta: ContaPagar | null;
  onSuccess: (updated: ContaPagar) => void;
  onError: (msg: string) => void;
}

export const BaixaPagamentoModal: React.FC<BaixaPagamentoModalProps> = ({
  isOpen,
  onClose,
  conta,
  onSuccess,
  onError,
}) => {
  const [dataPagamento, setDataPagamento] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [valorPago, setValorPago] = useState<number>(0);
  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (conta) {
      const saldoRestante = Number(
        conta.saldo ?? Math.max(0, (conta.valor_original ?? conta.valor_parcela ?? 0) - (conta.valor_pago || 0))
      );
      setValorPago(saldoRestante);
      setDataPagamento(new Date().toISOString().split('T')[0]);
      setFormaPagamento('PIX');
      setObservacao('');
    }
  }, [conta]);

  if (!conta) return null;

  const saldoAtual = Number(
    conta.saldo ?? Math.max(0, (conta.valor_original ?? conta.valor_parcela ?? 0) - (conta.valor_pago || 0))
  );
  const saldoRestanteAposBaixa = Math.max(0, saldoAtual - valorPago);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (valorPago <= 0) {
      onError('O valor de pagamento deve ser superior a zero.');
      return;
    }

    if (valorPago > saldoAtual + 0.01) {
      onError('O valor pago não pode exceder o saldo devedor da conta.');
      return;
    }

    setLoading(true);
    try {
      const updated = await api.contasPagar.baixar(conta.id, {
        valorPago,
        dataPagamento,
        formaPagamento,
        observacao,
      });
      onSuccess(updated);
    } catch (err: any) {
      onError(err.message || 'Erro ao efetuar o pagamento.');
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
      title="Baixa de Pagamento de Fornecedor"
      subtitle={`Conta #${conta.id} • Doc: ${conta.numero_documento} • ${conta.fornecedor_nome}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Resumo do Compromisso */}
        <div className="grid grid-cols-3 gap-3 p-3.5 bg-gray-50 dark:bg-gray-900/60 rounded-md border border-gray-200 dark:border-gray-700 text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400 block text-[10px] uppercase font-bold">
              Valor Original
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
              {formatCurrency(conta.valor_original ?? conta.valor_parcela ?? 0)}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block text-[10px] uppercase font-bold">
              Já Pago
            </span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {formatCurrency(conta.valor_pago || 0)}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block text-[10px] uppercase font-bold">
              Saldo em Aberto
            </span>
            <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {formatCurrency(saldoAtual)}
            </span>
          </div>
        </div>

        {/* Campos de Baixa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Valor do Pagamento (R$) *
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
                value={valorPago}
                onChange={(e) => setValorPago(parseFloat(e.target.value) || 0)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Data da Liquidação *
            </label>
            <input
              type="date"
              required
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
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
              <option value="TED_DOC">TED / DOC Bancário</option>
              <option value="CARTAO_CORPORATIVO">Cartão Corporativo</option>
              <option value="DEBITO_AUTOMATICO">Débito Automático</option>
              <option value="DINHEIRO">Dinheiro / Caixa</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Saldo Restante Previsto
            </label>
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-md text-xs font-bold text-gray-800 dark:text-gray-200 tabular-nums">
              {formatCurrency(saldoRestanteAposBaixa)}
              <span className="text-[11px] font-normal text-gray-500 ml-2">
                ({saldoRestanteAposBaixa === 0 ? 'Liquidação Total' : 'Pagamento Parcial'})
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Observações / Autenticação Bancária
          </label>
          <textarea
            rows={2}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex: Pagamento autorizado pela diretoria, comprovante bancário nº 998877..."
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
            <span>{loading ? 'Confirmando Pagamento...' : 'Confirmar Pagamento'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
