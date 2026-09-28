import React, { useState } from 'react';
import {
  Upload,
  FileCode,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  Sparkles,
  Truck,
  Plus,
  Trash2,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';

interface XmlEntradaImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresaId: number;
  onImportSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const XmlEntradaImporterModal: React.FC<XmlEntradaImporterModalProps> = ({
  isOpen,
  onClose,
  empresaId,
  onImportSuccess,
  onError,
}) => {
  const [xmlFiles, setXmlFiles] = useState<Array<{ name: string; content: string }>>([]);
  const [manualXml, setManualXml] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tabModo, setTabModo] = useState<'upload' | 'texto'>('upload');

  if (!isOpen) return null;

  const handleMultipleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.name.endsWith('.xml') || file.type.includes('xml')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setXmlFiles((prev) => [...prev, { name: file.name, content }]);
        };
        reader.readAsText(file);
      }
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleMultipleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setXmlFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcessar = async () => {
    if (tabModo === 'upload') {
      if (xmlFiles.length === 0) {
        onError('Selecione pelo menos um arquivo XML para importar.');
        return;
      }

      setLoading(true);
      try {
        if (xmlFiles.length === 1) {
          const res = await api.nfeEntrada.importarXml(xmlFiles[0].content, empresaId);
          onImportSuccess(res.mensagem || 'NF-e de entrada importada com sucesso.');
        } else {
          const xmlContents = xmlFiles.map((f) => f.content);
          const res = await api.nfeEntrada.importarMultiplos(xmlContents, empresaId);
          onImportSuccess(
            `Lote processado: ${res.sucessos} notas importadas com sucesso (${res.falhas} falhas/duplicadas).`
          );
        }
        setXmlFiles([]);
        onClose();
      } catch (err: any) {
        onError(err.message || 'Erro ao processar importação de XMLs.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!manualXml.trim()) {
        onError('Cole o texto do XML da nota fiscal.');
        return;
      }

      setLoading(true);
      try {
        const res = await api.nfeEntrada.importarXml(manualXml, empresaId);
        onImportSuccess(res.mensagem || 'NF-e de entrada importada com sucesso.');
        setManualXml('');
        onClose();
      } catch (err: any) {
        onError(err.message || 'Erro ao processar XML.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Exemplo de XML de entrada para teste rápido
  const handleCarregarExemplo = () => {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35260999887766000199550010000088991000088990" versao="4.00">
      <ide>
        <nNF>8899</nNF>
        <serie>1</serie>
        <dhEmi>2026-09-28T09:00:00-03:00</dhEmi>
      </ide>
      <emit>
        <CNPJ>33445566000199</CNPJ>
        <xNome>Distribuidora Metalúrgica Tubos e Perfis S/A</xNome>
        <xFant>Metal Tubos</xFant>
        <enderEmit>
          <xLgr>Rodovia Anhanguera, KM 110</xLgr>
          <nro>1500</nro>
          <xBairro>Distrito Industrial</xBairro>
          <xMun>Campinas</xMun>
          <UF>SP</UF>
          <CEP>13050000</CEP>
        </enderEmit>
      </emit>
      <total>
        <ICMSTot>
          <vNF>14500.00</vNF>
        </ICMSTot>
      </total>
      <cobr>
        <dup>
          <nDup>001</nDup>
          <dVenc>2026-10-15</dVenc>
          <vDup>7250.00</vDup>
        </dup>
        <dup>
          <nDup>002</nDup>
          <dVenc>2026-11-15</dVenc>
          <vDup>7250.00</vDup>
        </dup>
      </cobr>
    </infNFe>
  </NFe>
</nfeProc>`;
    setXmlFiles((prev) => [
      ...prev,
      { name: 'NFe_Entrada_Exemplo_MetalTubos.xml', content: sampleXml },
    ]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importação de XML de Entrada (Contas a Pagar)"
      subtitle="Importe 1 ou múltiplos XMLs de fornecedores. O sistema cadastra o emitente e gera as duplicatas a pagar automaticamente."
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Toggle de Modo: Arquivos vs Colar Texto */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
          <button
            type="button"
            onClick={() => setTabModo('upload')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              tabModo === 'upload'
                ? 'bg-[#2563EB] text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Upload de Arquivos (.XML Único ou em Lote)
          </button>
          <button
            type="button"
            onClick={() => setTabModo('texto')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              tabModo === 'texto'
                ? 'bg-[#2563EB] text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Colar Texto XML Direto
          </button>
        </div>

        {tabModo === 'upload' ? (
          <>
            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
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
                multiple
                onChange={(e) => handleMultipleFiles(e.target.files)}
                id="xml-entrada-upload"
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#2563EB]">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <label
                    htmlFor="xml-entrada-upload"
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Clique para selecionar múltiplos arquivos XML
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400"> ou arraste-os para esta área</span>
                </div>
                <p className="text-[11px] text-gray-400">Padrão NF-e SEFAZ v4.00</p>
              </div>
            </div>

            {/* Botão de Exemplo */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                Arquivos selecionados: <strong>{xmlFiles.length}</strong>
              </span>
              <button
                type="button"
                onClick={handleCarregarExemplo}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar XML de Teste de Fornecedor</span>
              </button>
            </div>

            {/* Lista de Arquivos Selecionados */}
            {xmlFiles.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800">
                {xmlFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-900 text-xs border border-gray-100 dark:border-gray-800"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {file.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-red-500 hover:text-red-700 p-1 rounded transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Editor Direto */
          <div>
            <textarea
              rows={8}
              value={manualXml}
              onChange={(e) => setManualXml(e.target.value)}
              placeholder="<nfeProc xmlns='http://www.portalfiscal.inf.br/nfe'>..."
              className="w-full p-3 font-mono text-[11px] bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Informações Automáticas */}
        <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-md text-xs text-blue-800 dark:text-blue-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Processamento Automático de Compras:</span>
          </div>
          <p className="text-[11px] text-blue-700 dark:text-blue-400">
            • Cadastra o Fornecedor com CNPJ e endereço se ainda não existir.<br />
            • Registra a Nota de Entrada fiscal.<br />
            • Cria todos os lançamentos em Contas a Pagar conforme as duplicatas da nota.
          </p>
        </div>

        {/* Footer */}
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
            onClick={handleProcessar}
            disabled={loading || (tabModo === 'upload' ? xmlFiles.length === 0 : !manualXml.trim())}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {loading
                ? 'Processando...'
                : xmlFiles.length > 1
                ? `Importar ${xmlFiles.length} XMLs em Lote`
                : 'Processar e Gerar Contas a Pagar'}
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
