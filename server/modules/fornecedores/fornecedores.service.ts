import { db, Fornecedor } from '../../config/database.js';

export class FornecedoresService {
  public listar(empresaId?: number): Fornecedor[] {
    let list = db.fornecedores.filter((f) => f.ativo);
    if (empresaId) {
      list = list.filter((f) => f.empresa_id === empresaId);
    }
    return list;
  }

  public buscarPorId(id: number): Fornecedor | undefined {
    return db.fornecedores.find((f) => f.id === id && f.ativo);
  }

  public buscarPorCnpj(cnpj: string, empresaId?: number): Fornecedor | undefined {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    return db.fornecedores.find(
      (f) =>
        f.ativo &&
        f.cpf_cnpj.replace(/\D/g, '') === cleanCnpj &&
        (!empresaId || f.empresa_id === empresaId)
    );
  }

  public criar(
    dados: {
      empresa_id?: number;
      empresaId?: number;
      nome: string;
      cpf_cnpj?: string;
      cpfCnpj?: string;
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
    },
    usuarioId?: number,
    usuarioNome?: string
  ): Fornecedor {
    const now = new Date().toISOString();
    const novoFornecedor: Fornecedor = {
      id: db.getNextFornecedorId(),
      empresa_id: dados.empresa_id || dados.empresaId || 1,
      nome: dados.nome,
      cpf_cnpj: dados.cpf_cnpj || dados.cpfCnpj || '',
      email: dados.email,
      telefone: dados.telefone,
      endereco: dados.endereco || dados.logradouro,
      cidade: dados.cidade,
      estado: dados.estado || 'SP',
      cep: dados.cep,
      categoria: dados.categoria,
      ativo: true,
      criado_em: now,
      atualizado_em: now,
    };

    db.fornecedores.unshift(novoFornecedor);
    db.log(
      usuarioId,
      usuarioNome,
      'FORNECEDOR_CRIADO',
      `Fornecedor "${novoFornecedor.nome}" (CNPJ: ${novoFornecedor.cpf_cnpj}) cadastrado.`
    );

    return novoFornecedor;
  }

  public atualizar(
    id: number,
    dados: Partial<Fornecedor>,
    usuarioId?: number,
    usuarioNome?: string
  ): Fornecedor {
    const fornecedor = db.fornecedores.find((f) => f.id === id && f.ativo);
    if (!fornecedor) {
      throw new Error('Fornecedor não encontrado ou inativo.');
    }

    Object.assign(fornecedor, {
      ...dados,
      atualizado_em: new Date().toISOString(),
    });

    db.log(
      usuarioId,
      usuarioNome,
      'FORNECEDOR_EDITADO',
      `Fornecedor "${fornecedor.nome}" atualizado.`
    );

    return fornecedor;
  }

  public excluir(id: number, usuarioId?: number, usuarioNome?: string): boolean {
    const fornecedor = db.fornecedores.find((f) => f.id === id);
    if (!fornecedor) {
      throw new Error('Fornecedor não encontrado.');
    }

    fornecedor.ativo = false;
    fornecedor.atualizado_em = new Date().toISOString();

    db.log(
      usuarioId,
      usuarioNome,
      'FORNECEDOR_EXCLUIDO',
      `Fornecedor "${fornecedor.nome}" inativado no sistema.`
    );

    return true;
  }
}

export const fornecedoresService = new FornecedoresService();
