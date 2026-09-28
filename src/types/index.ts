export interface Empresa {
  id: number;
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  inscricao_estadual?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
  criado_em?: string;
  atualizado_em?: string;
}

export interface Usuario {
  id: number;
  empresa_id: number;
  nome: string;
  email: string;
  perfil: string;
  ativo?: boolean;
  ultimo_acesso?: string;
  created_at?: string;
  updated_at?: string;
  criado_em?: string;
}

export interface Cliente {
  id: number;
  empresa_id: number;
  nome: string;
  cpf_cnpj: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
  criado_em?: string;
}

export interface Fornecedor {
  id: number;
  empresa_id: number;
  nome: string;
  cpf_cnpj: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  categoria?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
  criado_em?: string;
}

export interface NotaFiscal {
  id: number;
  empresa_id: number;
  cliente_id: number;
  cliente_nome?: string;
  cliente_cpf_cnpj?: string;
  destinatario_nome?: string;
  destinatario_cnpj?: string;
  chave_acesso: string;
  numero: string;
  numero_nota?: string;
  serie: string;
  data_emissao: string;
  valor_total: number;
  protocolo?: string;
  protocolo_autorizacao?: string;
  arquivo_xml?: string;
  caminho_xml?: string;
  created_at?: string;
  updated_at?: string;
  criado_em?: string;
  parcelas?: ParcelaReceber[];
}

export interface NotaEntrada {
  id: number;
  empresa_id: number;
  fornecedor_id: number;
  fornecedor_nome?: string;
  fornecedor_cnpj?: string;
  chave_acesso: string;
  numero: string;
  numero_nota?: string;
  serie: string;
  data_emissao: string;
  data_entrada: string;
  valor_total: number;
  protocolo_autorizacao?: string;
  arquivo_xml?: string;
  created_at?: string;
}

export interface CategoriaFinanceira {
  id: number;
  empresa_id?: number;
  tipo: 'RECEITA' | 'DESPESA' | string;
  nome: string;
  padrao?: boolean;
  criado_em?: string;
}

export interface ParcelaReceber {
  id: number;
  nota_id?: number;
  empresa_id?: number;
  numero_nota?: string;
  serie_nota?: string;
  serie?: string;
  chave_acesso?: string;
  chave_nfe?: string;
  cliente_id?: number;
  cliente_nome?: string;
  cliente_cpf_cnpj?: string;
  numero_documento?: string;
  descricao?: string;
  origem?: 'XML' | 'MANUAL' | string;
  numero_parcela: number;
  total_parcelas?: number;
  vencimento: string;
  data_vencimento?: string;
  valor_original: number;
  valor_parcela?: number;
  valor_recebido: number;
  saldo?: number;
  saldo_devedor?: number;
  data_recebimento?: string;
  status: 'pendente' | 'vencido' | 'pago' | 'parcial' | 'cancelado' | string;
  observacao?: string;
  observacoes?: string;
  forma_pagamento?: string;
  categoria?: string;
  anexo_nome?: string;
  anexo_url?: string;
  created_at?: string;
  updated_at?: string;
  criado_em?: string;
}

export interface ContaPagar {
  id: number;
  empresa_id: number;
  fornecedor_id: number;
  fornecedor_nome: string;
  fornecedor_cnpj?: string;
  nota_entrada_id?: number;
  numero_documento: string;
  documento?: string;
  descricao?: string;
  centro_custo?: string;
  origem?: 'XML' | 'MANUAL' | string;
  numero_parcela: number;
  total_parcelas: number;
  vencimento: string;
  data_vencimento?: string;
  valor_original: number;
  valor_parcela?: number;
  valor_pago: number;
  saldo?: number;
  data_pagamento?: string;
  status: 'pendente' | 'vencido' | 'pago' | 'parcial' | 'cancelado' | string;
  forma_pagamento?: string;
  categoria?: string;
  observacao?: string;
  observacoes?: string;
  anexo_nome?: string;
  anexo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LogSistema {
  id: number;
  usuario_id?: number;
  usuario_nome?: string;
  acao: string;
  descricao: string;
  ip?: string;
  created_at?: string;
  data_hora?: string;
}

export interface RecebimentoMes {
  mes: string;
  recebido?: number;
  pendente?: number;
  total?: number;
  previsto?: number;
  realizado?: number;
}

export interface DashboardStats {
  total_a_receber?: number;
  totalAReceber?: number;
  total_recebido?: number;
  totalRecebido?: number;
  total_vencido?: number;
  totalVencido?: number;
  total_vencendo_hoje?: number;
  totalVencendoHoje?: number;
  vencendoHoje?: number;
  quantidade_a_receber?: number;
  quantidadeAReceber?: number;
  quantidade_recebidas?: number;
  quantidadeRecebidas?: number;
  quantidade_vencidas?: number;
  quantidadeVencidas?: number;
  quantidade_vencendo_hoje?: number;
  quantidadeVencendoHoje?: number;
  recebimentos_por_mes?: RecebimentoMes[];
  recebimentosPorMes?: RecebimentoMes[];
  proximos_vencimentos?: ParcelaReceber[];
  proximosVencimentos?: ParcelaReceber[];
}

export interface FluxoCaixaItem {
  periodo: string;
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

export interface FluxoCaixaData {
  resumo: {
    totalEntradasPrevistas: number;
    totalEntradasRealizadas: number;
    totalSaidasPrevistas: number;
    totalSaidasRealizadas: number;
    saldoAtualRealizado: number;
    saldoProjetadoFinal: number;
  };
  tipoVisao: 'diario' | 'semanal' | 'mensal';
  periodos: FluxoCaixaItem[];
}

export interface ConfiguracoesApp {
  diasAvisoVencimento?: number;
  diasToleranciaVencimento?: number;
  notificarAtraso?: boolean;
  notificarVencimentoEmail?: boolean;
  jurosMoraMensal?: number;
  percentualJurosMes?: number;
  multaAtraso?: number;
  percentualMultaPadrao?: number;
  modoAuditoriaEstrito?: boolean;
  bloquearCadastroDuplicado?: boolean;
  exigirProtocoloNfe?: boolean;
}

export interface SampleNFeXml {
  id: string;
  nome: string;
  titulo?: string;
  descricao: string;
  parcelas?: number;
  valorTotal?: number;
  xml: string;
  xmlContent?: string;
}
