export interface Empresa {
  id: number;
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  inscricao_estadual?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em?: string;
}

export interface Usuario {
  id: number;
  empresa_id: number;
  nome: string;
  email: string;
  senha_hash: string;
  perfil: 'ADMIN' | 'OPERADOR' | 'CONSULTOR' | 'FINANCEIRO';
  ativo: boolean;
  ultimo_acesso?: string;
  criado_em: string;
  atualizado_em?: string;
}

export interface Cliente {
  id: number;
  empresa_id: number;
  nome: string;
  cpf_cnpj: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em?: string;
}

export interface Fornecedor {
  id: number;
  empresa_id: number;
  nome: string;
  cpf_cnpj: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  categoria?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em?: string;
}

export interface CategoriaFinanceira {
  id: number;
  empresa_id?: number;
  tipo: 'RECEITA' | 'DESPESA';
  nome: string;
  padrao: boolean;
  criado_em?: string;
}

export interface NotaFiscal {
  id: number;
  empresa_id: number;
  cliente_id: number;
  chave_acesso: string;
  numero_nota: string;
  serie: string;
  data_emissao: string;
  valor_total: number;
  caminho_xml?: string;
  protocolo_autorizacao?: string;
  criado_em: string;
  natureza_operacao?: string;
  valor_produtos?: number;
  valor_desconto?: number;
  valor_frete?: number;
  conteudo_xml?: string;
  itens?: any[];
}

export interface NotaEntrada {
  id: number;
  empresa_id: number;
  fornecedor_id: number;
  fornecedor_nome?: string;
  fornecedor_cnpj?: string;
  chave_acesso: string;
  numero_nota: string;
  serie: string;
  data_emissao: string;
  data_entrada: string;
  valor_total: number;
  arquivo_xml?: string;
  protocolo_autorizacao?: string;
  criado_em: string;
}

export type StatusParcela = 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'PARCIAL' | 'CANCELADO';
export type OrigemLancamento = 'XML' | 'MANUAL';

export interface ParcelaReceber {
  id: number;
  nota_id?: number;
  empresa_id?: number;
  cliente_id?: number;
  cliente_nome?: string;
  numero_documento?: string;
  descricao?: string;
  origem: OrigemLancamento;
  numero_parcela: number;
  total_parcelas?: number;
  data_vencimento: string; // YYYY-MM-DD
  valor_parcela: number;
  valor_recebido: number;
  data_recebimento?: string; // YYYY-MM-DD
  status: StatusParcela;
  observacoes?: string;
  forma_pagamento?: string;
  categoria?: string;
  anexo_nome?: string;
  anexo_url?: string;
  criado_em: string;
  atualizado_em?: string;
}

export interface ContaPagar {
  id: number;
  empresa_id: number;
  fornecedor_id: number;
  fornecedor_nome: string;
  fornecedor_cnpj?: string;
  nota_entrada_id?: number;
  numero_documento: string;
  descricao?: string;
  centro_custo?: string;
  origem: OrigemLancamento;
  numero_parcela: number;
  total_parcelas: number;
  data_vencimento: string; // YYYY-MM-DD
  valor_parcela: number;
  valor_pago: number;
  data_pagamento?: string; // YYYY-MM-DD
  status: StatusParcela;
  observacoes?: string;
  forma_pagamento?: string;
  categoria?: string;
  anexo_nome?: string;
  anexo_url?: string;
  criado_em: string;
  atualizado_em?: string;
}

export interface LogSistema {
  id: number;
  usuario_id?: number;
  usuario_nome?: string;
  acao: string;
  descricao: string;
  ip?: string;
  data_hora: string;
}

export interface ConfiguracoesApp {
  notificar_vencimento_dias: number;
  multa_padrao_percentual: number;
  juros_dia_percentual: number;
  email_notificacoes: string;
  ambiente_emissao: 'PRODUCAO' | 'HOMOLOGACAO';
  auto_baixa_pix: boolean;
}

class DatabaseStore {
  public empresas: Empresa[] = [];
  public usuarios: Usuario[] = [];
  public clientes: Cliente[] = [];
  public fornecedores: Fornecedor[] = [];
  public notas_fiscais: NotaFiscal[] = [];
  public notas_entrada: NotaEntrada[] = [];
  public parcelas_receber: ParcelaReceber[] = [];
  public contas_pagar: ContaPagar[] = [];
  public categorias: CategoriaFinanceira[] = [];
  public logs_sistema: LogSistema[] = [];
  public configuracoes: ConfiguracoesApp = {
    notificar_vencimento_dias: 3,
    multa_padrao_percentual: 2.0,
    juros_dia_percentual: 0.033,
    email_notificacoes: 'financeiro@recebefacil.com.br',
    ambiente_emissao: 'PRODUCAO',
    auto_baixa_pix: true,
  };

  private nextEmpresaId = 1;
  private nextUsuarioId = 1;
  private nextClienteId = 1;
  private nextFornecedorId = 1;
  private nextNotaId = 1;
  private nextNotaEntradaId = 1;
  private nextParcelaId = 1;
  private nextContaPagarId = 1;
  private nextCategoriaId = 1;
  private nextLogId = 1;

  constructor() {
    this.seedInitialData();
  }

  public getNextEmpresaId() { return this.nextEmpresaId++; }
  public getNextUsuarioId() { return this.nextUsuarioId++; }
  public getNextClienteId() { return this.nextClienteId++; }
  public getNextFornecedorId() { return this.nextFornecedorId++; }
  public getNextNotaId() { return this.nextNotaId++; }
  public getNextNotaEntradaId() { return this.nextNotaEntradaId++; }
  public getNextParcelaId() { return this.nextParcelaId++; }
  public getNextContaPagarId() { return this.nextContaPagarId++; }
  public getNextCategoriaId() { return this.nextCategoriaId++; }

  // Atualiza automaticamente parcelas vencidas para status ATRASADO
  public autoUpdateOverdueStatus() {
    const today = new Date().toISOString().split('T')[0];
    for (const p of this.parcelas_receber) {
      if (p.status === 'PENDENTE' && p.data_vencimento < today) {
        p.status = 'ATRASADO';
      }
    }
    for (const cp of this.contas_pagar) {
      if (cp.status === 'PENDENTE' && cp.data_vencimento < today) {
        cp.status = 'ATRASADO';
      }
    }
  }

  public log(usuarioId: number | undefined, usuarioNome: string | undefined, acao: string, descricao: string, ip?: string) {
    const novoLog: LogSistema = {
      id: this.nextLogId++,
      usuario_id: usuarioId || 1,
      usuario_nome: usuarioNome || 'Evandro Guedes',
      acao,
      descricao,
      ip: ip || '127.0.0.1',
      data_hora: new Date().toISOString(),
    };
    this.logs_sistema.unshift(novoLog);
    if (this.logs_sistema.length > 500) {
      this.logs_sistema.pop();
    }
    return novoLog;
  }

  public zerarDados(opcoes?: {
    empresaId?: number;
    zerarMovimentacoes?: boolean;
    zerarCadastros?: boolean;
    zerarEmpresa?: boolean;
    novaEmpresa?: {
      razao_social?: string;
      cnpj?: string;
      nome_fantasia?: string;
      email?: string;
      telefone?: string;
      cidade?: string;
      estado?: string;
    };
  }) {
    const {
      empresaId,
      zerarMovimentacoes = true,
      zerarCadastros = true,
      zerarEmpresa = false,
      novaEmpresa,
    } = opcoes || {};

    if (empresaId) {
      if (zerarMovimentacoes) {
        this.parcelas_receber = this.parcelas_receber.filter((p) => p.empresa_id !== empresaId);
        this.contas_pagar = this.contas_pagar.filter((cp) => cp.empresa_id !== empresaId);
        this.notas_fiscais = this.notas_fiscais.filter((n) => n.empresa_id !== empresaId);
        this.notas_entrada = this.notas_entrada.filter((ne) => ne.empresa_id !== empresaId);
      }
      if (zerarCadastros) {
        this.clientes = this.clientes.filter((c) => c.empresa_id !== empresaId);
        this.fornecedores = this.fornecedores.filter((f) => f.empresa_id !== empresaId);
      }
      if (zerarEmpresa && novaEmpresa) {
        const emp = this.empresas.find((e) => e.id === empresaId);
        if (emp) {
          if (novaEmpresa.razao_social) emp.razao_social = novaEmpresa.razao_social;
          if (novaEmpresa.cnpj) emp.cnpj = novaEmpresa.cnpj;
          if (novaEmpresa.nome_fantasia !== undefined) emp.nome_fantasia = novaEmpresa.nome_fantasia;
          if (novaEmpresa.email !== undefined) emp.email = novaEmpresa.email;
          if (novaEmpresa.telefone !== undefined) emp.telefone = novaEmpresa.telefone;
          if (novaEmpresa.cidade !== undefined) emp.cidade = novaEmpresa.cidade;
          if (novaEmpresa.estado !== undefined) emp.estado = novaEmpresa.estado;
        }
      }
    } else {
      if (zerarMovimentacoes) {
        this.parcelas_receber = [];
        this.contas_pagar = [];
        this.notas_fiscais = [];
        this.notas_entrada = [];
      }
      if (zerarCadastros) {
        this.clientes = [];
        this.fornecedores = [];
      }
      if (zerarEmpresa && novaEmpresa) {
        if (this.empresas.length > 0) {
          const emp = this.empresas[0];
          if (novaEmpresa.razao_social) emp.razao_social = novaEmpresa.razao_social;
          if (novaEmpresa.cnpj) emp.cnpj = novaEmpresa.cnpj;
          if (novaEmpresa.nome_fantasia !== undefined) emp.nome_fantasia = novaEmpresa.nome_fantasia;
        }
      }
    }

    this.log(
      1,
      'Evandro Guedes',
      'ZERAR_DADOS',
      `Base de dados zerada com sucesso.`
    );
  }

  private seedInitialData() {
    const now = new Date().toISOString();

    // 1. Base 100% Zerada: Nenhuma empresa pré-cadastrada
    this.empresas = [];

    // 2. Usuário Administrador
    this.usuarios = [
      {
        id: this.getNextUsuarioId(),
        empresa_id: 0,
        nome: 'Evandro Guedes',
        email: 'evandro@recebefacil.com.br',
        senha_hash: '123456',
        perfil: 'ADMIN',
        ativo: true,
        ultimo_acesso: now,
        criado_em: now,
      },
    ];

    // 3. Categorias Financeiras Iniciais
    this.categorias = [
      // Receitas
      { id: this.getNextCategoriaId(), tipo: 'RECEITA', nome: 'Venda de Produtos / Mercadorias', padrao: true, criado_em: now },
      { id: this.getNextCategoriaId(), tipo: 'RECEITA', nome: 'Prestação de Serviços', padrao: true, criado_em: now },
      { id: this.getNextCategoriaId(), tipo: 'RECEITA', nome: 'Receitas Financeiras / Juros', padrao: true, criado_em: now },
      { id: this.getNextCategoriaId(), tipo: 'RECEITA', nome: 'Consultoria e Treinamentos', padrao: true, criado_em: now },
      { id: this.getNextCategoriaId(), tipo: 'RECEITA', nome: 'Outras Receitas Operacionais', padrao: true, criado_em: now },
      // Despesas
      { id: this.getNextCategoriaId(), tipo: 'DESPESA', nome: 'Fornecedores e Matéria-Prima', padrao: true, criado_em: now },
      { id: this.getNextCategoriaId(), tipo: 'DESPESA', nome: 'Salários e Encargos', padrao: true, criado_em: now },
      { id: this.getNextCategoriaId(), tipo: 'DESPESA', nome: 'Aluguel e Condomínio', padrao: true, criado_em: now },
      { id: this.getNextCategoriaId(), tipo: 'DESPESA', nome: 'Energia, Água e Telecom', padrao: true, criado_em: now },
      { id: this.getNextCategoriaId(), tipo: 'DESPESA', nome: 'Impostos e Tributos Fiscais', padrao: true, criado_em: now },
      { id: this.getNextCategoriaId(), tipo: 'DESPESA', nome: 'Marketing e Publicidade', padrao: true, criado_em: now },
      { id: this.getNextCategoriaId(), tipo: 'DESPESA', nome: 'Softwares e Infraestrutura TI', padrao: true, criado_em: now },
      { id: this.getNextCategoriaId(), tipo: 'DESPESA', nome: 'Despesas Bancárias e Tarifas', padrao: true, criado_em: now },
      { id: this.getNextCategoriaId(), tipo: 'DESPESA', nome: 'Outras Despesas Administrativas', padrao: true, criado_em: now },
    ];

    // BANCO RESETADO: Clientes, Fornecedores, Notas Fiscais e Títulos iniciam vazios
    this.clientes = [];
    this.fornecedores = [];
    this.notas_fiscais = [];
    this.notas_entrada = [];
    this.parcelas_receber = [];
    this.contas_pagar = [];

    this.logs_sistema = [
      {
        id: this.nextLogId++,
        usuario_id: 1,
        usuario_nome: 'Evandro Guedes',
        acao: 'SISTEMA_INICIALIZADO',
        descricao: 'Base financeira inicializada e pronta para novos cadastros e importações de NF-e.',
        ip: '127.0.0.1',
        data_hora: now,
      },
    ];
  }
}

export const db = new DatabaseStore();
