import { db, ParcelaReceber, StatusParcela } from '../../config/database.js';

export class ParcelasService {
  public listar(filtros?: {
    empresaId?: number;
    clienteId?: number;
    status?: string;
    categoria?: string;
    origem?: string;
    dataInicio?: string;
    dataFim?: string;
    busca?: string;
  }): any[] {
    db.autoUpdateOverdueStatus();

    let list = [...db.parcelas_receber];

    if (filtros?.empresaId) {
      list = list.filter((p) => !p.empresa_id || p.empresa_id === filtros.empresaId);
    }

    if (filtros?.clienteId) {
      list = list.filter((p) => p.cliente_id === filtros.clienteId);
    }

    if (filtros?.status && filtros.status !== 'todos') {
      const st = filtros.status.toUpperCase();
      list = list.filter((p) => p.status.toUpperCase() === st);
    }

    if (filtros?.categoria && filtros.categoria !== 'todas') {
      list = list.filter((p) => p.categoria?.toLowerCase() === filtros.categoria!.toLowerCase());
    }

    if (filtros?.origem && filtros.origem !== 'todas') {
      const orig = filtros.origem.toUpperCase();
      list = list.filter((p) => {
        const itemOrigem = p.origem || (p.nota_id ? 'XML' : 'MANUAL');
        return itemOrigem.toUpperCase() === orig;
      });
    }

    if (filtros?.dataInicio) {
      list = list.filter((p) => p.data_vencimento >= filtros.dataInicio!);
    }

    if (filtros?.dataFim) {
      list = list.filter((p) => p.data_vencimento <= filtros.dataFim!);
    }

    if (filtros?.busca) {
      const term = filtros.busca.toLowerCase();
      list = list.filter(
        (p) =>
          p.cliente_nome?.toLowerCase().includes(term) ||
          p.numero_documento?.toLowerCase().includes(term) ||
          p.descricao?.toLowerCase().includes(term) ||
          p.categoria?.toLowerCase().includes(term) ||
          String(p.id).includes(term)
      );
    }

    // Enriquecer parcelas com dados do cliente e nota
    return list.map((p) => {
      let clienteNome = p.cliente_nome;
      let clienteCnpj = '';
      let numeroNota = p.numero_documento;
      let chaveNfe = '';

      if (p.nota_id) {
        const nota = db.notas_fiscais.find((n) => n.id === p.nota_id);
        if (nota) {
          numeroNota = nota.numero_nota;
          chaveNfe = nota.chave_acesso;
          const cliente = db.clientes.find((c) => c.id === nota.cliente_id);
          if (cliente) {
            clienteNome = cliente.nome;
            clienteCnpj = cliente.cpf_cnpj;
          }
        }
      } else if (p.cliente_id) {
        const cliente = db.clientes.find((c) => c.id === p.cliente_id);
        if (cliente) {
          clienteNome = cliente.nome;
          clienteCnpj = cliente.cpf_cnpj;
        }
      }

      const saldo = Math.max(0, p.valor_parcela - p.valor_recebido);
      const origemEfetiva = p.origem || (p.nota_id ? 'XML' : 'MANUAL');

      return {
        ...p,
        origem: origemEfetiva,
        descricao: p.descricao || (p.nota_id ? `Faturamento NF-e ${numeroNota}` : `Título a Receber #${p.id}`),
        vencimento: p.data_vencimento,
        valor_original: p.valor_parcela,
        saldo,
        status: p.status.toLowerCase(),
        cliente_nome: clienteNome || 'Cliente não identificado',
        cliente_cpf_cnpj: clienteCnpj,
        numero_nota: numeroNota,
        chave_nfe: chaveNfe,
        observacao: p.observacoes,
      };
    });
  }

  public buscarPorId(id: number): any {
    db.autoUpdateOverdueStatus();
    const p = db.parcelas_receber.find((item) => item.id === id);
    if (!p) return null;

    let clienteNome = p.cliente_nome;
    let clienteCnpj = '';
    let numeroNota = p.numero_documento;
    let chaveNfe = '';

    if (p.nota_id) {
      const nota = db.notas_fiscais.find((n) => n.id === p.nota_id);
      if (nota) {
        numeroNota = nota.numero_nota;
        chaveNfe = nota.chave_acesso;
        const cliente = db.clientes.find((c) => c.id === nota.cliente_id);
        if (cliente) {
          clienteNome = cliente.nome;
          clienteCnpj = cliente.cpf_cnpj;
        }
      }
    } else if (p.cliente_id) {
      const cliente = db.clientes.find((c) => c.id === p.cliente_id);
      if (cliente) {
        clienteNome = cliente.nome;
        clienteCnpj = cliente.cpf_cnpj;
      }
    }

    const saldo = Math.max(0, p.valor_parcela - p.valor_recebido);
    const origemEfetiva = p.origem || (p.nota_id ? 'XML' : 'MANUAL');

    return {
      ...p,
      origem: origemEfetiva,
      descricao: p.descricao || (p.nota_id ? `Faturamento NF-e ${numeroNota}` : `Título a Receber #${p.id}`),
      vencimento: p.data_vencimento,
      valor_original: p.valor_parcela,
      saldo,
      status: p.status.toLowerCase(),
      cliente_nome: clienteNome || 'Cliente',
      cliente_cpf_cnpj: clienteCnpj,
      numero_nota: numeroNota,
      chave_nfe: chaveNfe,
      observacao: p.observacoes,
    };
  }

  public criarManual(
    dados: {
      empresaId: number;
      clienteId: number;
      descricao: string;
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
  ): ParcelaReceber[] {
    const cliente = db.clientes.find((c) => c.id === dados.clienteId);
    if (!cliente) {
      throw new Error('Cliente obrigatório não encontrado.');
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

    const parcelasCriadas: ParcelaReceber[] = [];
    const totalParcelas = Math.max(1, dados.quantidadeParcelas || 1);
    const valorPorParcela = Math.round((dados.valorTotal / totalParcelas) * 100) / 100;
    const diferencaCentavos = dados.valorTotal - valorPorParcela * totalParcelas;

    const docBase = dados.numeroDocumento || `REC-${Date.now().toString().slice(-6)}`;
    const dataInicial = new Date(dados.primeiroVencimento + 'T12:00:00');
    const intervalo = dados.intervaloDias || 30;

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

      const novaParcela: ParcelaReceber = {
        id: db.getNextParcelaId(),
        empresa_id: dados.empresaId,
        cliente_id: cliente.id,
        cliente_nome: cliente.nome,
        numero_documento: `${docBase}`,
        descricao: descFinal,
        origem: 'MANUAL',
        numero_parcela: i,
        total_parcelas: totalParcelas,
        data_vencimento: vencStr,
        valor_parcela: valorFinal,
        valor_recebido: 0,
        status: 'PENDENTE',
        categoria: dados.categoria.trim(),
        observacoes: dados.observacoes || dados.observacao || '',
        anexo_nome: dados.anexoNome,
        anexo_url: dados.anexoUrl,
        criado_em: new Date().toISOString(),
      };

      db.parcelas_receber.push(novaParcela);
      parcelasCriadas.push(novaParcela);
    }

    // Registra categoria na lista se ainda não existir
    const catExiste = db.categorias.some(
      (c) => c.tipo === 'RECEITA' && c.nome.toLowerCase() === dados.categoria.trim().toLowerCase()
    );
    if (!catExiste) {
      db.categorias.push({
        id: db.getNextCategoriaId(),
        tipo: 'RECEITA',
        nome: dados.categoria.trim(),
        padrao: false,
        criado_em: new Date().toISOString(),
      });
    }

    db.log(
      usuarioId,
      usuarioNome,
      'LANCAMENTO_MANUAL_RECEBER',
      `Lançamento manual a receber criado: "${dados.descricao}" de R$ ${dados.valorTotal.toFixed(2)} (${totalParcelas}x) para cliente "${cliente.nome}".`
    );

    return parcelasCriadas;
  }

  public baixar(
    id: number,
    dados: {
      valorRecebido: number;
      dataRecebimento: string;
      formaPagamento?: string;
      observacoes?: string;
    },
    usuarioId?: number,
    usuarioNome?: string
  ): any {
    const p = db.parcelas_receber.find((item) => item.id === id);
    if (!p) {
      throw new Error('Parcela não encontrada.');
    }

    if (p.status === 'PAGO') {
      throw new Error('Esta parcela já está totalmente quitada.');
    }

    const valorBaixa = Number(dados.valorRecebido);
    if (isNaN(valorBaixa) || valorBaixa <= 0) {
      throw new Error('Valor de recebimento inválido.');
    }

    const novoTotalRecebido = (p.valor_recebido || 0) + valorBaixa;

    p.valor_recebido = Math.round(novoTotalRecebido * 100) / 100;
    p.data_recebimento = dados.dataRecebimento || new Date().toISOString().split('T')[0];
    p.forma_pagamento = dados.formaPagamento || p.forma_pagamento || 'PIX';
    if (dados.observacoes) {
      p.observacoes = (p.observacoes ? p.observacoes + ' | ' : '') + dados.observacoes;
    }

    if (p.valor_recebido >= p.valor_parcela - 0.009) {
      p.status = 'PAGO';
      p.valor_recebido = p.valor_parcela;
    } else {
      p.status = 'PARCIAL';
    }

    p.atualizado_em = new Date().toISOString();

    db.log(
      usuarioId,
      usuarioNome,
      'BAIXA_RECEBIMENTO',
      `Baixa de R$ ${valorBaixa.toFixed(2)} na parcela #${p.id} (${p.cliente_nome || 'Cliente'}). Novo status: ${p.status}.`
    );

    return this.buscarPorId(p.id);
  }

  public estornar(id: number, usuarioId?: number, usuarioNome?: string): any {
    const p = db.parcelas_receber.find((item) => item.id === id);
    if (!p) throw new Error('Parcela não encontrada.');

    const valorEstornado = p.valor_recebido;
    p.valor_recebido = 0;
    p.data_recebimento = undefined;
    p.forma_pagamento = undefined;
    p.status = 'PENDENTE';
    p.atualizado_em = new Date().toISOString();

    db.autoUpdateOverdueStatus();

    db.log(
      usuarioId,
      usuarioNome,
      'ESTORNO_RECEBIMENTO',
      `Estorno de baixa no valor de R$ ${valorEstornado.toFixed(2)} na parcela #${p.id}. Status revertido para ${p.status}.`
    );

    return this.buscarPorId(p.id);
  }

  public atualizar(
    id: number,
    dados: Partial<ParcelaReceber> & { valorOriginal?: number; dataVencimento?: string },
    usuarioId?: number,
    usuarioNome?: string
  ): any {
    const p = db.parcelas_receber.find((item) => item.id === id);
    if (!p) throw new Error('Parcela não encontrada.');

    if (dados.dataVencimento) p.data_vencimento = dados.dataVencimento;
    if (dados.valor_parcela !== undefined) p.valor_parcela = Number(dados.valor_parcela);
    if (dados.valorOriginal !== undefined) p.valor_parcela = Number(dados.valorOriginal);
    if (dados.categoria !== undefined) p.categoria = dados.categoria;
    if (dados.descricao !== undefined) p.descricao = dados.descricao;
    if (dados.observacoes !== undefined) p.observacoes = dados.observacoes;
    if (dados.status !== undefined) p.status = dados.status as StatusParcela;

    p.atualizado_em = new Date().toISOString();
    db.autoUpdateOverdueStatus();

    db.log(
      usuarioId,
      usuarioNome,
      'PARCELA_ATUALIZADA',
      `Título a receber #${p.id} foi alterado. Vencimento: ${p.data_vencimento}, Valor: R$ ${p.valor_parcela.toFixed(2)}.`
    );

    return this.buscarPorId(p.id);
  }
}

export const parcelasService = new ParcelasService();
