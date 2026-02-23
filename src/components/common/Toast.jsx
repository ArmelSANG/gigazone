import React, { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

// Context
const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

// Toast Item
const ToastItem = ({ toast, onRemove }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />
  };

  const colors = {
    success: 'border-green-500/30 bg-green-500/10',
    error: 'border-red-500/30 bg-red-500/10',
    warning: 'border-yellow-500/30 bg-yellow-500/10',
    info: 'border-blue-500/30 bg-blue-500/10'
  };

  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => onRemove(toast.id), toast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, onRemove]);

  return (
    <div 
      className={`flex items-start gap-3 p-4 rounded-xl border ${colors[toast.type]} backdrop-blur-lg shadow-xl animate-slideIn`}
      style={{ minWidth: '320px', maxWidth: '420px' }}
    >
      {icons[toast.type]}
      <div className="flex-1">
        {toast.title && (
          <div className="font-semibold text-white text-sm mb-1">{toast.title}</div>
        )}
        <div className="text-gray-300 text-sm">{toast.message}</div>
      </div>
      <button 
        onClick={() => onRemove(toast.id)}
        className="text-gray-500 hover:text-white transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Provider
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const toast = {
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
    custom: (options) => addToast(options)
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
