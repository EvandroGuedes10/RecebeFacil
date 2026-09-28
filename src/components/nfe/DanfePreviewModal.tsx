import React from 'react';
import { Download, FileText, Printer, CheckCircle2, Building, User, Calendar, DollarSign, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { NotaFiscal, Empresa } from '../../types';

interface DanfePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  nota: NotaFiscal | null;
  empresa: Empresa | null;
}

export const DanfePreviewModal: React.FC<DanfePreviewModalProps> = ({
  isOpen,
  onClose,
  nota,
  empresa,
}) => {
  if (!nota) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadXml = () => {
    if (!nota.arquivo_xml) return;
    const blob = new Blob([nota.arquivo_xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NFe_${nota.chave_acesso || nota.numero}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      title="DANFE - Documento Auxiliar da Nota Fiscal Eletrônica"
      subtitle={`NF-e Nº ${nota.numero} • Série ${nota.serie || '1'}`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Documento DANFE Visual */}
        <div className="bg-white text-gray-900 border-2 border-gray-800 p-6 rounded text-xs font-sans space-y-4 print:border-none print:p-0">
          {/* Header DANFE */}
          <div className="grid grid-cols-12 gap-3 border-b-2 border-gray-800 pb-4">
            {/* Emitente */}
            <div className="col-span-6 border-r border-gray-300 pr-3">
              <h2 className="font-bold text-sm text-gray-900 leading-tight">
                {empresa?.razao_social || 'RECEBE FACIL SOLUCOES FINANCEIRAS LTDA'}
              </h2>
              <p className="text-[11px] text-gray-600 mt-1">
                {empresa?.endereco || 'Av. Paulista, 1000 - Bela Vista'}
              </p>
              <p className="text-[11px] text-gray-600">
                {empresa?.cidade || 'São Paulo'} - {empresa?.estado || 'SP'} • CEP: {empresa?.cep || '01310-100'}
              </p>
              <p className="text-[11px] text-gray-600">
                CNPJ: {empresa?.cnpj || '00.000.000/0001-00'} • IE: {empresa?.inscricao_estadual || '111.222.333.444'}
              </p>
            </div>

            {/* Quadro DANFE */}
            <div className="col-span-3 text-center border-r border-gray-300 px-2 flex flex-col justify-center">
              <span className="font-black text-base tracking-wider block">DANFE</span>
              <span className="text-[10px] text-gray-500 block leading-tight">
                Documento Auxiliar da Nota Fiscal Eletrônica
              </span>
              <div className="mt-2 text-left text-[10px] space-y-0.5">
                <p>
                  <strong>0</strong> - Entrada / <strong>1</strong> - Saída: <strong>1</strong>
                </p>
                <p>
                  Nº: <strong>{nota.numero}</strong> • Série: <strong>{nota.serie || '1'}</strong>
                </p>
              </div>
            </div>

            {/* Chave de Acesso e Protocolo */}
            <div className="col-span-3 pl-2 flex flex-col justify-center">
              <span className="text-[9px] uppercase font-bold text-gray-500 block">
                Chave de Acesso
              </span>
              <span className="font-mono text-[10px] font-bold break-all block my-1">
                {nota.chave_acesso || '35260100000000000100550010000012341000012340'}
              </span>
              <p className="text-[10px] text-gray-500 mt-1">
                Protocolo: {nota.protocolo_autorizacao || '135260000123456'}
              </p>
            </div>
          </div>

          {/* Destinatário */}
          <div className="border border-gray-300 p-3 rounded">
            <span className="text-[10px] uppercase font-bold text-gray-500 block border-b border-gray-200 pb-1 mb-2">
              DESTINATÁRIO / REMETENTE
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-gray-500 block">Nome / Razão Social</span>
                <span className="font-bold text-gray-900">{nota.destinatario_nome || 'Cliente Consumidor'}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block">CNPJ / CPF</span>
                <span className="font-bold font-mono text-gray-900">
                  {nota.destinatario_cnpj || '00.000.000/0000-00'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block">Data de Emissão</span>
                <span className="font-bold text-gray-900">{formatDate(nota.data_emissao)}</span>
              </div>
            </div>
          </div>

          {/* Fatura / Duplicatas */}
          <div className="border border-gray-300 p-3 rounded">
            <span className="text-[10px] uppercase font-bold text-gray-500 block border-b border-gray-200 pb-1 mb-2">
              FATURA / DUPLICATAS GERADAS
            </span>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Condição de Cobrança: À Prazo</span>
              <span className="font-bold text-gray-900">
                Valor Total da Fatura: {formatCurrency(nota.valor_total)}
              </span>
            </div>
          </div>

          {/* Totais do Imposto */}
          <div className="border border-gray-300 p-3 rounded bg-gray-50">
            <span className="text-[10px] uppercase font-bold text-gray-500 block border-b border-gray-200 pb-1 mb-2">
              CÁLCULO DO IMPOSTO
            </span>
            <div className="grid grid-cols-4 gap-2 text-right">
              <div>
                <span className="text-[10px] text-gray-500 block text-left">Base de Cálculo ICMS</span>
                <span className="font-semibold">{formatCurrency(nota.valor_total)}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block text-left">Valor do ICMS</span>
                <span className="font-semibold">{formatCurrency((nota.valor_total || 0) * 0.18)}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block text-left">Valor do Frete</span>
                <span className="font-semibold">R$ 0,00</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block text-left font-bold text-gray-900">
                  VALOR TOTAL DA NOTA
                </span>
                <span className="font-black text-sm text-gray-900">
                  {formatCurrency(nota.valor_total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
          >
            Fechar
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadXml}
              className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Baixar XML</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir DANFE</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
