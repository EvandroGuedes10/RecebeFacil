import { ParcelaReceber } from '../types';

export function exportParcelasToCsv(parcelas: ParcelaReceber[], filename = 'recebe_facil_titulos.csv') {
  const headers = [
    'ID Parcela',
    'NF-e Nº',
    'Série',
    'Chave de Acesso',
    'Cliente',
    'CPF/CNPJ',
    'Parcela Nº',
    'Data Vencimento',
    'Valor Original (R$)',
    'Valor Recebido (R$)',
    'Saldo Devedor (R$)',
    'Data Recebimento',
    'Status',
    'Observações',
  ];

  const rows = parcelas.map((p) => {
    const valorOriginal = Number(p.valor_original ?? p.valor_parcela ?? 0);
    const valorRecebido = Number(p.valor_recebido || 0);
    const saldo = Number(p.saldo ?? Math.max(0, valorOriginal - valorRecebido));

    return [
      p.id,
      p.numero_nota || '',
      p.serie_nota || p.serie || '1',
      p.chave_acesso || p.chave_nfe || '',
      `"${(p.cliente_nome || '').replace(/"/g, '""')}"`,
      p.cliente_cpf_cnpj || '',
      p.numero_parcela,
      p.vencimento || p.data_vencimento || '',
      valorOriginal.toFixed(2).replace('.', ','),
      valorRecebido.toFixed(2).replace('.', ','),
      saldo.toFixed(2).replace('.', ','),
      p.data_recebimento || '',
      p.status,
      `"${(p.observacao || p.observacoes || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
