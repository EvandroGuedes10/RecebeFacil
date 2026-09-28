import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Calendar,
  Layers,
  FileText,
  Paperclip,
  Save,
  User,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Tag,
  Briefcase,
  Check,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Cliente, Fornecedor } from '../../types';
import { api } from '../../services/api';

interface NovoLancamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresaId: number;
  clientes: Cliente[];
  fornecedores: Fornecedor[];
  defaultTipo?: 'receber' | 'pagar';
  tipoPadrao?: 'receber' | 'pagar' | 'RECEBER' | 'PAGAR';
  onSuccess: (tipo?: any, total?: any) => void;
  onError: (msg: string) => void;
  onOpenNovoCliente?: () => void;
  onOpenNovoFornecedor?: () => void;
}

export const NovoLancamentoModal: React.FC<NovoLancamentoModalProps> = ({
  isOpen,
  onClose,
  empresaId,
  clientes,
  fornecedores,
  defaultTipo = 'receber',
  tipoPadrao,
  onSuccess,
  onError,
  onOpenNovoCliente,
  onOpenNovoFornecedor,
}) => {
  const initialTipo = tipoPadrao ? (tipoPadrao.toLowerCase() as 'receber' | 'pagar') : defaultTipo;
  const [tipo, setTipo] = useState<'receber' | 'pagar'>(initialTipo);
  const [entidadeId, setEntidadeId] = useState<string>('');
  const [descricao, setDescricao] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [centroCusto, setCentroCusto] = useState('Operacional');
  const [valorTotal, setValorTotal] = useState<number>(0);

  // Parcelamento Opcional
  const [temParcelamento, setTemParcelamento] = useState<boolean>(false);
  const [quantidadeParcelas, setQuantidadeParcelas] = useState<number>(2);
  const [primeiroVencimento, setPrimeiroVencimento] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [intervaloDias, setIntervaloDias] = useState<number>(30);

  // Categorias
  const [categoriasList, setCategoriasList] = useState<any[]>([]);
  const [categoria, setCategoria] = useState('');
  const [isCriandoCategoria, setIsCriandoCategoria] = useState(false);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);

  // Observações e Anexos
  const [observacoes, setObservacoes] = useState('');
  const [anexoNome, setAnexoNome] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Carregar categorias correspondentes ao tipo
  useEffect(() => {
    if (isOpen) {
      loadCategorias(tipo);
    }
  }, [isOpen, tipo]);

  const loadCategorias = async (tipoAtual: 'receber' | 'pagar') => {
    try {
      const tipoApi = tipoAtual === 'receber' ? 'RECEITA' : 'DESPESA';
      const dados = await api.categorias.listar(tipoApi);
      setCategoriasList(dados || []);
      if (dados && dados.length > 0 && !categoria) {
        setCategoria(dados[0].nome);
      }
    } catch {
      // Fallback padrão se offline
      if (tipoAtual === 'receber') {
        setCategoriasList([
          { id: 1, nome: 'Venda de Produtos / Mercadorias' },
          { id: 2, nome: 'Prestação de Serviços' },
          { id: 3, nome: 'Receitas Financeiras / Juros' },
          { id: 4, nome: 'Outras Receitas Operacionais' },
        ]);
        if (!categoria) setCategoria('Venda de Produtos / Mercadorias');
      } else {
        setCategoriasList([
          { id: 5, nome: 'Fornecedores e Matéria-Prima' },
          { id: 6, nome: 'Salários e Encargos' },
          { id: 7, nome: 'Aluguel e Condomínio' },
          { id: 8, nome: 'Impostos e Tributos Fiscais' },
          { id: 9, nome: 'Energia, Água e Telecom' },
          { id: 10, nome: 'Softwares e Infraestrutura TI' },
          { id: 11, nome: 'Outras Despesas Administrativas' },
        ]);
        if (!categoria) setCategoria('Fornecedores e Matéria-Prima');
      }
    }
  };

  const handleSalvarNovaCategoria = async () => {
    if (!novaCategoriaNome.trim()) return;
    setSalvandoCategoria(true);
    try {
      const tipoApi = tipo === 'receber' ? 'RECEITA' : 'DESPESA';
      const nova = await api.categorias.criar(tipoApi, novaCategoriaNome.trim());
      setCategoriasList((prev) => [...prev, nova]);
      setCategoria(nova.nome);
      setNovaCategoriaNome('');
      setIsCriandoCategoria(false);
    } catch (err: any) {
      onError(err.message || 'Erro ao criar categoria.');
    } finally {
      setSalvandoCategoria(false);
    }
  };

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnexoNome(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações obrigatórias especificadas pelo usuário:
    // Descrição, Categoria, Valor, Vencimento, Observação
    if (!descricao.trim()) {
      onError('O campo Descrição é obrigatório.');
      return;
    }
    if (!categoria.trim()) {
      onError('O campo Categoria é obrigatório.');
      return;
    }
    if (valorTotal <= 0) {
      onError('O campo Valor deve ser superior a R$ 0,00.');
      return;
    }
    if (!primeiroVencimento) {
      onError('A Data de Vencimento é obrigatória.');
      return;
    }
    if (!observacoes.trim()) {
      onError('O campo Observação é obrigatório.');
      return;
    }

    if (tipo === 'receber' && !entidadeId) {
      onError('Selecione o Cliente obrigatório.');
      return;
    }
    if (tipo === 'pagar' && !entidadeId) {
      onError('Selecione o Fornecedor obrigatório.');
      return;
    }

    const qtdParcelasEfetiva = temParcelamento ? Math.max(1, quantidadeParcelas) : 1;

    setLoading(true);
    try {
      if (tipo === 'receber') {
        await api.parcelas.criarManual({
          empresaId,
          clienteId: Number(entidadeId),
          descricao: descricao.trim(),
          numeroDocumento: numeroDocumento || undefined,
          valorTotal,
          quantidadeParcelas: qtdParcelasEfetiva,
          primeiroVencimento,
          intervaloDias: temParcelamento ? intervaloDias : 30,
          categoria: categoria.trim(),
          observacoes: observacoes.trim(),
          anexoNome: anexoNome || undefined,
        });
      } else {
        await api.contasPagar.criarManual({
          empresaId,
          fornecedorId: Number(entidadeId),
          descricao: descricao.trim(),
          centroCusto: centroCusto.trim(),
          numeroDocumento: numeroDocumento || undefined,
          valorTotal,
          quantidadeParcelas: qtdParcelasEfetiva,
          primeiroVencimento,
          intervaloDias: temParcelamento ? intervaloDias : 30,
          categoria: categoria.trim(),
          observacoes: observacoes.trim(),
          anexoNome: anexoNome || undefined,
        });
      }

      onSuccess(tipo, valorTotal);
      onClose();
    } catch (err: any) {
      onError(err.message || 'Erro ao registrar lançamento.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  };

  const qtdPreview = temParcelamento ? Math.max(1, quantidadeParcelas) : 1;
  const parcelasPreview = Array.from({ length: Math.min(qtdPreview, 12) }).map((_, i) => {
    const d = new Date(primeiroVencimento + 'T12:00:00');
    if (i > 0) d.setDate(d.getDate() + i * intervaloDias);
    const valorParcela = Math.round((valorTotal / qtdPreview) * 100) / 100;
    return {
      numero: i + 1,
      vencimento: d.toISOString().split('T')[0],
      valor: valorParcela,
    };
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Lançamento Financeiro Manual"
      subtitle="Cadastre títulos a receber ou a pagar com parcelamento automático e centro de custo"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Seletor de Tipo (Receber vs Pagar) */}
        <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setTipo('receber');
              setEntidadeId('');
              setCategoria('');
              loadCategorias('receber');
            }}
            className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tipo === 'receber'
                ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-400 shadow-xs border border-emerald-500/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <ArrowDownRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Conta a Receber (Receita)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTipo('pagar');
              setEntidadeId('');
              setCategoria('');
              loadCategorias('pagar');
            }}
            className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tipo === 'pagar'
                ? 'bg-white dark:bg-gray-700 text-amber-700 dark:text-amber-400 shadow-xs border border-amber-500/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Conta a Pagar (Despesa)</span>
          </button>
        </div>

        {/* Descrição Obrigatória */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Descrição do Lançamento <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder={
              tipo === 'receber'
                ? 'Ex: Prestação de serviços de consultoria - Contrato Mensal'
                : 'Ex: Pagamento mensal de licença de softwares e nuvem'
            }
            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Cliente / Fornecedor e Documento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {tipo === 'receber' ? 'Cliente / Devedor' : 'Fornecedor / Favorecido'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={entidadeId}
              onChange={(e) => setEntidadeId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">Selecione...</option>
              {tipo === 'receber'
                ? (clientes || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.cpf_cnpj ? `(${c.cpf_cnpj})` : ''}
                    </option>
                  ))
                : (fornecedores || []).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome} {f.cpf_cnpj ? `(${f.cpf_cnpj})` : ''}
                    </option>
                  ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Nº do Documento / Contrato / Fatura
            </label>
            <input
              type="text"
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
              placeholder="Ex: FAT-2026-001 ou CTR-98"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Centro de Custo (Se for Pagar) */}
        {tipo === 'pagar' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Centro de Custo <span className="text-red-500">*</span>
              </label>
              <select
                value={centroCusto}
                onChange={(e) => setCentroCusto(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Operacional">Operacional</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Comercial / Vendas">Comercial / Vendas</option>
                <option value="Financeiro">Financeiro</option>
                <option value="TI e Tecnologia">TI e Tecnologia</option>
                <option value="Marketing">Marketing</option>
                <option value="Diretoria">Diretoria</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Personalizar Centro de Custo
              </label>
              <input
                type="text"
                value={centroCusto}
                onChange={(e) => setCentroCusto(e.target.value)}
                placeholder="Ou digite o nome do centro de custo..."
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Categorias com Opção de Cadastro Personalizado */}
        <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Categoria Financeira <span className="text-red-500">*</span></span>
            </label>
            <button
              type="button"
              onClick={() => setIsCriandoCategoria(!isCriandoCategoria)}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>{isCriandoCategoria ? 'Cancelar Nova Categoria' : '+ Nova Categoria Personalizada'}</span>
            </button>
          </div>

          {isCriandoCategoria ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={novaCategoriaNome}
                onChange={(e) => setNovaCategoriaNome(e.target.value)}
                placeholder={`Nome da nova categoria de ${tipo === 'receber' ? 'Receita' : 'Despesa'}...`}
                className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-blue-400 rounded-md text-gray-900 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSalvarNovaCategoria}
                disabled={salvandoCategoria || !novaCategoriaNome.trim()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salvar Categoria</span>
              </button>
            </div>
          ) : (
            <select
              required
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">Selecione a Categoria...</option>
              {categoriasList.map((cat) => (
                <option key={cat.id} value={cat.nome}>
                  {cat.nome}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Valores e Vencimento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Valor Total (R$) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-xs font-semibold">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={valorTotal || ''}
                onChange={(e) => setValorTotal(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Data de Vencimento {temParcelamento && '(1ª Parcela)'} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={primeiroVencimento}
              onChange={(e) => setPrimeiroVencimento(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Bloco de Parcelamento Opcional */}
        <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="check-parcelamento"
                checked={temParcelamento}
                onChange={(e) => setTemParcelamento(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="check-parcelamento" className="text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer">
                Habilitar Parcelamento (Opcional)
              </label>
            </div>
            <span className="text-[11px] text-gray-500">
              {temParcelamento ? `${quantidadeParcelas} parcelas selecionadas` : 'À vista (1 parcela)'}
            </span>
          </div>

          {temParcelamento && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Quantidade de Parcelas
                </label>
                <select
                  value={quantidadeParcelas}
                  onChange={(e) => setQuantidadeParcelas(parseInt(e.target.value) || 2)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value={2}>2x de {formatCurrency(valorTotal / 2)}</option>
                  <option value={3}>3x de {formatCurrency(valorTotal / 3)}</option>
                  <option value={4}>4x de {formatCurrency(valorTotal / 4)}</option>
                  <option value={5}>5x de {formatCurrency(valorTotal / 5)}</option>
                  <option value={6}>6x de {formatCurrency(valorTotal / 6)}</option>
                  <option value={10}>10x de {formatCurrency(valorTotal / 10)}</option>
                  <option value={12}>12x de {formatCurrency(valorTotal / 12)}</option>
                  <option value={24}>24x de {formatCurrency(valorTotal / 24)}</option>
                  <option value={36}>36x de {formatCurrency(valorTotal / 36)}</option>
                  <option value={48}>48x de {formatCurrency(valorTotal / 48)}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Intervalo entre Parcelas
                </label>
                <select
                  value={intervaloDias}
                  onChange={(e) => setIntervaloDias(parseInt(e.target.value) || 30)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value={30}>Mensal (30 em 30 dias)</option>
                  <option value={15}>Quinzenal (15 dias)</option>
                  <option value={7}>Semanal (7 dias)</option>
                </select>
              </div>
            </div>
          )}

          {/* Prévia automática das Parcelas */}
          {temParcelamento && valorTotal > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">
                Cronograma Gerado Automaticamente ({qtdPreview}x de {formatCurrency(valorTotal / qtdPreview)})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-28 overflow-y-auto custom-scrollbar">
                {parcelasPreview.map((p) => (
                  <div
                    key={p.numero}
                    className="p-1.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex justify-between items-center text-[11px]"
                  >
                    <span className="font-semibold text-gray-700 dark:text-gray-300">P.{p.numero}</span>
                    <span className="text-gray-500">{p.vencimento.slice(5)}</span>
                    <span className="font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(p.valor)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Observações Obrigatórias */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Observações e Justificativa <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={2}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Descreva detalhes adicionais, condições comerciais, justificativa contábil..."
            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Anexo Opcional */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Comprovante / Contrato em Anexo (Opcional)
          </label>
          <div className="relative flex items-center">
            <input
              type="file"
              id="anexo-upload"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="anexo-upload"
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 cursor-pointer truncate"
            >
              <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{anexoNome || 'Selecionar documento (PDF, Imagem, Contrato)...'}</span>
            </label>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Gravando no Banco...' : 'Criar Lançamento'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
