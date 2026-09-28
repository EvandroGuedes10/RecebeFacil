import { XMLParser } from 'fast-xml-parser';

export interface ParsedNFeItem {
  itemNumero: number;
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface ParsedNFeParcela {
  numeroParcela: number;
  numeroDuplicata: string;
  dataVencimento: string; // YYYY-MM-DD
  valorParcela: number;
}

export interface ParsedNFeResult {
  chaveAcesso: string;
  numeroNota: string;
  serie: string;
  dataEmissao: string; // ISO String
  naturezaOperacao: string;
  valorTotal: number;
  valorProdutos: number;
  valorDesconto: number;
  valorFrete: number;
  protocoloAutorizacao: string;
  
  // Emitente
  emitente: {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia?: string;
    inscricaoEstadual?: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };

  // Destinatário / Cliente
  destinatario: {
    cpfCnpj: string;
    nome: string;
    inscricaoEstadual?: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };

  // Parcelas / Duplicatas
  parcelas: ParsedNFeParcela[];
  
  // Itens
  itens: ParsedNFeItem[];
  
  // XML original em string
  xmlRaw: string;
}

export function parseNFeXml(xmlContent: string): ParsedNFeResult {
  if (!xmlContent || typeof xmlContent !== 'string') {
    throw new Error('Conteúdo XML inválido ou vazio.');
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: true,
    trimValues: true,
    numberParseOptions: {
      hex: false,
      leadingZeros: true,
      skipLike: /^[0-9]{11,44}$/, // Preservar chaves e CNPJ como string
    },
  });

  const parsed = parser.parse(xmlContent);

  // Navegar até infNFe (suporta nfeProc ou direto NFe)
  const nfe = parsed.nfeProc?.NFe || parsed.NFe || parsed;
  const infNFe = nfe?.infNFe;

  if (!infNFe) {
    throw new Error('Formato de XML incompatível: Tag <infNFe> não encontrada. Certifique-se de que é um XML de NF-e (Modelo 55 ou 65).');
  }

  // Chave de Acesso (Extrai do atributo Id="NFe35..." ou gera fallback)
  let chaveAcesso = '';
  const rawId = infNFe['@_Id'] || infNFe['@_id'] || '';
  if (rawId) {
    chaveAcesso = rawId.replace(/^NFe/i, '').trim();
  }

  // Identificação da Nota
  const ide = infNFe.ide || {};
  const numeroNota = String(ide.nNF || ide.cNF || '0');
  const serie = String(ide.serie ?? '1');
  const dataEmissaoRaw = ide.dhEmi || ide.dEmi || new Date().toISOString();
  const dataEmissao = new Date(dataEmissaoRaw).toISOString();
  const naturezaOperacao = ide.natOp || 'Venda de mercadorias';

  // Se a chave não veio no atributo Id, tenta protNFe ou compõe
  const protNFe = parsed.nfeProc?.protNFe?.infProt || parsed.protNFe?.infProt;
  if (!chaveAcesso && protNFe?.chNFe) {
    chaveAcesso = String(protNFe.chNFe).trim();
  }
  if (!chaveAcesso || chaveAcesso.length < 44) {
    // Gerar chave sintetizada consistente caso não venha no XML
    const cUF = String(ide.cUF || '35').padStart(2, '0');
    const aamm = dataEmissao.slice(2, 4) + dataEmissao.slice(5, 7);
    const cnpjEmit = String(infNFe.emit?.CNPJ || '00000000000000').replace(/\D/g, '').padStart(14, '0');
    const mod = String(ide.mod || '55').padStart(2, '0');
    const seriePad = String(serie).padStart(3, '0');
    const nNFPad = String(numeroNota).padStart(9, '0');
    const tpEmis = String(ide.tpEmis || '1');
    const cNFPad = String(ide.cNF || '12345678').padStart(8, '0');
    chaveAcesso = `${cUF}${aamm}${cnpjEmit}${mod}${seriePad}${nNFPad}${tpEmis}${cNFPad}0`;
  }

  const protocoloAutorizacao = protNFe?.nProt ? String(protNFe.nProt) : (ide.cNF ? `PROT-${ide.cNF}` : 'AUT-SEFAZ-OK');

  // Emitente
  const emit = infNFe.emit || {};
  const enderEmit = emit.enderEmit || {};
  const emitCnpj = String(emit.CNPJ || emit.CPF || '').trim();
  const emitente = {
    cnpj: emitCnpj,
    razaoSocial: emit.xNome || 'Empresa Emitente S/A',
    nomeFantasia: emit.xFant || emit.xNome || 'Empresa Emitente',
    inscricaoEstadual: emit.IE ? String(emit.IE) : undefined,
    email: emit.email || undefined,
    telefone: enderEmit.fone ? String(enderEmit.fone) : undefined,
    endereco: enderEmit.xLgr ? `${enderEmit.xLgr}, ${enderEmit.nro || 'S/N'}${enderEmit.xBairro ? ' - ' + enderEmit.xBairro : ''}` : undefined,
    cidade: enderEmit.xMun || undefined,
    estado: enderEmit.UF || undefined,
    cep: enderEmit.CEP ? String(enderEmit.CEP) : undefined,
  };

  // Destinatário
  const dest = infNFe.dest || {};
  const enderDest = dest.enderDest || {};
  const destCpfCnpj = String(dest.CNPJ || dest.CPF || '00000000000').trim();
  const destinatario = {
    cpfCnpj: destCpfCnpj,
    nome: dest.xNome || 'Consumidor Final',
    inscricaoEstadual: dest.IE ? String(dest.IE) : undefined,
    email: dest.email || undefined,
    telefone: enderDest.fone ? String(enderDest.fone) : undefined,
    endereco: enderDest.xLgr ? `${enderDest.xLgr}, ${enderDest.nro || 'S/N'}${enderDest.xBairro ? ' - ' + enderDest.xBairro : ''}` : undefined,
    cidade: enderDest.xMun || undefined,
    estado: enderDest.UF || undefined,
    cep: enderDest.CEP ? String(enderDest.CEP) : undefined,
  };

  // Totais
  const total = infNFe.total?.ICMSTot || {};
  const valorTotal = Number(total.vNF ?? total.vProd ?? 0);
  const valorProdutos = Number(total.vProd ?? valorTotal);
  const valorDesconto = Number(total.vDesc ?? 0);
  const valorFrete = Number(total.vFrete ?? 0);

  // Duplicatas e Cobrança
  const parcelas: ParsedNFeParcela[] = [];
  const cobr = infNFe.cobr;

  if (cobr && cobr.dup) {
    const rawDups = Array.isArray(cobr.dup) ? cobr.dup : [cobr.dup];
    rawDups.forEach((dup: any, index: number) => {
      const numParcela = index + 1;
      const numDup = String(dup.nDup || numParcela);
      let dVenc = dup.dVenc;
      if (!dVenc) {
        const d = new Date(dataEmissao);
        d.setDate(d.getDate() + 30 * numParcela);
        dVenc = d.toISOString().split('T')[0];
      } else {
        dVenc = String(dVenc).split('T')[0];
      }
      const vDup = Number(dup.vDup || (valorTotal / rawDups.length));

      parcelas.push({
        numeroParcela: numParcela,
        numeroDuplicata: numDup,
        dataVencimento: dVenc,
        valorParcela: Math.round(vDup * 100) / 100,
      });
    });
  } else {
    // Se não há grupo <cobr><dup>, verificar se há <pag> ou gerar parcela única com vencimento a 30 dias ou à vista
    const emissaoDate = new Date(dataEmissao);
    const dataVencDefault = new Date(emissaoDate);
    dataVencDefault.setDate(dataVencDefault.getDate() + 30);

    parcelas.push({
      numeroParcela: 1,
      numeroDuplicata: '001',
      dataVencimento: dataVencDefault.toISOString().split('T')[0],
      valorParcela: valorTotal > 0 ? valorTotal : 100.0,
    });
  }

  // Itens da Nota Fiscal
  const itens: ParsedNFeItem[] = [];
  const detList = Array.isArray(infNFe.det) ? infNFe.det : (infNFe.det ? [infNFe.det] : []);

  detList.forEach((detItem: any, index: number) => {
    const prod = detItem.prod || {};
    itens.push({
      itemNumero: Number(detItem['@_nItem'] || index + 1),
      codigo: String(prod.cProd || `ITEM-${index + 1}`),
      descricao: String(prod.xProd || 'Produto Comercial'),
      ncm: String(prod.NCM || '00000000'),
      cfop: String(prod.CFOP || '5102'),
      unidade: String(prod.uCom || 'UN'),
      quantidade: Number(prod.qCom || 1),
      valorUnitario: Number(prod.vUnCom || prod.vProd || 0),
      valorTotal: Number(prod.vProd || 0),
    });
  });

  return {
    chaveAcesso,
    numeroNota,
    serie,
    dataEmissao,
    naturezaOperacao,
    valorTotal,
    valorProdutos,
    valorDesconto,
    valorFrete,
    protocoloAutorizacao,
    emitente,
    destinatario,
    parcelas,
    itens,
    xmlRaw: xmlContent,
  };
}
