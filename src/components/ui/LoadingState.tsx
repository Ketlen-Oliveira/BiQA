import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  message?: string
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Carregando dados...',
  className = '',
}) => {
  return (
    <div className={`loading-state-container ${className}`}>
      <Loader2 className="loading-spinner-icon" />
      <span className="loading-state-message">{message}</span>
    </div>
  )
}
