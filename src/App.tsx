import { useState, useEffect } from 'react'
import { Nav, Badge, Alert, Spinner } from 'react-bootstrap'
import UtteranceSearchForm from './components/UtteranceSearchForm'
import RelatedIdForm from './components/RelatedIdForm'
import CookieBar from './components/CookieBar'
import { checkHealth } from './api'


interface NavItem {
  id: string
  label: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'search', label: 'Buscar por Frase', icon: '🔍' },
  { id: 'related', label: 'IDs Relacionados', icon: '🔗' },
]

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  search: { title: 'Buscar Utterance por Frase', subtitle: 'Digite a frase da utterance para encontrar o UID correspondente. Também é possível processar planilhas em lote.' },
  related: { title: 'IDs Relacionados', subtitle: 'Busque IDs relacionados a um conteúdo.' },
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('search')
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    checkHealth()
      .then(() => setServerStatus('online'))
      .catch(() => setServerStatus('offline'))
  }, [])

  if (serverStatus === 'offline') {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100">
        <Alert variant="danger" style={{ maxWidth: 500 }}>
          ⚠️ Não foi possível conectar ao backend Flask. Certifique-se de que o servidor
          está rodando em <code>http://127.0.0.1:5000</code>.
        </Alert>
      </div>
    )
  }

  if (serverStatus === 'checking') {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100">
        <Spinner animation="border" className="me-2" />
        <span>Verificando conexão com o backend...</span>
      </div>
    )
  }

  const pageInfo = PAGE_TITLES[activeTab] || {}

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">BIQA</div>
        <div className="sidebar-status">
          <Badge bg="success">● Backend online</Badge>
        </div>
        <Nav className="flex-column sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <Nav.Link
              key={item.id}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
              className="sidebar-link"
            >
              <span className="me-2">{item.icon}</span>
              {item.label}
            </Nav.Link>
          ))}
        </Nav>
      </aside>

      {/* ── Main content ── */}
      <main className="app-main">
        <CookieBar />
        <div className="page-header">

          <h1 className="h4 fw-bold mb-1">{pageInfo.title}</h1>
          <p className="text-muted small mb-0">{pageInfo.subtitle}</p>
        </div>

        {activeTab === 'search' && <UtteranceSearchForm />}
        {activeTab === 'related' && <RelatedIdForm />}
      </main>
    </div>
  )
}
