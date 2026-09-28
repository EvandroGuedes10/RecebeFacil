import React from 'react';
import { Printer, Download, CheckCircle2, Building, User, Calendar, DollarSign, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ParcelaReceber, Empresa } from '../../types';

interface ReciboModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcela: ParcelaReceber | null;
  empresa: Empresa | null;
}

export const ReciboModal: React.FC<ReciboModalProps> = ({
  isOpen,
  onClose,
  parcela,
  empresa,
}) => {
  if (!parcela) return null;

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
      title="Recibo de Quitação Financeira"
      subtitle="Comprovante de liquidação de título para fins de contabilidade"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Documento do Recibo para Impressão */}
        <div className="p-8 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-xs print:shadow-none print:border-none print:p-0">
          {/* Topo do Recibo */}
          <div className="border-b-2 border-gray-800 pb-4 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900">
                RECIBO DE QUITAÇÃO FINANCEIRA
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Documento nº RC-{parcela.id}-{new Date().getFullYear()}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 uppercase font-bold block">Valor Total</span>
              <span className="text-xl font-black text-gray-900 tabular-nums">
                {formatCurrency(parcela.valor_recebido || parcela.valor_original)}
              </span>
            </div>
          </div>

          {/* Dados do Emissor e Pagador */}
          <div className="grid grid-cols-2 gap-6 my-6 text-xs border-b border-gray-200 pb-6">
            <div>
              <span className="text-gray-500 font-bold uppercase text-[10px] block mb-1">
                EMISSOR / BENEFICIÁRIO
              </span>
              <p className="font-bold text-gray-900">{empresa?.razao_social || 'Recebe Fácil Ltda'}</p>
              <p className="text-gray-600">CNPJ: {empresa?.cnpj || '00.000.000/0001-00'}</p>
              <p className="text-gray-600">{empresa?.email || 'contato@empresa.com.br'}</p>
            </div>
            <div>
              <span className="text-gray-500 font-bold uppercase text-[10px] block mb-1">
                PAGADOR / SACADO
              </span>
              <p className="font-bold text-gray-900">{parcela.cliente_nome || 'Cliente Consumidor'}</p>
              <p className="text-gray-600">Identificação: #{parcela.cliente_id || '---'}</p>
            </div>
          </div>

          {/* Declaração de Quitação */}
          <div className="my-6 text-xs text-gray-800 leading-relaxed space-y-3">
            <p>
              Declaramos para os devidos fins de direito que recebemos da empresa/pessoa acima qualificada a importância supra de{' '}
              <strong>{formatCurrency(parcela.valor_recebido || parcela.valor_original)}</strong>, referente à liquidação da parcela{' '}
              <strong>{parcela.numero_parcela}</strong> vinculada à <strong>Nota Fiscal Eletrônica nº {parcela.numero_nota || 'S/N'}</strong> (vencimento original em {formatDate(parcela.vencimento)}), dando por este instrumento plena, geral e irrevogável quitação do respectivo título.
            </p>
            {parcela.observacao && (
              <p className="bg-gray-50 p-2.5 rounded border border-gray-200 italic text-[11px]">
                Observações registradas: "{parcela.observacao}"
              </p>
            )}
          </div>

          {/* Assinatura e Data */}
          <div className="mt-12 pt-6 border-t border-gray-200 grid grid-cols-2 gap-8 items-end text-xs">
            <div>
              <p className="text-gray-600">
                Data de Liquidação: <strong>{formatDate(parcela.data_recebimento || new Date().toISOString())}</strong>
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Autenticação do Sistema Recebe Fácil • ID Transação: {parcela.id}
              </p>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-400 pb-1 mb-1"></div>
              <p className="font-bold text-gray-900">{empresa?.razao_social || 'Departamento Financeiro'}</p>
              <p className="text-[10px] text-gray-500">Assinatura do Responsável</p>
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
            <span>Imprimir Recibo</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
