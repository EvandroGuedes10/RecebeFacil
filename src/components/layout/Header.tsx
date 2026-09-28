import React from 'react';
import { Building2, RefreshCw, Upload, Sun, Moon, PlusCircle, ArrowUpRight, ArrowDownRight, Edit3, RotateCcw, Plus } from 'lucide-react';
import { Empresa, Usuario } from '../../types';

interface HeaderProps {
  empresas: Empresa[];
  selectedEmpresaId: number;
  onSelectEmpresa: (id: number) => void;
  currentUser: Usuario | null;
  onOpenImport: () => void;
  onOpenNovoLancamento: () => void;
  onOpenZerarDados?: () => void;
  onEditarEmpresaAtiva?: () => void;
  onCadastrarEmpresa?: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  currentTabLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({
  empresas,
  selectedEmpresaId,
  onSelectEmpresa,
  currentUser,
  onOpenImport,
  onOpenNovoLancamento,
  onOpenZerarDados,
  onEditarEmpresaAtiva,
  onCadastrarEmpresa,
  onRefresh,
  isRefreshing,
  theme,
  onToggleTheme,
  currentTabLabel = 'Dashboard',
}) => {
  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between z-10 select-none shadow-2xs">
      {/* Left: Breadcrumbs / Empresa Selector */}
      <div className="flex items-center gap-4">
        {/* Module Label */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
          <span className="text-gray-400 dark:text-gray-500">Módulo</span>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-blue-600 dark:text-blue-400 font-bold">{currentTabLabel}</span>
        </div>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 hidden md:block" />

        {/* Empresa Selector */}
        <div className="flex items-center gap-2 px-2.5 py-1 bg-gray-50 dark:bg-gray-700/60 rounded-md border border-gray-200 dark:border-gray-600">
          <Building2 className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-400 dark:text-gray-400 font-bold uppercase tracking-wider leading-none">
              Empresa Ativa
            </span>
            {empresas && empresas.length > 0 ? (
              <select
                value={selectedEmpresaId}
                onChange={(e) => onSelectEmpresa(Number(e.target.value))}
                className="bg-transparent text-xs font-semibold text-gray-900 dark:text-gray-100 focus:outline-none cursor-pointer pr-2 pt-0.5"
              >
                {empresas.map((empresa) => (
                  <option
                    key={empresa.id}
                    value={empresa.id}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    {empresa.razao_social} {empresa.cnpj ? `(${empresa.cnpj})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-medium text-gray-400 dark:text-gray-400 italic pt-0.5">
                Nenhuma empresa cadastrada
              </span>
            )}
          </div>

          {empresas && empresas.length > 0 && onEditarEmpresaAtiva && (
            <button
              type="button"
              onClick={onEditarEmpresaAtiva}
              title="Editar Razão Social e dados desta empresa"
              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          {(!empresas || empresas.length === 0) && onCadastrarEmpresa && (
            <button
              type="button"
              onClick={onCadastrarEmpresa}
              className="flex items-center gap-1 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-3 h-3" />
              <span>Cadastrar</span>
            </button>
          )}
        </div>

        {/* Botão Zerar Dados */}
        {empresas && empresas.length > 0 && onOpenZerarDados && (
          <button
            type="button"
            onClick={onOpenZerarDados}
            title="Zerar dados, movimentações e redefinir empresa"
            className="flex items-center gap-1.5 py-1.5 px-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30 rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span className="hidden sm:inline">Zerar Dados</span>
          </button>
        )}
      </div>

      {/* Right: Quick Actions & Theme Switcher */}
      <div className="flex items-center gap-2.5">
        {/* Novo Lançamento Button */}
        <button
          onClick={onOpenNovoLancamento}
          className="flex items-center gap-1.5 py-1.5 px-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Novo Lançamento</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-600 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-gray-700" />
          )}
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Sincronizar dados com o banco"
          className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-600 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>
    </header>
  );
};
