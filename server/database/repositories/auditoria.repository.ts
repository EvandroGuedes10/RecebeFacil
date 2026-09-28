import { DatabaseService, dbService } from '../database.service.js';

export interface AuditoriaLogModel {
  id: string;
  usuario_id?: string | null;
  acao: string;
  descricao: string;
  ip?: string | null;
  created_at: Date | string;
  // Campos em JOIN
  usuario_nome?: string;
  usuario_email?: string;
}

export class AuditoriaRepository {
  private db: DatabaseService;

  constructor(dbInstance: DatabaseService = dbService) {
    this.db = dbInstance;
  }

  public async create(data: {
    usuario_id?: string | null;
    acao: string;
    descricao: string;
    ip?: string | null;
  }): Promise<AuditoriaLogModel> {
    const res = await this.db.query<AuditoriaLogModel>(
      `INSERT INTO auditoria_logs (usuario_id, acao, descricao, ip)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.usuario_id || null, data.acao, data.descricao, data.ip || null]
    );
    return res.rows[0];
  }

  public async findAll(limite = 100, busca?: string): Promise<AuditoriaLogModel[]> {
    let sql = `
      SELECT a.*,
             u.nome as usuario_nome,
             u.email as usuario_email
      FROM auditoria_logs a
      LEFT JOIN usuarios u ON u.id = a.usuario_id
      WHERE 1=1`;
    const params: any[] = [];

    if (busca && busca.trim()) {
      params.push(`%${busca.trim()}%`);
      sql += ` AND (a.acao ILIKE $${params.length} OR a.descricao ILIKE $${params.length} OR u.nome ILIKE $${params.length})`;
    }

    params.push(limite);
    sql += ` ORDER BY a.created_at DESC LIMIT $${params.length}`;

    const res = await this.db.query<AuditoriaLogModel>(sql, params);
    return res.rows;
  }
}

export const auditoriaRepository = new AuditoriaRepository();
