import React, { useState } from 'react';
import {
  Truck,
  Search,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Fornecedor } from '../../types';
import { api } from '../../services/api';
import { TableSkeleton } from '../common/Skeleton';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface FornecedoresListProps {
  fornecedores: Fornecedor[];
  loading: boolean;
  onNovoFornecedor: () => void;
  onEditarFornecedor: (fornecedor: Fornecedor) => void;
  onRefresh: () => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', msg: string) => void;
}

export const FornecedoresList: React.FC<FornecedoresListProps> = ({
  fornecedores,
  loading,
  onNovoFornecedor,
  onEditarFornecedor,
  onRefresh,
  onToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingFornecedor, setDeletingFornecedor] = useState<Fornecedor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredFornecedores = (fornecedores || []).filter((f) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      f.nome?.toLowerCase().includes(term) ||
      f.cpf_cnpj?.toLowerCase().includes(term) ||
      f.email?.toLowerCase().includes(term) ||
      f.cidade?.toLowerCase().includes(term) ||
      f.categoria?.toLowerCase().includes(term)
    );
  });

  const handleConfirmDelete = async () => {
    if (!deletingFornecedor) return;
    setDeleteLoading(true);
    try {
      await api.fornecedores.excluir(deletingFornecedor.id);
      onToast('success', `Fornecedor ${deletingFornecedor.nome} desativado com sucesso.`);
      setDeletingFornecedor(null);
      onRefresh();
    } catch (err: any) {
      onToast('error', err.message || 'Erro ao desativar fornecedor.');
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
            Cadastro de Fornecedores
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Empresas emitentes de notas de compras, parceiros e prestadores de serviços.
          </p>
        </div>
        <button
          onClick={onNovoFornecedor}
          className="px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Fornecedor</span>
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
            placeholder="Pesquisar por razão social, CNPJ/CPF, categoria..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Fornecedores Ativos: <strong className="text-gray-800 dark:text-gray-200 tabular-nums">{filteredFornecedores.length}</strong>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xs">
          {filteredFornecedores.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Código</th>
                    <th className="py-3.5 px-4">Razão Social / Nome</th>
                    <th className="py-3.5 px-4">CNPJ / CPF</th>
                    <th className="py-3.5 px-4">Contato / Localidade</th>
                    <th className="py-3.5 px-4">Categoria</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredFornecedores.map((fornecedor) => (
                    <tr
                      key={fornecedor.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                        #{fornecedor.id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                        {fornecedor.nome}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-gray-700 dark:text-gray-300">
                        {fornecedor.cpf_cnpj || '---'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        <div>{fornecedor.email || fornecedor.telefone || 'Sem contato'}</div>
                        {(fornecedor.cidade || fornecedor.estado) && (
                          <div className="text-[10px] text-gray-400">
                            {fornecedor.cidade ? `${fornecedor.cidade} - ` : ''}{fornecedor.estado || ''}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {fornecedor.categoria || 'Geral'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          Ativo
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditarFornecedor(fornecedor)}
                            title="Editar Fornecedor"
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingFornecedor(fornecedor)}
                            title="Desativar Fornecedor"
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
              Nenhum fornecedor cadastrado.
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Inativação */}
      <ConfirmationModal
        isOpen={!!deletingFornecedor}
        onClose={() => setDeletingFornecedor(null)}
        onConfirm={handleConfirmDelete}
        title="Inativar Cadastro de Fornecedor"
        message={`Deseja realmente inativar o fornecedor "${deletingFornecedor?.nome}"? O histórico de notas e contas a pagar continuará registrado no banco de dados.`}
        confirmText="Sim, Inativar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};
