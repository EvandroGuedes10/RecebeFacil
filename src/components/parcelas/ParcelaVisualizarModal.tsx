import React from 'react';
import { FileText, Calendar, DollarSign, User, Building, Clock, CheckCircle2, AlertTriangle, ShieldCheck, Receipt } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ParcelaReceber } from '../../types';

interface ParcelaVisualizarModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcela: ParcelaReceber | null;
  onOpenBaixa: (parcela: ParcelaReceber) => void;
  onOpenRecibo: (parcela: ParcelaReceber) => void;
}

export const ParcelaVisualizarModal: React.FC<ParcelaVisualizarModalProps> = ({
  isOpen,
  onClose,
  parcela,
  onOpenBaixa,
  onOpenRecibo,
}) => {
  if (!parcela) return null;

  const formatCurrency = (val?: number | null) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '---';
    try {
      const parts = dateString.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  const isPago = parcela.status === 'pago';
  const isVencido = parcela.status === 'vencido';
  const isParcial = parcela.status === 'parcial';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ficha Detalhada do Título"
      subtitle={`Identificador Único: #${parcela.id}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Status Badge e Valores Principais */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-md border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
              Situação do Título
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold ${
                isPago
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : isVencido
                  ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                  : isParcial
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
              }`}
            >
              {isPago
                ? 'Totalmente Quitado'
                : isVencido
                ? 'Vencido (Em Atraso)'
                : isParcial
                ? 'Baixa Parcial Realizada'
                : 'Aguardando Pagamento'}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Valor Original</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                {formatCurrency(parcela.valor_original)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Saldo a Liquidar</span>
              <span className="text-base font-bold text-[#2563EB] dark:text-blue-400 tabular-nums">
                {formatCurrency(parcela.saldo ?? parcela.valor_original)}
              </span>
            </div>
          </div>
        </div>

        {/* Dados do Cliente e Documento Fiscal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-700 pb-2">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Cliente / Sacado</span>
            </h4>
            <div>
              <span className="text-[11px] text-gray-400 block">Razão Social / Nome</span>
              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                {parcela.cliente_nome || 'Não vinculado'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 block">Código Cliente</span>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                #{parcela.cliente_id || '---'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-700 pb-2">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Origem Fiscal (NF-e)</span>
            </h4>
            <div className="flex justify-between">
              <div>
                <span className="text-[11px] text-gray-400 block">Número da Nota</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  {parcela.numero_nota || 'Sem nota'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block">Nº Parcela</span>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  {parcela.numero_parcela}
                </span>
              </div>
            </div>
            {parcela.chave_nfe && (
              <div>
                <span className="text-[11px] text-gray-400 block">Chave de Acesso</span>
                <span className="text-[10px] font-mono text-gray-600 dark:text-gray-300 break-all">
                  {parcela.chave_nfe}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Datas e Liquidação */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-700 pb-2">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Cronograma & Liquidação</span>
          </h4>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-gray-400 block">Vencimento</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                {formatDate(parcela.vencimento)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 block">Data Recebimento</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                {formatDate(parcela.data_recebimento)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 block">Total Liquidado</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                {formatCurrency(parcela.valor_recebido)}
              </span>
            </div>
          </div>
          {parcela.observacao && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <span className="text-[11px] text-gray-400 block">Observação</span>
              <p className="text-xs text-gray-600 dark:text-gray-300 italic mt-0.5">
                "{parcela.observacao}"
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2">
            {isPago && (
              <button
                type="button"
                onClick={() => onOpenRecibo(parcela)}
                className="px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Imprimir Recibo</span>
              </button>
            )}

            {!isPago && (
              <button
                type="button"
                onClick={() => onOpenBaixa(parcela)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>Efetuar Baixa</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
