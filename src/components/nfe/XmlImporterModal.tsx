import React, { useState, useEffect } from 'react';
import { Upload, FileCode, CheckCircle2, AlertCircle, FileText, ArrowRight, Layers, Sparkles, Building, User, Calendar, DollarSign } from 'lucide-react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { SampleNFeXml } from '../../types';

interface XmlImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresaId: number;
  onImportSuccess: (result: any) => void;
  onError: (msg: string) => void;
}

export const XmlImporterModal: React.FC<XmlImporterModalProps> = ({
  isOpen,
  onClose,
  empresaId,
  onImportSuccess,
  onError,
}) => {
  const [xmlContent, setXmlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [samples, setSamples] = useState<SampleNFeXml[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.nfe
        .obterExemplos()
        .then((data) => setSamples(data))
        .catch(() => {});
      setXmlContent('');
      setFileName(null);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setXmlContent(text);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setXmlContent(text);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleSelectSample = (sample: SampleNFeXml) => {
    setXmlContent(sample.xml);
    setFileName(`Exemplo_${sample.nome}.xml`);
  };

  const handleImport = async () => {
    if (!xmlContent.trim()) {
      onError('Selecione ou cole o conteúdo do arquivo XML da NF-e.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.nfe.importarXml(xmlContent, empresaId);
      if (response.sucesso) {
        onImportSuccess(response);
        onClose();
      } else {
        onError(response.mensagem || 'Falha ao processar arquivo XML.');
      }
    } catch (err: any) {
      onError(err.message || 'Erro durante a importação do XML.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importação Automática de NF-e (XML)"
      subtitle="O sistema extrai o emitente, cliente, produtos, valores e gera automaticamente as parcelas a receber"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-900/40 hover:border-gray-400'
          }`}
        >
          <input
            type="file"
            accept=".xml"
            onChange={handleFileChange}
            id="xml-file-upload"
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#2563EB]">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <label
                htmlFor="xml-file-upload"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Clique para selecionar o arquivo XML
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400"> ou arraste e solte aqui</span>
            </div>
            <p className="text-[11px] text-gray-400">Formatos aceitos: Padrão NF-e SEFAZ (.xml)</p>
            {fileName && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <FileCode className="w-3.5 h-3.5" />
                <span>{fileName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Exemplos de XML Prontos para Teste */}
        {samples.length > 0 && (
          <div className="p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2">
              Modelos de Demonstração para Teste Rápido
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {samples.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  className="p-2 bg-gray-50 dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-gray-200 dark:border-gray-700 hover:border-blue-300 rounded text-left transition-colors text-xs flex flex-col cursor-pointer"
                >
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{s.nome}</span>
                  <span className="text-[10px] text-gray-500 mt-0.5">{s.descricao}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Área de Visualização do Conteúdo XML */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Conteúdo XML (Visualização ou Edição Direta)
            </label>
            {xmlContent && (
              <button
                onClick={() => {
                  setXmlContent('');
                  setFileName(null);
                }}
                className="text-[11px] text-red-600 dark:text-red-400 hover:underline cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
          <textarea
            rows={6}
            value={xmlContent}
            onChange={(e) => setXmlContent(e.target.value)}
            placeholder="<nfeProc xmlns='http://www.portalfiscal.inf.br/nfe'>..."
            className="w-full p-3 font-mono text-[11px] bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Informações Processadas Automaticamente */}
        <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-md text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Ao importar, o ERP vincula o cliente automaticamente e cria o lançamento de todas as parcelas na agenda de Contas a Receber.
          </span>
        </div>

        {/* Action Buttons */}
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
            type="button"
            onClick={handleImport}
            disabled={loading || !xmlContent.trim()}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Processando XML...' : 'Processar e Gerar Títulos'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
