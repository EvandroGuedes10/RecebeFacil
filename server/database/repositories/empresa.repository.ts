import { DatabaseService, dbService } from '../database.service.js';

export interface EmpresaModel {
  id: string;
  razao_social: string;
  nome_fantasia?: string | null;
  cnpj: string;
  inscricao_estadual?: string | null;
  email?: string | null;
  telefone?: string | null;
  ativo: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export class EmpresaRepository {
  private db: DatabaseService;

  constructor(dbInstance: DatabaseService = dbService) {
    this.db = dbInstance;
  }

  public async findById(id: string): Promise<EmpresaModel | null> {
    const res = await this.db.query<EmpresaModel>(
      'SELECT * FROM empresas WHERE id = $1 LIMIT 1',
      [id]
    );
    return res.rows[0] || null;
  }

  public async findByCnpj(cnpj: string): Promise<EmpresaModel | null> {
    const res = await this.db.query<EmpresaModel>(
      'SELECT * FROM empresas WHERE cnpj = $1 LIMIT 1',
      [cnpj]
    );
    return res.rows[0] || null;
  }

  public async findAll(incluirInativos = false): Promise<EmpresaModel[]> {
    const sql = incluirInativos
      ? 'SELECT * FROM empresas ORDER BY razao_social ASC'
      : 'SELECT * FROM empresas WHERE ativo = true ORDER BY razao_social ASC';
    const res = await this.db.query<EmpresaModel>(sql);
    return res.rows;
  }

  public async create(data: {
    razao_social: string;
    nome_fantasia?: string;
    cnpj: string;
    inscricao_estadual?: string;
    email?: string;
    telefone?: string;
  }): Promise<EmpresaModel> {
    const res = await this.db.query<EmpresaModel>(
      `INSERT INTO empresas (razao_social, nome_fantasia, cnpj, inscricao_estadual, email, telefone, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [
        data.razao_social,
        data.nome_fantasia || null,
        data.cnpj,
        data.inscricao_estadual || null,
        data.email || null,
        data.telefone || null,
      ]
    );
    return res.rows[0];
  }

  public async update(id: string, data: Partial<EmpresaModel>): Promise<EmpresaModel | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.razao_social !== undefined) {
      fields.push(`razao_social = $${idx++}`);
      values.push(data.razao_social);
    }
    if (data.nome_fantasia !== undefined) {
      fields.push(`nome_fantasia = $${idx++}`);
      values.push(data.nome_fantasia);
    }
    if (data.cnpj !== undefined) {
      fields.push(`cnpj = $${idx++}`);
      values.push(data.cnpj);
    }
    if (data.inscricao_estadual !== undefined) {
      fields.push(`inscricao_estadual = $${idx++}`);
      values.push(data.inscricao_estadual);
    }
    if (data.email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(data.email);
    }
    if (data.telefone !== undefined) {
      fields.push(`telefone = $${idx++}`);
      values.push(data.telefone);
    }
    if (data.ativo !== undefined) {
      fields.push(`ativo = $${idx++}`);
      values.push(data.ativo);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const sql = `UPDATE empresas SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await this.db.query<EmpresaModel>(sql, values);
    return res.rows[0] || null;
  }

  public async softDelete(id: string): Promise<boolean> {
    const res = await this.db.query(
      'UPDATE empresas SET ativo = false WHERE id = $1',
      [id]
    );
    return (res.rowCount ?? 0) > 0;
  }
}

export const empresaRepository = new EmpresaRepository();
