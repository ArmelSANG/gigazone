import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showClose = true,
  closeOnOverlay = true 
}) {
  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Bloquer scroll body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeOnOverlay ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className={`relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col animate-modalIn`}>
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            {title && <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>}
            {showClose && (
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition ml-auto"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modalIn {
          animation: modalIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

// Composant Footer pour les actions
export function ModalFooter({ children, className = '' }) {
  return (
    <div className={`flex gap-3 justify-end pt-6 border-t border-gray-200 dark:border-gray-800 mt-6 ${className}`}>
      {children}
    </div>
  );
}
