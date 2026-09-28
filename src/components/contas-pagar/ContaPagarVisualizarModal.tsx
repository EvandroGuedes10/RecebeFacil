import React from 'react';
import { Calendar, DollarSign, Truck, FileText, CheckCircle2, AlertTriangle, Paperclip, Receipt, Clock } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ContaPagar } from '../../types';

interface ContaPagarVisualizarModalProps {
  isOpen: boolean;
  onClose: () => void;
  conta: ContaPagar | null;
  onOpenBaixa: (conta: ContaPagar) => void;
  onOpenComprovante: (conta: ContaPagar) => void;
}

export const ContaPagarVisualizarModal: React.FC<ContaPagarVisualizarModalProps> = ({
  isOpen,
  onClose,
  conta,
  onOpenBaixa,
  onOpenComprovante,
}) => {
  if (!conta) return null;

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

  const isPago = conta.status === 'pago';
  const isVencido = conta.status === 'atrasado' || conta.status === 'vencido';
  const isParcial = conta.status === 'parcial';
  const saldo = conta.saldo ?? Math.max(0, (conta.valor_original ?? conta.valor_parcela ?? 0) - (conta.valor_pago || 0));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalhes da Conta a Pagar"
      subtitle={`ID: #${conta.id} • ${conta.numero_documento}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Status Badge e Valores */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-md border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
              Situação da Conta
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
                ? 'Totalmente Pago'
                : isVencido
                ? 'Em Atraso (Vencido)'
                : isParcial
                ? 'Pagamento Parcial Realizado'
                : 'Aguardando Pagamento'}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Valor Original</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                {formatCurrency(conta.valor_original ?? conta.valor_parcela)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Saldo a Pagar</span>
              <span className="text-base font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {formatCurrency(saldo)}
              </span>
            </div>
          </div>
        </div>

        {/* Dados do Fornecedor e Documento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-700 pb-2">
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              <span>Fornecedor / Favorecido</span>
            </h4>
            <div>
              <span className="text-[11px] text-gray-400 block">Razão Social / Nome</span>
              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                {conta.fornecedor_nome}
              </span>
            </div>
            {conta.fornecedor_cnpj && (
              <div>
                <span className="text-[11px] text-gray-400 block">CNPJ / CPF</span>
                <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                  {conta.fornecedor_cnpj}
                </span>
              </div>
            )}
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-700 pb-2">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Documento de Origem</span>
            </h4>
            <div className="flex justify-between">
              <div>
                <span className="text-[11px] text-gray-400 block">Nº Documento</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  {conta.numero_documento}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block">Parcela</span>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  {conta.numero_parcela}/{conta.total_parcelas || 1}
                </span>
              </div>
            </div>
            {conta.categoria && (
              <div>
                <span className="text-[11px] text-gray-400 block">Categoria / Centro de Custo</span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {conta.categoria}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Datas e Pagamento */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-700 pb-2">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Cronograma de Pagamento</span>
          </h4>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-gray-400 block">Vencimento</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                {formatDate(conta.vencimento || conta.data_vencimento)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 block">Data Pagamento</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                {formatDate(conta.data_pagamento)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 block">Total Liquidado</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                {formatCurrency(conta.valor_pago)}
              </span>
            </div>
          </div>
          {(conta.observacao || conta.observacoes) && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <span className="text-[11px] text-gray-400 block">Observações</span>
              <p className="text-xs text-gray-600 dark:text-gray-300 italic mt-0.5">
                "{conta.observacao || conta.observacoes}"
              </p>
            </div>
          )}
          {conta.anexo_nome && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 text-xs text-blue-600">
              <Paperclip className="w-3.5 h-3.5" />
              <span>Anexo vinculado: {conta.anexo_nome}</span>
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
                onClick={() => onOpenComprovante(conta)}
                className="px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Comprovante de Pagamento</span>
              </button>
            )}

            {!isPago && (
              <button
                type="button"
                onClick={() => onOpenBaixa(conta)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>Efetuar Pagamento</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
