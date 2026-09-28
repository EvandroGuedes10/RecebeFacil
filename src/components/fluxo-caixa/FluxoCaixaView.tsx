import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  ChevronRight,
  DollarSign,
  Download,
  Filter,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { FluxoCaixaData, FluxoCaixaItem } from '../../types';
import { api } from '../../services/api';
import { ChartSkeleton, MetricCardSkeleton, TableSkeleton } from '../common/Skeleton';

interface FluxoCaixaViewProps {
  empresaId: number;
  onNovoLancamento?: (tipo: 'RECEBER' | 'PAGAR') => void;
}

export const FluxoCaixaView: React.FC<FluxoCaixaViewProps> = ({ empresaId, onNovoLancamento }) => {
  const [visao, setVisao] = useState<'diario' | 'semanal' | 'mensal'>('mensal');
  const [fluxoData, setFluxoData] = useState<FluxoCaixaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.fluxoCaixa
      .obter(visao, empresaId)
      .then((data) => setFluxoData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visao, empresaId]);

  const formatCurrency = (val?: number | null) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  };

  const handleExportCsv = () => {
    if (!fluxoData) return;
    const headers = [
      'Período',
      'Entradas Previstas (R$)',
      'Entradas Realizadas (R$)',
      'Saídas Previstas (R$)',
      'Saídas Realizadas (R$)',
      'Resultado Líquido (R$)',
      'Saldo Projetado Acumulado (R$)',
    ];

    const rows = fluxoData.periodos.map((p) => [
      `"${p.periodo}"`,
      p.entradasPrevistas.toFixed(2).replace('.', ','),
      p.entradasRealizadas.toFixed(2).replace('.', ','),
      p.saidasPrevistas.toFixed(2).replace('.', ','),
      p.saidasRealizadas.toFixed(2).replace('.', ','),
      p.saldoPrevistoPeriodo.toFixed(2).replace('.', ','),
      p.saldoProjetadoAcumulado.toFixed(2).replace('.', ','),
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fluxo_de_caixa_${visao}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading || !fluxoData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Fluxo de Caixa</h1>
            <p className="text-xs text-gray-500">Calculando projeções financeiras...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
        <ChartSkeleton />
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  const { resumo, periodos } = fluxoData;

  const maxVal = Math.max(
    ...periodos.map((p) =>
      Math.max(
        p.entradasPrevistas + p.entradasRealizadas,
        p.saidasPrevistas + p.saidasRealizadas,
        1
      )
    ),
    1000
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Demonstrativo de Fluxo de Caixa
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Projeção contínua de liquidez comparando recebimentos e pagamentos futuros.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor de Visão */}
          <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-md text-xs font-semibold">
            <button
              onClick={() => setVisao('diario')}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                visao === 'diario'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              Visão Diária
            </button>
            <button
              onClick={() => setVisao('semanal')}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                visao === 'semanal'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              Visão Semanal
            </button>
            <button
              onClick={() => setVisao('mensal')}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                visao === 'mensal'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              Visão Mensal
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Cards de Resumo Consolidado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Saldo Realizado Atual */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Saldo Realizado (Caixa)
            </span>
            <div className="w-9 h-9 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-[#2563EB]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p
              className={`text-2xl font-bold tabular-nums tracking-tight ${
                resumo.saldoAtualRealizado >= 0
                  ? 'text-gray-900 dark:text-white'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatCurrency(resumo.saldoAtualRealizado)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Entradas Pagas - Saídas Pagas
            </p>
          </div>
        </div>

        {/* 2. Entradas Previstas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Entradas Previstas
            </span>
            <div className="w-9 h-9 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-[#059669]">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-[#059669] dark:text-emerald-400 tabular-nums tracking-tight">
              {formatCurrency(resumo.totalEntradasPrevistas)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Contas a Receber em Aberto
            </p>
          </div>
        </div>

        {/* 3. Saídas Previstas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Saídas Previstas
            </span>
            <div className="w-9 h-9 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center text-[#D97706]">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-[#D97706] dark:text-amber-400 tabular-nums tracking-tight">
              {formatCurrency(resumo.totalSaidasPrevistas)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Contas a Pagar em Aberto
            </p>
          </div>
        </div>

        {/* 4. Saldo Projetado Final */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Saldo Projetado
            </span>
            <div className="w-9 h-9 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-[#2563EB]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p
              className={`text-2xl font-bold tabular-nums tracking-tight ${
                resumo.saldoProjetadoFinal >= 0
                  ? 'text-[#2563EB] dark:text-blue-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatCurrency(resumo.saldoProjetadoFinal)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Posição Final Estimada
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico Comparativo de Entradas vs Saídas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Evolução Temporal do Fluxo de Caixa ({visao.toUpperCase()})
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Comparativo de volumes financeiros previstos por período
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#059669]" />
              <span className="text-gray-600 dark:text-gray-300">Entradas Previstas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#D97706]" />
              <span className="text-gray-600 dark:text-gray-300">Saídas Previstas</span>
            </div>
          </div>
        </div>

        {periodos.length > 0 ? (
          <div className="h-60 flex items-end gap-3 sm:gap-6 justify-between pt-6 border-t border-gray-100 dark:border-gray-700">
            {periodos.slice(0, 12).map((p, idx) => {
              const entTotal = p.entradasPrevistas + p.entradasRealizadas;
              const saiTotal = p.saidasPrevistas + p.saidasRealizadas;
              const heightEnt = Math.round((entTotal / maxVal) * 100);
              const heightSai = Math.round((saiTotal / maxVal) * 100);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group">
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-44">
                    {/* Barra Entrada */}
                    <div
                      title={`Entradas em ${p.periodo}: ${formatCurrency(entTotal)}`}
                      style={{ height: `${Math.max(heightEnt, 4)}%` }}
                      className="w-full max-w-[16px] bg-[#059669] rounded-t-xs transition-all group-hover:brightness-110"
                    />
                    {/* Barra Saída */}
                    <div
                      title={`Saídas em ${p.periodo}: ${formatCurrency(saiTotal)}`}
                      style={{ height: `${Math.max(heightSai, 4)}%` }}
                      className="w-full max-w-[16px] bg-[#D97706] rounded-t-xs transition-all group-hover:brightness-110"
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 truncate max-w-[70px] block">
                      {p.periodo}
                    </span>
                    <span
                      className={`text-[10px] font-bold tabular-nums hidden sm:block ${
                        p.saldoPrevistoPeriodo >= 0 ? 'text-blue-600' : 'text-red-500'
                      }`}
                    >
                      {formatCurrency(p.saldoPrevistoPeriodo).slice(0, 9)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-400 text-xs">
            Nenhuma movimentação registrada para gerar projeção no período.
          </div>
        )}
      </div>

      {/* Tabela Detalhada Período a Período */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Extrato Analítico por Período
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Período</th>
                <th className="py-3 px-4 text-right">Entradas Previstas</th>
                <th className="py-3 px-4 text-right">Entradas Realizadas</th>
                <th className="py-3 px-4 text-right">Saídas Previstas</th>
                <th className="py-3 px-4 text-right">Saídas Realizadas</th>
                <th className="py-3 px-4 text-right">Resultado do Período</th>
                <th className="py-3 px-4 text-right">Saldo Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {periodos.map((p, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-gray-900 dark:text-gray-100">
                    {p.periodo}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                    {formatCurrency(p.entradasPrevistas)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-gray-600 dark:text-gray-400">
                    {formatCurrency(p.entradasRealizadas)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-amber-700 dark:text-amber-400 font-semibold">
                    {formatCurrency(p.saidasPrevistas)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-gray-600 dark:text-gray-400">
                    {formatCurrency(p.saidasRealizadas)}
                  </td>
                  <td
                    className={`py-3 px-4 text-right tabular-nums font-bold ${
                      p.saldoPrevistoPeriodo >= 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatCurrency(p.saldoPrevistoPeriodo)}
                  </td>
                  <td
                    className={`py-3 px-4 text-right tabular-nums font-bold ${
                      p.saldoProjetadoAcumulado >= 0
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatCurrency(p.saldoProjetadoAcumulado)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
