export interface SampleNFeXml {
  id: string;
  title: string;
  description: string;
  filename: string;
  xml: string;
  parcelasCount: number;
  valorTotal: number;
}

export function generateSampleXml(
  numeroNota: number,
  emitenteNome: string,
  emitenteCnpj: string,
  destNome: string,
  destCpfCnpj: string,
  parcelas: { vencimentoDias: number; valor: number }[],
  itens: { descricao: string; qtd: number; unit: number }[]
): string {
  const cNF = String(Math.floor(10000000 + Math.random() * 90000000));
  const nNF = String(numeroNota);
  const now = new Date();
  const dhEmi = now.toISOString();
  const aamm = dhEmi.slice(2, 4) + dhEmi.slice(5, 7);
  const cnpjClean = emitenteCnpj.replace(/\D/g, '').padStart(14, '0');
  const chave = `35${aamm}${cnpjClean}55001${nNF.padStart(9, '0')}1${cNF}8`;
  const nProt = `1352600${Math.floor(10000000 + Math.random() * 90000000)}`;

  const valorTotal = parcelas.reduce((acc, p) => acc + p.valor, 0);

  const itemsXml = itens
    .map((item, idx) => {
      const vProd = (item.qtd * item.unit).toFixed(2);
      return `
    <det nItem="${idx + 1}">
      <prod>
        <cProd>PRD-${100 + idx}</cProd>
        <cEAN>SEM GTIN</cEAN>
        <xProd>${item.descricao}</xProd>
        <NCM>84713012</NCM>
        <CFOP>5102</CFOP>
        <uCom>UN</uCom>
        <qCom>${item.qtd.toFixed(4)}</qCom>
        <vUnCom>${item.unit.toFixed(4)}</vUnCom>
        <vProd>${vProd}</vProd>
        <cEANTrib>SEM GTIN</cEANTrib>
        <uTrib>UN</uTrib>
        <qTrib>${item.qtd.toFixed(4)}</qTrib>
        <vUnTrib>${item.unit.toFixed(4)}</vUnTrib>
        <indTot>1</indTot>
      </prod>
      <imposto>
        <ICMS>
          <ICMS00>
            <orig>0</orig>
            <CST>00</CST>
            <modBC>3</modBC>
            <vBC>${vProd}</vBC>
            <pICMS>18.00</pICMS>
            <vICMS>${(Number(vProd) * 0.18).toFixed(2)}</vICMS>
          </ICMS00>
        </ICMS>
        <PIS>
          <PISAliq>
            <CST>01</CST>
            <vBC>${vProd}</vBC>
            <pPIS>1.65</pPIS>
            <vPIS>${(Number(vProd) * 0.0165).toFixed(2)}</vPIS>
          </PISAliq>
        </PIS>
        <COFINS>
          <COFINSAliq>
            <CST>01</CST>
            <vBC>${vProd}</vBC>
            <pCOFINS>7.60</pCOFINS>
            <vCOFINS>${(Number(vProd) * 0.076).toFixed(2)}</vCOFINS>
          </COFINSAliq>
        </COFINS>
      </imposto>
    </det>`;
    })
    .join('');

  const dupsXml = parcelas
    .map((p, idx) => {
      const d = new Date(now);
      d.setDate(d.getDate() + p.vencimentoDias);
      const dVenc = d.toISOString().split('T')[0];
      return `
      <dup>
        <nDup>${String(idx + 1).padStart(3, '0')}</nDup>
        <dVenc>${dVenc}</dVenc>
        <vDup>${p.valor.toFixed(2)}</vDup>
      </dup>`;
    })
    .join('');

  const isCpf = destCpfCnpj.replace(/\D/g, '').length === 11;
  const destDocTag = isCpf
    ? `<CPF>${destCpfCnpj.replace(/\D/g, '')}</CPF>`
    : `<CNPJ>${destCpfCnpj.replace(/\D/g, '')}</CNPJ>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe Id="NFe${chave}" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>${cNF}</cNF>
        <natOp>Venda de mercadorias para revenda</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>${nNF}</nNF>
        <dhEmi>${dhEmi}</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>3550308</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>8</cDV>
        <tpAmb>1</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>0</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>RecebeFacil-ERP-1.0</verProc>
      </ide>
      <emit>
        <CNPJ>${emitenteCnpj.replace(/\D/g, '')}</CNPJ>
        <xNome>${emitenteNome}</xNome>
        <xFant>${emitenteNome.split(' ')[0]} Brasil</xFant>
        <enderEmit>
          <xLgr>Av. Paulista</xLgr>
          <nro>1578</nro>
          <xBairro>Bela Vista</xBairro>
          <cMun>3550308</cMun>
          <xMun>São Paulo</xMun>
          <UF>SP</UF>
          <CEP>01310200</CEP>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
          <fone>1133334444</fone>
        </enderEmit>
        <IE>112233445566</IE>
        <CRT>3</CRT>
      </emit>
      <dest>
        ${destDocTag}
        <xNome>${destNome}</xNome>
        <enderDest>
          <xLgr>Rua das Indústrias</xLgr>
          <nro>450</nro>
          <xBairro>Distrito Industrial</xBairro>
          <cMun>3509502</cMun>
          <xMun>Campinas</xMun>
          <UF>SP</UF>
          <CEP>13050000</CEP>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
          <fone>1932556677</fone>
        </enderDest>
        <indIEDest>1</indIEDest>
        <IE>998877665544</IE>
        <email>financeiro@${destNome.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br</email>
      </dest>
      ${itemsXml}
      <total>
        <ICMSTot>
          <vBC>${valorTotal.toFixed(2)}</vBC>
          <vICMS>${(valorTotal * 0.18).toFixed(2)}</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>${valorTotal.toFixed(2)}</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>${(valorTotal * 0.0165).toFixed(2)}</vPIS>
          <vCOFINS>${(valorTotal * 0.076).toFixed(2)}</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>${valorTotal.toFixed(2)}</vNF>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>0</modFrete>
      </transp>
      <cobr>
        <fat>
          <nFat>${nNF}</nFat>
          <vOrig>${valorTotal.toFixed(2)}</vOrig>
          <vDesc>0.00</vDesc>
          <vLiq>${valorTotal.toFixed(2)}</vLiq>
        </fat>
        ${dupsXml}
      </cobr>
      <pag>
        <detPag>
          <indPag>1</indPag>
          <tPag>15</tPag>
          <vPag>${valorTotal.toFixed(2)}</vPag>
        </detPag>
      </pag>
      <infAdic>
        <infCpl>Documento emitido por ME ou EPP optante pelo Simples Nacional. Trib aprox R$ ${(valorTotal * 0.14).toFixed(2)} federal e ${(valorTotal * 0.05).toFixed(2)} estadual. Fonte: IBPT.</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>1</tpAmb>
      <verAplic>SP_NFE_PL_009_V4</verAplic>
      <chNFe>${chave}</chNFe>
      <dhRecbto>${dhEmi}</dhRecbto>
      <nProt>${nProt}</nProt>
      <digVal>zFvR+82sP9qXhY=</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;
}

export const SAMPLE_NFES: SampleNFeXml[] = [
  {
    id: 'sample-1',
    title: 'NF-e 1024 - Distribuidora Aurora (3 Parcelas: 30/60/90d)',
    description: 'Venda corporativa de servidores e monitores para Tech Solutions Ltda com 3 duplicatas.',
    filename: 'NFe_1024_Aurora_3Parcelas.xml',
    parcelasCount: 3,
    valorTotal: 15750.00,
    xml: generateSampleXml(
      1024,
      'Aurora Distribuidora de Eletrônicos S/A',
      '12.345.678/0001-95',
      'Tech Solutions Informática & Serviços Ltda',
      '98.765.432/0001-10',
      [
        { vencimentoDias: 30, valor: 5250.00 },
        { vencimentoDias: 60, valor: 5250.00 },
        { vencimentoDias: 90, valor: 5250.00 },
      ],
      [
        { descricao: 'Servidor Dell PowerEdge R450 Xeon Silver', qtd: 2, unit: 6500.00 },
        { descricao: 'Monitor Profissional Dell 27 4K IPS', qtd: 3, unit: 916.6666 },
      ]
    ),
  },
  {
    id: 'sample-2',
    title: 'NF-e 1025 - Metalúrgica Nacional (4 Parcelas: 15/30/45/60d)',
    description: 'Fornecimento de perfis de alumínio para Construtora Horizonte S/A.',
    filename: 'NFe_1025_Metalurgica_4Parcelas.xml',
    parcelasCount: 4,
    valorTotal: 28400.00,
    xml: generateSampleXml(
      1025,
      'Metalúrgica Nacional de Aços & Perfis Ltda',
      '45.890.123/0001-44',
      'Construtora & Incorporadora Horizonte S/A',
      '11.222.333/0001-88',
      [
        { vencimentoDias: 15, valor: 7100.00 },
        { vencimentoDias: 30, valor: 7100.00 },
        { vencimentoDias: 45, valor: 7100.00 },
        { vencimentoDias: 60, valor: 7100.00 },
      ],
      [
        { descricao: 'Perfil Estrutural Tubular Alumínio Anodizado 6m', qtd: 80, unit: 250.00 },
        { descricao: 'Chapa de Aço Inox 304 2mm 1200x3000mm', qtd: 14, unit: 600.00 },
      ]
    ),
  },
  {
    id: 'sample-3',
    title: 'NF-e 1026 - Logística & Embalagens (2 Parcelas - Venda Pessoa Física)',
    description: 'Venda de caixas térmicas e paletes para produtor rural (CPF).',
    filename: 'NFe_1026_Embalagens_CPF_2Parcelas.xml',
    parcelasCount: 2,
    valorTotal: 4800.00,
    xml: generateSampleXml(
      1026,
      'Aurora Distribuidora de Eletrônicos S/A',
      '12.345.678/0001-95',
      'Carlos Eduardo Mendes Silveira',
      '312.456.789-00',
      [
        { vencimentoDias: 20, valor: 2400.00 },
        { vencimentoDias: 50, valor: 2400.00 },
      ],
      [
        { descricao: 'Caixa Térmica Industrial 120L Reforçada', qtd: 6, unit: 800.00 },
      ]
    ),
  },
  {
    id: 'sample-4',
    title: 'NF-e 1027 - Suprimentos Comerciais (1 Parcela - À Vista 10 dias)',
    description: 'Venda de suprimentos com parcela única de vencimento rápido.',
    filename: 'NFe_1027_Suprimentos_1Parcela.xml',
    parcelasCount: 1,
    valorTotal: 3450.00,
    xml: generateSampleXml(
      1027,
      'Aurora Distribuidora de Eletrônicos S/A',
      '12.345.678/0001-95',
      'Restaurante & Buffet Sabor Paulista Ltda',
      '55.444.333/0001-22',
      [
        { vencimentoDias: 10, valor: 3450.00 },
      ],
      [
        { descricao: 'Sistema de Impressão Térmica Não Fiscal USB/Ethernet', qtd: 5, unit: 690.00 },
      ]
    ),
  }
];
