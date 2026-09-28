import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  FileText,
  FileDown,
  Users,
  Truck,
  Building2,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Settings,
  Upload,
  LogOut,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';
import { Usuario } from '../../types';

export type TabType =
  | 'dashboard'
  | 'contas-a-receber'
  | 'contas-a-pagar'
  | 'fluxo-de-caixa'
  | 'notas-fiscais'
  | 'notas-entrada'
  | 'clientes'
  | 'fornecedores'
  | 'relatorios'
  | 'empresas'
  | 'auditoria'
  | 'configuracoes';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenImport: () => void;
  onOpenNovoLancamento: () => void;
  currentUser: Usuario | null;
  onLogout: () => void;
  counts?: {
    parcelasReceberPendentes: number;
    contasPagarPendentes: number;
    totalNotasSaida: number;
    totalNotasEntrada: number;
    totalClientes: number;
    totalFornecedores: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenImport,
  onOpenNovoLancamento,
  currentUser,
  onLogout,
  counts,
}) => {
  const menuSections: {
    sectionTitle: string;
    items: {
      id: TabType;
      label: string;
      icon: React.ElementType;
      badge?: number;
      badgeColor?: string;
    }[];
  }[] = [
    {
      sectionTitle: 'Visão Geral',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard Executivo',
          icon: LayoutDashboard,
        },
        {
          id: 'fluxo-de-caixa',
          label: 'Fluxo de Caixa',
          icon: TrendingUp,
        },
      ],
    },
    {
      sectionTitle: 'Financeiro',
      items: [
        {
          id: 'contas-a-receber',
          label: 'Contas a Receber',
          icon: Receipt,
          badge: counts?.parcelasReceberPendentes,
          badgeColor: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800',
        },
        {
          id: 'contas-a-pagar',
          label: 'Contas a Pagar',
          icon: CreditCard,
          badge: counts?.contasPagarPendentes,
          badgeColor: 'bg-amber-950/60 text-amber-400 border border-amber-800',
        },
        {
          id: 'relatorios',
          label: 'Relatórios Financeiros',
          icon: BarChart3,
        },
      ],
    },
    {
      sectionTitle: 'Documentos Fiscais',
      items: [
        {
          id: 'notas-fiscais',
          label: 'Notas Fiscais (Saída)',
          icon: FileText,
          badge: counts?.totalNotasSaida,
          badgeColor: 'bg-gray-700 text-gray-300 border border-gray-600',
        },
        {
          id: 'notas-entrada',
          label: 'Notas de Entrada (Compras)',
          icon: FileDown,
          badge: counts?.totalNotasEntrada,
          badgeColor: 'bg-gray-700 text-gray-300 border border-gray-600',
        },
      ],
    },
    {
      sectionTitle: 'Cadastros',
      items: [
        {
          id: 'clientes',
          label: 'Clientes',
          icon: Users,
          badge: counts?.totalClientes,
          badgeColor: 'bg-gray-700 text-gray-300 border border-gray-600',
        },
        {
          id: 'fornecedores',
          label: 'Fornecedores',
          icon: Truck,
          badge: counts?.totalFornecedores,
          badgeColor: 'bg-gray-700 text-gray-300 border border-gray-600',
        },
        {
          id: 'empresas',
          label: 'Empresas / Filiais',
          icon: Building2,
        },
      ],
    },
    {
      sectionTitle: 'Sistema',
      items: [
        {
          id: 'auditoria',
          label: 'Auditoria & Logs',
          icon: ShieldCheck,
        },
        {
          id: 'configuracoes',
          label: 'Configurações',
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#1F2937] border-r border-gray-800 flex flex-col h-screen shrink-0 text-gray-300 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-gray-700/80 gap-3">
        <div className="w-8 h-8 rounded-md bg-[#2563EB] flex items-center justify-center text-white shadow-xs">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-1">
            <span className="font-bold text-base tracking-tight text-white">Recebe</span>
            <span className="font-bold text-base text-blue-400">Fácil</span>
          </div>
          <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">
            ERP Financeiro Completo
          </p>
        </div>
      </div>

      {/* Action Buttons: Novo Lançamento e Importar XML */}
      <div className="p-3 border-b border-gray-700/50 space-y-2">
        <button
          onClick={onOpenNovoLancamento}
          className="w-full py-2 px-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-md font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar">
        {menuSections.map((sec, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              {sec.sectionTitle}
            </p>
            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors group cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border-l-3 border-[#2563EB] font-semibold pl-2.5'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-200'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium tabular-nums ${
                          item.badgeColor || 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-gray-700/80 bg-[#192230]">
        <div className="flex items-center justify-between p-2 rounded-md bg-gray-800/80 border border-gray-700/60">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-md bg-blue-900/60 border border-blue-600/40 text-blue-300 font-semibold text-xs flex items-center justify-center shrink-0">
              {currentUser?.nome ? currentUser.nome.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden text-left">
              <p className="text-xs font-medium text-gray-200 truncate">
                {currentUser?.nome || 'Usuário'}
              </p>
              <p className="text-[10px] text-gray-400 capitalize truncate">
                {currentUser?.perfil || 'financeiro'}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sair do Sistema"
            className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
