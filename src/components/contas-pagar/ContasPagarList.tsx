import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  CreditCard,
  DollarSign,
  Eye,
  Edit,
  RotateCcw,
  Receipt,
  Download,
  Plus,
  PlusCircle,
  Truck,
  Filter,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Tag,
  Briefcase,
} from 'lucide-react';
import { ContaPagar, Fornecedor } from '../../types';
import { TableSkeleton } from '../common/Skeleton';

interface ContasPagarListProps {
  contas: ContaPagar[];
  fornecedores: Fornecedor[];
  loading: boolean;
  onNovoLancamento: () => void;
  onVisualizar: (conta: ContaPagar) => void;
  onEditar: (conta: ContaPagar) => void;
  onBaixar: (conta: ContaPagar) => void;
  onEstornar: (conta: ContaPagar) => void;
  onComprovante: (conta: ContaPagar) => void;
}

export const ContasPagarList: React.FC<ContasPagarListProps> = ({
  contas,
  fornecedores,
  loading,
  onNovoLancamento,
  onVisualizar,
  onEditar,
  onBaixar,
  onEstornar,
  onComprovante,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('todos');
  const [selectedFornecedorId, setSelectedFornecedorId] = useState('');
  const [selectedOrigem, setSelectedOrigem] = useState('todas');
  const [selectedCategoria, setSelectedCategoria] = useState('todas');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Obter categorias únicas dos dados
  const categoriasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    (contas || []).forEach((cp) => {
      if (cp.categoria) set.add(cp.categoria);
    });
    return Array.from(set).sort();
  }, [contas]);

  // Filtering
  const filteredContas = useMemo(() => {
    return (contas || []).filter((cp) => {
      if (selectedFornecedorId && cp.fornecedor_id !== Number(selectedFornecedorId)) {
        return false;
      }
      if (selectedStatus !== 'todos' && cp.status.toLowerCase() !== selectedStatus.toLowerCase()) {
        return false;
      }
      if (selectedOrigem !== 'todas') {
        const itemOrigem = cp.origem || (cp.nota_entrada_id ? 'XML' : 'MANUAL');
        if (itemOrigem.toUpperCase() !== selectedOrigem.toUpperCase()) {
          return false;
        }
      }
      if (selectedCategoria !== 'todas' && cp.categoria?.toLowerCase() !== selectedCategoria.toLowerCase()) {
        return false;
      }

      const venc = cp.vencimento || cp.data_vencimento || '';
      if (dataInicio && venc < dataInicio) {
        return false;
      }
      if (dataFim && venc > dataFim) {
        return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchForn = cp.fornecedor_nome?.toLowerCase().includes(term);
        const matchDoc = cp.numero_documento?.toLowerCase().includes(term);
        const matchDesc = cp.descricao?.toLowerCase().includes(term);
        const matchCC = cp.centro_custo?.toLowerCase().includes(term);
        const matchCat = cp.categoria?.toLowerCase().includes(term);
        const matchId = String(cp.id).includes(term);

        if (!matchForn && !matchDoc && !matchDesc && !matchCC && !matchCat && !matchId) {
          return false;
        }
      }
      return true;
    });
  }, [contas, selectedFornecedorId, selectedStatus, selectedOrigem, selectedCategoria, dataInicio, dataFim, searchTerm]);

  const summaryTotals = useMemo(() => {
    return filteredContas.reduce(
      (acc, cp) => {
        const valorOriginal = Number(cp.valor_original ?? cp.valor_parcela ?? 0);
        const valorPago = Number(cp.valor_pago || 0);
        const saldo = Number(cp.saldo ?? Math.max(0, valorOriginal - valorPago));
        acc.totalOriginal += valorOriginal;
        acc.totalPago += valorPago;
        acc.totalSaldo += saldo;
        return acc;
      },
      { totalOriginal: 0, totalPago: 0, totalSaldo: 0 }
    );
  }, [filteredContas]);

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

  const exportToCsv = () => {
    const headers = [
      'ID',
      'Origem',
      'Fornecedor',
      'CNPJ',
      'Documento',
      'Descrição',
      'Centro de Custo',
      'Categoria',
      'Parcela',
      'Vencimento',
      'Valor Original',
      'Valor Pago',
      'Saldo',
      'Status',
    ];
    const rows = filteredContas.map((cp) => [
      cp.id,
      cp.origem || (cp.nota_entrada_id ? 'XML' : 'MANUAL'),
      `"${cp.fornecedor_nome}"`,
      `"${cp.fornecedor_cnpj || ''}"`,
      `"${cp.numero_documento}"`,
      `"${cp.descricao || ''}"`,
      `"${cp.centro_custo || ''}"`,
      `"${cp.categoria || ''}"`,
      `${cp.numero_parcela}/${cp.total_parcelas}`,
      cp.vencimento || cp.data_vencimento,
      Number(cp.valor_original ?? cp.valor_parcela ?? 0).toFixed(2),
      Number(cp.valor_pago || 0).toFixed(2),
      Number(cp.saldo ?? 0).toFixed(2),
      cp.status,
    ]);

    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `contas_a_pagar_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Contas a Pagar
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Gestão de fornecedores, pagamentos, faturas manuais e notas de entrada.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onNovoLancamento}
            className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Novo Lançamento</span>
          </button>

          <button
            onClick={exportToCsv}
            disabled={filteredContas.length === 0}
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
              placeholder="Buscar fornecedor, descrição, doc ou centro de custo..."
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
              <option value="XML">Origem XML (Entrada)</option>
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
              <option value="atrasado">Apenas Atrasadas</option>
              <option value="pago">Apenas Pagas</option>
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

          {/* Fornecedor Dropdown */}
          <div>
            <select
              value={selectedFornecedorId}
              onChange={(e) => setSelectedFornecedorId(e.target.value)}
              className="w-full py-1.5 px-3 text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">Todos os Fornecedores</option>
              {(fornecedores || []).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Linha 2: Período de Vencimento e Totais */}
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
            {(dataInicio || dataFim || selectedStatus !== 'todos' || selectedOrigem !== 'todas' || selectedCategoria !== 'todas' || selectedFornecedorId || searchTerm) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('todos');
                  setSelectedOrigem('todas');
                  setSelectedCategoria('todas');
                  setSelectedFornecedorId('');
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
              Exibindo: <strong className="text-gray-900 dark:text-white">{filteredContas.length}</strong> contas
            </span>
            <span>
              Total: <strong className="text-gray-900 dark:text-white tabular-nums">{formatCurrency(summaryTotals.totalOriginal)}</strong>
            </span>
            <span>
              Pago: <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(summaryTotals.totalPago)}</strong>
            </span>
            <span>
              Saldo a Pagar: <strong className="text-amber-600 dark:text-amber-400 tabular-nums">{formatCurrency(summaryTotals.totalSaldo)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : filteredContas.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Nenhuma conta a pagar encontrada
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              Cadastre despesas manuais pelo botão "Novo Lançamento" ou importe XMLs de notas fiscais de entrada.
            </p>
            <button
              onClick={onNovoLancamento}
              className="mt-4 px-3.5 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Cadastrar Lançamento a Pagar</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Origem / ID</th>
                  <th className="py-3 px-4">Descrição / Doc</th>
                  <th className="py-3 px-4">Fornecedor</th>
                  <th className="py-3 px-4">Centro de Custo</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-right">Saldo Aberto</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {filteredContas.map((cp) => {
                  const isAtrasado = cp.status.toLowerCase() === 'atrasado' || cp.status.toLowerCase() === 'vencido';
                  const isPago = cp.status.toLowerCase() === 'pago';
                  const isParcial = cp.status.toLowerCase() === 'parcial';
                  const origemIsXml = (cp.origem || (cp.nota_entrada_id ? 'XML' : 'MANUAL')).toUpperCase() === 'XML';

                  return (
                    <tr
                      key={cp.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-750 transition-colors group"
                    >
                      {/* Origem / ID */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              origemIsXml
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            }`}
                          >
                            {origemIsXml ? 'XML' : 'MANUAL'}
                          </span>
                          <span className="font-mono text-gray-500 text-[11px]">#{cp.id}</span>
                        </div>
                      </td>

                      {/* Descrição / Doc */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white truncate max-w-[190px]" title={cp.descricao}>
                          {cp.descricao || cp.numero_documento}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          {cp.total_parcelas > 1 ? `Parc. ${cp.numero_parcela}/${cp.total_parcelas}` : 'À Vista'}
                          {cp.numero_documento && ` • ${cp.numero_documento}`}
                        </div>
                      </td>

                      {/* Fornecedor */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {cp.fornecedor_nome}
                        </div>
                        {cp.fornecedor_cnpj && (
                          <div className="text-[11px] text-gray-400 font-mono">
                            {cp.fornecedor_cnpj}
                          </div>
                        )}
                      </td>

                      {/* Centro de Custo */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-gray-100 dark:bg-gray-700 font-medium">
                          <Briefcase className="w-2.5 h-2.5 text-gray-400" />
                          <span>{cp.centro_custo || 'Operacional'}</span>
                        </span>
                      </td>

                      {/* Categoria */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 dark:bg-gray-700">
                          <Tag className="w-2.5 h-2.5 text-gray-400" />
                          <span>{cp.categoria || 'Geral'}</span>
                        </span>
                      </td>

                      {/* Vencimento */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-700 dark:text-gray-300 tabular-nums">
                        {formatDate(cp.vencimento || cp.data_vencimento)}
                      </td>

                      {/* Valor Original */}
                      <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap tabular-nums">
                        {formatCurrency(cp.valor_original ?? cp.valor_parcela)}
                      </td>

                      {/* Saldo Aberto */}
                      <td className="py-3 px-4 text-right font-bold whitespace-nowrap tabular-nums">
                        <span className={Number(cp.saldo || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}>
                          {formatCurrency(cp.saldo ?? Math.max(0, (cp.valor_original ?? cp.valor_parcela) - (cp.valor_pago || 0)))}
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
                          <span>{cp.status}</span>
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onVisualizar(cp)}
                            title="Visualizar detalhes"
                            className="p-1 rounded text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {!isPago && (
                            <>
                              <button
                                onClick={() => onBaixar(cp)}
                                title="Baixar / Pagar conta"
                                className="px-2 py-1 rounded bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer"
                              >
                                <DollarSign className="w-3 h-3" />
                                <span>Pagar</span>
                              </button>
                              <button
                                onClick={() => onEditar(cp)}
                                title="Editar conta"
                                className="p-1 rounded text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {isPago && (
                            <>
                              <button
                                onClick={() => onComprovante(cp)}
                                title="Imprimir Comprovante de Pagamento"
                                className="p-1 rounded text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/60 cursor-pointer"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onEstornar(cp)}
                                title="Estornar pagamento"
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
