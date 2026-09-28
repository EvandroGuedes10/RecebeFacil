import { db } from '../../config/database.js';

export interface FluxoCaixaItem {
  periodo: string; // Ex: '2026-09-28', 'Semana 39', 'Set/2026'
  dataInicio: string;
  dataFim: string;
  entradasPrevistas: number;
  entradasRealizadas: number;
  saidasPrevistas: number;
  saidasRealizadas: number;
  saldoPrevistoPeriodo: number;
  saldoRealizadoPeriodo: number;
  saldoProjetadoAcumulado: number;
  detalhes: {
    receber: any[];
    pagar: any[];
  };
}

export class FluxoCaixaService {
  public obterFluxo(
    tipoVisao: 'diario' | 'semanal' | 'mensal' = 'mensal',
    empresaId?: number,
    dataInicioParam?: string,
    dataFimParam?: string
  ) {
    db.autoUpdateOverdueStatus();

    // Contas a Receber
    let parcelasReceber = db.parcelas_receber.filter((p) => p.status !== 'CANCELADO');
    if (empresaId) {
      parcelasReceber = parcelasReceber.filter((p) => !p.empresa_id || p.empresa_id === empresaId);
    }

    // Contas a Pagar
    let contasPagar = db.contas_pagar.filter((p) => p.status !== 'CANCELADO');
    if (empresaId) {
      contasPagar = contasPagar.filter((p) => p.empresa_id === empresaId);
    }

    // Totais Consolidados Globais
    const totalEntradasPrevistas = parcelasReceber
      .filter((p) => p.status === 'PENDENTE' || p.status === 'ATRASADO')
      .reduce((sum, p) => sum + (p.valor_parcela - p.valor_recebido), 0);

    const totalEntradasRealizadas = parcelasReceber
      .reduce((sum, p) => sum + (p.valor_recebido || 0), 0);

    const totalSaidasPrevistas = contasPagar
      .filter((p) => p.status === 'PENDENTE' || p.status === 'ATRASADO')
      .reduce((sum, p) => sum + (p.valor_parcela - p.valor_pago), 0);

    const totalSaidasRealizadas = contasPagar
      .reduce((sum, p) => sum + (p.valor_pago || 0), 0);

    const saldoAtualRealizado = totalEntradasRealizadas - totalSaidasRealizadas;
    const saldoProjetadoFinal = saldoAtualRealizado + totalEntradasPrevistas - totalSaidasPrevistas;

    // Agrupamento por períodos
    const periodosMap: Record<string, FluxoCaixaItem> = {};

    // Helper de chave por tipo de visão
    const getPeriodoKey = (dateStr: string) => {
      if (!dateStr) return 'Sem Data';
      const d = new Date(dateStr + 'T12:00:00');
      if (tipoVisao === 'diario') {
        return dateStr;
      }
      if (tipoVisao === 'semanal') {
        const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
        const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        return `Semana ${weekNum}/${d.getFullYear()}`;
      }
      // Mensal
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${meses[d.getMonth()]}/${d.getFullYear()}`;
    };

    // Processa Contas a Receber
    parcelasReceber.forEach((p) => {
      const dataRef = p.data_vencimento || p.data_recebimento || '2026-09-01';
      const key = getPeriodoKey(dataRef);
      if (!periodosMap[key]) {
        periodosMap[key] = {
          periodo: key,
          dataInicio: dataRef,
          dataFim: dataRef,
          entradasPrevistas: 0,
          entradasRealizadas: 0,
          saidasPrevistas: 0,
          saidasRealizadas: 0,
          saldoPrevistoPeriodo: 0,
          saldoRealizadoPeriodo: 0,
          saldoProjetadoAcumulado: 0,
          detalhes: { receber: [], pagar: [] },
        };
      }

      if (p.status === 'PAGO') {
        periodosMap[key].entradasRealizadas += p.valor_recebido || p.valor_parcela;
      } else if (p.status === 'PARCIAL') {
        periodosMap[key].entradasRealizadas += p.valor_recebido || 0;
        periodosMap[key].entradasPrevistas += Math.max(0, p.valor_parcela - p.valor_recebido);
      } else {
        periodosMap[key].entradasPrevistas += p.valor_parcela;
      }

      const cliente = db.clientes.find((c) => c.id === p.cliente_id);
      periodosMap[key].detalhes.receber.push({
        id: p.id,
        clienteNome: cliente?.nome || p.cliente_nome || 'Cliente',
        vencimento: p.data_vencimento,
        valor: p.valor_parcela,
        saldo: p.valor_parcela - p.valor_recebido,
        status: p.status,
      });
    });

    // Processa Contas a Pagar
    contasPagar.forEach((cp) => {
      const dataRef = cp.data_vencimento || cp.data_pagamento || '2026-09-01';
      const key = getPeriodoKey(dataRef);
      if (!periodosMap[key]) {
        periodosMap[key] = {
          periodo: key,
          dataInicio: dataRef,
          dataFim: dataRef,
          entradasPrevistas: 0,
          entradasRealizadas: 0,
          saidasPrevistas: 0,
          saidasRealizadas: 0,
          saldoPrevistoPeriodo: 0,
          saldoRealizadoPeriodo: 0,
          saldoProjetadoAcumulado: 0,
          detalhes: { receber: [], pagar: [] },
        };
      }

      if (cp.status === 'PAGO') {
        periodosMap[key].saidasRealizadas += cp.valor_pago || cp.valor_parcela;
      } else if (cp.status === 'PARCIAL') {
        periodosMap[key].saidasRealizadas += cp.valor_pago || 0;
        periodosMap[key].saidasPrevistas += Math.max(0, cp.valor_parcela - cp.valor_pago);
      } else {
        periodosMap[key].saidasPrevistas += cp.valor_parcela;
      }

      periodosMap[key].detalhes.pagar.push({
        id: cp.id,
        fornecedorNome: cp.fornecedor_nome,
        vencimento: cp.data_vencimento,
        valor: cp.valor_parcela,
        saldo: cp.valor_parcela - cp.valor_pago,
        status: cp.status,
      });
    });

    // Converte para array ordenado e calcula saldos acumulados
    const periodos = Object.values(periodosMap);
    let acumulado = saldoAtualRealizado;

    periodos.forEach((item) => {
      item.saldoRealizadoPeriodo = item.entradasRealizadas - item.saidasRealizadas;
      item.saldoPrevistoPeriodo = item.entradasPrevistas - item.saidasPrevistas;
      acumulado += item.saldoPrevistoPeriodo;
      item.saldoProjetadoAcumulado = acumulado;
    });

    return {
      resumo: {
        totalEntradasPrevistas,
        totalEntradasRealizadas,
        totalSaidasPrevistas,
        totalSaidasRealizadas,
        saldoAtualRealizado,
        saldoProjetadoFinal,
      },
      tipoVisao,
      periodos,
    };
  }
}

export const fluxoCaixaService = new FluxoCaixaService();
