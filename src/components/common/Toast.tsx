import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (!toasts || !toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full px-4 sm:px-0 pointer-events-none">
      {toasts.map((toast) => {
        const config = {
          success: {
            icon: CheckCircle2,
            border: 'border-l-4 border-l-emerald-600 border-gray-200 dark:border-gray-700',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            defaultTitle: 'Sucesso',
          },
          error: {
            icon: AlertCircle,
            border: 'border-l-4 border-l-red-600 border-gray-200 dark:border-gray-700',
            iconColor: 'text-red-600 dark:text-red-400',
            defaultTitle: 'Erro',
          },
          warning: {
            icon: AlertTriangle,
            border: 'border-l-4 border-l-amber-600 border-gray-200 dark:border-gray-700',
            iconColor: 'text-amber-600 dark:text-amber-400',
            defaultTitle: 'Atenção',
          },
          info: {
            icon: Info,
            border: 'border-l-4 border-l-blue-600 border-gray-200 dark:border-gray-700',
            iconColor: 'text-blue-600 dark:text-blue-400',
            defaultTitle: 'Informação',
          },
        }[toast.type];

        const Icon = config.icon;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md border shadow-md animate-fadeIn transition-all`}
            style={{ borderLeftWidth: '4px' }}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                {toast.title || config.defaultTitle}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
