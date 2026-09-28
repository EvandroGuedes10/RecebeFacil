import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { Cliente } from '../../types';
import { api } from '../../services/api';
import { TableSkeleton } from '../common/Skeleton';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface ClientesListProps {
  clientes: Cliente[];
  loading: boolean;
  onNovoCliente: () => void;
  onEditarCliente: (cliente: Cliente) => void;
  onRefresh: () => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', msg: string) => void;
}

export const ClientesList: React.FC<ClientesListProps> = ({
  clientes,
  loading,
  onNovoCliente,
  onEditarCliente,
  onRefresh,
  onToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingCliente, setDeletingCliente] = useState<Cliente | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredClientes = (clientes || []).filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.nome?.toLowerCase().includes(term) ||
      c.cpf_cnpj?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.cidade?.toLowerCase().includes(term)
    );
  });

  const handleConfirmDelete = async () => {
    if (!deletingCliente) return;
    setDeleteLoading(true);
    try {
      await api.clientes.excluir(deletingCliente.id);
      onToast('success', `Cliente ${deletingCliente.nome} desativado com sucesso.`);
      setDeletingCliente(null);
      onRefresh();
    } catch (err: any) {
      onToast('error', err.message || 'Erro ao desativar cliente.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Cadastro de Clientes
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Base cadastral de sacados, contatos, dados de faturamento e histórico.
          </p>
        </div>
        <button
          onClick={onNovoCliente}
          className="px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Cliente</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, CPF/CNPJ, email ou cidade..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Clientes Ativos: <strong className="text-gray-800 dark:text-gray-200 tabular-nums">{filteredClientes.length}</strong>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xs">
          {filteredClientes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Código</th>
                    <th className="py-3.5 px-4">Razão Social / Nome</th>
                    <th className="py-3.5 px-4">CPF / CNPJ</th>
                    <th className="py-3.5 px-4">Contato / Localidade</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredClientes.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                        #{cliente.id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                        {cliente.nome}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-gray-700 dark:text-gray-300">
                        {cliente.cpf_cnpj || '---'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        <div>{cliente.email || cliente.telefone || 'Sem contato'}</div>
                        {(cliente.cidade || cliente.estado) && (
                          <div className="text-[10px] text-gray-400">
                            {cliente.cidade ? `${cliente.cidade} - ` : ''}{cliente.estado || ''}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          Ativo
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditarCliente(cliente)}
                            title="Editar Cliente"
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingCliente(cliente)}
                            title="Desativar Cliente"
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-xs">
              Nenhum cliente cadastrado.
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Soft-Delete */}
      <ConfirmationModal
        isOpen={!!deletingCliente}
        onClose={() => setDeletingCliente(null)}
        onConfirm={handleConfirmDelete}
        title="Desativar Cadastro de Cliente"
        message={`Deseja realmente desativar o cliente "${deletingCliente?.nome}"? O histórico de títulos e notas fiscais existentes será preservado.`}
        confirmText="Sim, Desativar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};
