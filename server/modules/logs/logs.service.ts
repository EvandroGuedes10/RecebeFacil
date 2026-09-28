import { db } from '../../config/database.js';

export class LogsService {
  public listar(acao?: string, busca?: string, limite = 100) {
    let logs = [...db.logs_sistema];

    if (acao && acao !== 'TODOS') {
      logs = logs.filter(l => l.acao === acao);
    }

    if (busca) {
      const b = busca.toLowerCase();
      logs = logs.filter(
        l =>
          l.descricao.toLowerCase().includes(b) ||
          l.acao.toLowerCase().includes(b) ||
          (l.usuario_nome && l.usuario_nome.toLowerCase().includes(b))
      );
    }

    return logs.slice(0, limite);
  }
}

export const logsService = new LogsService();
