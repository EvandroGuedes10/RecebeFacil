import { db } from '../../config/database.js';

export class RelatoriosService {
  public getDashboardStats(empresaId?: number) {
    db.autoUpdateOverdueStatus();

    const today = new Date().toISOString().split('T')[0];
    const todayObj = new Date();

    let notas = db.notas_fiscais;
    let parcelas = db.parcelas_receber;

    if (empresaId) {
      notas = notas.filter(n => n.empresa_id === empresaId);
      const notasIds = notas.map(n => n.id);
      parcelas = parcelas.filter(p => p.empresa_id === empresaId || (p.nota_id !== undefined && notasIds.includes(p.nota_id)));
    }

    // 1. CARDS PRINCIPAIS:
    // - Total a Receber: soma de todos os saldos abertos (pendente + parcial + atrasado)
    const totalAReceber = parcelas
      .filter(p => p.status !== 'PAGO' && p.status !== 'CANCELADO')
      .reduce((acc, p) => acc + Math.max(0, p.valor_parcela - (p.valor_recebido || 0)), 0);

    // - Total Recebido: soma de todos os valores baixados/recebidos
    const totalRecebido = parcelas.reduce((acc, p) => acc + (p.valor_recebido || 0), 0);

    // - Total Vencido: parcelas vencidas antes de hoje e ainda não pagas
    const totalVencido = parcelas
      .filter(p => p.status === 'ATRASADO' || (p.status !== 'PAGO' && p.status !== 'CANCELADO' && p.data_vencimento < today))
      .reduce((acc, p) => acc + Math.max(0, p.valor_parcela - (p.valor_recebido || 0)), 0);

    // - Total Vencendo Hoje: parcelas com vencimento igual a hoje e ainda não pagas
    const totalVencendoHoje = parcelas
      .filter(p => p.data_vencimento === today && p.status !== 'PAGO' && p.status !== 'CANCELADO')
      .reduce((acc, p) => acc + Math.max(0, p.valor_parcela - (p.valor_recebido || 0)), 0);

    // 2. GRÁFICO: Recebimentos por Mês
    const mesesMap = new Map<string, { label: string; mesNome: string; recebido: number; aReceber: number }>();
    
    // Gerar 6 meses cronológicos
    for (let i = -2; i <= 3; i++) {
      const d = new Date(todayObj.getFullYear(), todayObj.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const nomeMes = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const label = `${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}/${String(d.getFullYear()).slice(-2)}`;
      mesesMap.set(key, { label, mesNome: label, recebido: 0, aReceber: 0 });
    }

    parcelas.forEach(p => {
      // Recebido: considera mês da data_recebimento ou data_vencimento se pago
      if (p.data_recebimento) {
        const mesRec = p.data_recebimento.slice(0, 7);
        if (mesesMap.has(mesRec)) {
          mesesMap.get(mesRec)!.recebido += (p.valor_recebido || 0);
        }
      }

      // A Receber: considera mês da data_vencimento
      if (p.status !== 'PAGO' && p.status !== 'CANCELADO') {
        const mesVenc = p.data_vencimento.slice(0, 7);
        if (mesesMap.has(mesVenc)) {
          mesesMap.get(mesVenc)!.aReceber += Math.max(0, p.valor_parcela - (p.valor_recebido || 0));
        }
      }
    });

    const recebimentosPorMes = Array.from(mesesMap.entries()).map(([chave, v]) => ({
      mes: v.label,
      chave,
      label: v.label,
      recebido: Math.round(v.recebido * 100) / 100,
      aReceber: Math.round(v.aReceber * 100) / 100,
      previsto: Math.round((v.aReceber + v.recebido) * 100) / 100,
      realizado: Math.round(v.recebido * 100) / 100,
    }));

    // 3. TABELA: Próximos Vencimentos
    const parcelasAbertas = parcelas
      .filter(p => p.status !== 'PAGO' && p.status !== 'CANCELADO')
      .map(p => {
        const nf = db.notas_fiscais.find(n => n.id === p.nota_id);
        const cli = nf ? db.clientes.find(c => c.id === nf.cliente_id) : db.clientes.find(c => c.id === p.cliente_id);
        return {
          id: p.id,
          nota_id: p.nota_id,
          cliente_id: cli?.id,
          cliente_nome: cli?.nome || p.cliente_nome || 'Cliente não identificado',
          cliente_cpf_cnpj: cli?.cpf_cnpj || '',
          numero_nota: nf?.numero_nota || p.numero_documento || '-',
          serie_nota: nf?.serie || '1',
          numero_parcela: p.numero_parcela,
          data_vencimento: p.data_vencimento,
          data_recebimento: p.data_recebimento,
          valor_parcela: p.valor_parcela,
          valor_recebido: p.valor_recebido || 0,
          saldo_devedor: Math.max(0, p.valor_parcela - (p.valor_recebido || 0)),
          status: p.data_vencimento < today ? 'vencido' : (p.status.toLowerCase() || 'pendente'),
          observacoes: p.observacoes,
          origem: p.origem || (p.nota_id ? 'XML' : 'MANUAL'),
          descricao: p.descricao || `Título #${p.id}`,
        };
      })
      .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))
      .slice(0, 10);

    return {
      total_a_receber: totalAReceber,
      total_recebido: totalRecebido,
      total_vencido: totalVencido,
      total_vencendo_hoje: totalVencendoHoje,
      totalAReceber,
      totalRecebido,
      totalVencido,
      totalVencendoHoje,
      quantidade_a_receber: parcelas.filter(p => p.status !== 'PAGO' && p.status !== 'CANCELADO').length,
      quantidade_recebidas: parcelas.filter(p => p.status === 'PAGO').length,
      quantidade_vencidas: parcelas.filter(p => p.status === 'ATRASADO').length,
      quantidade_vencendo_hoje: parcelas.filter(p => p.data_vencimento === today && p.status !== 'PAGO').length,
      recebimentos_por_mes: recebimentosPorMes,
      proximos_vencimentos: parcelasAbertas,
    };
  }

  public getReceitasPorCategoria(empresaId?: number, dataInicio?: string, dataFim?: string) {
    let parcelas = [...db.parcelas_receber];
    if (empresaId) {
      parcelas = parcelas.filter((p) => !p.empresa_id || p.empresa_id === empresaId);
    }
    if (dataInicio) {
      parcelas = parcelas.filter((p) => p.data_vencimento >= dataInicio);
    }
    if (dataFim) {
      parcelas = parcelas.filter((p) => p.data_vencimento <= dataFim);
    }

    const mapaCategorias: Record<string, { categoria: string; total: number; recebido: number; pendente: number; quantidade: number }> = {};
    let totalGeral = 0;

    parcelas.forEach((p) => {
      const cat = p.categoria?.trim() || 'Outras Receitas';
      if (!mapaCategorias[cat]) {
        mapaCategorias[cat] = {
          categoria: cat,
          total: 0,
          recebido: 0,
          pendente: 0,
          quantidade: 0,
        };
      }
      mapaCategorias[cat].total += p.valor_parcela;
      mapaCategorias[cat].recebido += (p.valor_recebido || 0);
      mapaCategorias[cat].pendente += Math.max(0, p.valor_parcela - (p.valor_recebido || 0));
      mapaCategorias[cat].quantidade += 1;
      totalGeral += p.valor_parcela;
    });

    const lista = Object.values(mapaCategorias).map((item) => ({
      ...item,
      percentual: totalGeral > 0 ? Math.round((item.total / totalGeral) * 1000) / 10 : 0,
    })).sort((a, b) => b.total - a.total);

    return {
      totalGeral,
      categorias: lista,
    };
  }

  public getDespesasPorCategoria(empresaId?: number, dataInicio?: string, dataFim?: string) {
    let contas = [...db.contas_pagar];
    if (empresaId) {
      contas = contas.filter((cp) => !cp.empresa_id || cp.empresa_id === empresaId);
    }
    if (dataInicio) {
      contas = contas.filter((cp) => cp.data_vencimento >= dataInicio);
    }
    if (dataFim) {
      contas = contas.filter((cp) => cp.data_vencimento <= dataFim);
    }

    const mapaCategorias: Record<string, { categoria: string; total: number; pago: number; pendente: number; quantidade: number }> = {};
    let totalGeral = 0;

    contas.forEach((cp) => {
      const cat = cp.categoria?.trim() || 'Outras Despesas';
      if (!mapaCategorias[cat]) {
        mapaCategorias[cat] = {
          categoria: cat,
          total: 0,
          pago: 0,
          pendente: 0,
          quantidade: 0,
        };
      }
      mapaCategorias[cat].total += cp.valor_parcela;
      mapaCategorias[cat].pago += (cp.valor_pago || 0);
      mapaCategorias[cat].pendente += Math.max(0, cp.valor_parcela - (cp.valor_pago || 0));
      mapaCategorias[cat].quantidade += 1;
      totalGeral += cp.valor_parcela;
    });

    const lista = Object.values(mapaCategorias).map((item) => ({
      ...item,
      percentual: totalGeral > 0 ? Math.round((item.total / totalGeral) * 1000) / 10 : 0,
    })).sort((a, b) => b.total - a.total);

    return {
      totalGeral,
      categorias: lista,
    };
  }
}

export const relatoriosService = new RelatoriosService();
