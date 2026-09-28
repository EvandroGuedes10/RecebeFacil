import pg, { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DatabaseHealth {
  connected: boolean;
  type: 'postgresql' | 'in-memory-fallback';
  latencyMs?: number;
  poolTotal?: number;
  poolIdle?: number;
  poolWaiting?: number;
  lastChecked: string;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private pool: Pool | null = null;
  private isConnected = false;
  private isInitializing = false;
  private connectionString: string;
  private connectionTimeoutMs = 10000;
  private queryTimeoutMs = 15000;

  private constructor() {
    this.connectionString =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      'postgresql://postgres:postgres@localhost:5432/recebe_facil';
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Inicializa o Pool de Conexões do PostgreSQL e executa as migrations
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitializing) return this.isConnected;
    this.isInitializing = true;

    try {
      this.pool = new Pool({
        connectionString: this.connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: this.connectionTimeoutMs,
        statement_timeout: this.queryTimeoutMs,
      });

      this.pool.on('error', (err) => {
        console.error('[PostgreSQL Pool Error]:', err.message);
        this.isConnected = false;
      });

      // Testar conexão inicial
      const client = await this.pool.connect();
      try {
        await client.query('SELECT 1');
        this.isConnected = true;
        console.log('[PostgreSQL] Conexão com banco de dados estabelecida com sucesso.');
        
        // Executar migrations automáticas
        await this.runMigrations(client);
      } finally {
        client.release();
      }

      return true;
    } catch (err: any) {
      console.warn(`[PostgreSQL] Não foi possível conectar ao banco PostgreSQL (${err.message}). Operando em modo de resiliência ativo.`);
      this.isConnected = false;
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Executa scripts de migrations SQL idempotentes
   */
  public async runMigrations(client?: PoolClient): Promise<void> {
    try {
      const migrationFilePath = path.join(__dirname, 'migrations.sql');
      if (fs.existsSync(migrationFilePath)) {
        const sql = fs.readFileSync(migrationFilePath, 'utf8');
        if (client) {
          await client.query(sql);
        } else if (this.pool && this.isConnected) {
          await this.pool.query(sql);
        }
        console.log('[PostgreSQL Migrations] Schema e tabelas validados com sucesso.');
      }
    } catch (err: any) {
      console.error('[PostgreSQL Migrations Error]:', err.message);
    }
  }

  /**
   * Executa uma consulta SQL no Pool
   */
  public async query<T extends QueryResultRow = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
    if (!this.pool || !this.isConnected) {
      await this.initialize();
    }

    if (this.pool && this.isConnected) {
      try {
        return await this.pool.query<T>(text, params);
      } catch (err: any) {
        console.error(`[PostgreSQL Query Error] SQL: ${text.slice(0, 100)}... | Erro:`, err.message);
        throw err;
      }
    }

    throw new Error('Banco de dados PostgreSQL não conectado no momento.');
  }

  /**
   * Executa uma transação gerenciada com Rollback automático em caso de erro
   */
  public async withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool || !this.isConnected) {
      await this.initialize();
    }

    if (!this.pool || !this.isConnected) {
      throw new Error('Não há conexão PostgreSQL disponível para transação.');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[PostgreSQL Transaction Rolled Back]:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  public isDbConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Retorna a saúde e status da conexão com o banco de dados
   */
  public async getHealth(): Promise<DatabaseHealth> {
    const start = Date.now();
    try {
      if (this.pool && this.isConnected) {
        await this.pool.query('SELECT 1');
        const latencyMs = Date.now() - start;
        return {
          connected: true,
          type: 'postgresql',
          latencyMs,
          poolTotal: this.pool.totalCount,
          poolIdle: this.pool.idleCount,
          poolWaiting: this.pool.waitingCount,
          lastChecked: new Date().toISOString(),
        };
      }
    } catch {
      this.isConnected = false;
    }

    return {
      connected: false,
      type: 'in-memory-fallback',
      lastChecked: new Date().toISOString(),
    };
  }

  /**
   * Fecha o pool graciosamente
   */
  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('[PostgreSQL Pool] Conexões encerradas.');
    }
  }
}

export const dbService = DatabaseService.getInstance();
