import React, { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { SessionCookieModal } from './SessionCookieModal'
import { checkHealth } from '../../api'

interface AppShellProps {
  activeTab: string
  onSelectTab: (tabId: string) => void
  title: string
  subtitle?: string
  children: React.ReactNode
}

const STORAGE_KEY = 'biqa_session_cookie'
const SIDEBAR_COLLAPSED_KEY = 'biqa_sidebar_collapsed'

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onSelectTab,
  title,
  subtitle,
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  })
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [sessionCookie, setSessionCookie] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY) || null
  })
  const [showSessionModal, setShowSessionModal] = useState<boolean>(false)

  // Verify backend health on mount and periodically
  useEffect(() => {
    const verifyHealth = () => {
      checkHealth()
        .then((res) => {
          if (res.success) {
            setServerStatus('online')
          } else {
            setServerStatus('offline')
          }
        })
        .catch(() => {
          setServerStatus('offline')
        })
    }

    verifyHealth()
    const timer = setInterval(verifyHealth, 30000)
    return () => clearInterval(timer)
  }, [])

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      return next
    })
  }

  const handleCookieSaved = (newCookie: string | null) => {
    setSessionCookie(newCookie)
  }

  return (
    <div className={`app-shell-root ${isCollapsed ? 'layout-sidebar-collapsed' : 'layout-sidebar-expanded'}`}>
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <div className="app-shell-main-wrapper">
        <Header
          title={title}
          subtitle={subtitle}
          serverStatus={serverStatus}
          cookieConfigured={Boolean(sessionCookie)}
          onOpenSessionModal={() => setShowSessionModal(true)}
        />

        <main className="app-shell-content">
          {children}
        </main>
      </div>

      <SessionCookieModal
        show={showSessionModal}
        onHide={() => setShowSessionModal(false)}
        onCookieSaved={handleCookieSaved}
        currentCookie={sessionCookie}
      />
    </div>
  )
}
