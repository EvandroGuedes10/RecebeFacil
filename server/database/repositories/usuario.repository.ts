import { DatabaseService, dbService } from '../database.service.js';

export interface UsuarioModel {
  id: string;
  empresa_id: string;
  nome: string;
  email: string;
  senha_hash: string;
  perfil: string;
  ativo: boolean;
  ultimo_acesso?: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export class UsuarioRepository {
  private db: DatabaseService;

  constructor(dbInstance: DatabaseService = dbService) {
    this.db = dbInstance;
  }

  public async findById(id: string): Promise<UsuarioModel | null> {
    const res = await this.db.query<UsuarioModel>(
      'SELECT * FROM usuarios WHERE id = $1 LIMIT 1',
      [id]
    );
    return res.rows[0] || null;
  }

  public async findByEmail(email: string): Promise<UsuarioModel | null> {
    const res = await this.db.query<UsuarioModel>(
      'SELECT * FROM usuarios WHERE email = $1 LIMIT 1',
      [email.toLowerCase().trim()]
    );
    return res.rows[0] || null;
  }

  public async findAllByEmpresa(empresaId: string, incluirInativos = false): Promise<UsuarioModel[]> {
    const sql = incluirInativos
      ? 'SELECT * FROM usuarios WHERE empresa_id = $1 ORDER BY nome ASC'
      : 'SELECT * FROM usuarios WHERE empresa_id = $1 AND ativo = true ORDER BY nome ASC';
    const res = await this.db.query<UsuarioModel>(sql, [empresaId]);
    return res.rows;
  }

  public async create(data: {
    empresa_id: string;
    nome: string;
    email: string;
    senha_hash: string;
    perfil?: string;
  }): Promise<UsuarioModel> {
    const res = await this.db.query<UsuarioModel>(
      `INSERT INTO usuarios (empresa_id, nome, email, senha_hash, perfil, ativo)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [
        data.empresa_id,
        data.nome,
        data.email.toLowerCase().trim(),
        data.senha_hash,
        data.perfil || 'FINANCEIRO',
      ]
    );
    return res.rows[0];
  }

  public async updateUltimoAcesso(id: string): Promise<void> {
    await this.db.query(
      'UPDATE usuarios SET ultimo_acesso = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  public async update(id: string, data: Partial<UsuarioModel>): Promise<UsuarioModel | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.nome !== undefined) {
      fields.push(`nome = $${idx++}`);
      values.push(data.nome);
    }
    if (data.email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(data.email.toLowerCase().trim());
    }
    if (data.senha_hash !== undefined) {
      fields.push(`senha_hash = $${idx++}`);
      values.push(data.senha_hash);
    }
    if (data.perfil !== undefined) {
      fields.push(`perfil = $${idx++}`);
      values.push(data.perfil);
    }
    if (data.ativo !== undefined) {
      fields.push(`ativo = $${idx++}`);
      values.push(data.ativo);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const sql = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await this.db.query<UsuarioModel>(sql, values);
    return res.rows[0] || null;
  }

  public async softDelete(id: string): Promise<boolean> {
    const res = await this.db.query(
      'UPDATE usuarios SET ativo = false WHERE id = $1',
      [id]
    );
    return (res.rowCount ?? 0) > 0;
  }
}

export const usuarioRepository = new UsuarioRepository();
