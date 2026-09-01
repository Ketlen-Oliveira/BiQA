import React from 'react'

interface StatusBadgeProps {
  status?: string | null
  type?: 'status' | 'division' | 'category' | 'lang'
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'status',
  className = '',
}) => {
  if (!status) return null

  const s = String(status).toUpperCase()

  if (type === 'division') {
    return (
      <span
        className={`badge-subtle badge-division ${className}`}
      >
        {s}
      </span>
    )
  }

  if (type === 'category') {
    return (
      <span
        className={`badge-subtle badge-category ${className}`}
      >
        {status}
      </span>
    )
  }

  if (type === 'lang') {
    return (
      <span
        className={`badge-subtle badge-lang ${className}`}
      >
        {status}
      </span>
    )
  }

  // General state (RELEASED, ACTIVE, DRAFT, etc.)
  let variantClass = 'badge-neutral'
  if (['RELEASED', 'ACTIVE', 'ATIVO', 'PUBLICADO', 'ONLINE'].includes(s)) {
    variantClass = 'badge-success'
  } else if (['PENDING', 'PENDENTE', 'REVIEW', 'DRAFT', 'RASCUNHO'].includes(s)) {
    variantClass = 'badge-warning'
  } else if (['REJECTED', 'INACTIVE', 'INATIVO', 'OFFLINE', 'ERROR'].includes(s)) {
    variantClass = 'badge-danger'
  }

  return (
    <span className={`badge-subtle ${variantClass} ${className}`}>
      {status}
    </span>
  )
}
