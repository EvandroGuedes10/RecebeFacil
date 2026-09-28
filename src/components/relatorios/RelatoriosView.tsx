import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  FileText,
  Printer,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Truck,
  User,
  Clock,
  PieChart,
  Tag,
  Briefcase,
  Layers,
} from 'lucide-react';
import { ParcelaReceber, ContaPagar, Cliente, Fornecedor, Empresa } from '../../types';

interface RelatoriosViewProps {
  parcelasReceber?: ParcelaReceber[];
  parcelas?: ParcelaReceber[];
  contasPagar: ContaPagar[];
  clientes: Cliente[];
  fornecedores: Fornecedor[];
  empresa?: Empresa | null;
  empresaId?: number;
  onToast?: (type: any, msg: any) => void;
}

export type TipoRelatorio =
  | 'receber'
  | 'pagar'
  | 'fluxo'
  | 'receitas-categoria'
  | 'despesas-categoria'
  | 'inadimplencia';

export const RelatoriosView: React.FC<RelatoriosViewProps> = ({
  parcelasReceber,
  parcelas: parcelasProp = [],
  contasPagar,
  clientes,
  fornecedores,
  empresa = null,
  empresaId,
  onToast,
}) => {
  const parcelas = parcelasReceber || parcelasProp;
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>('receber');

  // Filtros Globais dos Relatórios
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroOrigem, setFiltroOrigem] = useState('todas');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroClienteId, setFiltroClienteId] = useState('');
  const [filtroFornecedorId, setFiltroFornecedorId] = useState('');

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

  // Extrair categorias únicas existentes
  const categoriasReceber = useMemo(() => {
    const set = new Set<string>();
    (parcelas || []).forEach((p) => {
      if (p.categoria) set.add(p.categoria);
    });
    return Array.from(set).sort();
  }, [parcelas]);

  const categoriasPagar = useMemo(() => {
    const set = new Set<string>();
    (contasPagar || []).forEach((cp) => {
      if (cp.categoria) set.add(cp.categoria);
    });
    return Array.from(set).sort();
  }, [contasPagar]);

  // 1. Dados Filtrados: Contas a Receber
  const dadosReceber = useMemo(() => {
    return (parcelas || []).filter((p) => {
      if (filtroStatus !== 'todos' && p.status.toLowerCase() !== filtroStatus.toLowerCase()) return false;
      if (filtroOrigem !== 'todas') {
        const orig = p.origem || (p.nota_id ? 'XML' : 'MANUAL');
        if (orig.toUpperCase() !== filtroOrigem.toUpperCase()) return false;
      }
      if (filtroCategoria !== 'todas' && p.categoria?.toLowerCase() !== filtroCategoria.toLowerCase()) return false;
      if (filtroClienteId && p.cliente_id !== Number(filtroClienteId)) return false;

      const v = p.vencimento || p.data_vencimento || '';
      if (dataInicio && v < dataInicio) return false;
      if (dataFim && v > dataFim) return false;
      return true;
    });
  }, [parcelas, filtroStatus, filtroOrigem, filtroCategoria, filtroClienteId, dataInicio, dataFim]);

  // 2. Dados Filtrados: Contas a Pagar
  const dadosPagar = useMemo(() => {
    return (contasPagar || []).filter((cp) => {
      if (filtroStatus !== 'todos' && cp.status.toLowerCase() !== filtroStatus.toLowerCase()) return false;
      if (filtroOrigem !== 'todas') {
        const orig = cp.origem || (cp.nota_entrada_id ? 'XML' : 'MANUAL');
        if (orig.toUpperCase() !== filtroOrigem.toUpperCase()) return false;
      }
      if (filtroCategoria !== 'todas' && cp.categoria?.toLowerCase() !== filtroCategoria.toLowerCase()) return false;
      if (filtroFornecedorId && cp.fornecedor_id !== Number(filtroFornecedorId)) return false;

      const v = cp.vencimento || cp.data_vencimento || '';
      if (dataInicio && v < dataInicio) return false;
      if (dataFim && v > dataFim) return false;
      return true;
    });
  }, [contasPagar, filtroStatus, filtroOrigem, filtroCategoria, filtroFornecedorId, dataInicio, dataFim]);

  // 3. Dados: Receitas por Categoria
  const dadosReceitasPorCategoria = useMemo(() => {
    const mapa: Record<string, { categoria: string; total: number; recebido: number; aberto: number; quantidade: number }> = {};
    let totalGeral = 0;

    dadosReceber.forEach((p) => {
      const cat = p.categoria || 'Outras Receitas';
      if (!mapa[cat]) {
        mapa[cat] = { categoria: cat, total: 0, recebido: 0, aberto: 0, quantidade: 0 };
      }
      const val = Number(p.valor_original ?? p.valor_parcela ?? 0);
      const rec = Number(p.valor_recebido || 0);
      const ab = Number(p.saldo ?? Math.max(0, val - rec));

      mapa[cat].total += val;
      mapa[cat].recebido += rec;
      mapa[cat].aberto += ab;
      mapa[cat].quantidade += 1;
      totalGeral += val;
    });

    const lista = Object.values(mapa).map((item) => ({
      ...item,
      percentual: totalGeral > 0 ? (item.total / totalGeral) * 100 : 0,
    })).sort((a, b) => b.total - a.total);

    return { totalGeral, categorias: lista };
  }, [dadosReceber]);

  // 4. Dados: Despesas por Categoria
  const dadosDespesasPorCategoria = useMemo(() => {
    const mapa: Record<string, { categoria: string; total: number; pago: number; aberto: number; quantidade: number }> = {};
    let totalGeral = 0;

    dadosPagar.forEach((cp) => {
      const cat = cp.categoria || 'Outras Despesas';
      if (!mapa[cat]) {
        mapa[cat] = { categoria: cat, total: 0, pago: 0, aberto: 0, quantidade: 0 };
      }
      const val = Number(cp.valor_original ?? cp.valor_parcela ?? 0);
      const pag = Number(cp.valor_pago || 0);
      const ab = Number(cp.saldo ?? Math.max(0, val - pag));

      mapa[cat].total += val;
      mapa[cat].pago += pag;
      mapa[cat].aberto += ab;
      mapa[cat].quantidade += 1;
      totalGeral += val;
    });

    const lista = Object.values(mapa).map((item) => ({
      ...item,
      percentual: totalGeral > 0 ? (item.total / totalGeral) * 100 : 0,
    })).sort((a, b) => b.total - a.total);

    return { totalGeral, categorias: lista };
  }, [dadosPagar]);

  // 5. Dados: Fluxo de Caixa Consolidado
  const dadosFluxo = useMemo(() => {
    const totalEntradas = dadosReceber.reduce((acc, p) => acc + Number(p.valor_original ?? p.valor_parcela ?? 0), 0);
    const entradasRecebidas = dadosReceber.reduce((acc, p) => acc + Number(p.valor_recebido || 0), 0);
    const entradasAbertas = totalEntradas - entradasRecebidas;

    const totalSaidas = dadosPagar.reduce((acc, cp) => acc + Number(cp.valor_original ?? cp.valor_parcela ?? 0), 0);
    const saidasPagas = dadosPagar.reduce((acc, cp) => acc + Number(cp.valor_pago || 0), 0);
    const saidasAbertas = totalSaidas - saidasPagas;

    const resultadoOperacional = totalEntradas - totalSaidas;
    const resultadoRealizado = entradasRecebidas - saidasPagas;

    return {
      totalEntradas,
      entradasRecebidas,
      entradasAbertas,
      totalSaidas,
      saidasPagas,
      saidasAbertas,
      resultadoOperacional,
      resultadoRealizado,
    };
  }, [dadosReceber, dadosPagar]);

  const handlePrintPdf = () => {
    window.print();
  };

  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `relatorio_${tipoRelatorio}_${new Date().toISOString().split('T')[0]}.csv`;

    if (tipoRelatorio === 'receber') {
      headers = ['ID', 'Origem', 'Cliente', 'Descrição', 'Categoria', 'Vencimento', 'Valor', 'Recebido', 'Saldo', 'Status'];
      rows = dadosReceber.map((p) => [
        p.id,
        p.origem || (p.nota_id ? 'XML' : 'MANUAL'),
        `"${p.cliente_nome}"`,
        `"${p.descricao || p.numero_nota || ''}"`,
        `"${p.categoria || ''}"`,
        p.vencimento || p.data_vencimento,
        Number(p.valor_original ?? p.valor_parcela ?? 0).toFixed(2),
        Number(p.valor_recebido || 0).toFixed(2),
        Number(p.saldo ?? 0).toFixed(2),
        p.status,
      ]);
    } else if (tipoRelatorio === 'pagar') {
      headers = ['ID', 'Origem', 'Fornecedor', 'Descrição', 'Centro de Custo', 'Categoria', 'Vencimento', 'Valor', 'Pago', 'Saldo', 'Status'];
      rows = dadosPagar.map((cp) => [
        cp.id,
        cp.origem || (cp.nota_entrada_id ? 'XML' : 'MANUAL'),
        `"${cp.fornecedor_nome}"`,
        `"${cp.descricao || cp.numero_documento || ''}"`,
        `"${cp.centro_custo || ''}"`,
        `"${cp.categoria || ''}"`,
        cp.vencimento || cp.data_vencimento,
        Number(cp.valor_original ?? cp.valor_parcela ?? 0).toFixed(2),
        Number(cp.valor_pago || 0).toFixed(2),
        Number(cp.saldo ?? 0).toFixed(2),
        cp.status,
      ]);
    } else if (tipoRelatorio === 'receitas-categoria') {
      headers = ['Categoria', 'Quantidade Títulos', 'Valor Total', 'Valor Recebido', 'Saldo Aberto', '% Participação'];
      rows = dadosReceitasPorCategoria.categorias.map((c) => [
        `"${c.categoria}"`,
        c.quantidade,
        c.total.toFixed(2),
        c.recebido.toFixed(2),
        c.aberto.toFixed(2),
        `${c.percentual.toFixed(1)}%`,
      ]);
    } else if (tipoRelatorio === 'despesas-categoria') {
      headers = ['Categoria', 'Quantidade Contas', 'Valor Total', 'Valor Pago', 'Saldo Aberto', '% Participação'];
      rows = dadosDespesasPorCategoria.categorias.map((c) => [
        `"${c.categoria}"`,
        c.quantidade,
        c.total.toFixed(2),
        c.pago.toFixed(2),
        c.aberto.toFixed(2),
        `${c.percentual.toFixed(1)}%`,
      ]);
    } else if (tipoRelatorio === 'fluxo') {
      headers = ['Indicador', 'Valor Previsto', 'Valor Realizado', 'Saldo Pendente'];
      rows = [
        ['Entradas Financeiras', dadosFluxo.totalEntradas.toFixed(2), dadosFluxo.entradasRecebidas.toFixed(2), dadosFluxo.entradasAbertas.toFixed(2)],
        ['Saídas Financeiras', dadosFluxo.totalSaidas.toFixed(2), dadosFluxo.saidasPagas.toFixed(2), dadosFluxo.saidasAbertas.toFixed(2)],
        ['Resultado Operacional Líquido', dadosFluxo.resultadoOperacional.toFixed(2), dadosFluxo.resultadoRealizado.toFixed(2), (dadosFluxo.entradasAbertas - dadosFluxo.saidasAbertas).toFixed(2)],
      ];
    }

    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs: { id: TipoRelatorio; label: string; icon: React.ElementType }[] = [
    { id: 'receber', label: 'Contas a Receber', icon: Receipt },
    { id: 'pagar', label: 'Contas a Pagar', icon: CreditCard },
    { id: 'fluxo', label: 'Fluxo de Caixa', icon: TrendingUp },
    { id: 'receitas-categoria', label: 'Receitas por Categoria', icon: PieChart },
    { id: 'despesas-categoria', label: 'Despesas por Categoria', icon: Layers },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Relatórios Financeiros e Gerenciais
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            DRE operacional, fluxo de caixa, demonstrativo por categoria e exportações contábeis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Exportar Excel (CSV)</span>
          </button>
          <button
            onClick={handlePrintPdf}
            className="px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs dos Relatórios */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tipoRelatorio === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setTipoRelatorio(tab.id);
                setFiltroCategoria('todas');
              }}
              className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Barra de Filtros Unificada */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Período Inicial */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full py-1.5 px-2 text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Período Final */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full py-1.5 px-2 text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Origem */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Origem
            </label>
            <select
              value={filtroOrigem}
              onChange={(e) => setFiltroOrigem(e.target.value)}
              className="w-full py-1.5 px-3 text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="todas">Todas as Origens</option>
              <option value="XML">Apenas XML</option>
              <option value="MANUAL">Apenas Manual</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Status Financeiro
            </label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full py-1.5 px-3 text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Apenas Pendentes</option>
              <option value="pago">Apenas Baixados / Pagos</option>
              <option value="vencido">Apenas Atrasados</option>
            </select>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Categoria
            </label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full py-1.5 px-3 text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="todas">Todas as Categorias</option>
              {(tipoRelatorio === 'receber' || tipoRelatorio === 'receitas-categoria'
                ? categoriasReceber
                : categoriasPagar
              ).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Linha de Cliente / Fornecedor */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            {tipoRelatorio !== 'pagar' && tipoRelatorio !== 'despesas-categoria' && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-[11px] font-semibold">Cliente:</span>
                <select
                  value={filtroClienteId}
                  onChange={(e) => setFiltroClienteId(e.target.value)}
                  className="py-1 px-2 text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                >
                  <option value="">Todos os Clientes</option>
                  {(clientes || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {tipoRelatorio !== 'receber' && tipoRelatorio !== 'receitas-categoria' && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-[11px] font-semibold">Fornecedor:</span>
                <select
                  value={filtroFornecedorId}
                  onChange={(e) => setFiltroFornecedorId(e.target.value)}
                  className="py-1 px-2 text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                >
                  <option value="">Todos os Fornecedores</option>
                  {(fornecedores || []).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(dataInicio || dataFim || filtroStatus !== 'todos' || filtroOrigem !== 'todas' || filtroCategoria !== 'todas' || filtroClienteId || filtroFornecedorId) && (
              <button
                onClick={() => {
                  setDataInicio('');
                  setDataFim('');
                  setFiltroStatus('todos');
                  setFiltroOrigem('todas');
                  setFiltroCategoria('todas');
                  setFiltroClienteId('');
                  setFiltroFornecedorId('');
                }}
                className="text-blue-600 dark:text-blue-400 text-xs hover:underline cursor-pointer"
              >
                Limpar todos os filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo Dinâmico por Tipo de Relatório */}

      {/* 1. RELATÓRIO DE CONTAS A RECEBER */}
      {tipoRelatorio === 'receber' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Demonstrativo de Contas a Receber ({dadosReceber.length} itens)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 font-semibold text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-4">Origem</th>
                  <th className="py-2.5 px-4">Cliente</th>
                  <th className="py-2.5 px-4">Descrição</th>
                  <th className="py-2.5 px-4">Categoria</th>
                  <th className="py-2.5 px-4">Vencimento</th>
                  <th className="py-2.5 px-4 text-right">Valor Original</th>
                  <th className="py-2.5 px-4 text-right">Valor Recebido</th>
                  <th className="py-2.5 px-4 text-right">Saldo</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {dadosReceber.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-750">
                    <td className="py-2.5 px-4">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                        {p.origem || (p.nota_id ? 'XML' : 'MANUAL')}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-gray-900 dark:text-white">
                      {p.cliente_nome}
                    </td>
                    <td className="py-2.5 px-4 text-gray-600 dark:text-gray-300 truncate max-w-xs">
                      {p.descricao || (p.numero_nota ? `NF-e ${p.numero_nota}` : `#${p.id}`)}
                    </td>
                    <td className="py-2.5 px-4 text-gray-500">{p.categoria || 'Geral'}</td>
                    <td className="py-2.5 px-4 tabular-nums">{formatDate(p.vencimento || p.data_vencimento)}</td>
                    <td className="py-2.5 px-4 text-right font-medium tabular-nums">{formatCurrency(p.valor_original ?? p.valor_parcela)}</td>
                    <td className="py-2.5 px-4 text-right text-emerald-600 font-medium tabular-nums">{formatCurrency(p.valor_recebido || 0)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(p.saldo ?? p.valor_original)}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. RELATÓRIO DE CONTAS A PAGAR */}
      {tipoRelatorio === 'pagar' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Demonstrativo de Contas a Pagar ({dadosPagar.length} itens)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 font-semibold text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-4">Origem</th>
                  <th className="py-2.5 px-4">Fornecedor</th>
                  <th className="py-2.5 px-4">Descrição</th>
                  <th className="py-2.5 px-4">Centro Custo</th>
                  <th className="py-2.5 px-4">Categoria</th>
                  <th className="py-2.5 px-4">Vencimento</th>
                  <th className="py-2.5 px-4 text-right">Valor Original</th>
                  <th className="py-2.5 px-4 text-right">Valor Pago</th>
                  <th className="py-2.5 px-4 text-right">Saldo</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {dadosPagar.map((cp) => (
                  <tr key={cp.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-750">
                    <td className="py-2.5 px-4">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                        {cp.origem || (cp.nota_entrada_id ? 'XML' : 'MANUAL')}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-gray-900 dark:text-white">
                      {cp.fornecedor_nome}
                    </td>
                    <td className="py-2.5 px-4 text-gray-600 dark:text-gray-300 truncate max-w-xs">
                      {cp.descricao || cp.numero_documento}
                    </td>
                    <td className="py-2.5 px-4 text-gray-500 font-mono text-[11px]">{cp.centro_custo || 'Operacional'}</td>
                    <td className="py-2.5 px-4 text-gray-500">{cp.categoria || 'Geral'}</td>
                    <td className="py-2.5 px-4 tabular-nums">{formatDate(cp.vencimento || cp.data_vencimento)}</td>
                    <td className="py-2.5 px-4 text-right font-medium tabular-nums">{formatCurrency(cp.valor_original ?? cp.valor_parcela)}</td>
                    <td className="py-2.5 px-4 text-right text-emerald-600 font-medium tabular-nums">{formatCurrency(cp.valor_pago || 0)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(cp.saldo ?? 0)}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">
                        {cp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. RELATÓRIO: FLUXO DE CAIXA */}
      {tipoRelatorio === 'fluxo' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-gray-400 block mb-1">Entradas Previstas (Receber)</span>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(dadosFluxo.totalEntradas)}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Realizado: <span className="font-semibold text-emerald-700 dark:text-emerald-300">{formatCurrency(dadosFluxo.entradasRecebidas)}</span>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-gray-400 block mb-1">Saídas Previstas (Pagar)</span>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {formatCurrency(dadosFluxo.totalSaidas)}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Liquidado: <span className="font-semibold text-amber-700 dark:text-amber-300">{formatCurrency(dadosFluxo.saidasPagas)}</span>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-gray-400 block mb-1">Resultado Líquido Projetado</span>
              <div
                className={`text-xl font-bold tabular-nums ${
                  dadosFluxo.resultadoOperacional >= 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(dadosFluxo.resultadoOperacional)}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Saldo Realizado: <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(dadosFluxo.resultadoRealizado)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. RELATÓRIO: RECEITAS POR CATEGORIA */}
      {tipoRelatorio === 'receitas-categoria' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Distribuição de Receitas por Categoria (Total: {formatCurrency(dadosReceitasPorCategoria.totalGeral)})
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 font-semibold text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-4">Categoria</th>
                  <th className="py-2.5 px-4 text-center">Títulos</th>
                  <th className="py-2.5 px-4 text-right">Valor Total</th>
                  <th className="py-2.5 px-4 text-right">Recebido</th>
                  <th className="py-2.5 px-4 text-right">Saldo Aberto</th>
                  <th className="py-2.5 px-4 text-right">% Participação</th>
                  <th className="py-2.5 px-4">Proporção Visual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {dadosReceitasPorCategoria.categorias.map((cat) => (
                  <tr key={cat.categoria} className="hover:bg-gray-50/60 dark:hover:bg-gray-750">
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      {cat.categoria}
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums text-gray-500">{cat.quantidade}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white tabular-nums">
                      {formatCurrency(cat.total)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium tabular-nums">
                      {formatCurrency(cat.recebido)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium tabular-nums text-gray-600 dark:text-gray-400">
                      {formatCurrency(cat.aberto)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {cat.percentual.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 w-44">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, cat.percentual))}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. RELATÓRIO: DESPESAS POR CATEGORIA */}
      {tipoRelatorio === 'despesas-categoria' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Distribuição de Despesas por Categoria (Total: {formatCurrency(dadosDespesasPorCategoria.totalGeral)})
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 font-semibold text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-4">Categoria</th>
                  <th className="py-2.5 px-4 text-center">Contas</th>
                  <th className="py-2.5 px-4 text-right">Valor Total</th>
                  <th className="py-2.5 px-4 text-right">Valor Pago</th>
                  <th className="py-2.5 px-4 text-right">Saldo a Pagar</th>
                  <th className="py-2.5 px-4 text-right">% Participação</th>
                  <th className="py-2.5 px-4">Proporção Visual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {dadosDespesasPorCategoria.categorias.map((cat) => (
                  <tr key={cat.categoria} className="hover:bg-gray-50/60 dark:hover:bg-gray-750">
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      {cat.categoria}
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums text-gray-500">{cat.quantidade}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white tabular-nums">
                      {formatCurrency(cat.total)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium tabular-nums">
                      {formatCurrency(cat.pago)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      {formatCurrency(cat.aberto)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      {cat.percentual.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 w-44">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, cat.percentual))}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
