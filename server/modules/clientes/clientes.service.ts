import { db, Cliente } from '../../config/database.js';

export interface ClienteDTO {
  empresaId: number;
  nome: string;
  cpfCnpj: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

export class ClientesService {
  public listar(empresaId?: number, busca?: string, incluirInativos = false) {
    db.autoUpdateOverdueStatus();

    let clientes = db.clientes;
    if (!incluirInativos) {
      clientes = clientes.filter(c => c.ativo !== false);
    }

    let resultado = clientes.map(c => {
      const notas = db.notas_fiscais.filter(n => n.cliente_id === c.id);
      const notasIds = notas.map(n => n.id);
      const parcelas = db.parcelas_receber.filter(p => p.nota_id !== undefined && notasIds.includes(p.nota_id));

      const totalFaturado = notas.reduce((acc, n) => acc + n.valor_total, 0);
      const totalRecebido = parcelas.reduce((acc, p) => acc + (p.valor_recebido || 0), 0);
      const totalPendente = parcelas
        .filter(p => p.status === 'PENDENTE' || p.status === 'PARCIAL')
        .reduce((acc, p) => acc + (p.valor_parcela - (p.valor_recebido || 0)), 0);
      const totalAtrasado = parcelas
        .filter(p => p.status === 'ATRASADO')
        .reduce((acc, p) => acc + (p.valor_parcela - (p.valor_recebido || 0)), 0);

      const empresa = db.empresas.find(e => e.id === c.empresa_id);

      return {
        ...c,
        empresa_nome: empresa?.razao_social || '',
        total_notas: notas.length,
        total_faturado: totalFaturado,
        total_recebido: totalRecebido,
        total_pendente: totalPendente,
        total_atrasado: totalAtrasado,
        saldo_devedor_total: totalPendente + totalAtrasado,
      };
    });

    if (empresaId) {
      resultado = resultado.filter(c => c.empresa_id === empresaId);
    }

    if (busca) {
      const b = busca.toLowerCase();
      resultado = resultado.filter(
        c =>
          c.nome.toLowerCase().includes(b) ||
          c.cpf_cnpj.toLowerCase().includes(b) ||
          (c.email && c.email.toLowerCase().includes(b)) ||
          (c.cidade && c.cidade.toLowerCase().includes(b))
      );
    }

    return resultado;
  }

  public buscarPorId(id: number) {
    const c = db.clientes.find(item => item.id === id);
    if (!c) throw new Error(`Cliente #${id} não encontrado.`);

    const notas = db.notas_fiscais.filter(n => n.cliente_id === c.id);
    const notasIds = notas.map(n => n.id);
    const parcelas = db.parcelas_receber
      .filter(p => p.nota_id !== undefined && notasIds.includes(p.nota_id))
      .map(p => {
        const nf = notas.find(n => n.id === p.nota_id);
        return {
          ...p,
          nota_numero: nf?.numero_nota,
          nota_chave: nf?.chave_acesso,
        };
      });

    return {
      ...c,
      notas,
      parcelas,
    };
  }

  public criar(dto: ClienteDTO, usuarioId?: number, usuarioNome?: string) {
    const docClean = dto.cpfCnpj.replace(/\D/g, '');
    const existente = db.clientes.find(
      c => c.empresa_id === dto.empresaId && c.cpf_cnpj.replace(/\D/g, '') === docClean && c.ativo !== false
    );

    if (existente) {
      throw new Error(`Já existe um cliente ativo cadastrado com o CPF/CNPJ ${dto.cpfCnpj} para esta empresa.`);
    }

    const novo: Cliente = {
      id: db.getNextClienteId(),
      empresa_id: dto.empresaId,
      nome: dto.nome.trim(),
      cpf_cnpj: dto.cpfCnpj.trim(),
      email: dto.email?.trim(),
      telefone: dto.telefone?.trim(),
      endereco: dto.endereco?.trim(),
      cidade: dto.cidade?.trim(),
      estado: dto.estado?.trim().toUpperCase(),
      cep: dto.cep?.trim(),
      ativo: true,
      criado_em: new Date().toISOString(),
    };

    db.clientes.push(novo);
    db.log(usuarioId, usuarioNome, 'CLIENTE_CRIADO', `Cliente ${novo.nome} (${novo.cpf_cnpj}) cadastrado com sucesso.`);

    return novo;
  }

  public atualizar(id: number, dto: Partial<ClienteDTO>, usuarioId?: number, usuarioNome?: string) {
    const c = db.clientes.find(item => item.id === id);
    if (!c) throw new Error(`Cliente #${id} não encontrado.`);

    if (dto.nome) c.nome = dto.nome.trim();
    if (dto.cpfCnpj) c.cpf_cnpj = dto.cpfCnpj.trim();
    if (dto.email !== undefined) c.email = dto.email;
    if (dto.telefone !== undefined) c.telefone = dto.telefone;
    if (dto.endereco !== undefined) c.endereco = dto.endereco;
    if (dto.cidade !== undefined) c.cidade = dto.cidade;
    if (dto.estado !== undefined) c.estado = dto.estado;
    if (dto.cep !== undefined) c.cep = dto.cep;
    c.atualizado_em = new Date().toISOString();

    db.log(usuarioId, usuarioNome, 'CLIENTE_EDITADO', `Cadastro do cliente ${c.nome} (#${c.id}) atualizado.`);
    return c;
  }

  public excluirLogica(id: number, usuarioId?: number, usuarioNome?: string) {
    const c = db.clientes.find(item => item.id === id);
    if (!c) throw new Error(`Cliente #${id} não encontrado.`);

    c.ativo = false;
    c.atualizado_em = new Date().toISOString();

    db.log(usuarioId, usuarioNome, 'CLIENTE_EXCLUIDO', `Exclusão lógica do cliente ${c.nome} (#${c.id}).`);
    return { sucesso: true, mensagem: `Cliente ${c.nome} desativado com sucesso.` };
  }
}

export const clientesService = new ClientesService();
