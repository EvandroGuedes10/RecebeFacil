import React, { useState } from 'react';
import {
  Building2,
  Search,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Building,
} from 'lucide-react';
import { Empresa } from '../../types';
import { api } from '../../services/api';
import { TableSkeleton } from '../common/Skeleton';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface EmpresasListProps {
  empresas: Empresa[];
  selectedEmpresaId: number;
  loading: boolean;
  onNovaEmpresa: () => void;
  onEditarEmpresa: (empresa: Empresa) => void;
  onSelectEmpresa: (id: number) => void;
  onRefresh: () => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', msg: string) => void;
}

export const EmpresasList: React.FC<EmpresasListProps> = ({
  empresas,
  selectedEmpresaId,
  loading,
  onNovaEmpresa,
  onEditarEmpresa,
  onSelectEmpresa,
  onRefresh,
  onToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingEmpresa, setDeletingEmpresa] = useState<Empresa | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredEmpresas = (empresas || []).filter((e) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.razao_social?.toLowerCase().includes(term) ||
      e.nome_fantasia?.toLowerCase().includes(term) ||
      e.cnpj?.toLowerCase().includes(term) ||
      e.cidade?.toLowerCase().includes(term)
    );
  });

  const handleConfirmDelete = async () => {
    if (!deletingEmpresa) return;
    if (empresas.length <= 1) {
      onToast('warning', 'Não é possível excluir a única empresa do sistema.');
      setDeletingEmpresa(null);
      return;
    }

    setDeleteLoading(true);
    try {
      await api.empresas.excluir(deletingEmpresa.id);
      onToast('success', `Empresa ${deletingEmpresa.razao_social} desativada com sucesso.`);
      setDeletingEmpresa(null);
      onRefresh();
    } catch (err: any) {
      onToast('error', err.message || 'Erro ao desativar empresa.');
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
            Gestão Multi-Empresas (Filiais / Matrizes)
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Configuração cadastral dos CNPJs emissores e gerência multi-tenant do ERP.
          </p>
        </div>
        <button
          onClick={onNovaEmpresa}
          className="px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Empresa</span>
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
            placeholder="Pesquisar por razão social, nome fantasia, CNPJ..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Empresas Registradas: <strong className="text-gray-800 dark:text-gray-200 tabular-nums">{filteredEmpresas.length}</strong>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <TableSkeleton rows={4} columns={5} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xs">
          {filteredEmpresas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Razão Social / Nome Fantasia</th>
                    <th className="py-3.5 px-4">CNPJ / Inscrição Estadual</th>
                    <th className="py-3.5 px-4">Contato / Localidade</th>
                    <th className="py-3.5 px-4 text-center">Contexto Ativo</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredEmpresas.map((empresa) => {
                    const isSelected = empresa.id === selectedEmpresaId;

                    return (
                      <tr
                        key={empresa.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-blue-50/50 dark:bg-blue-950/20'
                            : 'hover:bg-gray-50/80 dark:hover:bg-gray-700/40'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <span>{empresa.razao_social}</span>
                            {isSelected && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                                Selecionada
                              </span>
                            )}
                          </div>
                          {empresa.nome_fantasia && (
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                              {empresa.nome_fantasia}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums">
                          <div className="text-gray-900 dark:text-gray-200 font-medium">
                            {empresa.cnpj || '---'}
                          </div>
                          {empresa.inscricao_estadual && (
                            <div className="text-[10px] text-gray-400">
                              IE: {empresa.inscricao_estadual}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400">
                          <div>{empresa.email || empresa.telefone || 'Sem contato'}</div>
                          {(empresa.cidade || empresa.estado) && (
                            <div className="text-[10px] text-gray-400">
                              {empresa.cidade ? `${empresa.cidade} - ` : ''}{empresa.estado || ''}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Em Uso</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => onSelectEmpresa(empresa.id)}
                              className="px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors cursor-pointer"
                            >
                              Alternar para esta
                            </button>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onEditarEmpresa(empresa)}
                              title="Editar Empresa"
                              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {empresas.length > 1 && (
                              <button
                                onClick={() => setDeletingEmpresa(empresa)}
                                title="Desativar Empresa"
                                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-xs">
              Nenhuma empresa encontrada.
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deletingEmpresa}
        onClose={() => setDeletingEmpresa(null)}
        onConfirm={handleConfirmDelete}
        title="Desativar Empresa"
        message={`Tem certeza que deseja desativar a empresa "${deletingEmpresa?.razao_social}"? O histórico fiscal continuará gravado no banco de dados.`}
        confirmText="Sim, Desativar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};
