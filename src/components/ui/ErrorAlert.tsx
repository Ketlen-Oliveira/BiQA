import React from 'react'
import { AlertCircle, X, RefreshCw } from 'lucide-react'

interface ErrorAlertProps {
  message: string
  onDismiss?: () => void
  onRetry?: () => void
  title?: string
  className?: string
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  onDismiss,
  onRetry,
  title = 'Ocorreu um erro',
  className = '',
}) => {
  return (
    <div className={`error-alert-box ${className}`} role="alert">
      <div className="error-alert-icon-col">
        <AlertCircle className="error-alert-icon" />
      </div>
      <div className="error-alert-body">
        <div className="error-alert-title">{title}</div>
        <div className="error-alert-message">{message}</div>
        {onRetry && (
          <button
            type="button"
            className="btn-retry"
            onClick={onRetry}
          >
            <RefreshCw className="icon-sm me-1" />
            Tentar novamente
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          className="error-alert-close"
          onClick={onDismiss}
          aria-label="Fechar"
        >
          <X className="icon-sm" />
        </button>
      )}
    </div>
  )
}
