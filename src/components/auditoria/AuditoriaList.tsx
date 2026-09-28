import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  User,
  Clock,
  Calendar,
  Activity,
  FileText,
  DollarSign,
  LogIn,
  Edit,
  Trash2,
} from 'lucide-react';
import { LogSistema } from '../../types';
import { TableSkeleton } from '../common/Skeleton';

interface AuditoriaListProps {
  logs: LogSistema[];
  loading: boolean;
}

export const AuditoriaList: React.FC<AuditoriaListProps> = ({ logs, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('todas');

  const filteredLogs = (logs || []).filter((log) => {
    if (selectedAction !== 'todas' && !log.acao.toLowerCase().includes(selectedAction.toLowerCase())) {
      return false;
    }
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.acao?.toLowerCase().includes(term) ||
      log.descricao?.toLowerCase().includes(term) ||
      log.usuario_nome?.toLowerCase().includes(term) ||
      log.ip?.toLowerCase().includes(term)
    );
  });

  const formatTimestamp = (ts?: string) => {
    if (!ts) return '---';
    try {
      const d = new Date(ts);
      return d.toLocaleString('pt-BR');
    } catch {
      return ts;
    }
  };

  const getActionBadge = (acao: string) => {
    const act = acao.toUpperCase();
    if (act.includes('LOGIN')) {
      return {
        icon: LogIn,
        bg: 'bg-blue-50 dark:bg-blue-950/60',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        label: 'Acesso',
      };
    }
    if (act.includes('XML') || act.includes('IMPORT')) {
      return {
        icon: FileText,
        bg: 'bg-emerald-50 dark:bg-emerald-950/60',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
        label: 'Importação NF-e',
      };
    }
    if (act.includes('BAIXA') || act.includes('RECEB')) {
      return {
        icon: DollarSign,
        bg: 'bg-emerald-50 dark:bg-emerald-950/60',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
        label: 'Baixa Financeira',
      };
    }
    if (act.includes('DELETE') || act.includes('EXCLU')) {
      return {
        icon: Trash2,
        bg: 'bg-red-50 dark:bg-red-950/60',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
        label: 'Exclusão',
      };
    }
    return {
      icon: Edit,
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-300 dark:border-gray-700',
      label: 'Alteração',
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Trilha de Auditoria e Governança
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Registro imutável de todas as ações operacionais, financeiras e acessos realizados no ERP.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuário, ação ou descrição..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full sm:w-auto py-1.5 px-3 text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="todas">Todas as Ações</option>
            <option value="LOGIN">Acessos / Logins</option>
            <option value="IMPORT">Importações de XML</option>
            <option value="BAIXA">Baixas de Títulos</option>
            <option value="CADASTRO">Cadastros e Edições</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={8} columns={5} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xs">
          {filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Data e Hora</th>
                    <th className="py-3.5 px-4">Usuário</th>
                    <th className="py-3.5 px-4">Tipo de Ação</th>
                    <th className="py-3.5 px-4">Descrição do Evento</th>
                    <th className="py-3.5 px-4">Endereço IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredLogs.map((log) => {
                    const badge = getActionBadge(log.acao);
                    const Icon = badge.icon;

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono tabular-nums text-gray-500 dark:text-gray-400 text-[11px] whitespace-nowrap">
                          {formatTimestamp(log.created_at)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          {log.usuario_nome || 'Sistema Automático'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${badge.bg} ${badge.text} ${badge.border} border`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{log.acao}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {log.descricao}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {log.ip || '127.0.0.1'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-xs">
              Nenhum registro de auditoria encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
