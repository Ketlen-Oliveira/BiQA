import React from 'react'
import { Server, AlertTriangle, ShieldCheck, KeyRound } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  serverStatus: 'online' | 'offline' | 'checking'
  cookieConfigured: boolean
  onOpenSessionModal: () => void
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  serverStatus,
  cookieConfigured,
  onOpenSessionModal,
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
        {subtitle && <p className="header-subtitle">{subtitle}</p>}
      </div>

      <div className="header-right">
        {/* Server Status Indicator */}
        <div className="header-status-badge">
          {serverStatus === 'online' && (
            <span className="badge-server-status status-online" title="Backend operacional">
              <span className="status-dot online"></span>
              <Server size={13} className="me-1 text-emerald-600" />
              <span className="fw-medium">Backend Online</span>
            </span>
          )}
          {serverStatus === 'checking' && (
            <span className="badge-server-status status-checking" title="Verificando conexão">
              <span className="status-dot checking"></span>
              <span>Verificando...</span>
            </span>
          )}
          {serverStatus === 'offline' && (
            <span className="badge-server-status status-offline" title="Backend inacessível">
              <span className="status-dot offline"></span>
              <AlertTriangle size={13} className="me-1 text-rose-600" />
              <span>Backend Offline</span>
            </span>
          )}
        </div>

        {/* Simplified Session Badge / Button */}
        <button
          type="button"
          onClick={onOpenSessionModal}
          className={`btn-session-cookie ${cookieConfigured ? 'configured' : 'unconfigured'}`}
          title="Clique para gerenciar o cookie de sessão"
        >
          {cookieConfigured ? (
            <>
              <ShieldCheck size={15} className="text-emerald-500" />
              <span className="session-text">Sessão conectada</span>
            </>
          ) : (
            <>
              <KeyRound size={15} className="text-amber-500" />
              <span className="session-text">Definir Sessão</span>
            </>
          )}
        </button>
      </div>
    </header>
  )
}
