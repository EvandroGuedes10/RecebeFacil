import { DatabaseService, dbService } from '../database.service.js';

export interface ClienteModel {
  id: string;
  empresa_id: string;
  nome: string;
  cpf_cnpj: string;
  email?: string | null;
  telefone?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  ativo: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export class ClienteRepository {
  private db: DatabaseService;

  constructor(dbInstance: DatabaseService = dbService) {
    this.db = dbInstance;
  }

  public async findById(id: string): Promise<ClienteModel | null> {
    const res = await this.db.query<ClienteModel>(
      'SELECT * FROM clientes WHERE id = $1 LIMIT 1',
      [id]
    );
    return res.rows[0] || null;
  }

  public async findByCpfCnpj(empresaId: string, cpfCnpj: string): Promise<ClienteModel | null> {
    const cleanDoc = cpfCnpj.replace(/\D/g, '');
    const res = await this.db.query<ClienteModel>(
      `SELECT * FROM clientes 
       WHERE empresa_id = $1 
         AND REGEXP_REPLACE(cpf_cnpj, '[^0-9]', '', 'g') = $2 
       LIMIT 1`,
      [empresaId, cleanDoc]
    );
    return res.rows[0] || null;
  }

  public async findAllByEmpresa(
    empresaId: string,
    incluirInativos = false,
    busca?: string
  ): Promise<ClienteModel[]> {
    let sql = 'SELECT * FROM clientes WHERE empresa_id = $1';
    const params: any[] = [empresaId];

    if (!incluirInativos) {
      sql += ' AND ativo = true';
    }

    if (busca && busca.trim()) {
      params.push(`%${busca.trim()}%`);
      sql += ` AND (nome ILIKE $${params.length} OR cpf_cnpj ILIKE $${params.length} OR email ILIKE $${params.length} OR cidade ILIKE $${params.length})`;
    }

    sql += ' ORDER BY nome ASC';
    const res = await this.db.query<ClienteModel>(sql, params);
    return res.rows;
  }

  public async create(data: {
    empresa_id: string;
    nome: string;
    cpf_cnpj: string;
    email?: string;
    telefone?: string;
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  }): Promise<ClienteModel> {
    const res = await this.db.query<ClienteModel>(
      `INSERT INTO clientes (
        empresa_id, nome, cpf_cnpj, email, telefone, 
        logradouro, numero, bairro, cidade, estado, cep, ativo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
      RETURNING *`,
      [
        data.empresa_id,
        data.nome,
        data.cpf_cnpj,
        data.email || null,
        data.telefone || null,
        data.logradouro || null,
        data.numero || null,
        data.bairro || null,
        data.cidade || null,
        data.estado || null,
        data.cep || null,
      ]
    );
    return res.rows[0];
  }

  public async upsertFromNfe(data: {
    empresa_id: string;
    nome: string;
    cpf_cnpj: string;
    email?: string;
    telefone?: string;
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  }): Promise<ClienteModel> {
    const existing = await this.findByCpfCnpj(data.empresa_id, data.cpf_cnpj);
    if (existing) {
      // Atualizar com novos dados caso disponíveis
      const updated = await this.update(existing.id, {
        email: data.email || existing.email,
        telefone: data.telefone || existing.telefone,
        logradouro: data.logradouro || existing.logradouro,
        cidade: data.cidade || existing.cidade,
        estado: data.estado || existing.estado,
        cep: data.cep || existing.cep,
      });
      return updated || existing;
    }

    return this.create(data);
  }

  public async update(id: string, data: Partial<ClienteModel>): Promise<ClienteModel | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const allowedKeys: (keyof ClienteModel)[] = [
      'nome',
      'cpf_cnpj',
      'email',
      'telefone',
      'logradouro',
      'numero',
      'bairro',
      'cidade',
      'estado',
      'cep',
      'ativo',
    ];

    for (const key of allowedKeys) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const sql = `UPDATE clientes SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await this.db.query<ClienteModel>(sql, values);
    return res.rows[0] || null;
  }

  public async softDelete(id: string): Promise<boolean> {
    const res = await this.db.query(
      'UPDATE clientes SET ativo = false WHERE id = $1',
      [id]
    );
    return (res.rowCount ?? 0) > 0;
  }
}

export const clienteRepository = new ClienteRepository();
