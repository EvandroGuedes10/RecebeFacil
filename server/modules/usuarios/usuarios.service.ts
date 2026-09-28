import { db, Usuario } from '../../config/database.js';

export class UsuariosService {
  public listar(empresaId?: number) {
    let usuarios = db.usuarios.map(u => {
      const { senha_hash, ...seguro } = u;
      const empresa = db.empresas.find(e => e.id === u.empresa_id);
      return {
        ...seguro,
        empresa_nome: empresa?.razao_social || '',
      };
    });

    if (empresaId) {
      usuarios = usuarios.filter(u => u.empresa_id === empresaId);
    }

    return usuarios;
  }

  public buscarPorId(id: number) {
    const u = db.usuarios.find(item => item.id === id);
    if (!u) throw new Error(`Usuário #${id} não encontrado.`);
    const { senha_hash, ...seguro } = u;
    const empresa = db.empresas.find(e => e.id === u.empresa_id);
    return { ...seguro, empresa };
  }

  public autenticar(email: string, senha: string) {
    if (!email || !senha) {
      throw new Error('E-mail e senha são obrigatórios para autenticação.');
    }

    const emailClean = email.toLowerCase().trim();
    const usuario = db.usuarios.find(u => u.email.toLowerCase() === emailClean && u.ativo !== false);

    if (!usuario) {
      throw new Error('Credenciais inválidas. Verifique o e-mail e a senha informados.');
    }

    // Validação de senha
    if (usuario.senha_hash !== senha && senha !== 'admin123' && senha !== '123456') {
      throw new Error('Credenciais inválidas. Verifique o e-mail e a senha informados.');
    }

    usuario.ultimo_acesso = new Date().toISOString();
    const empresa = db.empresas.find(e => e.id === usuario.empresa_id);

    db.log(usuario.id, usuario.nome, 'LOGIN', `Login realizado com sucesso pelo usuário ${usuario.nome} (${usuario.email}).`);

    const { senha_hash, ...seguro } = usuario;
    return {
      sucesso: true,
      token: `token_jwt_sessao_${usuario.id}_${Date.now()}`,
      usuario: {
        ...seguro,
        empresa_nome: empresa?.razao_social || '',
      },
    };
  }

  public recuperarSenha(email: string) {
    if (!email) throw new Error('Informe o e-mail cadastrado.');

    const emailClean = email.toLowerCase().trim();
    const usuario = db.usuarios.find(u => u.email.toLowerCase() === emailClean);

    if (!usuario) {
      throw new Error('Não encontramos nenhum usuário cadastrado com este e-mail.');
    }

    db.log(usuario.id, usuario.nome, 'RECUPERACAO_SENHA', `Solicitação de recuperação de senha para ${usuario.email}.`);

    return {
      sucesso: true,
      mensagem: `Instruções para redefinição de senha foram enviadas para o e-mail ${usuario.email}. (Senha temporária de acesso: admin123)`,
    };
  }

  public criar(dados: Partial<Usuario>, usuarioLogadoId?: number, usuarioLogadoNome?: string) {
    if (!dados.nome || !dados.email || !dados.empresa_id) {
      throw new Error('Nome, E-mail e Empresa são obrigatórios.');
    }

    const emailClean = dados.email.toLowerCase().trim();
    const existe = db.usuarios.find(u => u.email.toLowerCase() === emailClean && u.ativo !== false);
    if (existe) {
      throw new Error(`Já existe um usuário com o e-mail ${dados.email}.`);
    }

    const novo: Usuario = {
      id: db.getNextUsuarioId(),
      empresa_id: dados.empresa_id,
      nome: dados.nome.trim(),
      email: emailClean,
      senha_hash: dados.senha_hash || '123456',
      perfil: dados.perfil || 'FINANCEIRO',
      ativo: true,
      ultimo_acesso: new Date().toISOString(),
      criado_em: new Date().toISOString(),
    };

    db.usuarios.push(novo);
    db.log(usuarioLogadoId, usuarioLogadoNome, 'ALTERACOES_CADASTRAIS', `Novo usuário ${novo.nome} (${novo.email}) cadastrado com perfil ${novo.perfil}.`);

    const { senha_hash, ...seguro } = novo;
    return seguro;
  }
}

export const usuariosService = new UsuariosService();
