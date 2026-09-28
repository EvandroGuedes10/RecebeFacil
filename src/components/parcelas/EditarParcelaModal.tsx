import React, { useState, useEffect } from 'react';
import { Save, Calendar, DollarSign, Edit3 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ParcelaReceber } from '../../types';
import { api } from '../../services/api';

interface EditarParcelaModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcela: ParcelaReceber | null;
  onSuccess: (updated: ParcelaReceber) => void;
  onError: (msg: string) => void;
}

export const EditarParcelaModal: React.FC<EditarParcelaModalProps> = ({
  isOpen,
  onClose,
  parcela,
  onSuccess,
  onError,
}) => {
  const [vencimento, setVencimento] = useState('');
  const [valorOriginal, setValorOriginal] = useState<number>(0);
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (parcela) {
      setVencimento(parcela.vencimento ? parcela.vencimento.split('T')[0] : '');
      setValorOriginal(Number(parcela.valor_original || 0));
      setObservacao(parcela.observacao || '');
    }
  }, [parcela]);

  if (!parcela) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (valorOriginal <= 0) {
      onError('O valor original deve ser superior a zero.');
      return;
    }
    if (!vencimento) {
      onError('A data de vencimento é obrigatória.');
      return;
    }

    setLoading(true);
    try {
      const updated = await api.parcelas.atualizar(parcela.id, {
        vencimento,
        valorOriginal,
        observacao,
      });
      onSuccess(updated);
    } catch (err: any) {
      onError(err.message || 'Erro ao atualizar a parcela.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Informações do Título"
      subtitle={`Título #${parcela.id} • NF-e ${parcela.numero_nota || 'S/N'}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Data de Vencimento *
          </label>
          <input
            type="date"
            required
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Valor do Título (R$) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={valorOriginal}
            onChange={(e) => setValorOriginal(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Observações
          </label>
          <textarea
            rows={3}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Informações adicionais do título..."
            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>

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
            className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
