import { DatabaseService, dbService } from '../database.service.js';

export interface ParcelaModel {
  id: string;
  nota_id: string;
  numero_parcela: number;
  vencimento: Date | string;
  valor_original: number;
  valor_recebido: number;
  saldo: number;
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'PARCIAL' | 'CANCELADO';
  data_recebimento?: Date | string | null;
  observacao?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  // Campos em JOIN
  numero_nota?: string;
  serie_nota?: string;
  chave_acesso?: string;
  cliente_id?: string;
  cliente_nome?: string;
  cliente_cpf_cnpj?: string;
  empresa_id?: string;
}

export class ParcelaRepository {
  private db: DatabaseService;

  constructor(dbInstance: DatabaseService = dbService) {
    this.db = dbInstance;
  }

  public async findById(id: string): Promise<ParcelaModel | null> {
    const sql = `
      SELECT p.*,
             nf.numero as numero_nota,
             nf.serie as serie_nota,
             nf.chave_acesso,
             nf.empresa_id,
             c.id as cliente_id,
             c.nome as cliente_nome,
             c.cpf_cnpj as cliente_cpf_cnpj
      FROM parcelas_receber p
      INNER JOIN notas_fiscais nf ON nf.id = p.nota_id
      INNER JOIN clientes c ON c.id = nf.cliente_id
      WHERE p.id = $1
      LIMIT 1`;
    const res = await this.db.query<ParcelaModel>(sql, [id]);
    return res.rows[0] || null;
  }

  public async findAllByNota(notaId: string): Promise<ParcelaModel[]> {
    const res = await this.db.query<ParcelaModel>(
      'SELECT * FROM parcelas_receber WHERE nota_id = $1 ORDER BY numero_parcela ASC',
      [notaId]
    );
    return res.rows;
  }

  public async findAllFiltered(filtros: {
    empresaId?: string;
    clienteId?: string;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
    busca?: string;
  }): Promise<ParcelaModel[]> {
    let sql = `
      SELECT p.*,
             nf.numero as numero_nota,
             nf.serie as serie_nota,
             nf.chave_acesso,
             nf.empresa_id,
             c.id as cliente_id,
             c.nome as cliente_nome,
             c.cpf_cnpj as cliente_cpf_cnpj
      FROM parcelas_receber p
      INNER JOIN notas_fiscais nf ON nf.id = p.nota_id
      INNER JOIN clientes c ON c.id = nf.cliente_id
      WHERE 1=1`;
    
    const params: any[] = [];

    if (filtros.empresaId) {
      params.push(filtros.empresaId);
      sql += ` AND nf.empresa_id = $${params.length}`;
    }

    if (filtros.clienteId) {
      params.push(filtros.clienteId);
      sql += ` AND c.id = $${params.length}`;
    }

    if (filtros.status) {
      params.push(filtros.status.toUpperCase());
      sql += ` AND p.status = $${params.length}`;
    }

    if (filtros.dataInicio) {
      params.push(filtros.dataInicio);
      sql += ` AND p.vencimento >= $${params.length}`;
    }

    if (filtros.dataFim) {
      params.push(filtros.dataFim);
      sql += ` AND p.vencimento <= $${params.length}`;
    }

    if (filtros.busca && filtros.busca.trim()) {
      params.push(`%${filtros.busca.trim()}%`);
      sql += ` AND (c.nome ILIKE $${params.length} OR c.cpf_cnpj ILIKE $${params.length} OR nf.numero ILIKE $${params.length} OR p.observacao ILIKE $${params.length})`;
    }

    sql += ' ORDER BY p.vencimento ASC, p.numero_parcela ASC';
    const res = await this.db.query<ParcelaModel>(sql, params);
    return res.rows;
  }

  public async create(data: {
    nota_id: string;
    numero_parcela: number;
    vencimento: string;
    valor_original: number;
    valor_recebido?: number;
    saldo?: number;
    status?: string;
    data_recebimento?: string;
    observacao?: string;
  }): Promise<ParcelaModel> {
    const valorOriginal = Number(data.valor_original) || 0;
    const valorRecebido = Number(data.valor_recebido) || 0;
    const saldo = data.saldo !== undefined ? Number(data.saldo) : Math.max(0, valorOriginal - valorRecebido);
    const status = data.status || (saldo <= 0 ? 'PAGO' : 'PENDENTE');

    const res = await this.db.query<ParcelaModel>(
      `INSERT INTO parcelas_receber (
        nota_id, numero_parcela, vencimento, valor_original, 
        valor_recebido, saldo, status, data_recebimento, observacao
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        data.nota_id,
        data.numero_parcela,
        data.vencimento,
        valorOriginal,
        valorRecebido,
        saldo,
        status,
        data.data_recebimento || null,
        data.observacao || null,
      ]
    );
    return res.rows[0];
  }

  public async baixarRecebimento(
    id: string,
    data: {
      valorRecebido: number;
      dataRecebimento: string;
      observacao?: string;
    }
  ): Promise<ParcelaModel | null> {
    const atual = await this.findById(id);
    if (!atual) return null;

    const novoRecebido = Number(atual.valor_recebido || 0) + Number(data.valorRecebido);
    const novoSaldo = Math.max(0, Number(atual.valor_original) - novoRecebido);
    const novoStatus = novoSaldo <= 0.001 ? 'PAGO' : 'PARCIAL';

    const obsConcat = data.observacao
      ? atual.observacao
        ? `${atual.observacao} | ${data.observacao}`
        : data.observacao
      : atual.observacao;

    const res = await this.db.query<ParcelaModel>(
      `UPDATE parcelas_receber 
       SET valor_recebido = $1,
           saldo = $2,
           status = $3,
           data_recebimento = $4,
           observacao = $5
       WHERE id = $6
       RETURNING *`,
      [novoRecebido, novoSaldo, novoStatus, data.dataRecebimento, obsConcat, id]
    );

    return res.rows[0] || null;
  }

  public async update(id: string, data: Partial<ParcelaModel>): Promise<ParcelaModel | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.vencimento !== undefined) {
      fields.push(`vencimento = $${idx++}`);
      values.push(data.vencimento);
    }
    if (data.valor_original !== undefined) {
      fields.push(`valor_original = $${idx++}`);
      values.push(data.valor_original);
    }
    if (data.valor_recebido !== undefined) {
      fields.push(`valor_recebido = $${idx++}`);
      values.push(data.valor_recebido);
    }
    if (data.saldo !== undefined) {
      fields.push(`saldo = $${idx++}`);
      values.push(data.saldo);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }
    if (data.data_recebimento !== undefined) {
      fields.push(`data_recebimento = $${idx++}`);
      values.push(data.data_recebimento);
    }
    if (data.observacao !== undefined) {
      fields.push(`observacao = $${idx++}`);
      values.push(data.observacao);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const sql = `UPDATE parcelas_receber SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await this.db.query<ParcelaModel>(sql, values);
    return res.rows[0] || null;
  }
}

export const parcelaRepository = new ParcelaRepository();
