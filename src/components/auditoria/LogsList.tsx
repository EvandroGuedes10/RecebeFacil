import React, { useState } from 'react';
import { ShieldCheck, Search, Filter, Clock, User, Activity, FileText } from 'lucide-react';
import { LogSistema } from '../../types';
import { formatDateTime } from '../../utils/formatters';

interface LogsListProps {
  logs: LogSistema[];
  loading: boolean;
  onRefresh: () => void;
}

export const LogsList: React.FC<LogsListProps> = ({ logs, loading, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAcao, setSelectedAcao] = useState('TODOS');

  const filteredLogs = logs.filter(l => {
    if (selectedAcao !== 'TODOS' && l.acao !== selectedAcao) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        l.descricao.toLowerCase().includes(term) ||
        l.acao.toLowerCase().includes(term) ||
        (l.usuario_nome && l.usuario_nome.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const getAcaoBadge = (acao: string) => {
    if (acao.includes('IMPORTACAO') || acao.includes('NFE')) {
      return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
    }
    if (acao.includes('BAIXA')) {
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
    if (acao.includes('ESTORNO') || acao.includes('EXCLUSAO')) {
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    }
    if (acao.includes('CLIENTE') || acao.includes('EMPRESA')) {
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            Auditoria & Logs do Sistema
          </h2>
          <p className="text-xs text-slate-400">
            Trilha de auditoria e rastreabilidade de todas as ações fiscais, importações e liquidações
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
        >
          Atualizar Logs
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar nos registros de auditoria por descrição, usuário ou ação..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedAcao}
            onChange={e => setSelectedAcao(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-400"
          >
            <option value="TODOS">Todas as Ações</option>
            <option value="IMPORTACAO_NFE">Importação de NF-e</option>
            <option value="BAIXA_TITULO">Baixa de Título</option>
            <option value="ESTORNO_PARCELA">Estorno de Parcela</option>
            <option value="PRORROGAR_VENCIMENTO">Prorrogar Vencimento</option>
            <option value="CLIENTE_CRIADO">Cadastro de Cliente</option>
            <option value="EXCLUSAO_NFE">Exclusão de NF-e</option>
          </select>
        </div>
      </div>

      {/* Logs Timeline Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-950/40">
                <th className="py-3.5 px-4 w-44">Data / Hora</th>
                <th className="py-3.5 px-4 w-48">Usuário Responsável</th>
                <th className="py-3.5 px-4 w-52">Operação / Ação</th>
                <th className="py-3.5 px-4">Detalhamento da Operação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <Activity className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-300">Nenhum registro de log encontrado</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-400">
                      {formatDateTime(log.data_hora)}
                    </td>

                    <td className="py-3 px-4 text-slate-200 font-sans font-semibold">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{log.usuario_nome || 'Sistema'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getAcaoBadge(log.acao)}`}>
                        {log.acao}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-300 text-xs leading-relaxed">
                      {log.descricao}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
