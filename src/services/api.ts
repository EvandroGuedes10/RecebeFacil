import {
  Empresa,
  Usuario,
  Cliente,
  Fornecedor,
  NotaFiscal,
  NotaEntrada,
  ParcelaReceber,
  ContaPagar,
  LogSistema,
  DashboardStats,
  ConfiguracoesApp,
  SampleNFeXml,
  FluxoCaixaData,
} from '../types';

let currentUsuarioId = 1;
let currentUsuarioNome = 'Evandro Guedes';

export function setAuthSession(usuarioId: number, usuarioNome: string) {
  currentUsuarioId = usuarioId;
  currentUsuarioNome = usuarioNome;
}

export function clearAuthSession() {
  currentUsuarioId = 0;
  currentUsuarioNome = 'Visitante';
}

export function setApiUserContext(usuarioId: number, usuarioNome: string) {
  currentUsuarioId = usuarioId;
  currentUsuarioNome = usuarioNome;
}

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-usuario-id': String(currentUsuarioId || 1),
  'x-usuario-nome': encodeURIComponent(currentUsuarioNome || 'Usuário'),
});

export const api = {
  // Autenticação
  auth: {
    async login(
      email: string,
      senha: string
    ): Promise<{ sucesso: boolean; token?: string; usuario?: Usuario; mensagem?: string }> {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha ao autenticar.');
      return data;
    },

    async recuperarSenha(email: string): Promise<{ sucesso: boolean; mensagem: string }> {
      const res = await fetch('/api/auth/recuperar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Erro na recuperação de senha.');
      return data;
    },

    async logout(): Promise<void> {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: getHeaders(),
        });
      } catch {}
    },
  },

  // NF-e Saída
  nfe: {
    async importarXml(xmlOrParams: string | { xmlString: string; empresaId?: number }, empresaIdParam?: number): Promise<any> {
      const xml = typeof xmlOrParams === 'string' ? xmlOrParams : xmlOrParams.xmlString;
      const empresaId = typeof xmlOrParams === 'object' ? xmlOrParams.empresaId : empresaIdParam;

      const res = await fetch('/api/nfe/importar-xml', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ xml, empresaId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha ao importar XML.');
      return data;
    },

    async listarNotas(empresaId?: number): Promise<NotaFiscal[]> {
      const url = empresaId ? `/api/nfe/notas?empresaId=${empresaId}` : '/api/nfe/notas';
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao buscar notas fiscais.');
      return res.json();
    },

    async obterNota(id: number): Promise<NotaFiscal> {
      const res = await fetch(`/api/nfe/${id}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao obter dados da nota fiscal.');
      return res.json();
    },

    async obterExemplos(): Promise<SampleNFeXml[]> {
      const res = await fetch('/api/nfe/exemplos', { headers: getHeaders() });
      if (!res.ok) return [];
      const raw = await res.json();
      return raw.map((r: any) => ({
        id: r.id || String(Math.random()),
        nome: r.nome || r.titulo || 'Exemplo',
        titulo: r.titulo || r.nome || 'Exemplo NF-e',
        descricao: r.descricao || 'Modelo para testes',
        parcelas: r.parcelas || 1,
        valorTotal: r.valorTotal || r.valor_total || 0,
        xml: r.xml || r.xmlContent || '',
        xmlContent: r.xmlContent || r.xml || '',
      }));
    },

    async listarExemplos(): Promise<SampleNFeXml[]> {
      return api.nfe.obterExemplos();
    },
  },

  // NF-e Entrada / Compras
  nfeEntrada: {
    async importarXml(xml: string, empresaId?: number): Promise<any> {
      const res = await fetch('/api/nfe-entrada/importar-xml', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ xml, empresaId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha ao importar XML de entrada.');
      return data;
    },

    async importarMultiplos(xmls: string[], empresaId?: number): Promise<any> {
      const res = await fetch('/api/nfe-entrada/importar-multiplos', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ xmls, empresaId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha no lote de XMLs de entrada.');
      return data;
    },

    async listarNotas(empresaId?: number): Promise<NotaEntrada[]> {
      const url = empresaId ? `/api/nfe-entrada/notas?empresaId=${empresaId}` : '/api/nfe-entrada/notas';
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao listar notas de entrada.');
      return res.json();
    },
  },

  // Contas a Receber
  parcelas: {
    async listar(filtros?: {
      empresaId?: number;
      status?: string;
      categoria?: string;
      origem?: string;
      clienteId?: number;
      dataInicio?: string;
      dataFim?: string;
      busca?: string;
    }): Promise<ParcelaReceber[]> {
      const params = new URLSearchParams();
      if (filtros?.empresaId) params.append('empresaId', String(filtros.empresaId));
      if (filtros?.status) params.append('status', filtros.status);
      if (filtros?.categoria) params.append('categoria', filtros.categoria);
      if (filtros?.origem) params.append('origem', filtros.origem);
      if (filtros?.clienteId) params.append('clienteId', String(filtros.clienteId));
      if (filtros?.dataInicio) params.append('dataInicio', filtros.dataInicio);
      if (filtros?.dataFim) params.append('dataFim', filtros.dataFim);
      if (filtros?.busca) params.append('busca', filtros.busca);

      const url = `/api/parcelas?${params.toString()}`;
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao listar parcelas.');
      return res.json();
    },

    async criarManual(dados: {
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
    }): Promise<ParcelaReceber[]> {
      const res = await fetch('/api/parcelas/manual', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(dados),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Erro ao criar lançamento a receber.');
      return data.parcelas || data;
    },

    async baixar(
      id: number,
      dados: {
        valorRecebido: number;
        dataRecebimento: string;
        formaPagamento?: string;
        observacao?: string;
        observacoes?: string;
      }
    ): Promise<ParcelaReceber> {
      const res = await fetch(`/api/parcelas/${id}/baixar`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          valorRecebido: dados.valorRecebido,
          dataRecebimento: dados.dataRecebimento,
          formaPagamento: dados.formaPagamento,
          observacoes: dados.observacao || dados.observacoes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha ao processar baixa.');
      return data.parcela || data;
    },

    async atualizar(
      id: number,
      dados: {
        vencimento?: string;
        dataVencimento?: string;
        valorOriginal?: number;
        valorParcela?: number;
        categoria?: string;
        observacao?: string;
        observacoes?: string;
        status?: string;
      }
    ): Promise<ParcelaReceber> {
      const res = await fetch(`/api/parcelas/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          dataVencimento: dados.vencimento || dados.dataVencimento,
          valorParcela: dados.valorOriginal || dados.valorParcela,
          categoria: dados.categoria,
          observacoes: dados.observacao || dados.observacoes,
          status: dados.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha ao atualizar parcela.');
      return data.parcela || data;
    },

    async estornar(id: number): Promise<ParcelaReceber> {
      const res = await fetch(`/api/parcelas/${id}/estornar`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha ao estornar baixa.');
      return data.parcela || data;
    },
  },

  // Contas a Pagar
  contasPagar: {
    async listar(filtros?: {
      empresaId?: number;
      fornecedorId?: number;
      status?: string;
      categoria?: string;
      origem?: string;
      dataInicio?: string;
      dataFim?: string;
      busca?: string;
    }): Promise<ContaPagar[]> {
      const params = new URLSearchParams();
      if (filtros?.empresaId) params.append('empresaId', String(filtros.empresaId));
      if (filtros?.status) params.append('status', filtros.status);
      if (filtros?.categoria) params.append('categoria', filtros.categoria);
      if (filtros?.origem) params.append('origem', filtros.origem);
      if (filtros?.fornecedorId) params.append('fornecedorId', String(filtros.fornecedorId));
      if (filtros?.dataInicio) params.append('dataInicio', filtros.dataInicio);
      if (filtros?.dataFim) params.append('dataFim', filtros.dataFim);
      if (filtros?.busca) params.append('busca', filtros.busca);

      const url = `/api/contas-pagar?${params.toString()}`;
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao listar contas a pagar.');
      return res.json();
    },

    async obter(id: number): Promise<ContaPagar> {
      const res = await fetch(`/api/contas-pagar/${id}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao buscar conta a pagar.');
      return res.json();
    },

    async criarManual(dados: {
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
    }): Promise<ContaPagar[]> {
      const res = await fetch('/api/contas-pagar/manual', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(dados),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Erro ao criar lançamento a pagar.');
      return data.contas || data;
    },

    async baixar(
      id: number,
      dados: {
        valorPago: number;
        dataPagamento: string;
        formaPagamento?: string;
        observacao?: string;
        observacoes?: string;
      }
    ): Promise<ContaPagar> {
      const res = await fetch(`/api/contas-pagar/${id}/baixar`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          valorPago: dados.valorPago,
          dataPagamento: dados.dataPagamento,
          formaPagamento: dados.formaPagamento,
          observacoes: dados.observacao || dados.observacoes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha ao baixar pagamento.');
      return data.conta || data;
    },

    async estornar(id: number): Promise<ContaPagar> {
      const res = await fetch(`/api/contas-pagar/${id}/estornar`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha ao estornar pagamento.');
      return data.conta || data;
    },

    async atualizar(
      id: number,
      dados: {
        dataVencimento?: string;
        valorParcela?: number;
        categoria?: string;
        observacao?: string;
        observacoes?: string;
      }
    ): Promise<ContaPagar> {
      const res = await fetch(`/api/contas-pagar/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          dataVencimento: dados.dataVencimento,
          valorParcela: dados.valorParcela,
          categoria: dados.categoria,
          observacoes: dados.observacao || dados.observacoes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha ao atualizar conta.');
      return data.conta || data;
    },

    async excluir(id: number): Promise<{ sucesso: boolean; mensagem?: string }> {
      const res = await fetch(`/api/contas-pagar/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha ao excluir conta.');
      return data;
    },
  },

  // Fornecedores
  fornecedores: {
    async listar(empresaId?: number): Promise<Fornecedor[]> {
      const url = empresaId ? `/api/fornecedores?empresaId=${empresaId}` : '/api/fornecedores';
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao listar fornecedores.');
      return res.json();
    },

    async criar(dados: Partial<Fornecedor> & { empresaId?: number; empresa_id?: number; nome: string; cpf_cnpj?: string; cpfCnpj?: string }): Promise<Fornecedor> {
      const res = await fetch('/api/fornecedores', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          empresaId: dados.empresaId || dados.empresa_id || 1,
          nome: dados.nome,
          cpfCnpj: dados.cpf_cnpj || dados.cpfCnpj,
          email: dados.email,
          telefone: dados.telefone,
          endereco: dados.endereco || dados.logradouro,
          cidade: dados.cidade,
          estado: dados.estado,
          cep: dados.cep,
          categoria: dados.categoria,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha ao cadastrar fornecedor.');
      return data.fornecedor || data;
    },

    async atualizar(id: number, dados: Partial<Fornecedor>): Promise<Fornecedor> {
      const res = await fetch(`/api/fornecedores/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(dados),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha ao atualizar fornecedor.');
      return data.fornecedor || data;
    },

    async excluir(id: number): Promise<{ sucesso: boolean; mensagem?: string }> {
      const res = await fetch(`/api/fornecedores/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha ao desativar fornecedor.');
      return data;
    },
  },

  // Clientes
  clientes: {
    async listar(empresaId?: number): Promise<Cliente[]> {
      const url = empresaId ? `/api/clientes?empresaId=${empresaId}` : '/api/clientes';
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao buscar clientes.');
      return res.json();
    },

    async criar(dados: Partial<Cliente> & { empresa_id?: number; empresaId?: number; nome: string; cpf_cnpj?: string; cpfCnpj?: string }): Promise<Cliente> {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          empresaId: dados.empresa_id || dados.empresaId,
          nome: dados.nome,
          cpfCnpj: dados.cpf_cnpj || dados.cpfCnpj,
          email: dados.email,
          telefone: dados.telefone,
          endereco: dados.endereco || dados.logradouro,
          cidade: dados.cidade,
          estado: dados.estado,
          cep: dados.cep,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha ao cadastrar cliente.');
      return data.cliente || data;
    },

    async atualizar(
      id: number,
      dados: Partial<Cliente> & { cpfCnpj?: string; empresaId?: number }
    ): Promise<Cliente> {
      const res = await fetch(`/api/clientes/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(dados),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha ao atualizar cliente.');
      return data.cliente || data;
    },

    async excluir(id: number): Promise<{ sucesso: boolean; mensagem?: string }> {
      const res = await fetch(`/api/clientes/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha ao desativar cliente.');
      return data;
    },
  },

  // Empresas
  empresas: {
    async listar(): Promise<Empresa[]> {
      const res = await fetch('/api/empresas', { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao buscar empresas.');
      return res.json();
    },

    async criar(dados: Partial<Empresa> & { razao_social?: string; razaoSocial?: string; cnpj: string }): Promise<Empresa> {
      const res = await fetch('/api/empresas', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          razaoSocial: dados.razao_social || dados.razaoSocial,
          nomeFantasia: dados.nome_fantasia,
          cnpj: dados.cnpj,
          inscricaoEstadual: dados.inscricao_estadual,
          email: dados.email,
          telefone: dados.telefone,
          endereco: dados.endereco || dados.logradouro,
          cidade: dados.cidade,
          estado: dados.estado,
          cep: dados.cep,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha ao criar empresa.');
      return data.empresa || data;
    },

    async atualizar(
      id: number,
      dados: Partial<Empresa>
    ): Promise<Empresa> {
      const res = await fetch(`/api/empresas/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(dados),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha ao atualizar empresa.');
      return data.empresa || data;
    },

    async excluir(id: number): Promise<{ sucesso: boolean; mensagem?: string }> {
      const res = await fetch(`/api/empresas/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha ao desativar empresa.');
      return data;
    },
  },

  // Fluxo de Caixa
  fluxoCaixa: {
    async obter(visao: 'diario' | 'semanal' | 'mensal' = 'mensal', empresaId?: number): Promise<FluxoCaixaData> {
      const url = `/api/fluxo-caixa?visao=${visao}${empresaId ? `&empresaId=${empresaId}` : ''}`;
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao obter fluxo de caixa.');
      return res.json();
    },
  },

  // Relatórios / Dashboard
  relatorios: {
    async obterDashboard(empresaId?: number): Promise<DashboardStats> {
      const url = empresaId ? `/api/relatorios/dashboard?empresaId=${empresaId}` : '/api/relatorios/dashboard';
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao obter dados do dashboard.');
      return res.json();
    },

    async obterInadimplencia(empresaId?: number): Promise<any> {
      const url = empresaId ? `/api/relatorios/inadimplencia?empresaId=${empresaId}` : '/api/relatorios/inadimplencia';
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao obter relatório de inadimplência.');
      return res.json();
    },

    async obterReceitasPorCategoria(empresaId?: number, dataInicio?: string, dataFim?: string): Promise<{ totalGeral: number; categorias: any[] }> {
      const params = new URLSearchParams();
      if (empresaId) params.append('empresaId', String(empresaId));
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);
      const res = await fetch(`/api/relatorios/receitas-categoria?${params.toString()}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao obter receitas por categoria.');
      return res.json();
    },

    async obterDespesasPorCategoria(empresaId?: number, dataInicio?: string, dataFim?: string): Promise<{ totalGeral: number; categorias: any[] }> {
      const params = new URLSearchParams();
      if (empresaId) params.append('empresaId', String(empresaId));
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);
      const res = await fetch(`/api/relatorios/despesas-categoria?${params.toString()}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao obter despesas por categoria.');
      return res.json();
    },
  },

  // Categorias Financeiras
  categorias: {
    async listar(tipo?: 'RECEITA' | 'DESPESA'): Promise<any[]> {
      const url = tipo ? `/api/categorias?tipo=${tipo}` : '/api/categorias';
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao listar categorias financeiras.');
      return res.json();
    },

    async criar(tipo: 'RECEITA' | 'DESPESA', nome: string): Promise<any> {
      const res = await fetch('/api/categorias', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ tipo, nome }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Erro ao criar categoria.');
      return data;
    },
  },

  // Auditoria
  auditoria: {
    async listar(limite = 100): Promise<LogSistema[]> {
      const res = await fetch(`/api/logs?limite=${limite}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao buscar logs de auditoria.');
      return res.json();
    },
  },

  // Configurações
  configuracoes: {
    async obter(): Promise<ConfiguracoesApp> {
      const res = await fetch('/api/configuracoes', { headers: getHeaders() });
      if (!res.ok) throw new Error('Erro ao carregar configurações.');
      return res.json();
    },

    async salvar(config: Partial<ConfiguracoesApp>): Promise<{ sucesso: boolean; mensagem?: string }> {
      const res = await fetch('/api/configuracoes', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha ao salvar configurações.');
      return data;
    },
  },

  // Sistema / Reset
  sistema: {
    async zerarDados(params: {
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
    }): Promise<{ sucesso: boolean; mensagem: string; empresa?: Empresa }> {
      const res = await fetch('/api/sistema/zerar-dados', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || data.mensagem || 'Falha ao zerar dados.');
      return data;
    },
  },
};
