import React from 'react'
import { LucideIcon, Search, AlertCircle, FileSpreadsheet, Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  variant?: 'search' | 'empty' | 'warning' | 'file'
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  variant = 'empty',
}) => {
  let IconComponent = icon

  if (!IconComponent) {
    if (variant === 'search') IconComponent = Search
    else if (variant === 'warning') IconComponent = AlertCircle
    else if (variant === 'file') IconComponent = FileSpreadsheet
    else IconComponent = Inbox
  }

  return (
    <div className="empty-state-container">
      <div className="empty-state-icon-wrapper">
        <IconComponent className="empty-state-icon" />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  )
}
