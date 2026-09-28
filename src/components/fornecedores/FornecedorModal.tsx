import React, { useState, useEffect } from 'react';
import { Truck, Save, Mail, Phone, MapPin, Building, Tag } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Fornecedor } from '../../types';
import { api } from '../../services/api';

interface FornecedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  fornecedor: Fornecedor | null;
  empresaId: number;
  onSuccess: (fornecedor: Fornecedor) => void;
  onError: (msg: string) => void;
}

export const FornecedorModal: React.FC<FornecedorModalProps> = ({
  isOpen,
  onClose,
  fornecedor,
  empresaId,
  onSuccess,
  onError,
}) => {
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('SP');
  const [cep, setCep] = useState('');
  const [categoria, setCategoria] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fornecedor) {
      setNome(fornecedor.nome || '');
      setCpfCnpj(fornecedor.cpf_cnpj || '');
      setEmail(fornecedor.email || '');
      setTelefone(fornecedor.telefone || '');
      setLogradouro(fornecedor.logradouro || fornecedor.endereco || '');
      setNumero(fornecedor.numero || '');
      setBairro(fornecedor.bairro || '');
      setCidade(fornecedor.cidade || '');
      setEstado(fornecedor.estado || 'SP');
      setCep(fornecedor.cep || '');
      setCategoria(fornecedor.categoria || '');
    } else {
      setNome('');
      setCpfCnpj('');
      setEmail('');
      setTelefone('');
      setLogradouro('');
      setNumero('');
      setBairro('');
      setCidade('');
      setEstado('SP');
      setCep('');
      setCategoria('');
    }
  }, [fornecedor, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      onError('Informe a Razão Social ou Nome do Fornecedor.');
      return;
    }

    setLoading(true);
    try {
      if (fornecedor) {
        const updated = await api.fornecedores.atualizar(fornecedor.id, {
          nome,
          cpf_cnpj: cpfCnpj,
          email,
          telefone,
          logradouro,
          numero,
          bairro,
          cidade,
          estado,
          cep,
          categoria,
        });
        onSuccess(updated);
      } else {
        const created = await api.fornecedores.criar({
          empresaId,
          nome,
          cpf_cnpj: cpfCnpj,
          email,
          telefone,
          logradouro,
          numero,
          bairro,
          cidade,
          estado,
          cep,
          categoria,
        });
        onSuccess(created);
      }
    } catch (err: any) {
      onError(err.message || 'Erro ao salvar fornecedor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={fornecedor ? 'Editar Cadastro de Fornecedor' : 'Novo Cadastro de Fornecedor'}
      subtitle="Dados cadastrais, contato e categoria de suprimentos"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identificação Básica */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Razão Social / Nome Fantasia *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Distribuidora Nacional de Peças Ltda"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              CNPJ ou CPF
            </label>
            <input
              type="text"
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value)}
              placeholder="00.000.000/0001-00"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Categoria / Segmento
            </label>
            <input
              type="text"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Ex: Matéria-Prima, TI, Logística, Serviços"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Telefone / WhatsApp
            </label>
            <input
              type="text"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 3333-5555"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              E-mail de Contato / NFe
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vendas@fornecedor.com.br"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Endereço */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2">
            Localização e Endereço
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Logradouro
              </label>
              <input
                type="text"
                value={logradouro}
                onChange={(e) => setLogradouro(e.target.value)}
                placeholder="Rua, Avenida, Rodovia..."
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Número
              </label>
              <input
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="100"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Bairro
              </label>
              <input
                type="text"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                placeholder="Distrito Industrial"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Cidade
              </label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Campinas"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Estado (UF)
              </label>
              <input
                type="text"
                maxLength={2}
                value={estado}
                onChange={(e) => setEstado(e.target.value.toUpperCase())}
                placeholder="SP"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white uppercase font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-200 dark:border-gray-700">
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
            <span>{loading ? 'Salvando...' : fornecedor ? 'Atualizar Fornecedor' : 'Cadastrar Fornecedor'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
