import { db, Empresa } from '../../config/database.js';

export class EmpresasService {
  public listar(incluirInativas = false) {
    let empresas = db.empresas;
    if (!incluirInativas) {
      empresas = empresas.filter(e => e.ativo !== false);
    }

    return empresas.map(e => {
      const totalNotas = db.notas_fiscais.filter(n => n.empresa_id === e.id).length;
      const totalClientes = db.clientes.filter(c => c.empresa_id === e.id && c.ativo !== false).length;
      return {
        ...e,
        total_notas: totalNotas,
        total_clientes: totalClientes,
      };
    });
  }

  public buscarPorId(id: number) {
    const e = db.empresas.find(item => item.id === id);
    if (!e) throw new Error(`Empresa #${id} não encontrada.`);
    return e;
  }

  public criar(dados: Partial<Empresa>, usuarioId?: number, usuarioNome?: string) {
    if (!dados.razao_social || !dados.cnpj) {
      throw new Error('Razão Social e CNPJ são obrigatórios.');
    }

    const cnpjClean = dados.cnpj.replace(/\D/g, '');
    const existe = db.empresas.find(e => e.cnpj.replace(/\D/g, '') === cnpjClean && e.ativo !== false);
    if (existe) {
      throw new Error(`Já existe uma empresa ativa cadastrada com o CNPJ ${dados.cnpj}.`);
    }

    const now = new Date().toISOString();
    const nova: Empresa = {
      id: db.getNextEmpresaId(),
      razao_social: dados.razao_social.trim(),
      nome_fantasia: dados.nome_fantasia?.trim() || dados.razao_social.trim(),
      cnpj: dados.cnpj.trim(),
      inscricao_estadual: dados.inscricao_estadual?.trim(),
      email: dados.email?.trim(),
      telefone: dados.telefone?.trim(),
      endereco: dados.endereco?.trim(),
      cidade: dados.cidade?.trim(),
      estado: dados.estado?.trim().toUpperCase(),
      cep: dados.cep?.trim(),
      ativo: true,
      criado_em: now,
      atualizado_em: now,
    };

    db.empresas.push(nova);
    db.log(usuarioId, usuarioNome, 'EMPRESA_CRIADA', `Empresa ${nova.razao_social} cadastrada com sucesso.`);

    return nova;
  }

  public atualizar(id: number, dados: Partial<Empresa>, usuarioId?: number, usuarioNome?: string) {
    const e = db.empresas.find(item => item.id === id);
    if (!e) throw new Error(`Empresa #${id} não encontrada.`);

    if (dados.razao_social) e.razao_social = dados.razao_social.trim();
    if (dados.nome_fantasia !== undefined) e.nome_fantasia = dados.nome_fantasia?.trim();
    if (dados.cnpj) e.cnpj = dados.cnpj.trim();
    if (dados.inscricao_estadual !== undefined) e.inscricao_estadual = dados.inscricao_estadual?.trim();
    if (dados.email !== undefined) e.email = dados.email?.trim();
    if (dados.telefone !== undefined) e.telefone = dados.telefone?.trim();
    if (dados.endereco !== undefined) e.endereco = dados.endereco?.trim();
    if (dados.cidade !== undefined) e.cidade = dados.cidade?.trim();
    if (dados.estado !== undefined) e.estado = dados.estado?.trim().toUpperCase();
    if (dados.cep !== undefined) e.cep = dados.cep?.trim();
    if (dados.ativo !== undefined) e.ativo = dados.ativo;
    e.atualizado_em = new Date().toISOString();

    db.log(usuarioId, usuarioNome, 'EMPRESA_EDITADA', `Dados da empresa ${e.razao_social} (#${e.id}) atualizados.`);
    return e;
  }

  public excluirLogica(id: number, usuarioId?: number, usuarioNome?: string) {
    const e = db.empresas.find(item => item.id === id);
    if (!e) throw new Error(`Empresa #${id} não encontrada.`);

    e.ativo = false;
    e.atualizado_em = new Date().toISOString();

    db.log(usuarioId, usuarioNome, 'EMPRESA_EXCLUIDA', `Exclusão lógica da empresa ${e.razao_social} (#${e.id}).`);
    return { sucesso: true, mensagem: `Empresa ${e.razao_social} desativada com sucesso.` };
  }
}

export const empresasService = new EmpresasService();
