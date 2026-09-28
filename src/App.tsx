import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { ConfirmationModal } from './components/common/ConfirmationModal';
import { LoginView } from './components/auth/LoginView';
import { DashboardOverview } from './components/dashboard/DashboardOverview';

// Modais NF-e Saída & Títulos a Receber
import { XmlImporterModal } from './components/nfe/XmlImporterModal';
import { DanfePreviewModal } from './components/nfe/DanfePreviewModal';
import { NotasFiscaisList } from './components/nfe/NotasFiscaisList';
import { ParcelasList } from './components/parcelas/ParcelasList';
import { BaixaParcelaModal } from './components/parcelas/BaixaParcelaModal';
import { EditarParcelaModal } from './components/parcelas/EditarParcelaModal';
import { ParcelaVisualizarModal } from './components/parcelas/ParcelaVisualizarModal';
import { ReciboModal } from './components/parcelas/ReciboModal';

// Módulo Contas a Pagar
import { ContasPagarList } from './components/contas-pagar/ContasPagarList';
import { BaixaPagamentoModal } from './components/contas-pagar/BaixaPagamentoModal';
import { ContaPagarVisualizarModal } from './components/contas-pagar/ContaPagarVisualizarModal';
import { ComprovantePagamentoModal } from './components/contas-pagar/ComprovantePagamentoModal';

// Módulo Fornecedores & NF-e Entrada (Compras)
import { FornecedoresList } from './components/fornecedores/FornecedoresList';
import { FornecedorModal } from './components/fornecedores/FornecedorModal';
import { NotasEntradaList } from './components/nfe-entrada/NotasEntradaList';
import { XmlEntradaImporterModal } from './components/nfe-entrada/XmlEntradaImporterModal';

// Lançamentos Manuais, Fluxo de Caixa & Relatórios
import { NovoLancamentoModal } from './components/lancamentos/NovoLancamentoModal';
import { FluxoCaixaView } from './components/fluxo-caixa/FluxoCaixaView';
import { RelatoriosView } from './components/relatorios/RelatoriosView';

// Cadastros Base & Auditoria
import { ClientesList } from './components/clientes/ClientesList';
import { ClienteModal } from './components/clientes/ClienteModal';
import { EmpresasList } from './components/empresas/EmpresasList';
import { EmpresaModal } from './components/empresas/EmpresaModal';
import { AuditoriaList } from './components/auditoria/AuditoriaList';
import { ConfiguracoesView } from './components/configuracoes/ConfiguracoesView';
import { ZerarDadosModal } from './components/common/ZerarDadosModal';

import {
  Empresa,
  Usuario,
  Cliente,
  Fornecedor,
  NotaFiscal,
  NotaEntrada,
  ParcelaReceber,
  ContaPagar,
  LogSistema,
  DashboardStats,
} from './types';
import { api, setAuthSession, clearAuthSession } from './services/api';

export default function App() {
  // Theme state ('light' as default corporate ERP theme, with dark support)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('recebefacil_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('recebefacil_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Authentication state
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // App Navigation
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  // Core Data State
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<number>(1);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [parcelasReceber, setParcelasReceber] = useState<ParcelaReceber[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [notasFiscaisSaida, setNotasFiscaisSaida] = useState<NotaFiscal[]>([]);
  const [notasEntrada, setNotasEntrada] = useState<NotaEntrada[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [logs, setLogs] = useState<LogSistema[]>([]);

  // Loading states
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingParcelas, setLoadingParcelas] = useState(false);
  const [loadingContasPagar, setLoadingContasPagar] = useState(false);
  const [loadingNotasSaida, setLoadingNotasSaida] = useState(false);
  const [loadingNotasEntrada, setLoadingNotasEntrada] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingFornecedores, setLoadingFornecedores] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state - XMLs & Lançamentos
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportEntradaModalOpen, setIsImportEntradaModalOpen] = useState(false);
  const [isNovoLancamentoModalOpen, setIsNovoLancamentoModalOpen] = useState(false);
  const [novoLancamentoTipoPadrao, setNovoLancamentoTipoPadrao] = useState<'RECEBER' | 'PAGAR'>('RECEBER');

  // Parcela Receber modals
  const [selectedParcelaBaixa, setSelectedParcelaBaixa] = useState<ParcelaReceber | null>(null);
  const [selectedParcelaEditar, setSelectedParcelaEditar] = useState<ParcelaReceber | null>(null);
  const [selectedParcelaVisualizar, setSelectedParcelaVisualizar] = useState<ParcelaReceber | null>(null);
  const [selectedParcelaRecibo, setSelectedParcelaRecibo] = useState<ParcelaReceber | null>(null);
  const [estornoParcela, setEstornoParcela] = useState<ParcelaReceber | null>(null);
  const [estornoLoading, setEstornoLoading] = useState(false);

  // Conta Pagar modals
  const [selectedContaPagarBaixa, setSelectedContaPagarBaixa] = useState<ContaPagar | null>(null);
  const [selectedContaPagarVisualizar, setSelectedContaPagarVisualizar] = useState<ContaPagar | null>(null);
  const [selectedContaPagarComprovante, setSelectedContaPagarComprovante] = useState<ContaPagar | null>(null);
  const [estornoContaPagar, setEstornoContaPagar] = useState<ContaPagar | null>(null);
  const [estornoPagarLoading, setEstornoPagarLoading] = useState(false);

  // Nota Fiscal DANFE preview
  const [selectedNotaDanfe, setSelectedNotaDanfe] = useState<NotaFiscal | null>(null);

  // Fornecedor modal
  const [isFornecedorModalOpen, setIsFornecedorModalOpen] = useState(false);
  const [selectedFornecedorEditar, setSelectedFornecedorEditar] = useState<Fornecedor | null>(null);

  // Cliente modal
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [selectedClienteEditar, setSelectedClienteEditar] = useState<Cliente | null>(null);

  // Empresa modal
  const [isEmpresaModalOpen, setIsEmpresaModalOpen] = useState(false);
  const [selectedEmpresaEditar, setSelectedEmpresaEditar] = useState<Empresa | null>(null);

  // Zerar dados modal
  const [isZerarDadosModalOpen, setIsZerarDadosModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check auth session on boot
  useEffect(() => {
    const savedUser = localStorage.getItem('recebefacil_usuario');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        setAuthSession(u.id, u.nome);
        if (u.empresa_id) {
          setSelectedEmpresaId(u.empresa_id);
        }
      } catch {
        localStorage.removeItem('recebefacil_usuario');
      }
    }
    setAuthChecking(false);
  }, []);

  const handleLoginSuccess = (usuario: Usuario) => {
    setCurrentUser(usuario);
    setAuthSession(usuario.id, usuario.nome);
    localStorage.setItem('recebefacil_usuario', JSON.stringify(usuario));
    if (usuario.empresa_id) {
      setSelectedEmpresaId(usuario.empresa_id);
    }
    setCurrentTab('dashboard');
    addToast('success', `Acesso autorizado para ${usuario.nome}.`, 'Sessão Iniciada');
    loadInitialData(usuario.empresa_id || selectedEmpresaId);
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch {}
    clearAuthSession();
    localStorage.removeItem('recebefacil_usuario');
    setCurrentUser(null);
    addToast('info', 'Você saiu do sistema com segurança.', 'Sessão Finalizada');
  };

  // Data fetching functions
  const loadEmpresas = useCallback(async () => {
    try {
      const data = await api.empresas.listar();
      setEmpresas(data);
      if (data.length > 0 && !data.find((e) => e.id === selectedEmpresaId)) {
        setSelectedEmpresaId(data[0].id);
      }
    } catch (err: any) {
      addToast('error', 'Falha ao sincronizar empresas.');
    }
  }, [selectedEmpresaId]);

  const loadDashboard = useCallback(async (empId: number) => {
    setLoadingDashboard(true);
    try {
      const data = await api.relatorios.obterDashboard(empId);
      setDashboardStats(data);
    } catch (err: any) {
      addToast('error', 'Erro ao carregar indicadores do dashboard.');
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  const loadParcelasReceber = useCallback(async (empId: number) => {
    setLoadingParcelas(true);
    try {
      const data = await api.parcelas.listar({ empresaId: empId });
      setParcelasReceber(data);
    } catch (err: any) {
      addToast('error', 'Erro ao carregar carteira de recebimentos.');
    } finally {
      setLoadingParcelas(false);
    }
  }, []);

  const loadContasPagar = useCallback(async (empId: number) => {
    setLoadingContasPagar(true);
    try {
      const data = await api.contasPagar.listar({ empresaId: empId });
      setContasPagar(data);
    } catch (err: any) {
      addToast('error', 'Erro ao carregar contas a pagar.');
    } finally {
      setLoadingContasPagar(false);
    }
  }, []);

  const loadNotasSaida = useCallback(async (empId: number) => {
    setLoadingNotasSaida(true);
    try {
      const data = await api.nfe.listarNotas(empId);
      setNotasFiscaisSaida(data);
    } catch (err: any) {
      addToast('error', 'Erro ao carregar notas fiscais de saída.');
    } finally {
      setLoadingNotasSaida(false);
    }
  }, []);

  const loadNotasEntrada = useCallback(async (empId: number) => {
    setLoadingNotasEntrada(true);
    try {
      const data = await api.nfeEntrada.listarNotas(empId);
      setNotasEntrada(data);
    } catch (err: any) {
      addToast('error', 'Erro ao carregar notas fiscais de entrada.');
    } finally {
      setLoadingNotasEntrada(false);
    }
  }, []);

  const loadClientes = useCallback(async (empId: number) => {
    setLoadingClientes(true);
    try {
      const data = await api.clientes.listar(empId);
      setClientes(data);
    } catch (err: any) {
      addToast('error', 'Erro ao carregar clientes.');
    } finally {
      setLoadingClientes(false);
    }
  }, []);

  const loadFornecedores = useCallback(async (empId: number) => {
    setLoadingFornecedores(true);
    try {
      const data = await api.fornecedores.listar(empId);
      setFornecedores(data);
    } catch (err: any) {
      addToast('error', 'Erro ao carregar fornecedores.');
    } finally {
      setLoadingFornecedores(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const data = await api.auditoria.listar(150);
      setLogs(data);
    } catch (err: any) {
      addToast('error', 'Erro ao carregar auditoria.');
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const loadInitialData = useCallback(
    async (empId: number) => {
      setIsRefreshing(true);
      await Promise.all([
        loadEmpresas(),
        loadDashboard(empId),
        loadParcelasReceber(empId),
        loadContasPagar(empId),
        loadNotasSaida(empId),
        loadNotasEntrada(empId),
        loadClientes(empId),
        loadFornecedores(empId),
        loadLogs(),
      ]);
      setIsRefreshing(false);
    },
    [
      loadEmpresas,
      loadDashboard,
      loadParcelasReceber,
      loadContasPagar,
      loadNotasSaida,
      loadNotasEntrada,
      loadClientes,
      loadFornecedores,
      loadLogs,
    ]
  );

  useEffect(() => {
    if (currentUser) {
      loadInitialData(selectedEmpresaId);
    }
  }, [currentUser, selectedEmpresaId]);

  const handleRefreshCurrent = () => {
    loadInitialData(selectedEmpresaId);
    addToast('info', 'Dados sincronizados com o banco de dados.', 'Atualização');
  };

  const currentEmpresaObj = (empresas || []).find((e) => e.id === selectedEmpresaId) || empresas[0] || null;

  // Handlers for XML Saída
  const handleImportSaidaSuccess = (result: any) => {
    addToast('success', result?.mensagem || 'Importação realizada com sucesso.', 'NF-e de Saída');
    loadInitialData(selectedEmpresaId);
  };

  // Handlers for XML Entrada
  const handleImportEntradaSuccess = (result: any) => {
    addToast('success', result?.mensagem || 'XMLs de entrada importados e contas geradas com sucesso.', 'NF-e de Entrada');
    loadInitialData(selectedEmpresaId);
  };

  // Handlers for Parcela Receber Baixa
  const handleBaixaReceberSuccess = (updated: ParcelaReceber) => {
    setSelectedParcelaBaixa(null);
    addToast('success', `Recebimento de R$ ${Number(updated.valor_recebido || 0).toFixed(2)} confirmado!`, 'Baixa Concluída');
    loadInitialData(selectedEmpresaId);
    if (updated.status === 'pago') {
      setSelectedParcelaRecibo(updated);
    }
  };

  // Handlers for Parcela Receber Edit
  const handleEditarParcelaSuccess = (updated: ParcelaReceber) => {
    setSelectedParcelaEditar(null);
    addToast('success', 'Título a receber atualizado com sucesso.', 'Alteração Salva');
    loadInitialData(selectedEmpresaId);
  };

  // Handlers for Parcela Receber Estorno
  const handleConfirmEstornoReceber = async () => {
    if (!estornoParcela) return;
    setEstornoLoading(true);
    try {
      await api.parcelas.estornar(estornoParcela.id);
      addToast('info', `Baixa do título #${estornoParcela.id} estornada com sucesso.`, 'Estorno Concluído');
      setEstornoParcela(null);
      loadInitialData(selectedEmpresaId);
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao estornar recebimento.');
    } finally {
      setEstornoLoading(false);
    }
  };

  // Handlers for Conta a Pagar Baixa
  const handleBaixaPagarSuccess = (updated: ContaPagar) => {
    setSelectedContaPagarBaixa(null);
    addToast('success', `Pagamento de R$ ${Number(updated.valor_pago || 0).toFixed(2)} registrado!`, 'Baixa Concluída');
    loadInitialData(selectedEmpresaId);
    if (updated.status === 'PAGO' || updated.status === 'pago') {
      setSelectedContaPagarComprovante(updated);
    }
  };

  // Handlers for Conta a Pagar Estorno
  const handleConfirmEstornoPagar = async () => {
    if (!estornoContaPagar) return;
    setEstornoPagarLoading(true);
    try {
      await api.contasPagar.estornar(estornoContaPagar.id);
      addToast('info', `Pagamento da conta #${estornoContaPagar.id} estornado com sucesso.`, 'Estorno Concluído');
      setEstornoContaPagar(null);
      loadInitialData(selectedEmpresaId);
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao estornar pagamento.');
    } finally {
      setEstornoPagarLoading(false);
    }
  };

  // Open Novo Lançamento Modal
  const handleOpenNovoLancamento = (tipo?: 'RECEBER' | 'PAGAR') => {
    setNovoLancamentoTipoPadrao(tipo || 'RECEBER');
    setIsNovoLancamentoModalOpen(true);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If unauthenticated, show TELA LOGIN
  if (!currentUser) {
    return (
      <>
        <LoginView onLoginSuccess={handleLoginSuccess} />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  const pendentesReceberCount = (parcelasReceber || []).filter((p) => p.status === 'pendente' || p.status === 'vencido').length;
  const pendentesPagarCount = (contasPagar || []).filter((cp) => cp.status === 'PENDENTE' || cp.status === 'ATRASADO').length;

  const tabLabels: Record<TabType, string> = {
    dashboard: 'Dashboard Financeiro',
    'contas-a-receber': 'Contas a Receber',
    'contas-a-pagar': 'Contas a Pagar',
    'fluxo-de-caixa': 'Fluxo de Caixa',
    'notas-fiscais': 'Notas Fiscais de Saída',
    'notas-entrada': 'Notas de Entrada (Compras)',
    clientes: 'Cadastro de Clientes',
    fornecedores: 'Cadastro de Fornecedores',
    relatorios: 'Relatórios Financeiros',
    empresas: 'Empresas e Filiais',
    auditoria: 'Trilha de Auditoria',
    configuracoes: 'Parâmetros do ERP',
  };

  return (
    <div className="flex h-screen bg-[#F5F7FA] dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Lateral Menu */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenNovoLancamento={() => handleOpenNovoLancamento('RECEBER')}
        currentUser={currentUser}
        onLogout={handleLogout}
        counts={{
          parcelasReceberPendentes: pendentesReceberCount,
          contasPagarPendentes: pendentesPagarCount,
          totalNotasSaida: notasFiscaisSaida.length,
          totalNotasEntrada: notasEntrada.length,
          totalClientes: clientes.length,
          totalFornecedores: fornecedores.length,
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F5F7FA] dark:bg-gray-900">
        {/* Header */}
        <Header
          empresas={empresas}
          selectedEmpresaId={selectedEmpresaId}
          onSelectEmpresa={(id) => setSelectedEmpresaId(id)}
          currentUser={currentUser}
          onOpenImport={() => setIsImportModalOpen(true)}
          onOpenNovoLancamento={() => handleOpenNovoLancamento('RECEBER')}
          onOpenZerarDados={() => setIsZerarDadosModalOpen(true)}
          onEditarEmpresaAtiva={() => {
            const emp = empresas.find((e) => e.id === selectedEmpresaId) || null;
            setSelectedEmpresaEditar(emp);
            setIsEmpresaModalOpen(true);
          }}
          onCadastrarEmpresa={() => {
            setSelectedEmpresaEditar(null);
            setIsEmpresaModalOpen(true);
          }}
          onRefresh={handleRefreshCurrent}
          isRefreshing={isRefreshing}
          theme={theme}
          onToggleTheme={toggleTheme}
          currentTabLabel={tabLabels[currentTab]}
        />

        {/* Dynamic Views */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F5F7FA] dark:bg-gray-900 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {/* 1. Dashboard */}
            {currentTab === 'dashboard' && (
              <DashboardOverview
                stats={dashboardStats}
                loading={loadingDashboard}
                onOpenBaixa={(parc) => setSelectedParcelaBaixa(parc)}
                onViewParcela={(parc) => setSelectedParcelaVisualizar(parc)}
                onNavigateToTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {/* 2. Contas a Receber */}
            {currentTab === 'contas-a-receber' && (
              <ParcelasList
                parcelas={parcelasReceber}
                clientes={clientes}
                loading={loadingParcelas}
                onNovoLancamento={() => handleOpenNovoLancamento('RECEBER')}
                onVisualizar={(parc) => setSelectedParcelaVisualizar(parc)}
                onEditar={(parc) => setSelectedParcelaEditar(parc)}
                onBaixar={(parc) => setSelectedParcelaBaixa(parc)}
                onEstornar={(parc) => setEstornoParcela(parc)}
                onRecibo={(parc) => setSelectedParcelaRecibo(parc)}
              />
            )}

            {/* 3. Contas a Pagar */}
            {currentTab === 'contas-a-pagar' && (
              <ContasPagarList
                contas={contasPagar}
                fornecedores={fornecedores}
                loading={loadingContasPagar}
                onNovoLancamento={() => handleOpenNovoLancamento('PAGAR')}
                onVisualizar={(cp) => setSelectedContaPagarVisualizar(cp)}
                onEditar={(cp) => {
                  setSelectedContaPagarVisualizar(cp);
                }}
                onBaixar={(cp) => setSelectedContaPagarBaixa(cp)}
                onEstornar={(cp) => setEstornoContaPagar(cp)}
                onComprovante={(cp) => setSelectedContaPagarComprovante(cp)}
              />
            )}

            {/* 4. Fluxo de Caixa */}
            {currentTab === 'fluxo-de-caixa' && (
              <FluxoCaixaView
                empresaId={selectedEmpresaId}
                onNovoLancamento={(tipo) => handleOpenNovoLancamento(tipo)}
              />
            )}

            {/* 5. Notas Fiscais Saída */}
            {currentTab === 'notas-fiscais' && (
              <NotasFiscaisList
                notas={notasFiscaisSaida}
                loading={loadingNotasSaida}
                onVisualizarDanfe={(nota) => setSelectedNotaDanfe(nota)}
                onOpenImport={() => setIsImportModalOpen(true)}
              />
            )}

            {/* 6. Notas de Entrada (Compras) */}
            {currentTab === 'notas-entrada' && (
              <NotasEntradaList
                notas={notasEntrada}
                loading={loadingNotasEntrada}
                onOpenImport={() => setIsImportEntradaModalOpen(true)}
              />
            )}

            {/* 7. Clientes */}
            {currentTab === 'clientes' && (
              <ClientesList
                clientes={clientes}
                loading={loadingClientes}
                onNovoCliente={() => {
                  setSelectedClienteEditar(null);
                  setIsClienteModalOpen(true);
                }}
                onEditarCliente={(c) => {
                  setSelectedClienteEditar(c);
                  setIsClienteModalOpen(true);
                }}
                onRefresh={() => loadClientes(selectedEmpresaId)}
                onToast={(type, msg) => addToast(type, msg)}
              />
            )}

            {/* 8. Fornecedores */}
            {currentTab === 'fornecedores' && (
              <FornecedoresList
                fornecedores={fornecedores}
                loading={loadingFornecedores}
                onNovoFornecedor={() => {
                  setSelectedFornecedorEditar(null);
                  setIsFornecedorModalOpen(true);
                }}
                onEditarFornecedor={(f) => {
                  setSelectedFornecedorEditar(f);
                  setIsFornecedorModalOpen(true);
                }}
                onRefresh={() => loadFornecedores(selectedEmpresaId)}
                onToast={(type, msg) => addToast(type, msg)}
              />
            )}

            {/* 9. Relatórios */}
            {currentTab === 'relatorios' && (
              <RelatoriosView
                empresa={currentEmpresaObj}
                empresaId={selectedEmpresaId}
                parcelasReceber={parcelasReceber}
                contasPagar={contasPagar}
                clientes={clientes}
                fornecedores={fornecedores}
                onToast={(type: any, msg: any) => addToast(type, msg)}
              />
            )}

            {/* 10. Empresas */}
            {currentTab === 'empresas' && (
              <EmpresasList
                empresas={empresas}
                selectedEmpresaId={selectedEmpresaId}
                loading={loadingParcelas}
                onNovaEmpresa={() => {
                  setSelectedEmpresaEditar(null);
                  setIsEmpresaModalOpen(true);
                }}
                onEditarEmpresa={(emp) => {
                  setSelectedEmpresaEditar(emp);
                  setIsEmpresaModalOpen(true);
                }}
                onSelectEmpresa={(id) => {
                  setSelectedEmpresaId(id);
                  addToast('info', 'Empresa ativa alterada.');
                }}
                onRefresh={loadEmpresas}
                onToast={(type, msg) => addToast(type, msg)}
              />
            )}

            {/* 11. Auditoria */}
            {currentTab === 'auditoria' && (
              <AuditoriaList logs={logs} loading={loadingLogs} />
            )}

            {/* 12. Configurações */}
            {currentTab === 'configuracoes' && (
              <ConfiguracoesView
                empresa={currentEmpresaObj}
                onToast={(type, msg) => addToast(type, msg)}
                onOpenZerarDados={() => setIsZerarDadosModalOpen(true)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Confirmation Modals */}
      {/* Estorno Parcela Receber */}
      <ConfirmationModal
        isOpen={!!estornoParcela}
        onClose={() => setEstornoParcela(null)}
        onConfirm={handleConfirmEstornoReceber}
        title="Estornar Baixa de Recebimento"
        message={`Confirma o estorno da baixa do título #${estornoParcela?.id}? O título voltará à situação Pendente com o saldo original reaberto.`}
        confirmText="Confirmar Estorno"
        cancelText="Cancelar"
        variant="warning"
        loading={estornoLoading}
      />

      {/* Estorno Conta a Pagar */}
      <ConfirmationModal
        isOpen={!!estornoContaPagar}
        onClose={() => setEstornoContaPagar(null)}
        onConfirm={handleConfirmEstornoPagar}
        title="Estornar Pagamento"
        message={`Confirma o estorno do pagamento da conta #${estornoContaPagar?.id} (${estornoContaPagar?.fornecedor_nome})? O débito voltará à situação Pendente.`}
        confirmText="Confirmar Estorno"
        cancelText="Cancelar"
        variant="warning"
        loading={estornoPagarLoading}
      />

      {/* MODAIS OPERACIONAIS */}

      {/* 1. Modal Novo Lançamento Manual (Receita / Despesa) */}
      <NovoLancamentoModal
        isOpen={isNovoLancamentoModalOpen}
        onClose={() => setIsNovoLancamentoModalOpen(false)}
        empresaId={selectedEmpresaId}
        tipoPadrao={novoLancamentoTipoPadrao}
        clientes={clientes}
        fornecedores={fornecedores}
        onSuccess={() => {
          addToast('success', 'Lançamento financeiro registrado com sucesso!', 'Financeiro');
          loadInitialData(selectedEmpresaId);
        }}
        onError={(msg) => addToast('error', msg, 'Erro no Lançamento')}
      />

      {/* 2. Modal Importação XML NF-e de Saída */}
      <XmlImporterModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        empresaId={selectedEmpresaId}
        onImportSuccess={handleImportSaidaSuccess}
        onError={(msg) => addToast('error', msg, 'Erro no XML')}
      />

      {/* 3. Modal Importação XML NF-e de Entrada (Individual / Múltiplos) */}
      <XmlEntradaImporterModal
        isOpen={isImportEntradaModalOpen}
        onClose={() => setIsImportEntradaModalOpen(false)}
        empresaId={selectedEmpresaId}
        onImportSuccess={handleImportEntradaSuccess}
        onError={(msg) => addToast('error', msg, 'Erro no XML de Entrada')}
      />

      {/* 4. Modal Baixa de Recebimento */}
      <BaixaParcelaModal
        isOpen={!!selectedParcelaBaixa}
        onClose={() => setSelectedParcelaBaixa(null)}
        parcela={selectedParcelaBaixa}
        onSuccess={handleBaixaReceberSuccess}
        onError={(msg) => addToast('error', msg, 'Falha na Baixa')}
      />

      {/* 5. Modal Baixa de Pagamento */}
      <BaixaPagamentoModal
        isOpen={!!selectedContaPagarBaixa}
        onClose={() => setSelectedContaPagarBaixa(null)}
        conta={selectedContaPagarBaixa}
        onSuccess={handleBaixaPagarSuccess}
        onError={(msg) => addToast('error', msg, 'Falha na Baixa')}
      />

      {/* 6. Modal Visualizar Conta a Pagar */}
      <ContaPagarVisualizarModal
        isOpen={!!selectedContaPagarVisualizar}
        onClose={() => setSelectedContaPagarVisualizar(null)}
        conta={selectedContaPagarVisualizar}
        onOpenBaixa={(cp) => {
          setSelectedContaPagarVisualizar(null);
          setSelectedContaPagarBaixa(cp);
        }}
        onOpenComprovante={(cp) => {
          setSelectedContaPagarVisualizar(null);
          setSelectedContaPagarComprovante(cp);
        }}
      />

      {/* 7. Modal Comprovante de Pagamento */}
      <ComprovantePagamentoModal
        isOpen={!!selectedContaPagarComprovante}
        onClose={() => setSelectedContaPagarComprovante(null)}
        conta={selectedContaPagarComprovante}
        empresa={currentEmpresaObj}
      />

      {/* 8. Modal Editar Parcela Receber */}
      <EditarParcelaModal
        isOpen={!!selectedParcelaEditar}
        onClose={() => setSelectedParcelaEditar(null)}
        parcela={selectedParcelaEditar}
        onSuccess={handleEditarParcelaSuccess}
        onError={(msg) => addToast('error', msg, 'Erro ao Editar')}
      />

      {/* 9. Modal Visualizar Parcela Receber */}
      <ParcelaVisualizarModal
        isOpen={!!selectedParcelaVisualizar}
        onClose={() => setSelectedParcelaVisualizar(null)}
        parcela={selectedParcelaVisualizar}
        onOpenBaixa={(parc) => {
          setSelectedParcelaVisualizar(null);
          setSelectedParcelaBaixa(parc);
        }}
        onOpenRecibo={(parc) => {
          setSelectedParcelaVisualizar(null);
          setSelectedParcelaRecibo(parc);
        }}
      />

      {/* 10. Modal Recibo de Quitação Receber */}
      <ReciboModal
        isOpen={!!selectedParcelaRecibo}
        onClose={() => setSelectedParcelaRecibo(null)}
        parcela={selectedParcelaRecibo}
        empresa={currentEmpresaObj}
      />

      {/* 11. Modal DANFE Saída */}
      <DanfePreviewModal
        isOpen={!!selectedNotaDanfe}
        onClose={() => setSelectedNotaDanfe(null)}
        nota={selectedNotaDanfe}
        empresa={currentEmpresaObj}
      />

      {/* 12. Modal Cadastro/Edição de Fornecedor */}
      <FornecedorModal
        isOpen={isFornecedorModalOpen}
        onClose={() => {
          setIsFornecedorModalOpen(false);
          setSelectedFornecedorEditar(null);
        }}
        fornecedor={selectedFornecedorEditar}
        empresaId={selectedEmpresaId}
        onSuccess={(f) => {
          setIsFornecedorModalOpen(false);
          setSelectedFornecedorEditar(null);
          addToast('success', `Fornecedor ${f.nome} salvo com sucesso!`, 'Cadastro');
          loadFornecedores(selectedEmpresaId);
          loadLogs();
        }}
        onError={(msg) => addToast('error', msg)}
      />

      {/* 13. Modal Cadastro/Edição de Cliente */}
      <ClienteModal
        isOpen={isClienteModalOpen}
        onClose={() => {
          setIsClienteModalOpen(false);
          setSelectedClienteEditar(null);
        }}
        cliente={selectedClienteEditar}
        empresaId={selectedEmpresaId}
        onSuccess={(c) => {
          setIsClienteModalOpen(false);
          setSelectedClienteEditar(null);
          addToast('success', `Cliente ${c.nome} salvo com sucesso!`, 'Cadastro');
          loadClientes(selectedEmpresaId);
          loadLogs();
        }}
        onError={(msg) => addToast('error', msg)}
      />

      {/* 14. Modal Cadastro/Edição de Empresa */}
      <EmpresaModal
        isOpen={isEmpresaModalOpen}
        onClose={() => {
          setIsEmpresaModalOpen(false);
          setSelectedEmpresaEditar(null);
        }}
        empresa={selectedEmpresaEditar}
        onSuccess={(emp) => {
          setIsEmpresaModalOpen(false);
          setSelectedEmpresaEditar(null);
          addToast('success', `Empresa ${emp.razao_social} salva com sucesso!`, 'Cadastro');
          loadEmpresas();
          loadLogs();
        }}
        onError={(msg) => addToast('error', msg)}
      />

      {/* 15. Modal Zerar Dados do Sistema */}
      <ZerarDadosModal
        isOpen={isZerarDadosModalOpen}
        onClose={() => setIsZerarDadosModalOpen(false)}
        empresaAtiva={currentEmpresaObj}
        onSucesso={(empAtualizada) => {
          loadEmpresas();
          if (empAtualizada) {
            setSelectedEmpresaId(empAtualizada.id);
          }
          loadInitialData(selectedEmpresaId);
          loadLogs();
        }}
        onToast={(type, msg) => addToast(type, msg)}
      />
    </div>
  );
}
