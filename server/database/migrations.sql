-- =====================================================================
-- RECEBE FÁCIL - SCHEMA & MIGRATIONS POSTGRESQL (IDEMPOTENTE)
-- =====================================================================

-- Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Função genérica para atualização automática de updated_at
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 1. TABELA: EMPRESAS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255),
  cnpj VARCHAR(18) NOT NULL UNIQUE,
  inscricao_estadual VARCHAR(30),
  email VARCHAR(150),
  telefone VARCHAR(30),
  endereco VARCHAR(255),
  logradouro VARCHAR(255),
  numero VARCHAR(20),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_empresas_updated_at ON empresas;
CREATE TRIGGER trg_empresas_updated_at
BEFORE UPDATE ON empresas
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ---------------------------------------------------------------------
-- 2. TABELA: USUARIOS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  perfil VARCHAR(30) NOT NULL DEFAULT 'OPERADOR',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acesso TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_usuarios_perfil CHECK (perfil IN ('ADMIN', 'OPERADOR', 'CONSULTOR'))
);

DROP TRIGGER IF EXISTS trg_usuarios_updated_at ON usuarios;
CREATE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ---------------------------------------------------------------------
-- 3. TABELA: CLIENTES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  cpf_cnpj VARCHAR(18) NOT NULL,
  email VARCHAR(150),
  telefone VARCHAR(30),
  endereco VARCHAR(255),
  logradouro VARCHAR(255),
  numero VARCHAR(20),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_empresa_cliente_documento UNIQUE (empresa_id, cpf_cnpj)
);

DROP TRIGGER IF EXISTS trg_clientes_updated_at ON clientes;
CREATE TRIGGER trg_clientes_updated_at
BEFORE UPDATE ON clientes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ---------------------------------------------------------------------
-- 4. TABELA: FORNECEDORES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  cpf_cnpj VARCHAR(18) NOT NULL,
  email VARCHAR(150),
  telefone VARCHAR(30),
  endereco VARCHAR(255),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  categoria VARCHAR(100),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_empresa_fornecedor_documento UNIQUE (empresa_id, cpf_cnpj)
);

DROP TRIGGER IF EXISTS trg_fornecedores_updated_at ON fornecedores;
CREATE TRIGGER trg_fornecedores_updated_at
BEFORE UPDATE ON fornecedores
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ---------------------------------------------------------------------
-- 5. TABELA: CATEGORIAS_FINANCEIRAS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('RECEITA', 'DESPESA')),
  nome VARCHAR(100) NOT NULL,
  padrao BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 6. TABELA: NOTAS_FISCAIS (SAÍDA / VENDAS)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notas_fiscais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  chave_acesso VARCHAR(44) NOT NULL UNIQUE,
  numero VARCHAR(20) NOT NULL,
  serie VARCHAR(10) NOT NULL,
  data_emissao TIMESTAMP WITH TIME ZONE NOT NULL,
  valor_total NUMERIC(15, 2) NOT NULL CHECK (valor_total >= 0),
  protocolo VARCHAR(50),
  arquivo_xml TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_notas_fiscais_updated_at ON notas_fiscais;
CREATE TRIGGER trg_notas_fiscais_updated_at
BEFORE UPDATE ON notas_fiscais
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ---------------------------------------------------------------------
-- 7. TABELA: NOTAS_ENTRADA (COMPRAS / FORNECEDORES)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notas_entrada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  fornecedor_id UUID NOT NULL REFERENCES fornecedores(id) ON DELETE RESTRICT,
  chave_acesso VARCHAR(44) NOT NULL UNIQUE,
  numero VARCHAR(20) NOT NULL,
  serie VARCHAR(10) NOT NULL,
  data_emissao TIMESTAMP WITH TIME ZONE NOT NULL,
  data_entrada TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valor_total NUMERIC(15, 2) NOT NULL CHECK (valor_total >= 0),
  protocolo VARCHAR(50),
  arquivo_xml TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_notas_entrada_updated_at ON notas_entrada;
CREATE TRIGGER trg_notas_entrada_updated_at
BEFORE UPDATE ON notas_entrada
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ---------------------------------------------------------------------
-- 8. TABELA: PARCELAS_RECEBER (CONTAS A RECEBER)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parcelas_receber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_id UUID REFERENCES notas_fiscais(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE RESTRICT,
  numero_parcela INT NOT NULL,
  vencimento DATE NOT NULL,
  valor_original NUMERIC(15, 2) NOT NULL CHECK (valor_original >= 0),
  valor_recebido NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (valor_recebido >= 0),
  saldo NUMERIC(15, 2) GENERATED ALWAYS AS (valor_original - valor_recebido) STORED,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  origem VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
  descricao VARCHAR(255),
  data_recebimento DATE,
  observacao TEXT,
  categoria VARCHAR(100),
  anexo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_parcelas_status CHECK (status IN ('pendente', 'pago', 'vencido', 'parcial', 'cancelado'))
);

-- Idempotência para colunas novas
ALTER TABLE parcelas_receber ADD COLUMN IF NOT EXISTS origem VARCHAR(20) DEFAULT 'MANUAL';
ALTER TABLE parcelas_receber ADD COLUMN IF NOT EXISTS descricao VARCHAR(255);

DROP TRIGGER IF EXISTS trg_parcelas_receber_updated_at ON parcelas_receber;
CREATE TRIGGER trg_parcelas_receber_updated_at
BEFORE UPDATE ON parcelas_receber
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ---------------------------------------------------------------------
-- 9. TABELA: CONTAS_PAGAR
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  fornecedor_id UUID NOT NULL REFERENCES fornecedores(id) ON DELETE RESTRICT,
  nota_entrada_id UUID REFERENCES notas_entrada(id) ON DELETE CASCADE,
  numero_documento VARCHAR(50) NOT NULL,
  descricao VARCHAR(255),
  centro_custo VARCHAR(100),
  origem VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
  numero_parcela INT NOT NULL DEFAULT 1,
  total_parcelas INT NOT NULL DEFAULT 1,
  vencimento DATE NOT NULL,
  valor_original NUMERIC(15, 2) NOT NULL CHECK (valor_original >= 0),
  valor_pago NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (valor_pago >= 0),
  saldo NUMERIC(15, 2) GENERATED ALWAYS AS (valor_original - valor_pago) STORED,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  data_pagamento DATE,
  forma_pagamento VARCHAR(50),
  observacao TEXT,
  categoria VARCHAR(100),
  anexo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_contas_pagar_status CHECK (status IN ('pendente', 'pago', 'vencido', 'parcial', 'cancelado'))
);

-- Idempotência para colunas novas
ALTER TABLE contas_pagar ADD COLUMN IF NOT EXISTS origem VARCHAR(20) DEFAULT 'MANUAL';
ALTER TABLE contas_pagar ADD COLUMN IF NOT EXISTS descricao VARCHAR(255);
ALTER TABLE contas_pagar ADD COLUMN IF NOT EXISTS centro_custo VARCHAR(100);

DROP TRIGGER IF EXISTS trg_contas_pagar_updated_at ON contas_pagar;
CREATE TRIGGER trg_contas_pagar_updated_at
BEFORE UPDATE ON contas_pagar
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ---------------------------------------------------------------------
-- 10. TABELA: AUDITORIA_LOGS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  acao VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  ip VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- ÍNDICES DE ALTA PERFORMANCE
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON empresas (cnpj);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios (email);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON clientes (cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_fornecedores_cpf_cnpj ON fornecedores (cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_chave ON notas_fiscais (chave_acesso);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_numero ON notas_fiscais (numero);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_data ON notas_fiscais (data_emissao);
CREATE INDEX IF NOT EXISTS idx_notas_entrada_chave ON notas_entrada (chave_acesso);
CREATE INDEX IF NOT EXISTS idx_notas_entrada_numero ON notas_entrada (numero);
CREATE INDEX IF NOT EXISTS idx_parcelas_receber_vencimento ON parcelas_receber (vencimento);
CREATE INDEX IF NOT EXISTS idx_parcelas_receber_status ON parcelas_receber (status);
CREATE INDEX IF NOT EXISTS idx_parcelas_receber_origem ON parcelas_receber (origem);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento ON contas_pagar (vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON contas_pagar (status);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_origem ON contas_pagar (origem);
CREATE INDEX IF NOT EXISTS idx_auditoria_logs_created_at ON auditoria_logs (created_at);
