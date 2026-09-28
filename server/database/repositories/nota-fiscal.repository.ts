import { DatabaseService, dbService } from '../database.service.js';

export interface NotaFiscalModel {
  id: string;
  empresa_id: string;
  cliente_id: string;
  chave_acesso: string;
  numero: string;
  serie: string;
  data_emissao: Date | string;
  valor_total: number;
  protocolo?: string | null;
  arquivo_xml?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  // Campos agregados em joins
  cliente_nome?: string;
  cliente_cpf_cnpj?: string;
  empresa_razao_social?: string;
}

export class NotaFiscalRepository {
  private db: DatabaseService;

  constructor(dbInstance: DatabaseService = dbService) {
    this.db = dbInstance;
  }

  public async findById(id: string): Promise<NotaFiscalModel | null> {
    const sql = `
      SELECT nf.*, 
             c.nome as cliente_nome, 
             c.cpf_cnpj as cliente_cpf_cnpj,
             e.razao_social as empresa_razao_social
      FROM notas_fiscais nf
      LEFT JOIN clientes c ON c.id = nf.cliente_id
      LEFT JOIN empresas e ON e.id = nf.empresa_id
      WHERE nf.id = $1 LIMIT 1`;
    const res = await this.db.query<NotaFiscalModel>(sql, [id]);
    return res.rows[0] || null;
  }

  public async findByChaveAcesso(chaveAcesso: string): Promise<NotaFiscalModel | null> {
    const res = await this.db.query<NotaFiscalModel>(
      'SELECT * FROM notas_fiscais WHERE chave_acesso = $1 LIMIT 1',
      [chaveAcesso]
    );
    return res.rows[0] || null;
  }

  public async findAllByEmpresa(
    empresaId: string,
    busca?: string
  ): Promise<NotaFiscalModel[]> {
    let sql = `
      SELECT nf.*, 
             c.nome as cliente_nome, 
             c.cpf_cnpj as cliente_cpf_cnpj,
             e.razao_social as empresa_razao_social
      FROM notas_fiscais nf
      LEFT JOIN clientes c ON c.id = nf.cliente_id
      LEFT JOIN empresas e ON e.id = nf.empresa_id
      WHERE nf.empresa_id = $1`;
    const params: any[] = [empresaId];

    if (busca && busca.trim()) {
      params.push(`%${busca.trim()}%`);
      sql += ` AND (nf.numero ILIKE $${params.length} OR nf.chave_acesso ILIKE $${params.length} OR c.nome ILIKE $${params.length} OR c.cpf_cnpj ILIKE $${params.length})`;
    }

    sql += ' ORDER BY nf.data_emissao DESC, nf.created_at DESC';
    const res = await this.db.query<NotaFiscalModel>(sql, params);
    return res.rows;
  }

  public async create(data: {
    empresa_id: string;
    cliente_id: string;
    chave_acesso: string;
    numero: string;
    serie?: string;
    data_emissao: string;
    valor_total: number;
    protocolo?: string;
    arquivo_xml?: string;
  }): Promise<NotaFiscalModel> {
    const res = await this.db.query<NotaFiscalModel>(
      `INSERT INTO notas_fiscais (
        empresa_id, cliente_id, chave_acesso, numero, serie, 
        data_emissao, valor_total, protocolo, arquivo_xml
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        data.empresa_id,
        data.cliente_id,
        data.chave_acesso,
        data.numero,
        data.serie || '1',
        data.data_emissao,
        data.valor_total,
        data.protocolo || null,
        data.arquivo_xml || null,
      ]
    );
    return res.rows[0];
  }

  public async delete(id: string): Promise<boolean> {
    const res = await this.db.query('DELETE FROM notas_fiscais WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}

export const notaFiscalRepository = new NotaFiscalRepository();
