import React from 'react'
import { Search, Link2, PanelLeftClose, PanelLeftOpen, Database } from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  badge?: string
}

interface SidebarProps {
  activeTab: string
  onSelectTab: (tabId: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'search',
    label: 'Buscar por Frase',
    icon: Search,
  },
  {
    id: 'related',
    label: 'IDs Relacionados',
    icon: Link2,
  },
]

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
}) => {
  return (
    <aside
      className={`app-sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}
      aria-label="Barra lateral de navegação"
    >
      {/* Brand & Toggle Header */}
      <div className="sidebar-top">
        {!isCollapsed ? (
          <>
            <div className="sidebar-brand-wrapper">
              <div className="brand-logo-icon">
                <Database size={18} />
              </div>
              <div className="sidebar-brand-text">
                <span className="brand-name">BiQA</span>
                <span className="brand-tag">API Explorer</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleCollapse}
              className="sidebar-collapse-btn"
              title="Recolher menu lateral"
              aria-label="Recolher menu lateral"
            >
              <PanelLeftClose size={18} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="sidebar-collapsed-brand-btn"
            title="Expandir menu lateral (BiQA API Explorer)"
            aria-label="Expandir menu lateral"
          >
            <div className="brand-logo-icon">
              <Database size={18} />
            </div>
          </button>
        )}
      </div>

      {/* Navigation items */}
      <nav className="sidebar-nav">
        {!isCollapsed && (
          <div className="sidebar-nav-section-title">
            Módulos
          </div>
        )}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              title={item.label}
              aria-label={item.label}
            >
              <span className="nav-item-icon">
                <Icon size={18} />
              </span>
              {!isCollapsed && <span className="nav-item-label">{item.label}</span>}
              {!isCollapsed && item.badge && (
                <span className="nav-item-badge">{item.badge}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Sidebar Footer info */}
      <div className="sidebar-footer">
        {!isCollapsed ? (
          <div className="sidebar-footer-text">
            <span className="text-muted small fw-semibold">BiQA API Explorer</span>
            <span className="text-muted-xs">Samsung Electronics</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="sidebar-footer-mini-btn"
            title="Expandir menu lateral"
            aria-label="Expandir menu lateral"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}
      </div>
    </aside>
  )
}
