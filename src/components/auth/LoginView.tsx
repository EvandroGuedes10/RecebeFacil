import React, { useState } from 'react';
import { LogIn, KeyRound, ArrowRight, ShieldCheck, Mail, Lock, CheckCircle2, AlertCircle, Building2, TrendingUp } from 'lucide-react';
import { api } from '../../services/api';
import { Usuario } from '../../types';

interface LoginViewProps {
  onLoginSuccess: (usuario: Usuario) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@recebefacil.com.br');
  const [senha, setSenha] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      setError('Informe seu email e senha corporativa.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.auth.login(email, senha);
      if (response.sucesso && response.usuario) {
        onLoginSuccess(response.usuario);
      } else {
        setError(response.mensagem || 'Credenciais inválidas.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecuperarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Informe seu email cadastrado para recuperação.');
      return;
    }

    setForgotLoading(true);
    setError(null);
    setForgotSuccess(null);

    try {
      const response = await api.auth.recuperarSenha(forgotEmail);
      if (response.sucesso) {
        setForgotSuccess(response.mensagem);
      } else {
        setError(response.mensagem || 'Não foi possível enviar as instruções.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar solicitação.');
    } finally {
      setForgotLoading(false);
    }
  };

  const fillQuickAccess = (userEmail: string, pass: string) => {
    setEmail(userEmail);
    setSenha(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center items-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-md bg-[#2563EB] flex items-center justify-center text-white shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="flex items-center">
            <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Recebe</span>
            <span className="text-2xl font-bold text-[#2563EB] dark:text-blue-400">Fácil</span>
          </div>
        </div>
        <h2 className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          ERP Corporativo de Gestão Financeira e NF-e
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-gray-800 py-8 px-6 sm:px-8 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {!showForgot ? (
            /* Formulário de Login */
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@empresa.com.br"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Senha de Acesso
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgot(true);
                      setError(null);
                      setForgotSuccess(null);
                    }}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Autenticando...</span>
                ) : (
                  <>
                    <span>Acessar Painel Financeiro</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Recuperação de Senha */
            <form className="space-y-4" onSubmit={handleRecuperarSenha}>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                  Recuperar Senha
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Informe o seu e-mail cadastrado para redefinir o acesso.
                </p>
              </div>

              {forgotSuccess ? (
                <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{forgotSuccess}</span>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    E-mail Cadastrado
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="usuario@empresa.com.br"
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="flex-1 py-2 px-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium text-xs rounded-md transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                {!forgotSuccess && (
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2 px-3 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-md transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {forgotLoading ? 'Enviando...' : 'Enviar Instruções'}
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Perfis para Demonstração Rápida */}
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">
              Perfis Disponíveis para Demonstração
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillQuickAccess('admin@recebefacil.com.br', 'admin123')}
                className="py-1.5 px-2 bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border border-gray-200 dark:border-gray-600 text-left flex flex-col transition-colors cursor-pointer"
              >
                <span className="font-bold text-xs text-blue-600 dark:text-blue-400">Administrador</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Acesso Total</span>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccess('financeiro@recebefacil.com.br', 'financeiro123')}
                className="py-1.5 px-2 bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border border-gray-200 dark:border-gray-600 text-left flex flex-col transition-colors cursor-pointer"
              >
                <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">Financeiro</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Baixas e Títulos</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
