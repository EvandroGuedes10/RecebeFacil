import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './server/config/database.js';
import { dbService } from './server/database/index.js';
import { nfeService } from './server/modules/nfe/nfe.service.js';
import { parcelasService } from './server/modules/parcelas/parcelas.service.js';
import { clientesService } from './server/modules/clientes/clientes.service.js';
import { fornecedoresService } from './server/modules/fornecedores/fornecedores.service.js';
import { contasPagarService } from './server/modules/contas-pagar/contas-pagar.service.js';
import { nfeEntradaService } from './server/modules/nfe-entrada/nfe-entrada.service.js';
import { fluxoCaixaService } from './server/modules/fluxo-caixa/fluxo-caixa.service.js';
import { empresasService } from './server/modules/empresas/empresas.service.js';
import { usuariosService } from './server/modules/usuarios/usuarios.service.js';
import { logsService } from './server/modules/logs/logs.service.js';
import { relatoriosService } from './server/modules/relatorios/relatorios.service.js';
import { SAMPLE_NFES } from './server/sample-xmls/samples.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Configuração de Middlewares para JSON e XML
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.text({ type: ['application/xml', 'text/xml'], limit: '50mb' }));

// Multer para upload de arquivos XML
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 35 * 1024 * 1024 },
});

// Middleware de Sessão / Usuário
app.use((req, res, next) => {
  const userIdHeader = req.headers['x-usuario-id'];
  const userNameHeader = req.headers['x-usuario-nome'];
  if (userIdHeader) {
    (req as any).usuarioId = Number(userIdHeader);
    (req as any).usuarioNome = decodeURIComponent(String(userNameHeader || 'Usuário'));
  } else {
    (req as any).usuarioId = 1;
    (req as any).usuarioNome = 'Evandro Guedes';
  }
  next();
});

// ============================================================================
// HEALTH CHECK
// ============================================================================
app.get('/api/health', async (req: Request, res: Response) => {
  const dbHealth = await dbService.getHealth();
  return res.json({
    status: 'ok',
    database: {
      connected: dbHealth.connected,
      type: dbHealth.type,
      latencyMs: dbHealth.latencyMs,
      pool: {
        total: dbHealth.poolTotal,
        idle: dbHealth.poolIdle,
        waiting: dbHealth.poolWaiting,
      },
    },
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// 1. AUTENTICAÇÃO
// ============================================================================
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;
    const resultado = usuariosService.autenticar(email, senha);
    return res.json(resultado);
  } catch (error: any) {
    return res.status(401).json({ sucesso: false, erro: error.message });
  }
});

app.post('/api/auth/recuperar-senha', (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const resultado = usuariosService.recuperarSenha(email);
    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const usuarioId = (req as any).usuarioId;
  const usuarioNome = (req as any).usuarioNome;
  db.log(usuarioId, usuarioNome, 'LOGOUT', `Usuário ${usuarioNome} encerrou a sessão.`);
  return res.json({ sucesso: true, mensagem: 'Logout realizado com sucesso.' });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const usuarioId = (req as any).usuarioId || 1;
  try {
    const usuario = usuariosService.buscarPorId(usuarioId);
    return res.json(usuario);
  } catch (err: any) {
    return res.status(404).json({ erro: 'Usuário não encontrado.' });
  }
});

// ============================================================================
// 2. MÓDULO NF-E (SAÍDA / VENDAS)
// ============================================================================
app.post('/api/nfe/importar-xml', async (req: Request, res: Response) => {
  try {
    const { xml, empresaId, sobrescreverSeExistir } = req.body;
    const xmlContent = typeof req.body === 'string' ? req.body : xml;

    if (!xmlContent) {
      return res.status(400).json({ sucesso: false, erro: 'Conteúdo XML não fornecido.' });
    }

    const resultado = await nfeService.importarXml(xmlContent, {
      empresaId: empresaId ? Number(empresaId) : undefined,
      usuarioId: (req as any).usuarioId,
      usuarioNome: (req as any).usuarioNome,
      sobrescreverSeExistir: Boolean(sobrescreverSeExistir),
    });

    return res.status(200).json(resultado);
  } catch (error: any) {
    return res.status(400).json({ sucesso: false, erro: error.message || 'Erro ao processar XML de NF-e.' });
  }
});

app.get('/api/nfe/exemplos', (req: Request, res: Response) => {
  return res.json(SAMPLE_NFES);
});

app.get('/api/nfe', (req: Request, res: Response) => {
  const { empresaId, busca, clienteId } = req.query;
  const notas = nfeService.listarNotas(empresaId ? Number(empresaId) : undefined);
  return res.json(notas);
});

app.get('/api/nfe/notas', (req: Request, res: Response) => {
  const { empresaId } = req.query;
  const notas = nfeService.listarNotas(empresaId ? Number(empresaId) : undefined);
  return res.json(notas);
});

app.get('/api/nfe/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const nota = db.notas_fiscais.find((n) => n.id === id);
  if (!nota) return res.status(404).json({ erro: 'Nota Fiscal não encontrada.' });
  return res.json(nota);
});

// ============================================================================
// 3. MÓDULO CONTAS A RECEBER & PARCELAS
// ============================================================================
app.get('/api/parcelas', (req: Request, res: Response) => {
  const { empresaId, status, clienteId, categoria, origem, dataInicio, dataFim, busca } = req.query;
  const lista = parcelasService.listar({
    empresaId: empresaId ? Number(empresaId) : undefined,
    status: status ? String(status) : undefined,
    categoria: categoria ? String(categoria) : undefined,
    origem: origem ? String(origem) : undefined,
    clienteId: clienteId ? Number(clienteId) : undefined,
    dataInicio: dataInicio ? String(dataInicio) : undefined,
    dataFim: dataFim ? String(dataFim) : undefined,
    busca: busca ? String(busca) : undefined,
  });
  return res.json(lista);
});

app.get('/api/parcelas/:id', (req: Request, res: Response) => {
  try {
    const parcela = parcelasService.buscarPorId(Number(req.params.id));
    if (!parcela) return res.status(404).json({ erro: 'Parcela não encontrada.' });
    return res.json(parcela);
  } catch (error: any) {
    return res.status(404).json({ erro: error.message });
  }
});

app.post('/api/parcelas/manual', (req: Request, res: Response) => {
  try {
    const resultado = parcelasService.criarManual(
      req.body,
      (req as any).usuarioId,
      (req as any).usuarioNome
    );
    return res.status(201).json({ sucesso: true, parcelas: resultado, mensagem: 'Lançamento a receber criado com sucesso.' });
  } catch (error: any) {
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
});

app.post('/api/parcelas/:id/baixar', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const resultado = parcelasService.baixar(
      id,
      req.body,
      (req as any).usuarioId,
      (req as any).usuarioNome
    );
    return res.json({ sucesso: true, parcela: resultado, mensagem: 'Recebimento baixado com sucesso.' });
  } catch (error: any) {
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
});

app.post('/api/parcelas/:id/estornar', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const resultado = parcelasService.estornar(
      id,
      (req as any).usuarioId,
      (req as any).usuarioNome
    );
    return res.json({ sucesso: true, parcela: resultado, mensagem: 'Baixa estornada com sucesso.' });
  } catch (error: any) {
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
});

app.put('/api/parcelas/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const atualizada = parcelasService.atualizar(
      id,
      req.body,
      (req as any).usuarioId,
      (req as any).usuarioNome
    );
    return res.json({ sucesso: true, parcela: atualizada, mensagem: 'Título atualizado com sucesso.' });
  } catch (error: any) {
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
});

// ============================================================================
// 4. MÓDULO FORNECEDORES
// ============================================================================
app.get('/api/fornecedores', (req: Request, res: Response) => {
  const { empresaId } = req.query;
  const lista = fornecedoresService.listar(empresaId ? Number(empresaId) : undefined);
  return res.json(lista);
});

app.get('/api/fornecedores/:id', (req: Request, res: Response) => {
  const fornecedor = fornecedoresService.buscarPorId(Number(req.params.id));
  if (!fornecedor) return res.status(404).json({ erro: 'Fornecedor não encontrado.' });
  return res.json(fornecedor);
});

app.post('/api/fornecedores', (req: Request, res: Response) => {
  try {
    const novo = fornecedoresService.criar(req.body, (req as any).usuarioId, (req as any).usuarioNome);
    return res.status(201).json(novo);
  } catch (error: any) {
    return res.status(400).json({ erro: error.message });
  }
});

app.put('/api/fornecedores/:id', (req: Request, res: Response) => {
  try {
    const atualizado = fornecedoresService.atualizar(
      Number(req.params.id),
      req.body,
      (req as any).usuarioId,
      (req as any).usuarioNome
    );
    return res.json(atualizado);
  } catch (error: any) {
    return res.status(400).json({ erro: error.message });
  }
});

app.delete('/api/fornecedores/:id', (req: Request, res: Response) => {
  try {
    const sucesso = fornecedoresService.excluir(
      Number(req.params.id),
      (req as any).usuarioId,
      (req as any).usuarioNome
    );
    return res.json({ sucesso, mensagem: 'Fornecedor desativado com sucesso.' });
  } catch (error: any) {
    return res.status(400).json({ erro: error.message });
  }
});

// ============================================================================
// 5. MÓDULO CONTAS A PAGAR
// ============================================================================
app.get('/api/contas-pagar', (req: Request, res: Response) => {
  const { empresaId, fornecedorId, status, categoria, origem, dataInicio, dataFim, busca } = req.query;
  const lista = contasPagarService.listar({
    empresaId: empresaId ? Number(empresaId) : undefined,
    fornecedorId: fornecedorId ? Number(fornecedorId) : undefined,
    status: status ? String(status) : undefined,
    categoria: categoria ? String(categoria) : undefined,
    origem: origem ? String(origem) : undefined,
    dataInicio: dataInicio ? String(dataInicio) : undefined,
    dataFim: dataFim ? String(dataFim) : undefined,
    busca: busca ? String(busca) : undefined,
  });
  return res.json(lista);
});

app.get('/api/contas-pagar/:id', (req: Request, res: Response) => {
  const cp = contasPagarService.buscarPorId(Number(req.params.id));
  if (!cp) return res.status(404).json({ erro: 'Conta a pagar não encontrada.' });
  return res.json(cp);
});

app.post('/api/contas-pagar/manual', (req: Request, res: Response) => {
  try {
    const resultado = contasPagarService.criarManual(
      req.body,
      (req as any).usuarioId,
      (req as any).usuarioNome
    );
    return res.status(201).json({ sucesso: true, contas: resultado, mensagem: 'Lançamento a pagar criado com sucesso.' });
  } catch (error: any) {
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
});

app.post('/api/contas-pagar/:id/baixar', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const resultado = contasPagarService.baixar(
      id,
      req.body,
      (req as any).usuarioId,
      (req as any).usuarioNome
    );
    return res.json({ sucesso: true, conta: resultado, mensagem: 'Pagamento baixado com sucesso.' });
  } catch (error: any) {
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
});

app.post('/api/contas-pagar/:id/estornar', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const resultado = contasPagarService.estornar(
      id,
      (req as any).usuarioId,
      (req as any).usuarioNome
    );
    return res.json({ sucesso: true, conta: resultado, mensagem: 'Pagamento estornado com sucesso.' });
  } catch (error: any) {
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
});

app.put('/api/contas-pagar/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const atualizada = contasPagarService.atualizar(
      id,
      req.body,
      (req as any).usuarioId,
      (req as any).usuarioNome
    );
    return res.json({ sucesso: true, conta: atualizada, mensagem: 'Conta atualizada com sucesso.' });
  } catch (error: any) {
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
});

app.delete('/api/contas-pagar/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    contasPagarService.excluir(id, (req as any).usuarioId, (req as any).usuarioNome);
    return res.json({ sucesso: true, mensagem: 'Conta a pagar excluída.' });
  } catch (error: any) {
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
});

// ============================================================================
// 6. MÓDULO NOTAS DE ENTRADA & IMPORTAÇÃO XML COMPRAS
// ============================================================================
app.post('/api/nfe-entrada/importar-xml', (req: Request, res: Response) => {
  try {
    const { xml, empresaId } = req.body;
    const xmlContent = typeof req.body === 'string' ? req.body : xml;
    if (!xmlContent) {
      return res.status(400).json({ sucesso: false, erro: 'Conteúdo XML não fornecido.' });
    }

    const resultado = nfeEntradaService.importarXml(
      xmlContent,
      empresaId ? Number(empresaId) : 1,
      (req as any).usuarioId,
      (req as any).usuarioNome
    );

    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
});

app.post('/api/nfe-entrada/importar-multiplos', (req: Request, res: Response) => {
  try {
    const { xmls, empresaId } = req.body;
    if (!Array.isArray(xmls) || xmls.length === 0) {
      return res.status(400).json({ sucesso: false, erro: 'Nenhum XML enviado na lista.' });
    }

    const resultado = nfeEntradaService.importarMultiplos(
      xmls,
      empresaId ? Number(empresaId) : 1,
      (req as any).usuarioId,
      (req as any).usuarioNome
    );

    return res.json({ sucesso: true, ...resultado });
  } catch (error: any) {
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
});

app.get('/api/nfe-entrada/notas', (req: Request, res: Response) => {
  const { empresaId } = req.query;
  const notas = nfeEntradaService.listarNotas(empresaId ? Number(empresaId) : undefined);
  return res.json(notas);
});

// ============================================================================
// 7. FLUXO DE CAIXA
// ============================================================================
app.get('/api/fluxo-caixa', (req: Request, res: Response) => {
  const { visao, empresaId } = req.query;
  const tipoVisao = (visao === 'diario' || visao === 'semanal' || visao === 'mensal') ? visao : 'mensal';
  const fluxo = fluxoCaixaService.obterFluxo(
    tipoVisao,
    empresaId ? Number(empresaId) : undefined
  );
  return res.json(fluxo);
});

// ============================================================================
// 8. CLIENTES
// ============================================================================
app.get('/api/clientes', (req: Request, res: Response) => {
  const { empresaId, busca, incluirInativos } = req.query;
  const lista = clientesService.listar(
    empresaId ? Number(empresaId) : undefined,
    busca ? String(busca) : undefined,
    incluirInativos === 'true'
  );
  return res.json(lista);
});

app.get('/api/clientes/:id', (req: Request, res: Response) => {
  try {
    const cliente = clientesService.buscarPorId(Number(req.params.id));
    return res.json(cliente);
  } catch (error: any) {
    return res.status(404).json({ erro: error.message });
  }
});

app.post('/api/clientes', (req: Request, res: Response) => {
  try {
    const novo = clientesService.criar(req.body, (req as any).usuarioId, (req as any).usuarioNome);
    return res.status(201).json(novo);
  } catch (error: any) {
    return res.status(400).json({ erro: error.message });
  }
});

app.put('/api/clientes/:id', (req: Request, res: Response) => {
  try {
    const atualizado = clientesService.atualizar(
      Number(req.params.id),
      req.body,
      (req as any).usuarioId,
      (req as any).usuarioNome
    );
    return res.json(atualizado);
  } catch (error: any) {
    return res.status(400).json({ erro: error.message });
  }
});

app.delete('/api/clientes/:id', (req: Request, res: Response) => {
  try {
    const resultado = clientesService.excluirLogica(
      Number(req.params.id),
      (req as any).usuarioId,
      (req as any).usuarioNome
    );
    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({ erro: error.message });
  }
});

// ============================================================================
// 9. EMPRESAS
// ============================================================================
app.get('/api/empresas', (req: Request, res: Response) => {
  const { incluirInativas } = req.query;
  return res.json(empresasService.listar(incluirInativas === 'true'));
});

app.get('/api/empresas/:id', (req: Request, res: Response) => {
  try {
    const emp = empresasService.buscarPorId(Number(req.params.id));
    return res.json(emp);
  } catch (error: any) {
    return res.status(404).json({ erro: error.message });
  }
});

app.post('/api/empresas', (req: Request, res: Response) => {
  try {
    const nova = empresasService.criar(req.body, (req as any).usuarioId, (req as any).usuarioNome);
    return res.status(201).json(nova);
  } catch (error: any) {
    return res.status(400).json({ erro: error.message });
  }
});

app.put('/api/empresas/:id', (req: Request, res: Response) => {
  try {
    const atualizada = empresasService.atualizar(
      Number(req.params.id),
      req.body,
      (req as any).usuarioId,
      (req as any).usuarioNome
    );
    return res.json(atualizada);
  } catch (error: any) {
    return res.status(400).json({ erro: error.message });
  }
});

app.delete('/api/empresas/:id', (req: Request, res: Response) => {
  try {
    const resultado = empresasService.excluirLogica(
      Number(req.params.id),
      (req as any).usuarioId,
      (req as any).usuarioNome
    );
    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({ erro: error.message });
  }
});

// ============================================================================
// 10. AUDITORIA & LOGS
// ============================================================================
app.get('/api/logs', (req: Request, res: Response) => {
  const { acao, busca, limite } = req.query;
  const logs = logsService.listar(
    acao ? String(acao) : undefined,
    busca ? String(busca) : undefined,
    limite ? Number(limite) : 200
  );
  return res.json(logs);
});

// ============================================================================
// 11. DASHBOARD & RELATÓRIOS
// ============================================================================
app.get('/api/relatorios/dashboard', (req: Request, res: Response) => {
  const { empresaId } = req.query;
  const stats = relatoriosService.getDashboardStats(empresaId ? Number(empresaId) : undefined);
  return res.json(stats);
});

app.get('/api/relatorios/receitas-categoria', (req: Request, res: Response) => {
  const { empresaId, dataInicio, dataFim } = req.query;
  const dados = relatoriosService.getReceitasPorCategoria(
    empresaId ? Number(empresaId) : undefined,
    dataInicio ? String(dataInicio) : undefined,
    dataFim ? String(dataFim) : undefined
  );
  return res.json(dados);
});

app.get('/api/relatorios/despesas-categoria', (req: Request, res: Response) => {
  const { empresaId, dataInicio, dataFim } = req.query;
  const dados = relatoriosService.getDespesasPorCategoria(
    empresaId ? Number(empresaId) : undefined,
    dataInicio ? String(dataInicio) : undefined,
    dataFim ? String(dataFim) : undefined
  );
  return res.json(dados);
});

app.get('/api/relatorios/inadimplencia', (req: Request, res: Response) => {
  const { empresaId } = req.query;
  db.autoUpdateOverdueStatus();

  let receberAtrasadas = db.parcelas_receber.filter((p) => p.status === 'ATRASADO');
  let pagarAtrasadas = db.contas_pagar.filter((cp) => cp.status === 'ATRASADO');

  if (empresaId) {
    receberAtrasadas = receberAtrasadas.filter((p) => !p.empresa_id || p.empresa_id === Number(empresaId));
    pagarAtrasadas = pagarAtrasadas.filter((cp) => cp.empresa_id === Number(empresaId));
  }

  const totalInadimplenciaReceber = receberAtrasadas.reduce((acc, p) => acc + (p.valor_parcela - p.valor_recebido), 0);
  const totalInadimplenciaPagar = pagarAtrasadas.reduce((acc, cp) => acc + (cp.valor_parcela - cp.valor_pago), 0);

  return res.json({
    totalInadimplenciaReceber,
    totalInadimplenciaPagar,
    receberAtrasadas,
    pagarAtrasadas,
  });
});

// ============================================================================
// 12. CATEGORIAS FINANCEIRAS (RECEITAS & DESPESAS)
// ============================================================================
app.get('/api/categorias', (req: Request, res: Response) => {
  const { tipo } = req.query;
  let lista = db.categorias;
  if (tipo) {
    lista = lista.filter((c) => c.tipo.toUpperCase() === String(tipo).toUpperCase());
  }
  return res.json(lista);
});

app.post('/api/categorias', (req: Request, res: Response) => {
  try {
    const { tipo, nome } = req.body;
    if (!nome || !String(nome).trim()) {
      return res.status(400).json({ erro: 'O nome da categoria é obrigatório.' });
    }
    const tipoFinal: 'RECEITA' | 'DESPESA' = tipo?.toUpperCase() === 'DESPESA' ? 'DESPESA' : 'RECEITA';
    const nomeLimpo = String(nome).trim();

    const existe = db.categorias.find(
      (c) => c.tipo === tipoFinal && c.nome.toLowerCase() === nomeLimpo.toLowerCase()
    );
    if (existe) {
      return res.json(existe);
    }

    const novaCategoria = {
      id: db.getNextCategoriaId(),
      tipo: tipoFinal,
      nome: nomeLimpo,
      padrao: false,
      criado_em: new Date().toISOString(),
    };

    db.categorias.push(novaCategoria);
    db.log(
      (req as any).usuarioId,
      (req as any).usuarioNome,
      'CATEGORIA_CRIADA',
      `Nova categoria personalizada de ${tipoFinal} criada: "${novaCategoria.nome}".`
    );

    return res.status(201).json(novaCategoria);
  } catch (error: any) {
    return res.status(400).json({ erro: error.message });
  }
});

// ============================================================================
// 12. CONFIGURAÇÕES
// ============================================================================
app.get('/api/configuracoes', (req: Request, res: Response) => {
  return res.json(db.configuracoes);
});

app.post('/api/configuracoes', (req: Request, res: Response) => {
  db.configuracoes = { ...db.configuracoes, ...req.body };
  db.log(
    (req as any).usuarioId,
    (req as any).usuarioNome,
    'CONFIGURACOES_ATUALIZADAS',
    'Parâmetros do ERP atualizados com sucesso.'
  );
  return res.json({ sucesso: true, configuracoes: db.configuracoes });
});

// ============================================================================
// 13. ZERAR DADOS DO SISTEMA / RESET DE DADOS
// ============================================================================
app.post('/api/sistema/zerar-dados', async (req: Request, res: Response) => {
  try {
    const {
      empresaId,
      zerarMovimentacoes = true,
      zerarCadastros = true,
      zerarEmpresa = false,
      novaEmpresa,
    } = req.body;

    const targetEmpresaId = empresaId ? Number(empresaId) : undefined;

    db.zerarDados({
      empresaId: targetEmpresaId,
      zerarMovimentacoes: Boolean(zerarMovimentacoes),
      zerarCadastros: Boolean(zerarCadastros),
      zerarEmpresa: Boolean(zerarEmpresa),
      novaEmpresa,
    });

    if (dbService.isDbConnected()) {
      try {
        if (zerarMovimentacoes) {
          await dbService.query(
            'DELETE FROM parcelas_receber WHERE ($1::int IS NULL OR empresa_id = $1)',
            [targetEmpresaId || null]
          );
          await dbService.query(
            'DELETE FROM notas_fiscais WHERE ($1::int IS NULL OR empresa_id = $1)',
            [targetEmpresaId || null]
          );
        }
        if (zerarCadastros) {
          await dbService.query(
            'DELETE FROM clientes WHERE ($1::int IS NULL OR empresa_id = $1)',
            [targetEmpresaId || null]
          );
        }
        if (zerarEmpresa && novaEmpresa && targetEmpresaId) {
          await dbService.query(
            'UPDATE empresas SET razao_social = COALESCE($1, razao_social), cnpj = COALESCE($2, cnpj) WHERE id = $3',
            [novaEmpresa.razao_social || null, novaEmpresa.cnpj || null, targetEmpresaId]
          );
        }
      } catch (sqlErr: any) {
        console.warn('[PostgreSQL Zerar Dados Error]:', sqlErr.message);
      }
    }

    const empresaAtualizada = targetEmpresaId
      ? db.empresas.find((e) => e.id === targetEmpresaId)
      : db.empresas[0];

    return res.json({
      sucesso: true,
      mensagem: 'Base de dados zerada com sucesso!',
      empresa: empresaAtualizada,
    });
  } catch (error: any) {
    return res.status(400).json({ sucesso: false, erro: error.message || 'Erro ao zerar dados.' });
  }
});

// ============================================================================
// INICIALIZAÇÃO DO SERVIDOR COM VITE (DEV E PROD)
// ============================================================================
async function startServer() {
  dbService.initialize().catch((err) => {
    console.warn('[PostgreSQL Startup Check]:', err.message);
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    process.env.DISABLE_HMR = 'true';
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`[Recebe Fácil ERP] Servidor Financeiro ativo em http://localhost:${port}`);
  });
}

startServer();
