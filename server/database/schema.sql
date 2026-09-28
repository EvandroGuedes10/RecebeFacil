-- ============================================================================
-- PROJETO: RECEBE FÁCIL - SISTEMA DE GESTÃO FINANCEIRA E NF-E
-- BANCO DE DADOS: PostgreSQL 14+
-- DESCRIÇÃO: Estrutura relacional completa para importação de NF-e, 
--            geração de duplicatas/parcelas a receber, clientes e auditoria.
-- ============================================================================

-- Habilitar extensão para geração de UUIDs (se necessário)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABELA: EMPRESAS (Multi-empresa / Emitente)
-- ============================================================================
CREATE TABLE IF NOT EXISTS empresas (
    id BIGSERIAL PRIMARY KEY,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    inscricao_estadual VARCHAR(30),
    email VARCHAR(150),
    telefone VARCHAR(30),
    endereco VARCHAR(255),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Comentários na tabela e colunas
COMMENT ON TABLE empresas IS 'Cadastro de empresas emitentes e filiais usuárias do Recebe Fácil';
COMMENT ON COLUMN empresas.cnpj IS 'CNPJ formatado ou numérico (14 dígitos), único por registro';

-- ============================================================================
-- 2. TABELA: USUARIOS (Autenticação e Perfis)
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(50) NOT NULL DEFAULT 'FINANCEIRO', -- ADMIN, FINANCEIRO, CONSULTOR
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE usuarios IS 'Usuários com acesso ao sistema e vínculo com empresa';

-- ============================================================================
-- 3. TABELA: CLIENTES (Destinatários das NF-e)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clientes (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    telefone VARCHAR(30),
    endereco VARCHAR(255),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_empresa_cpf_cnpj UNIQUE (empresa_id, cpf_cnpj)
);

COMMENT ON TABLE clientes IS 'Cadastro de clientes tomadores/destinatários das notas fiscais';

-- ============================================================================
-- 4. TABELA: NOTAS_FISCAIS (Documentos Fiscais Eletrônicos Importados)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notas_fiscais (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    cliente_id BIGINT NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    chave_acesso VARCHAR(44) NOT NULL UNIQUE,
    numero_nota VARCHAR(20) NOT NULL,
    serie VARCHAR(10) NOT NULL DEFAULT '1',
    data_emissao TIMESTAMP WITH TIME ZONE NOT NULL,
    valor_total NUMERIC(15, 2) NOT NULL CHECK (valor_total >= 0),
    caminho_xml TEXT,
    protocolo_autorizacao VARCHAR(60),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE notas_fiscais IS 'Armazena o cabeçalho e metadados fiscais da NF-e processada';
COMMENT ON COLUMN notas_fiscais.chave_acesso IS 'Chave de 44 dígitos da NF-e emitida pela SEFAZ';

-- ============================================================================
-- 5. TABELA: PARCELAS_RECEBER (Títulos Financeiros Gerados Automaticamente)
-- ============================================================================
CREATE TABLE IF NOT EXISTS parcelas_receber (
    id BIGSERIAL PRIMARY KEY,
    nota_id BIGINT NOT NULL REFERENCES notas_fiscais(id) ON DELETE CASCADE,
    numero_parcela INTEGER NOT NULL CHECK (numero_parcela > 0),
    data_vencimento DATE NOT NULL,
    valor_parcela NUMERIC(15, 2) NOT NULL CHECK (valor_parcela > 0),
    valor_recebido NUMERIC(15, 2) DEFAULT 0.00 CHECK (valor_recebido >= 0),
    data_recebimento DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE', -- PENDENTE, PAGO, ATRASADO, PARCIAL, CANCELADO
    observacoes TEXT,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_nota_parcela UNIQUE (nota_id, numero_parcela)
);

COMMENT ON TABLE parcelas_receber IS 'Títulos financeiros e duplicatas a receber originadas da NF-e';

-- ============================================================================
-- 6. TABELA: LOGS_SISTEMA (Auditoria e Rastreabilidade)
-- ============================================================================
CREATE TABLE IF NOT EXISTS logs_sistema (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    acao VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE logs_sistema IS 'Trilha de auditoria completa de todas as operações críticas do sistema';

-- ============================================================================
-- ÍNDICES DE ALTA PERFORMANCE (Preparado para milhões de registros)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_notas_chave ON notas_fiscais(chave_acesso);
CREATE INDEX IF NOT EXISTS idx_notas_empresa ON notas_fiscais(empresa_id);
CREATE INDEX IF NOT EXISTS idx_notas_cliente ON notas_fiscais(cliente_id);
CREATE INDEX IF NOT EXISTS idx_notas_emissao ON notas_fiscais(data_emissao);
CREATE INDEX IF NOT EXISTS idx_notas_numero ON notas_fiscais(numero_nota);
CREATE INDEX IF NOT EXISTS idx_parcelas_nota ON parcelas_receber(nota_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_vencimento ON parcelas_receber(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_parcelas_status ON parcelas_receber(status);
CREATE INDEX IF NOT EXISTS idx_parcelas_vencimento_status ON parcelas_receber(data_vencimento, status);
CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs_sistema(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_data ON logs_sistema(data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_logs_acao ON logs_sistema(acao);

-- ============================================================================
-- TRIGGERS: Atualização Automática de 'atualizado_em'
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_empresas_atualizado_em ON empresas;
CREATE TRIGGER trg_empresas_atualizado_em
    BEFORE UPDATE ON empresas
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualizar_timestamp();

-- ============================================================================
-- VIEWS ANALÍTICAS PARA DASHBOARD E RELATÓRIOS FINANCEIROS
-- ============================================================================

-- 1. Visão Geral de Títulos com Dados do Cliente e NF-e
CREATE OR REPLACE VIEW vw_titulos_detalhados AS
SELECT 
    p.id AS parcela_id,
    p.numero_parcela,
    p.data_vencimento,
    p.valor_parcela,
    p.valor_recebido,
    (p.valor_parcela - COALESCE(p.valor_recebido, 0)) AS saldo_devedor,
    p.data_recebimento,
    CASE 
        WHEN p.status = 'PENDENTE' AND p.data_vencimento < CURRENT_DATE THEN 'ATRASADO'
        ELSE p.status
    END AS status_atual,
    p.observacoes,
    n.id AS nota_id,
    n.numero_nota,
    n.serie,
    n.chave_acesso,
    n.data_emissao,
    n.valor_total AS valor_total_nota,
    c.id AS cliente_id,
    c.nome AS cliente_nome,
    c.cpf_cnpj AS cliente_cpf_cnpj,
    e.id AS empresa_id,
    e.razao_social AS empresa_razao_social
FROM parcelas_receber p
INNER JOIN notas_fiscais n ON p.nota_id = n.id
INNER JOIN clientes c ON n.cliente_id = c.id
INNER JOIN empresas e ON n.empresa_id = e.id;

-- 2. Resumo de Inadimplência e Faturamento por Cliente
CREATE OR REPLACE VIEW vw_resumo_clientes AS
SELECT 
    c.id AS cliente_id,
    c.empresa_id,
    c.nome,
    c.cpf_cnpj,
    COUNT(DISTINCT n.id) AS total_notas,
    COALESCE(SUM(n.valor_total), 0) AS total_faturado,
    COALESCE(SUM(CASE WHEN p.status = 'PAGO' THEN p.valor_recebido ELSE 0 END), 0) AS total_recebido,
    COALESCE(SUM(CASE WHEN p.status IN ('PENDENTE', 'PARCIAL', 'ATRASADO') AND p.data_vencimento < CURRENT_DATE THEN (p.valor_parcela - COALESCE(p.valor_recebido, 0)) ELSE 0 END), 0) AS total_inadimplente,
    COALESCE(SUM(CASE WHEN p.status IN ('PENDENTE', 'PARCIAL') AND p.data_vencimento >= CURRENT_DATE THEN (p.valor_parcela - COALESCE(p.valor_recebido, 0)) ELSE 0 END), 0) AS total_a_vencer
FROM clientes c
LEFT JOIN notas_fiscais n ON c.id = n.cliente_id
LEFT JOIN parcelas_receber p ON n.id = p.nota_id
GROUP BY c.id, c.empresa_id, c.nome, c.cpf_cnpj;
