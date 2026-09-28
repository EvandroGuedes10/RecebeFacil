import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Edit,
  DollarSign,
  FileText,
  RotateCcw,
  Download,
  Receipt,
  ChevronDown,
  Layers,
  PlusCircle,
  Tag,
  Sparkles,
} from 'lucide-react';
import { ParcelaReceber, Cliente } from '../../types';
import { TableSkeleton } from '../common/Skeleton';
import { exportParcelasToCsv } from '../../utils/exportUtils';

interface ParcelasListProps {
  parcelas: ParcelaReceber[];
  clientes: Cliente[];
  loading: boolean;
  onNovoLancamento?: () => void;
  onVisualizar: (parcela: ParcelaReceber) => void;
  onEditar: (parcela: ParcelaReceber) => void;
  onBaixar: (parcela: ParcelaReceber) => void;
  onEstornar: (parcela: ParcelaReceber) => void;
  onRecibo: (parcela: ParcelaReceber) => void;
}

export const ParcelasList: React.FC<ParcelasListProps> = ({
  parcelas,
  clientes,
  loading,
  onNovoLancamento,
  onVisualizar,
  onEditar,
  onBaixar,
  onEstornar,
  onRecibo,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [selectedOrigem, setSelectedOrigem] = useState<string>('todas');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todas');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Obter categorias únicas dos dados
  const categoriasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    (parcelas || []).forEach((p) => {
      if (p.categoria) set.add(p.categoria);
    });
    return Array.from(set).sort();
  }, [parcelas]);

  // Filtering
  const filteredParcelas = useMemo(() => {
    return (parcelas || []).filter((p) => {
      // Cliente filter
      if (selectedClienteId && p.cliente_id !== Number(selectedClienteId)) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'todos' && p.status !== selectedStatus) {
        return false;
      }

      // Origem filter (XML vs MANUAL)
      if (selectedOrigem !== 'todas') {
        const itemOrigem = p.origem || (p.nota_id ? 'XML' : 'MANUAL');
        if (itemOrigem.toUpperCase() !== selectedOrigem.toUpperCase()) {
          return false;
        }
      }

      // Categoria filter
      if (selectedCategoria !== 'todas' && p.categoria?.toLowerCase() !== selectedCategoria.toLowerCase()) {
        return false;
      }

      // Date range filter
      const venc = p.vencimento || p.data_vencimento || '';
      if (dataInicio && venc < dataInicio) {
        return false;
      }
      if (dataFim && venc > dataFim) {
        return false;
      }

      // Search term filter (cliente, nota, chave, descricao, id)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchCliente = p.cliente_nome?.toLowerCase().includes(term);
        const matchNota = p.numero_nota?.toLowerCase().includes(term);
        const matchChave = p.chave_nfe?.toLowerCase().includes(term);
        const matchDesc = p.descricao?.toLowerCase().includes(term);
        const matchCat = p.categoria?.toLowerCase().includes(term);
        const matchId = String(p.id).includes(term);

        if (!matchCliente && !matchNota && !matchChave && !matchDesc && !matchCat && !matchId) {
          return false;
        }
      }

      return true;
    });
  }, [parcelas, selectedClienteId, selectedStatus, selectedOrigem, selectedCategoria, dataInicio, dataFim, searchTerm]);

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

  // Summary counts and totals of the filtered list
  const summaryTotals = useMemo(() => {
    return filteredParcelas.reduce(
      (acc, p) => {
        acc.totalOriginal += Number(p.valor_original || 0);
        acc.totalRecebido += Number(p.valor_recebido || 0);
        acc.totalSaldo += Number(p.saldo ?? p.valor_original ?? 0);
        return acc;
      },
      { totalOriginal: 0, totalRecebido: 0, totalSaldo: 0 }
    );
  }, [filteredParcelas]);

  const handleExportCsv = () => {
    exportParcelasToCsv(filteredParcelas);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Contas a Receber
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Gestão de títulos, faturamentos manuais e recebimentos originados de XMLs.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {onNovoLancamento && (
            <button
              onClick={onNovoLancamento}
              className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Novo Lançamento</span>
            </button>
          )}

          <button
            onClick={handleExportCsv}
            disabled={filteredParcelas.length === 0}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente, descrição ou NF-e..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Origem Dropdown (XML vs MANUAL) */}
          <div>
            <select
              value={selectedOrigem}
              onChange={(e) => setSelectedOrigem(e.target.value)}
              className="w-full py-1.5 px-3 text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
            >
              <option value="todas">Todas as Origens</option>
              <option value="XML">Origem XML (NF-e)</option>
              <option value="MANUAL">Origem Manual</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-1.5 px-3 text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Apenas Pendentes</option>
              <option value="vencido">Apenas Vencidos</option>
              <option value="pago">Apenas Pagos</option>
              <option value="parcial">Apenas Parciais</option>
            </select>
          </div>

          {/* Categoria Dropdown */}
          <div>
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="w-full py-1.5 px-3 text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="todas">Todas as Categorias</option>
              {categoriasDisponiveis.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Cliente Dropdown */}
          <div>
            <select
              value={selectedClienteId}
              onChange={(e) => setSelectedClienteId(e.target.value)}
              className="w-full py-1.5 px-3 text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">Todos os Clientes</option>
              {(clientes || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Linha 2: Filtro de Período e Limpar */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-700/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-[11px] font-semibold">Período de Vencimento:</span>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="py-1 px-2 text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
            />
            <span className="text-gray-400">até</span>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="py-1 px-2 text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
            />
            {(dataInicio || dataFim || selectedStatus !== 'todos' || selectedOrigem !== 'todas' || selectedCategoria !== 'todas' || selectedClienteId || searchTerm) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('todos');
                  setSelectedOrigem('todas');
                  setSelectedCategoria('todas');
                  setSelectedClienteId('');
                  setDataInicio('');
                  setDataFim('');
                }}
                className="text-blue-600 dark:text-blue-400 text-xs hover:underline ml-2 cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300 font-medium">
            <span>
              Exibindo: <strong className="text-gray-900 dark:text-white">{filteredParcelas.length}</strong> títulos
            </span>
            <span>
              Previsto: <strong className="text-gray-900 dark:text-white tabular-nums">{formatCurrency(summaryTotals.totalOriginal)}</strong>
            </span>
            <span>
              Recebido: <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(summaryTotals.totalRecebido)}</strong>
            </span>
            <span>
              Saldo Aberto: <strong className="text-blue-600 dark:text-blue-400 tabular-nums">{formatCurrency(summaryTotals.totalSaldo)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : filteredParcelas.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Nenhum título a receber encontrado
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              Utilize o botão "Novo Lançamento" para cadastrar títulos manuais ou importe um arquivo XML de NF-e de saída.
            </p>
            {onNovoLancamento && (
              <button
                onClick={onNovoLancamento}
                className="mt-4 px-3.5 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Cadastrar Primeiro Lançamento</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Origem / ID</th>
                  <th className="py-3 px-4">Descrição / Documento</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4 text-right">Valor Parcela</th>
                  <th className="py-3 px-4 text-right">Saldo Aberto</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {filteredParcelas.map((p) => {
                  const isAtrasado = p.status === 'vencido' || p.status === 'atrasado';
                  const isPago = p.status === 'pago';
                  const isParcial = p.status === 'parcial';
                  const origemIsXml = (p.origem || (p.nota_id ? 'XML' : 'MANUAL')).toUpperCase() === 'XML';

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-750 transition-colors group"
                    >
                      {/* Origem / ID */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              origemIsXml
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {origemIsXml ? 'XML' : 'MANUAL'}
                          </span>
                          <span className="font-mono text-gray-500 text-[11px]">#{p.id}</span>
                        </div>
                      </td>

                      {/* Descrição / Documento */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]" title={p.descricao}>
                          {p.descricao || (p.numero_nota ? `NF-e ${p.numero_nota}` : `Título #${p.id}`)}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          {p.total_parcelas && p.total_parcelas > 1 ? `Parc. ${p.numero_parcela}/${p.total_parcelas}` : 'À Vista'}
                          {p.numero_documento && ` • ${p.numero_documento}`}
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {p.cliente_nome || 'Cliente não identificado'}
                        </div>
                        {p.cliente_cpf_cnpj && (
                          <div className="text-[11px] text-gray-400 font-mono">
                            {p.cliente_cpf_cnpj}
                          </div>
                        )}
                      </td>

                      {/* Categoria */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 dark:bg-gray-700">
                          <Tag className="w-2.5 h-2.5 text-gray-400" />
                          <span>{p.categoria || 'Geral'}</span>
                        </span>
                      </td>

                      {/* Vencimento */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-700 dark:text-gray-300 tabular-nums">
                        {formatDate(p.vencimento || p.data_vencimento)}
                      </td>

                      {/* Valor Parcela */}
                      <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap tabular-nums">
                        {formatCurrency(p.valor_original ?? p.valor_parcela)}
                      </td>

                      {/* Saldo Aberto */}
                      <td className="py-3 px-4 text-right font-bold whitespace-nowrap tabular-nums">
                        <span className={Number(p.saldo || 0) > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                          {formatCurrency(p.saldo ?? p.valor_original)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                            isPago
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : isAtrasado
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-300 dark:border-red-800'
                              : isParcial
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {isPago && <CheckCircle2 className="w-3 h-3" />}
                          {isAtrasado && <AlertTriangle className="w-3 h-3" />}
                          {isParcial && <Clock className="w-3 h-3" />}
                          <span>{p.status || 'Pendente'}</span>
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onVisualizar(p)}
                            title="Visualizar detalhes"
                            className="p-1 rounded text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {!isPago && (
                            <>
                              <button
                                onClick={() => onBaixar(p)}
                                title="Baixar / Receber valor"
                                className="px-2 py-1 rounded bg-[#059669] hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer"
                              >
                                <DollarSign className="w-3 h-3" />
                                <span>Baixar</span>
                              </button>
                              <button
                                onClick={() => onEditar(p)}
                                title="Editar título"
                                className="p-1 rounded text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {isPago && (
                            <>
                              <button
                                onClick={() => onRecibo(p)}
                                title="Imprimir Recibo de Quitação"
                                className="p-1 rounded text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onEstornar(p)}
                                title="Estornar baixa"
                                className="p-1 rounded text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/60 cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
