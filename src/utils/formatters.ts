export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(Number(value))) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(Number(value));
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(dateString).toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateTimeString: string | undefined | null): string {
  if (!dateTimeString) return '-';
  try {
    const date = new Date(dateTimeString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateTimeString;
  }
}

export function formatCpfCnpj(value: string | undefined | null): string {
  if (!value) return '-';
  const clean = value.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (clean.length === 14) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return value;
}

export function formatChaveAcesso(chave: string | undefined | null): string {
  if (!chave) return '-';
  const clean = chave.replace(/\D/g, '');
  return clean.replace(/(\d{4})/g, '$1 ').trim();
}

export function getStatusBadgeConfig(status: string) {
  switch (status?.toUpperCase()) {
    case 'PAGO':
    case 'TOTALMENTE_PAGO':
      return {
        label: 'Pago / Liquidado',
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        dot: 'bg-emerald-400',
      };
    case 'ATRASADO':
      return {
        label: 'Em Atraso',
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        dot: 'bg-rose-400 animate-pulse',
      };
    case 'PARCIAL':
      return {
        label: 'Baixa Parcial',
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        dot: 'bg-amber-400',
      };
    case 'CANCELADO':
      return {
        label: 'Cancelado',
        bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        dot: 'bg-slate-400',
      };
    case 'PENDENTE':
    default:
      return {
        label: 'A Vencer',
        bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        dot: 'bg-blue-400',
      };
  }
}
