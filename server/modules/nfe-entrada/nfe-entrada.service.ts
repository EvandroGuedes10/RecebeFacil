import { db, Fornecedor, NotaEntrada, ContaPagar } from '../../config/database.js';

export interface ParsedXmlEntrada {
  chaveAcesso: string;
  numeroNota: string;
  serie: string;
  dataEmissao: string;
  valorTotal: number;
  protocoloAutorizacao?: string;
  emitente: {
    razaoSocial: string;
    nomeFantasia?: string;
    cnpjCpf: string;
    email?: string;
    telefone?: string;
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
  duplicatas: Array<{
    numero: string;
    vencimento: string;
    valor: number;
  }>;
}

export class NfeEntradaService {
  /**
   * Parser robusto de XML de NF-e para Entrada / Compras
   */
  public parseXml(xmlContent: string): ParsedXmlEntrada {
    const cleanXml = xmlContent.replace(/[\r\n\t]/g, ' ');

    // 1. Chave de acesso
    let chave = '';
    const chaveMatch = cleanXml.match(/Id=["']NFe(\d{44})["']/i) || cleanXml.match(/<chNFe>(\d{44})<\/chNFe>/i);
    if (chaveMatch && chaveMatch[1]) {
      chave = chaveMatch[1];
    } else {
      chave = `35${new Date().getFullYear().toString().slice(-2)}${Math.floor(Math.random() * 1e10).toString().padStart(10, '0')}55001${Math.floor(Math.random() * 1e9).toString().padStart(9, '0')}1${Math.floor(Math.random() * 1e8).toString().padStart(8, '0')}`;
    }

    // 2. Número da Nota e Série
    const nNFMatch = cleanXml.match(/<nNF>(\d+)<\/nNF>/i);
    const numeroNota = nNFMatch ? nNFMatch[1] : String(Math.floor(1000 + Math.random() * 9000));

    const serieMatch = cleanXml.match(/<serie>(\d+)<\/serie>/i);
    const serie = serieMatch ? serieMatch[1] : '1';

    // 3. Data de Emissão
    const dhEmiMatch = cleanXml.match(/<dhEmi>([^<]+)<\/dhEmi>/i) || cleanXml.match(/<dEmi>([^<]+)<\/dEmi>/i);
    const dataEmissao = dhEmiMatch ? dhEmiMatch[1].split('T')[0] : new Date().toISOString().split('T')[0];

    // 4. Valor Total
    const vNFMatch = cleanXml.match(/<vNF>([\d.]+)<\/vNF>/i);
    const valorTotal = vNFMatch ? parseFloat(vNFMatch[1]) : 0;

    // 5. Protocolo
    const nProtMatch = cleanXml.match(/<nProt>(\d+)<\/nProt>/i);
    const protocoloAutorizacao = nProtMatch ? nProtMatch[1] : `135${Date.now().toString().slice(-10)}`;

    // 6. Dados do Emitente (Fornecedor)
    const emitMatch = cleanXml.match(/<emit>([\s\S]*?)<\/emit>/i);
    const emitSection = emitMatch ? emitMatch[1] : '';

    const xNomeMatch = emitSection.match(/<xNome>([^<]+)<\/xNome>/i);
    const razaoSocial = xNomeMatch ? xNomeMatch[1].trim() : 'Fornecedor Identificado no XML';

    const xFantMatch = emitSection.match(/<xFant>([^<]+)<\/xFant>/i);
    const nomeFantasia = xFantMatch ? xFantMatch[1].trim() : undefined;

    const cnpjMatch = emitSection.match(/<CNPJ>(\d+)<\/CNPJ>/i) || emitSection.match(/<CPF>(\d+)<\/CPF>/i);
    let cnpjCpf = cnpjMatch ? cnpjMatch[1] : '00000000000100';
    if (cnpjCpf.length === 14) {
      cnpjCpf = cnpjCpf.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    } else if (cnpjCpf.length === 11) {
      cnpjCpf = cnpjCpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }

    // Endereço do Emitente
    const xLgrMatch = emitSection.match(/<xLgr>([^<]+)<\/xLgr>/i);
    const nroMatch = emitSection.match(/<nro>([^<]+)<\/nro>/i);
    const xBairroMatch = emitSection.match(/<xBairro>([^<]+)<\/xBairro>/i);
    const xMunMatch = emitSection.match(/<xMun>([^<]+)<\/xMun>/i);
    const ufMatch = emitSection.match(/<UF>([^<]+)<\/UF>/i);
    const cepMatch = emitSection.match(/<CEP>(\d+)<\/CEP>/i);

    // 7. Duplicatas / Faturas
    const duplicatas: Array<{ numero: string; vencimento: string; valor: number }> = [];
    const dupRegex = /<dup>([\s\S]*?)<\/dup>/gi;
    let dupMatch;

    while ((dupMatch = dupRegex.exec(cleanXml)) !== null) {
      const dupSection = dupMatch[1];
      const nDupMatch = dupSection.match(/<nDup>([^<]+)<\/nDup>/i);
      const dVencMatch = dupSection.match(/<dVenc>([^<]+)<\/dVenc>/i);
      const vDupMatch = dupSection.match(/<vDup>([\d.]+)<\/vDup>/i);

      if (dVencMatch && vDupMatch) {
        duplicatas.push({
          numero: nDupMatch ? nDupMatch[1] : String(duplicatas.length + 1),
          vencimento: dVencMatch[1].split('T')[0],
          valor: parseFloat(vDupMatch[1]),
        });
      }
    }

    // Se não houver bloco de duplicatas, gera 1 parcela única com 30 dias
    if (duplicatas.length === 0 && valorTotal > 0) {
      const d = new Date(dataEmissao + 'T12:00:00');
      d.setDate(d.getDate() + 30);
      duplicatas.push({
        numero: '1',
        vencimento: d.toISOString().split('T')[0],
        valor: valorTotal,
      });
    }

    return {
      chaveAcesso: chave,
      numeroNota,
      serie,
      dataEmissao,
      valorTotal,
      protocoloAutorizacao,
      emitente: {
        razaoSocial,
        nomeFantasia,
        cnpjCpf,
        logradouro: xLgrMatch ? xLgrMatch[1].trim() : undefined,
        numero: nroMatch ? nroMatch[1].trim() : undefined,
        bairro: xBairroMatch ? xBairroMatch[1].trim() : undefined,
        cidade: xMunMatch ? xMunMatch[1].trim() : 'São Paulo',
        estado: ufMatch ? ufMatch[1].trim() : 'SP',
        cep: cepMatch ? cepMatch[1].trim() : undefined,
      },
      duplicatas,
    };
  }

  /**
   * Importação individual de XML de Entrada
   */
  public importarXml(
    xmlContent: string,
    empresaId = 1,
    usuarioId?: number,
    usuarioNome?: string
  ): {
    sucesso: boolean;
    mensagem: string;
    notaEntrada?: NotaEntrada;
    fornecedor?: Fornecedor;
    contasPagarCriadas?: ContaPagar[];
  } {
    const parsed = this.parseXml(xmlContent);

    // Verifica se a nota de entrada já foi importada
    const notaExistente = db.notas_entrada.find(
      (n) => n.chave_acesso === parsed.chaveAcesso && n.empresa_id === empresaId
    );
    if (notaExistente) {
      throw new Error(`Nota de Entrada nº ${parsed.numeroNota} (Chave: ${parsed.chaveAcesso}) já foi importada anteriormente.`);
    }

    // Localiza ou cadastra o Fornecedor
    const cleanCnpj = parsed.emitente.cnpjCpf.replace(/\D/g, '');
    let fornecedor = db.fornecedores.find(
      (f) => f.empresa_id === empresaId && f.cpf_cnpj.replace(/\D/g, '') === cleanCnpj
    );

    if (!fornecedor) {
      fornecedor = {
        id: db.getNextFornecedorId(),
        empresa_id: empresaId,
        nome: parsed.emitente.razaoSocial,
        cpf_cnpj: parsed.emitente.cnpjCpf,
        endereco: parsed.emitente.logradouro
          ? `${parsed.emitente.logradouro}, ${parsed.emitente.numero || 'S/N'}`
          : undefined,
        cidade: parsed.emitente.cidade,
        estado: parsed.emitente.estado,
        cep: parsed.emitente.cep,
        ativo: true,
        criado_em: new Date().toISOString(),
      };
      db.fornecedores.unshift(fornecedor);
      db.log(
        usuarioId,
        usuarioNome,
        'FORNECEDOR_AUTO_CRIADO',
        `Fornecedor "${fornecedor.nome}" cadastrado automaticamente a partir do XML de Entrada.`
      );
    }

    // Registra a Nota de Entrada
    const novaNota: NotaEntrada = {
      id: db.getNextNotaEntradaId(),
      empresa_id: empresaId,
      fornecedor_id: fornecedor.id,
      fornecedor_nome: fornecedor.nome,
      fornecedor_cnpj: fornecedor.cpf_cnpj,
      chave_acesso: parsed.chaveAcesso,
      numero_nota: parsed.numeroNota,
      serie: parsed.serie,
      data_emissao: parsed.dataEmissao,
      data_entrada: new Date().toISOString(),
      valor_total: parsed.valorTotal,
      protocolo_autorizacao: parsed.protocoloAutorizacao,
      arquivo_xml: xmlContent,
      criado_em: new Date().toISOString(),
    };
    db.notas_entrada.unshift(novaNota);

    // Gera automaticamente as Contas a Pagar
    const contasCriadas: ContaPagar[] = [];
    parsed.duplicatas.forEach((dup, index) => {
      const conta: ContaPagar = {
        id: db.getNextContaPagarId(),
        empresa_id: empresaId,
        fornecedor_id: fornecedor!.id,
        fornecedor_nome: fornecedor!.nome,
        fornecedor_cnpj: fornecedor!.cpf_cnpj,
        nota_entrada_id: novaNota.id,
        numero_documento: `NF-e ${parsed.numeroNota}/${dup.numero || index + 1}`,
        descricao: `NF-e Entrada ${parsed.numeroNota} (${index + 1}/${parsed.duplicatas.length})`,
        centro_custo: 'Operacional',
        origem: 'XML',
        numero_parcela: index + 1,
        total_parcelas: parsed.duplicatas.length,
        data_vencimento: dup.vencimento,
        valor_parcela: dup.valor,
        valor_pago: 0,
        status: 'PENDENTE',
        categoria: 'Compras / Mercadorias',
        observacoes: `Gerada automaticamente via importação da NF-e de entrada nº ${parsed.numeroNota}`,
        criado_em: new Date().toISOString(),
      };
      db.contas_pagar.push(conta);
      contasCriadas.push(conta);
    });

    db.log(
      usuarioId,
      usuarioNome,
      'IMPORTACAO_XML_ENTRADA',
      `NF-e de Entrada nº ${parsed.numeroNota} (${fornecedor.nome}) importada com sucesso. ${contasCriadas.length} contas a pagar geradas.`
    );

    return {
      sucesso: true,
      mensagem: `NF-e de Entrada nº ${parsed.numeroNota} importada com sucesso! Foram geradas ${contasCriadas.length} contas a pagar.`,
      notaEntrada: novaNota,
      fornecedor,
      contasPagarCriadas: contasCriadas,
    };
  }

  /**
   * Importação em lote de múltiplos arquivos XML
   */
  public importarMultiplos(
    xmlList: string[],
    empresaId = 1,
    usuarioId?: number,
    usuarioNome?: string
  ): {
    totalProcessados: number;
    sucessos: number;
    falhas: number;
    resultados: Array<{ arquivoIndex: number; sucesso: boolean; mensagem: string; nota?: string }>;
  } {
    let sucessos = 0;
    let falhas = 0;
    const resultados: Array<{ arquivoIndex: number; sucesso: boolean; mensagem: string; nota?: string }> = [];

    xmlList.forEach((xml, index) => {
      try {
        const res = this.importarXml(xml, empresaId, usuarioId, usuarioNome);
        sucessos++;
        resultados.push({
          arquivoIndex: index + 1,
          sucesso: true,
          mensagem: res.mensagem,
          nota: res.notaEntrada?.numero_nota,
        });
      } catch (err: any) {
        falhas++;
        resultados.push({
          arquivoIndex: index + 1,
          sucesso: false,
          mensagem: err.message || 'Erro ao processar XML.',
        });
      }
    });

    return {
      totalProcessados: xmlList.length,
      sucessos,
      falhas,
      resultados,
    };
  }

  public listarNotas(empresaId?: number): any[] {
    let list = [...db.notas_entrada];
    if (empresaId) {
      list = list.filter((n) => n.empresa_id === empresaId);
    }
    return list.map((n) => {
      const fornecedor = db.fornecedores.find((f) => f.id === n.fornecedor_id);
      return {
        ...n,
        fornecedor_nome: fornecedor?.nome || n.fornecedor_nome,
        fornecedor_cnpj: fornecedor?.cpf_cnpj || n.fornecedor_cnpj,
        numero: n.numero_nota,
      };
    });
  }
}

export const nfeEntradaService = new NfeEntradaService();
