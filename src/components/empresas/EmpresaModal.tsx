import React, { useState, useEffect } from 'react';
import { Building2, Save, Mail, Phone, MapPin, Hash } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Empresa } from '../../types';
import { api } from '../../services/api';

interface EmpresaModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresa: Empresa | null;
  onSuccess: (empresa: Empresa) => void;
  onError: (msg: string) => void;
}

export const EmpresaModal: React.FC<EmpresaModalProps> = ({
  isOpen,
  onClose,
  empresa,
  onSuccess,
  onError,
}) => {
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [inscricaoEstadual, setInscricaoEstadual] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('SP');
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (empresa) {
      setRazaoSocial(empresa.razao_social || '');
      setNomeFantasia(empresa.nome_fantasia || '');
      setCnpj(empresa.cnpj || '');
      setInscricaoEstadual(empresa.inscricao_estadual || '');
      setEmail(empresa.email || '');
      setTelefone(empresa.telefone || '');
      setEndereco(empresa.endereco || '');
      setCidade(empresa.cidade || '');
      setEstado(empresa.estado || 'SP');
      setCep(empresa.cep || '');
    } else {
      setRazaoSocial('');
      setNomeFantasia('');
      setCnpj('');
      setInscricaoEstadual('');
      setEmail('');
      setTelefone('');
      setEndereco('');
      setCidade('');
      setEstado('SP');
      setCep('');
    }
  }, [empresa, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!razaoSocial.trim() || !cnpj.trim()) {
      onError('Razão Social e CNPJ são campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      if (empresa) {
        // Atualizar
        const updated = await api.empresas.atualizar(empresa.id, {
          razao_social: razaoSocial,
          nome_fantasia: nomeFantasia,
          cnpj,
          inscricao_estadual: inscricaoEstadual,
          email,
          telefone,
          endereco,
          cidade,
          estado,
          cep,
        });
        onSuccess(updated);
      } else {
        // Criar
        const created = await api.empresas.criar({
          razao_social: razaoSocial,
          nome_fantasia: nomeFantasia,
          cnpj,
          inscricao_estadual: inscricaoEstadual,
          email,
          telefone,
          endereco,
          cidade,
          estado,
          cep,
        });
        onSuccess(created);
      }
    } catch (err: any) {
      onError(err.message || 'Erro ao salvar empresa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={empresa ? 'Editar Dados da Empresa' : 'Cadastrar Nova Empresa'}
      subtitle="Dados cadastrais e fiscais da pessoa jurídica emitente"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identificação Cadastral */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Razão Social (Denominação Legal) *
            </label>
            <input
              type="text"
              required
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              placeholder="Ex: Minha Empresa Comercio e Servicos Ltda"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Nome Fantasia / Marca
            </label>
            <input
              type="text"
              value={nomeFantasia}
              onChange={(e) => setNomeFantasia(e.target.value)}
              placeholder="Ex: Minha Empresa"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              CNPJ *
            </label>
            <input
              type="text"
              required
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0001-00"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Inscrição Estadual (IE)
            </label>
            <input
              type="text"
              value={inscricaoEstadual}
              onChange={(e) => setInscricaoEstadual(e.target.value)}
              placeholder="123.456.789.000"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Telefone Principal
            </label>
            <input
              type="text"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 3333-4444"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              E-mail Comercial / Fiscal
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nfe@empresa.com.br"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Localidade e Endereço */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2">
            Endereço da Sede
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Endereço Completo
              </label>
              <input
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Av. Paulista, 1000 - Bela Vista"
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
                placeholder="São Paulo"
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

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                CEP
              </label>
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="01310-100"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
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
            <span>{loading ? 'Salvando...' : empresa ? 'Atualizar Empresa' : 'Cadastrar Empresa'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
