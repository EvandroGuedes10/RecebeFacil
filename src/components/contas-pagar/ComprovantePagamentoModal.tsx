import React from 'react';
import { Printer, Download, CheckCircle2, Truck, Calendar, DollarSign, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ContaPagar, Empresa } from '../../types';

interface ComprovantePagamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  conta: ContaPagar | null;
  empresa: Empresa | null;
}

export const ComprovantePagamentoModal: React.FC<ComprovantePagamentoModalProps> = ({
  isOpen,
  onClose,
  conta,
  empresa,
}) => {
  if (!conta) return null;

  const handlePrint = () => {
    window.print();
  };

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Comprovante de Pagamento a Fornecedor"
      subtitle="Comprovante de liquidação financeira de compromisso"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Documento de Impressão */}
        <div className="p-8 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-xs print:shadow-none print:border-none print:p-0 font-sans">
          {/* Topo */}
          <div className="border-b-2 border-gray-800 pb-4 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900">
                COMPROVANTE DE PAGAMENTO
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Controle Financeiro • ID Pagamento: #{conta.id}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 uppercase font-bold block">Valor Liquidado</span>
              <span className="text-xl font-black text-gray-900 tabular-nums">
                {formatCurrency(conta.valor_pago || conta.valor_original || conta.valor_parcela)}
              </span>
            </div>
          </div>

          {/* Pagador e Favorecido */}
          <div className="grid grid-cols-2 gap-6 my-6 text-xs border-b border-gray-200 pb-6">
            <div>
              <span className="text-gray-500 font-bold uppercase text-[10px] block mb-1">
                PAGADOR / DEVEDOR
              </span>
              <p className="font-bold text-gray-900">{empresa?.razao_social || 'Recebe Fácil ERP'}</p>
              <p className="text-gray-600">CNPJ: {empresa?.cnpj || '00.000.000/0001-00'}</p>
              <p className="text-gray-600">{empresa?.email || 'financeiro@empresa.com.br'}</p>
            </div>
            <div>
              <span className="text-gray-500 font-bold uppercase text-[10px] block mb-1">
                FAVORECIDO / FORNECEDOR
              </span>
              <p className="font-bold text-gray-900">{conta.fornecedor_nome}</p>
              <p className="text-gray-600">CNPJ/CPF: {conta.fornecedor_cnpj || '---'}</p>
            </div>
          </div>

          {/* Dados do Pagamento */}
          <div className="my-6 text-xs text-gray-800 leading-relaxed space-y-3">
            <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded border border-gray-200 text-xs">
              <div>
                <span className="text-[10px] text-gray-400 block font-bold">Nº DOCUMENTO</span>
                <span className="font-semibold text-gray-900">{conta.numero_documento}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block font-bold">PARCELA</span>
                <span className="font-semibold text-gray-900">{conta.numero_parcela}/{conta.total_parcelas || 1}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block font-bold">FORMA DE PAGAMENTO</span>
                <span className="font-semibold text-gray-900">{conta.forma_pagamento || 'PIX'}</span>
              </div>
            </div>

            <p>
              Confirmamos a liquidação financeira no valor de{' '}
              <strong>{formatCurrency(conta.valor_pago || conta.valor_original || conta.valor_parcela)}</strong>, referente ao documento nº{' '}
              <strong>{conta.numero_documento}</strong> com vencimento original em{' '}
              <strong>{formatDate(conta.vencimento || conta.data_vencimento)}</strong>.
            </p>

            {(conta.observacao || conta.observacoes) && (
              <p className="bg-gray-50 p-2.5 rounded border border-gray-200 italic text-[11px]">
                Observações: "{conta.observacao || conta.observacoes}"
              </p>
            )}
          </div>

          {/* Assinatura */}
          <div className="mt-10 pt-4 border-t border-gray-200 grid grid-cols-2 gap-8 items-end text-xs">
            <div>
              <p className="text-gray-600">
                Data do Pagamento: <strong>{formatDate(conta.data_pagamento || new Date().toISOString())}</strong>
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Autenticação do ERP Recebe Fácil • Ref: #{conta.id}
              </p>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-400 pb-1 mb-1"></div>
              <p className="font-bold text-gray-900">{empresa?.razao_social || 'Departamento Financeiro'}</p>
              <p className="text-[10px] text-gray-500">Tesouraria / Contas a Pagar</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Comprovante</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
