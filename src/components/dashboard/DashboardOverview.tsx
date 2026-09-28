import React from 'react';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  FileText,
  DollarSign,
  ChevronRight,
  Building,
  Check,
  Eye,
  BarChart3,
  Layers,
} from 'lucide-react';
import { DashboardStats, ParcelaReceber } from '../../types';
import { MetricCardSkeleton, ChartSkeleton, TableSkeleton } from '../common/Skeleton';

interface DashboardOverviewProps {
  stats: DashboardStats | null;
  loading: boolean;
  onOpenBaixa: (parcela: ParcelaReceber) => void;
  onViewParcela: (parcela: ParcelaReceber) => void;
  onNavigateToTab: (tab: any) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  loading,
  onOpenBaixa,
  onViewParcela,
  onNavigateToTab,
}) => {
  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Visão Geral Financeira</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Carregando métricas e indicadores...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartSkeleton />
          </div>
          <div>
            <ChartSkeleton />
          </div>
        </div>
        <TableSkeleton rows={5} columns={5} />
      </div>
    );
  }

  const formatCurrency = (val: number | undefined | null) => {
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

  // Safe accessors supporting camelCase and snake_case
  const totalReceber = stats.total_a_receber ?? stats.totalAReceber ?? 0;
  const totalRecebido = stats.total_recebido ?? stats.totalRecebido ?? 0;
  const totalVencido = stats.total_vencido ?? stats.totalVencido ?? 0;
  const vencendoHoje = stats.total_vencendo_hoje ?? stats.vencendoHoje ?? 0;

  const countReceber = stats.quantidade_a_receber ?? stats.quantidadeAReceber ?? 0;
  const countRecebido = stats.quantidade_recebidas ?? stats.quantidadeRecebidas ?? 0;
  const countVencido = stats.quantidade_vencidas ?? stats.quantidadeVencidas ?? 0;
  const countHoje = stats.quantidade_vencendo_hoje ?? stats.quantidadeVencendoHoje ?? 0;

  const recebimentosPorMes = stats.recebimentos_por_mes || stats.recebimentosPorMes || [];
  const proximosVencimentos = stats.proximos_vencimentos || stats.proximosVencimentos || [];

  // Month Chart calculation
  const maxMonthValue = Math.max(
    ...recebimentosPorMes.map((m) => Math.max(m.recebido || 0, m.pendente || 0, m.total || 0, 1)),
    100
  );

  // Cash flow summary metrics
  const totalGeral = totalRecebido + totalReceber + totalVencido;
  const percentRecebido = totalGeral > 0 ? Math.round((totalRecebido / totalGeral) * 100) : 0;
  const percentVencido = totalGeral > 0 ? Math.round((totalVencido / totalGeral) * 100) : 0;
  const percentReceber = 100 - percentRecebido - percentVencido;

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Painel Financeiro
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Acompanhamento em tempo real de títulos a receber, baixas e fluxo de caixa.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToTab('contas-a-receber')}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <span>Ver Todos os Títulos</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* 4 Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total a Receber */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total a Receber
            </span>
            <div className="w-9 h-9 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-[#2563EB]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums tracking-tight">
              {formatCurrency(totalReceber)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              <span className="font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{countReceber}</span>
              <span>títulos em aberto</span>
            </p>
          </div>
        </div>

        {/* 2. Total Recebido */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Recebido
            </span>
            <div className="w-9 h-9 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-[#059669]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-[#059669] dark:text-emerald-400 tabular-nums tracking-tight">
              {formatCurrency(totalRecebido)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              <span className="font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{countRecebido}</span>
              <span>parcelas liquidadas</span>
            </p>
          </div>
        </div>

        {/* 3. Total Vencido */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Vencido
            </span>
            <div className="w-9 h-9 rounded-md bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900/50 flex items-center justify-center text-[#DC2626]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-[#DC2626] dark:text-red-400 tabular-nums tracking-tight">
              {formatCurrency(totalVencido)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              <span className="font-semibold text-red-600 dark:text-red-400 tabular-nums">{countVencido}</span>
              <span>títulos em atraso</span>
            </p>
          </div>
        </div>

        {/* 4. Vencendo Hoje */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Vencendo Hoje
            </span>
            <div className="w-9 h-9 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center text-[#D97706]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-[#D97706] dark:text-amber-400 tabular-nums tracking-tight">
              {formatCurrency(vencendoHoje)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{countHoje}</span>
              <span>com vencimento hoje</span>
            </p>
          </div>
        </div>
      </div>

      {/* Gráficos: Fluxo de Caixa & Recebimentos por Mês */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recebimentos por Mês (2 colunas) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Recebimentos por Mês
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Comparativo de valores realizados e pendentes por competência
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#059669]" />
                  <span className="text-gray-600 dark:text-gray-300">Recebido</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#2563EB]" />
                  <span className="text-gray-600 dark:text-gray-300">A Receber</span>
                </div>
              </div>
            </div>

            {/* Bar Chart Container */}
            {recebimentosPorMes.length > 0 ? (
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="h-56 flex items-end gap-3 sm:gap-6 justify-between">
                  {recebimentosPorMes.map((mesData, idx) => {
                    const recebidoVal = mesData.recebido || 0;
                    const pendenteVal = mesData.pendente || 0;
                    const totalMes = recebidoVal + pendenteVal;

                    const heightRecebido = Math.round((recebidoVal / maxMonthValue) * 100);
                    const heightPendente = Math.round((pendenteVal / maxMonthValue) * 100);

                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center justify-end h-full group"
                      >
                        <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-44">
                          {/* Barra Recebido */}
                          <div
                            title={`Recebido em ${mesData.mes}: ${formatCurrency(recebidoVal)}`}
                            style={{ height: `${Math.max(heightRecebido, 4)}%` }}
                            className="w-full max-w-[18px] bg-[#059669] rounded-t-xs transition-all group-hover:brightness-110"
                          />
                          {/* Barra Pendente */}
                          <div
                            title={`A Receber em ${mesData.mes}: ${formatCurrency(pendenteVal)}`}
                            style={{ height: `${Math.max(heightPendente, 4)}%` }}
                            className="w-full max-w-[18px] bg-[#2563EB] rounded-t-xs transition-all group-hover:brightness-110"
                          />
                        </div>

                        {/* Label do Mês */}
                        <div className="mt-3 text-center">
                          <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 capitalize block">
                            {mesData.mes?.slice(0, 3)}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums hidden sm:block">
                            {formatCurrency(totalMes).slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <BarChart3 className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs">Nenhum dado mensal registrado ainda.</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span>Período fiscal vigente</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Total Acumulado: {formatCurrency(totalGeral)}
            </span>
          </div>
        </div>

        {/* Fluxo de Caixa / Composição Financeira (1 coluna) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              Fluxo de Caixa & Distribuição
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Proporção da carteira de cobrança
            </p>

            {/* Progress bar representativa */}
            <div className="space-y-4">
              <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${percentRecebido}%` }}
                  className="bg-[#059669] h-full"
                  title={`Recebido: ${percentRecebido}%`}
                />
                <div
                  style={{ width: `${percentReceber}%` }}
                  className="bg-[#2563EB] h-full"
                  title={`A Receber: ${percentReceber}%`}
                />
                <div
                  style={{ width: `${percentVencido}%` }}
                  className="bg-[#DC2626] h-full"
                  title={`Vencido: ${percentVencido}%`}
                />
              </div>

              {/* Breakdown List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Liquidados</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 dark:text-white tabular-nums">
                      {formatCurrency(totalRecebido)}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 ml-1.5 tabular-nums text-[11px]">
                      ({percentRecebido}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">A Vencer</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 dark:text-white tabular-nums">
                      {formatCurrency(totalReceber)}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 ml-1.5 tabular-nums text-[11px]">
                      ({percentReceber}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Vencidos</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 dark:text-white tabular-nums">
                      {formatCurrency(totalVencido)}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 ml-1.5 tabular-nums text-[11px]">
                      ({percentVencido}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => onNavigateToTab('contas-a-receber')}
              className="w-full py-2 bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Gerenciar Carteira de Cobrança</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabela: Próximos Vencimentos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Próximos Vencimentos
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Títulos mais urgentes que requerem acompanhamento financeiro
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('contas-a-receber')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>Ver listagem completa</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {proximosVencimentos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Nota / Parcela</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4 text-right">Valor Saldo</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {proximosVencimentos.slice(0, 6).map((parcela) => {
                  const isVencido = parcela.status === 'vencido';
                  const isPago = parcela.status === 'pago';
                  const isParcial = parcela.status === 'parcial';

                  return (
                    <tr
                      key={parcela.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                        {parcela.cliente_nome || 'Cliente não identificado'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-gray-800 dark:text-gray-200 font-medium">
                          NF-e {parcela.numero_nota || 'S/N'}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500 ml-1">
                          (P.{parcela.numero_parcela})
                        </span>
                      </td>
                      <td className="py-3 px-4 tabular-nums font-medium">
                        {formatDate(parcela.vencimento)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white tabular-nums">
                        {formatCurrency(parcela.saldo ?? parcela.valor_original)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
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
                            ? 'Pago'
                            : isVencido
                            ? 'Vencido'
                            : isParcial
                            ? 'Parcial'
                            : 'Pendente'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewParcela(parcela)}
                            title="Ver Detalhes"
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {!isPago && (
                            <button
                              onClick={() => onOpenBaixa(parcela)}
                              className="px-2.5 py-1 bg-[#2563EB] hover:bg-blue-700 text-white rounded font-medium text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Baixar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-xs">
            Nenhum título com vencimento próximo cadastrado.
          </div>
        )}
      </div>
    </div>
  );
};
