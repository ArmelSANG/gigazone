import React from 'react';

// =====================================================
// LOADING SPINNER
// =====================================================
export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className={`${sizes[size]} border-pink-500 border-t-transparent rounded-full animate-spin ${className}`} />
  );
}

// =====================================================
// LOADING SCREEN
// =====================================================
export function LoadingScreen({ message = 'Chargement...' }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}

// =====================================================
// BUTTON
// =====================================================
export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props 
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg hover:shadow-pink-500/30',
    secondary: 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white',
    outline: 'border-2 border-gray-300 dark:border-gray-700 hover:border-pink-500 text-gray-800 dark:text-white',
    ghost: 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30',
    success: 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-xl transition
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
        </>
      )}
    </button>
  );
}

// =====================================================
// BADGE
// =====================================================
export function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const variants = {
    default: 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300',
    primary: 'bg-pink-500/20 text-pink-400',
    success: 'bg-green-500/20 text-green-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    danger: 'bg-red-500/20 text-red-400',
    info: 'bg-blue-500/20 text-blue-400'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5'
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}

// =====================================================
// CARD
// =====================================================
export function Card({ children, className = '', hover = false, onClick }) {
  return (
    <div 
      className={`
        bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-5
        ${hover ? 'hover:border-pink-500/50 cursor-pointer transition' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// =====================================================
// EMPTY STATE
// =====================================================
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      {description && <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

// =====================================================
// AVATAR
// =====================================================
export function Avatar({ name, src, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl'
  };

  if (src) {
    return (
      <img 
        src={src} 
        alt={name} 
        className={`rounded-full object-cover ${sizes[size]} ${className}`}
      />
    );
  }

  return (
    <div className={`rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-semibold text-white ${sizes[size]} ${className}`}>
      {name ? name.charAt(0).toUpperCase() : '?'}
    </div>
  );
}

// =====================================================
// INPUT
// =====================================================
export function Input({ 
  label, 
  error, 
  icon: Icon, 
  className = '', 
  containerClassName = '',
  ...props 
}) {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
        )}
        <input
          className={`
            w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 
            text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition
            focus:border-pink-500
            ${Icon ? 'pl-12' : ''}
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

// =====================================================
// SELECT
// =====================================================
export function Select({ 
  label, 
  options = [], 
  error, 
  className = '', 
  containerClassName = '',
  ...props 
}) {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 
          text-white outline-none transition
          focus:border-pink-500
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

// =====================================================
// STAT CARD
// =====================================================
export function StatCard({ icon: Icon, label, value, subValue, trend, color = 'pink' }) {
  const colors = {
    pink: 'from-pink-500 to-purple-600',
    green: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-cyan-600',
    orange: 'from-orange-500 to-amber-600',
    red: 'from-red-500 to-rose-600'
  };

  return (
    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:border-gray-600 transition">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== undefined && (
          <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      {subValue && <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subValue}</div>}
    </div>
  );
}
