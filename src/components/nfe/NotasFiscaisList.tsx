import React, { useState } from 'react';
import {
  FileText,
  Search,
  Calendar,
  Upload,
  Eye,
  Download,
  DollarSign,
  CheckCircle2,
  Clock,
  Building,
} from 'lucide-react';
import { NotaFiscal } from '../../types';
import { TableSkeleton } from '../common/Skeleton';

interface NotasFiscaisListProps {
  notas: NotaFiscal[];
  loading: boolean;
  onVisualizarDanfe: (nota: NotaFiscal) => void;
  onOpenImport: () => void;
}

export const NotasFiscaisList: React.FC<NotasFiscaisListProps> = ({
  notas,
  loading,
  onVisualizarDanfe,
  onOpenImport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredNotas = (notas || []).filter((n) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      n.numero?.toLowerCase().includes(term) ||
      n.chave_acesso?.toLowerCase().includes(term) ||
      n.destinatario_nome?.toLowerCase().includes(term) ||
      n.destinatario_cnpj?.toLowerCase().includes(term)
    );
  });

  const handleDownloadXml = (nota: NotaFiscal) => {
    if (!nota.arquivo_xml) {
      alert('Arquivo XML não armazenado para esta nota.');
      return;
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Notas Fiscais Eletrônicas (NF-e)
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Documentos fiscais importados via XML com emissão de DANFE e geração de parcelas.
          </p>
        </div>
        <button
          onClick={onOpenImport}
          className="px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Importar Novo XML</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por número, chave ou destinatário..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Total de Notas: <strong className="text-gray-800 dark:text-gray-200 tabular-nums">{filteredNotas.length}</strong>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <TableSkeleton rows={6} columns={6} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xs">
          {filteredNotas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Número / Série</th>
                    <th className="py-3.5 px-4">Destinatário</th>
                    <th className="py-3.5 px-4">Data Emissão</th>
                    <th className="py-3.5 px-4 text-right">Valor Total</th>
                    <th className="py-3.5 px-4">Chave de Acesso</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredNotas.map((nota) => (
                    <tr
                      key={nota.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                        <span className="font-mono">NF-e {nota.numero}</span>
                        <span className="text-gray-400 dark:text-gray-500 ml-1.5 text-[11px]">
                          Série {nota.serie || '1'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-gray-200">
                          {nota.destinatario_nome || 'Destinatário'}
                        </div>
                        {nota.destinatario_cnpj && (
                          <div className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">
                            CNPJ/CPF: {nota.destinatario_cnpj}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 tabular-nums">
                        {formatDate(nota.data_emissao)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white tabular-nums">
                        {formatCurrency(nota.valor_total)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[160px] block">
                          {nota.chave_acesso}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onVisualizarDanfe(nota)}
                            className="px-2.5 py-1 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Visualizar DANFE</span>
                          </button>
                          <button
                            onClick={() => handleDownloadXml(nota)}
                            title="Baixar XML original"
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-xs">
              Nenhuma nota fiscal eletrônica encontrada.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
