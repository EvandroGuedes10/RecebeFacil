import { db, NotaFiscal, ParcelaReceber, Cliente, Empresa } from '../../config/database.js';
import { parseNFeXml, ParsedNFeResult } from './nfe.parser.js';

export interface ImportNFeOptions {
  empresaId?: number;
  usuarioId?: number;
  usuarioNome?: string;
  sobrescreverSeExistir?: boolean;
}

export interface ImportNFeResponse {
  sucesso: boolean;
  mensagem: string;
  notaFiscal: NotaFiscal;
  cliente: Cliente;
  parcelas: ParcelaReceber[];
  empresa: Empresa;
  resumo: {
    numeroNota: string;
    serie: string;
    chaveAcesso: string;
    valorTotal: number;
    quantidadeParcelas: number;
    primeiroVencimento: string;
    ultimoVencimento: string;
  };
}

export class NFeService {
  /**
   * Importa e processa um XML de NF-e completo, gerando cliente, nota fiscal e parcelas
   */
  public async importarXml(xmlContent: string, options: ImportNFeOptions = {}): Promise<ImportNFeResponse> {
    db.autoUpdateOverdueStatus();

    // 1. Fazer o parse estruturado do XML SEFAZ
    const parsed: ParsedNFeResult = parseNFeXml(xmlContent);

    // 2. Identificar a Empresa Emitente
    let empresa: Empresa | undefined;
    if (options.empresaId) {
      empresa = db.empresas.find(e => e.id === options.empresaId);
    }

    // Se não encontrou pelo ID ou não informado, busca pelo CNPJ do emitente
    if (!empresa) {
      const emitCnpjClean = parsed.emitente.cnpj.replace(/\D/g, '');
      empresa = db.empresas.find(e => e.cnpj.replace(/\D/g, '') === emitCnpjClean);
    }

    // Se a empresa ainda não existir, cria a empresa automaticamente a partir dos dados do emitente do XML
    if (!empresa) {
      const now = new Date().toISOString();
      empresa = {
        id: db.getNextEmpresaId(),
        razao_social: parsed.emitente.razaoSocial,
        nome_fantasia: parsed.emitente.nomeFantasia || parsed.emitente.razaoSocial,
        cnpj: parsed.emitente.cnpj,
        inscricao_estadual: parsed.emitente.inscricaoEstadual,
        email: parsed.emitente.email,
        telefone: parsed.emitente.telefone,
        endereco: parsed.emitente.endereco,
        cidade: parsed.emitente.cidade,
        estado: parsed.emitente.estado,
        cep: parsed.emitente.cep,
        ativo: true,
        criado_em: now,
        atualizado_em: now,
      };
      db.empresas.push(empresa);
      db.log(options.usuarioId, options.usuarioNome, 'EMPRESA_CRIADA_AUTOMATICA', `Empresa ${empresa.razao_social} cadastrada a partir do XML da NF-e ${parsed.numeroNota}.`);
    }

    // 3. Verificar duplicidade de NF-e pela Chave de Acesso
    const notaExistenteIndex = db.notas_fiscais.findIndex(n => n.chave_acesso === parsed.chaveAcesso);
    if (notaExistenteIndex >= 0) {
      if (!options.sobrescreverSeExistir) {
        throw new Error(`A NF-e nº ${parsed.numeroNota} (Chave: ${parsed.chaveAcesso}) já foi importada anteriormente no sistema.`);
      }
      // Se sobrescrever, remove as parcelas antigas
      const notaAntiga = db.notas_fiscais[notaExistenteIndex];
      db.parcelas_receber = db.parcelas_receber.filter(p => p.nota_id !== notaAntiga.id);
      db.notas_fiscais.splice(notaExistenteIndex, 1);
    }

    // 4. Cadastrar ou Atualizar Cliente (Destinatário)
    const destDocClean = parsed.destinatario.cpfCnpj.replace(/\D/g, '');
    let cliente = db.clientes.find(c => c.empresa_id === empresa!.id && c.cpf_cnpj.replace(/\D/g, '') === destDocClean);

    if (!cliente) {
      cliente = {
        id: db.getNextClienteId(),
        empresa_id: empresa.id,
        nome: parsed.destinatario.nome,
        cpf_cnpj: parsed.destinatario.cpfCnpj,
        email: parsed.destinatario.email,
        telefone: parsed.destinatario.telefone,
        endereco: parsed.destinatario.endereco,
        cidade: parsed.destinatario.cidade,
        estado: parsed.destinatario.estado,
        cep: parsed.destinatario.cep,
        ativo: true,
        criado_em: new Date().toISOString(),
      };
      db.clientes.push(cliente);
      db.log(options.usuarioId, options.usuarioNome, 'CLIENTE_CADASTRADO', `Cliente ${cliente.nome} (${cliente.cpf_cnpj}) cadastrado automaticamente.`);
    } else {
      // Atualiza dados de contato caso tenham vindo mais completos no XML
      if (parsed.destinatario.email && !cliente.email) cliente.email = parsed.destinatario.email;
      if (parsed.destinatario.telefone && !cliente.telefone) cliente.telefone = parsed.destinatario.telefone;
      if (parsed.destinatario.endereco && !cliente.endereco) cliente.endereco = parsed.destinatario.endereco;
    }

    const clienteAtivo = cliente;

    // 5. Inserir a Nota Fiscal
    const now = new Date().toISOString();
    const novaNota: NotaFiscal = {
      id: db.getNextNotaId(),
      empresa_id: empresa.id,
      cliente_id: clienteAtivo.id,
      chave_acesso: parsed.chaveAcesso,
      numero_nota: parsed.numeroNota,
      serie: parsed.serie,
      data_emissao: parsed.dataEmissao,
      valor_total: parsed.valorTotal,
      natureza_operacao: parsed.naturezaOperacao,
      valor_produtos: parsed.valorProdutos,
      valor_desconto: parsed.valorDesconto,
      valor_frete: parsed.valorFrete,
      protocolo_autorizacao: parsed.protocoloAutorizacao,
      caminho_xml: `nfe_${parsed.numeroNota}_${parsed.chaveAcesso.slice(-8)}.xml`,
      conteudo_xml: parsed.xmlRaw,
      itens: parsed.itens,
      criado_em: now,
    };
    db.notas_fiscais.push(novaNota);

    // 6. Inserir Parcelas a Receber
    const parcelasCriadas: ParcelaReceber[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const p of parsed.parcelas) {
      const isOverdue = p.dataVencimento < today;
      const parcela: ParcelaReceber = {
        id: db.getNextParcelaId(),
        empresa_id: empresa.id,
        cliente_id: cliente.id,
        cliente_nome: cliente.nome,
        nota_id: novaNota.id,
        origem: 'XML',
        descricao: `NF-e Saída ${parsed.numeroNota} (${p.numeroParcela}/${parsed.parcelas.length})`,
        categoria: 'Venda de Produtos / Mercadorias',
        numero_parcela: p.numeroParcela,
        total_parcelas: parsed.parcelas.length,
        data_vencimento: p.dataVencimento,
        valor_parcela: p.valorParcela,
        valor_recebido: 0,
        status: isOverdue ? 'ATRASADO' : 'PENDENTE',
        observacoes: `Duplicata ${p.numeroDuplicata} gerada automaticamente a partir da NF-e ${parsed.numeroNota}`,
        criado_em: now,
      };
      db.parcelas_receber.push(parcela);
      parcelasCriadas.push(parcela);
    }

    // 7. Gravar Log de Auditoria
    db.log(
      options.usuarioId,
      options.usuarioNome,
      'IMPORTACAO_NFE',
      `Importação da NF-e nº ${parsed.numeroNota} série ${parsed.serie} com sucesso. Valor total R$ ${parsed.valorTotal.toFixed(2)}, gerando ${parcelasCriadas.length} parcela(s) a receber.`
    );

    const primeiroVencimento = parcelasCriadas[0]?.data_vencimento || '';
    const ultimoVencimento = parcelasCriadas[parcelasCriadas.length - 1]?.data_vencimento || '';

    return {
      sucesso: true,
      mensagem: `NF-e nº ${parsed.numeroNota} importada com sucesso! Foram geradas ${parcelasCriadas.length} parcelas a receber para ${clienteAtivo.nome}.`,
      notaFiscal: novaNota,
      cliente: clienteAtivo,
      parcelas: parcelasCriadas,
      empresa,
      resumo: {
        numeroNota: parsed.numeroNota,
        serie: parsed.serie,
        chaveAcesso: parsed.chaveAcesso,
        valorTotal: parsed.valorTotal,
        quantidadeParcelas: parcelasCriadas.length,
        primeiroVencimento,
        ultimoVencimento,
      },
    };
  }

  /**
   * Importa múltiplos XMLs em lote
   */
  public async importarLote(arquivosXml: string[], options: ImportNFeOptions = {}) {
    const resultados = [];
    const erros = [];

    for (let i = 0; i < arquivosXml.length; i++) {
      const xml = arquivosXml[i];
      try {
        const res = await this.importarXml(xml, options);
        resultados.push(res);
      } catch (err: any) {
        erros.push({
          indice: i + 1,
          mensagem: err.message || 'Erro desconhecido ao processar arquivo XML.',
        });
      }
    }

    return {
      totalProcessados: arquivosXml.length,
      totalSucesso: resultados.length,
      totalFalhas: erros.length,
      resultados,
      erros,
    };
  }

  /**
   * Lista notas fiscais de saída cadastradas, enriquecidas com dados do cliente
   */
  public listarNotas(empresaId?: number, busca?: string, clienteId?: number): any[] {
    let list = [...db.notas_fiscais];
    if (empresaId) {
      list = list.filter((n) => n.empresa_id === empresaId);
    }
    if (clienteId) {
      list = list.filter((n) => n.cliente_id === clienteId);
    }
    if (busca) {
      const term = busca.toLowerCase();
      list = list.filter(
        (n) =>
          n.numero_nota?.toLowerCase().includes(term) ||
          n.chave_acesso?.toLowerCase().includes(term) ||
          n.serie?.toLowerCase().includes(term)
      );
    }

    return list.map((n) => {
      const cliente = db.clientes.find((c) => c.id === n.cliente_id);
      const parcelas = db.parcelas_receber.filter((p) => p.nota_id === n.id);
      const totalRecebido = parcelas.reduce((acc, p) => acc + (p.valor_recebido || 0), 0);

      return {
        ...n,
        cliente_nome: cliente?.nome || 'Cliente não identificado',
        cliente_cpf_cnpj: cliente?.cpf_cnpj || '',
        total_parcelas: parcelas.length,
        total_recebido: totalRecebido,
        saldo_restante: Math.max(0, n.valor_total - totalRecebido),
        numero: n.numero_nota,
      };
    });
  }

  /**
   * Busca uma nota fiscal pelo ID
   */
  public buscarPorId(id: number): any {
    const nota = db.notas_fiscais.find((n) => n.id === id);
    if (!nota) return undefined;
    const cliente = db.clientes.find((c) => c.id === nota.cliente_id);
    const parcelas = db.parcelas_receber.filter((p) => p.nota_id === nota.id);
    return {
      ...nota,
      cliente_nome: cliente?.nome,
      cliente_cpf_cnpj: cliente?.cpf_cnpj,
      total_parcelas: parcelas.length,
      parcelas,
      numero: nota.numero_nota,
    };
  }
}

export const nfeService = new NFeService();
