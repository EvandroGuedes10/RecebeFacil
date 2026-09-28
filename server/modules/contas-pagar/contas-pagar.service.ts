import { db, ContaPagar, StatusParcela } from '../../config/database.js';

export class ContasPagarService {
  public listar(filtros?: {
    empresaId?: number;
    fornecedorId?: number;
    status?: string;
    categoria?: string;
    origem?: string;
    dataInicio?: string;
    dataFim?: string;
    busca?: string;
  }): any[] {
    db.autoUpdateOverdueStatus();

    let list = [...db.contas_pagar];

    if (filtros?.empresaId) {
      list = list.filter((cp) => !cp.empresa_id || cp.empresa_id === filtros.empresaId);
    }

    if (filtros?.fornecedorId) {
      list = list.filter((cp) => cp.fornecedor_id === filtros.fornecedorId);
    }

    if (filtros?.status && filtros.status !== 'todos') {
      const st = filtros.status.toUpperCase();
      list = list.filter((cp) => cp.status.toUpperCase() === st);
    }

    if (filtros?.categoria && filtros.categoria !== 'todas') {
      list = list.filter((cp) => cp.categoria?.toLowerCase() === filtros.categoria!.toLowerCase());
    }

    if (filtros?.origem && filtros.origem !== 'todas') {
      const orig = filtros.origem.toUpperCase();
      list = list.filter((cp) => {
        const itemOrigem = cp.origem || (cp.nota_entrada_id ? 'XML' : 'MANUAL');
        return itemOrigem.toUpperCase() === orig;
      });
    }

    if (filtros?.dataInicio) {
      list = list.filter((cp) => cp.data_vencimento >= filtros.dataInicio!);
    }

    if (filtros?.dataFim) {
      list = list.filter((cp) => cp.data_vencimento <= filtros.dataFim!);
    }

    if (filtros?.busca) {
      const term = filtros.busca.toLowerCase();
      list = list.filter(
        (cp) =>
          cp.fornecedor_nome?.toLowerCase().includes(term) ||
          cp.numero_documento?.toLowerCase().includes(term) ||
          cp.descricao?.toLowerCase().includes(term) ||
          cp.centro_custo?.toLowerCase().includes(term) ||
          cp.categoria?.toLowerCase().includes(term) ||
          String(cp.id).includes(term)
      );
    }

    return list.map((cp) => {
      const fornecedor = db.fornecedores.find((f) => f.id === cp.fornecedor_id);
      const saldo = Math.max(0, cp.valor_parcela - cp.valor_pago);
      const origemEfetiva = cp.origem || (cp.nota_entrada_id ? 'XML' : 'MANUAL');

      return {
        ...cp,
        origem: origemEfetiva,
        descricao: cp.descricao || (cp.nota_entrada_id ? `NF-e Compra ${cp.numero_documento}` : `Conta a Pagar #${cp.id}`),
        vencimento: cp.data_vencimento,
        valor_original: cp.valor_parcela,
        saldo,
        status: cp.status.toLowerCase(),
        fornecedor_cnpj: fornecedor?.cpf_cnpj || cp.fornecedor_cnpj,
        fornecedor_nome: fornecedor?.nome || cp.fornecedor_nome,
        observacao: cp.observacoes,
      };
    });
  }

  public buscarPorId(id: number): any {
    db.autoUpdateOverdueStatus();
    const cp = db.contas_pagar.find((item) => item.id === id);
    if (!cp) return null;

    const fornecedor = db.fornecedores.find((f) => f.id === cp.fornecedor_id);
    const saldo = Math.max(0, cp.valor_parcela - cp.valor_pago);
    const origemEfetiva = cp.origem || (cp.nota_entrada_id ? 'XML' : 'MANUAL');

    return {
      ...cp,
      origem: origemEfetiva,
      descricao: cp.descricao || (cp.nota_entrada_id ? `NF-e Compra ${cp.numero_documento}` : `Conta a Pagar #${cp.id}`),
      vencimento: cp.data_vencimento,
      valor_original: cp.valor_parcela,
      saldo,
      status: cp.status.toLowerCase(),
      fornecedor_cnpj: fornecedor?.cpf_cnpj || cp.fornecedor_cnpj,
      fornecedor_nome: fornecedor?.nome || cp.fornecedor_nome,
      observacao: cp.observacoes,
    };
  }

  public criarManual(
    dados: {
      empresaId: number;
      fornecedorId: number;
      descricao: string;
      centroCusto?: string;
      centro_custo?: string;
      numeroDocumento?: string;
      valorTotal: number;
      quantidadeParcelas: number;
      primeiroVencimento: string;
      intervaloDias?: number;
      categoria: string;
      observacoes?: string;
      observacao?: string;
      anexoNome?: string;
      anexoUrl?: string;
    },
    usuarioId?: number,
    usuarioNome?: string
  ): ContaPagar[] {
    const fornecedor = db.fornecedores.find((f) => f.id === dados.fornecedorId);
    if (!fornecedor) {
      throw new Error('Fornecedor obrigatório não encontrado.');
    }

    if (!dados.descricao || !dados.descricao.trim()) {
      throw new Error('O campo Descrição é obrigatório.');
    }

    if (!dados.categoria || !dados.categoria.trim()) {
      throw new Error('O campo Categoria é obrigatório.');
    }

    if (!dados.valorTotal || dados.valorTotal <= 0) {
      throw new Error('O campo Valor deve ser superior a zero.');
    }

    if (!dados.primeiroVencimento) {
      throw new Error('O campo Vencimento é obrigatório.');
    }

    const parcelasCriadas: ContaPagar[] = [];
    const totalParcelas = Math.max(1, dados.quantidadeParcelas || 1);
    const valorPorParcela = Math.round((dados.valorTotal / totalParcelas) * 100) / 100;
    const diferencaCentavos = dados.valorTotal - valorPorParcela * totalParcelas;

    const docBase = dados.numeroDocumento || `PAG-${Date.now().toString().slice(-6)}`;
    const dataInicial = new Date(dados.primeiroVencimento + 'T12:00:00');
    const intervalo = dados.intervaloDias || 30;
    const centroCusto = dados.centroCusto || dados.centro_custo || 'Operacional';

    for (let i = 1; i <= totalParcelas; i++) {
      const dataVenc = new Date(dataInicial);
      if (i > 1) {
        dataVenc.setDate(dataInicial.getDate() + (i - 1) * intervalo);
      }
      const vencStr = dataVenc.toISOString().split('T')[0];
      const valorFinal = i === 1 ? valorPorParcela + diferencaCentavos : valorPorParcela;

      const descFinal = totalParcelas > 1 
        ? `${dados.descricao.trim()} (${i}/${totalParcelas})` 
        : dados.descricao.trim();

      const novaConta: ContaPagar = {
        id: db.getNextContaPagarId(),
        empresa_id: dados.empresaId,
        fornecedor_id: fornecedor.id,
        fornecedor_nome: fornecedor.nome,
        fornecedor_cnpj: fornecedor.cpf_cnpj,
        numero_documento: `${docBase}`,
        descricao: descFinal,
        centro_custo: centroCusto,
        origem: 'MANUAL',
        numero_parcela: i,
        total_parcelas: totalParcelas,
        data_vencimento: vencStr,
        valor_parcela: valorFinal,
        valor_pago: 0,
        status: 'PENDENTE',
        categoria: dados.categoria.trim(),
        observacoes: dados.observacoes || dados.observacao || '',
        anexo_nome: dados.anexoNome,
        anexo_url: dados.anexoUrl,
        criado_em: new Date().toISOString(),
      };

      db.contas_pagar.push(novaConta);
      parcelasCriadas.push(novaConta);
    }

    // Registra categoria na lista se ainda não existir
    const catExiste = db.categorias.some(
      (c) => c.tipo === 'DESPESA' && c.nome.toLowerCase() === dados.categoria.trim().toLowerCase()
    );
    if (!catExiste) {
      db.categorias.push({
        id: db.getNextCategoriaId(),
        tipo: 'DESPESA',
        nome: dados.categoria.trim(),
        padrao: false,
        criado_em: new Date().toISOString(),
      });
    }

    db.log(
      usuarioId,
      usuarioNome,
      'LANCAMENTO_MANUAL_PAGAR',
      `Lançamento manual a pagar criado: "${dados.descricao}" de R$ ${dados.valorTotal.toFixed(2)} (${totalParcelas}x) para fornecedor "${fornecedor.nome}". Centro de Custo: ${centroCusto}.`
    );

    return parcelasCriadas;
  }

  public baixar(
    id: number,
    dados: {
      valorPago: number;
      dataPagamento: string;
      formaPagamento?: string;
      observacoes?: string;
    },
    usuarioId?: number,
    usuarioNome?: string
  ): any {
    const cp = db.contas_pagar.find((item) => item.id === id);
    if (!cp) {
      throw new Error('Conta a pagar não encontrada.');
    }

    if (cp.status === 'PAGO') {
      throw new Error('Esta conta já está totalmente quitada.');
    }

    const valorBaixa = Number(dados.valorPago);
    if (isNaN(valorBaixa) || valorBaixa <= 0) {
      throw new Error('Valor de pagamento inválido.');
    }

    const novoTotalPago = (cp.valor_pago || 0) + valorBaixa;

    cp.valor_pago = Math.round(novoTotalPago * 100) / 100;
    cp.data_pagamento = dados.dataPagamento || new Date().toISOString().split('T')[0];
    cp.forma_pagamento = dados.formaPagamento || cp.forma_pagamento || 'PIX';
    if (dados.observacoes) {
      cp.observacoes = (cp.observacoes ? cp.observacoes + ' | ' : '') + dados.observacoes;
    }

    if (cp.valor_pago >= cp.valor_parcela - 0.009) {
      cp.status = 'PAGO';
      cp.valor_pago = cp.valor_parcela;
    } else {
      cp.status = 'PARCIAL';
    }

    cp.atualizado_em = new Date().toISOString();

    db.log(
      usuarioId,
      usuarioNome,
      'BAIXA_PAGAMENTO',
      `Baixa de pagamento de R$ ${valorBaixa.toFixed(2)} na conta #${cp.id} (${cp.fornecedor_nome}). Novo status: ${cp.status}.`
    );

    return this.buscarPorId(cp.id);
  }

  public estornar(id: number, usuarioId?: number, usuarioNome?: string): any {
    const cp = db.contas_pagar.find((item) => item.id === id);
    if (!cp) throw new Error('Conta a pagar não encontrada.');

    const valorEstornado = cp.valor_pago;
    cp.valor_pago = 0;
    cp.data_pagamento = undefined;
    cp.forma_pagamento = undefined;
    cp.status = 'PENDENTE';
    cp.atualizado_em = new Date().toISOString();

    db.autoUpdateOverdueStatus();

    db.log(
      usuarioId,
      usuarioNome,
      'ESTORNO_PAGAMENTO',
      `Estorno de pagamento no valor de R$ ${valorEstornado.toFixed(2)} na conta #${cp.id}. Status revertido para ${cp.status}.`
    );

    return this.buscarPorId(cp.id);
  }

  public atualizar(
    id: number,
    dados: Partial<ContaPagar>,
    usuarioId?: number,
    usuarioNome?: string
  ): any {
    const cp = db.contas_pagar.find((item) => item.id === id);
    if (!cp) throw new Error('Conta a pagar não encontrada.');

    if (dados.data_vencimento) cp.data_vencimento = dados.data_vencimento;
    if (dados.valor_parcela !== undefined) cp.valor_parcela = Number(dados.valor_parcela);
    if (dados.categoria !== undefined) cp.categoria = dados.categoria;
    if (dados.descricao !== undefined) cp.descricao = dados.descricao;
    if (dados.centro_custo !== undefined) cp.centro_custo = dados.centro_custo;
    if (dados.observacoes !== undefined) cp.observacoes = dados.observacoes;
    if (dados.status !== undefined) cp.status = dados.status as StatusParcela;

    cp.atualizado_em = new Date().toISOString();
    db.autoUpdateOverdueStatus();

    db.log(
      usuarioId,
      usuarioNome,
      'CONTA_PAGAR_ATUALIZADA',
      `Conta a pagar #${cp.id} foi alterada. Vencimento: ${cp.data_vencimento}, Valor: R$ ${cp.valor_parcela.toFixed(2)}.`
    );

    return this.buscarPorId(cp.id);
  }

  public excluir(id: number, usuarioId?: number, usuarioNome?: string): boolean {
    const index = db.contas_pagar.findIndex((cp) => cp.id === id);
    if (index === -1) throw new Error('Conta a pagar não encontrada.');

    const cp = db.contas_pagar[index];
    db.contas_pagar.splice(index, 1);

    db.log(
      usuarioId,
      usuarioNome,
      'CONTA_PAGAR_EXCLUIDA',
      `Conta a pagar #${id} (${cp.fornecedor_nome} - R$ ${cp.valor_parcela.toFixed(2)}) foi excluída.`
    );

    return true;
  }
}

export const contasPagarService = new ContasPagarService();
