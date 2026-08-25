import { useState, useRef, useEffect } from 'react'
import { Form, Button, Spinner, Badge } from 'react-bootstrap'
import { updateSessionCookie } from '../api'

type CookieStatus = 'idle' | 'validating' | 'valid' | 'invalid'

export default function CookieBar() {
  const [cookieValue, setCookieValue] = useState('')
  const [status, setStatus] = useState<CookieStatus>('idle')
  const [showHelp, setShowHelp] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Restaura o último cookie salvo (apenas para exibição)
  useEffect(() => {
    const saved = localStorage.getItem('biqa_session_cookie')
    if (saved) {
      setCookieValue(saved)
      setStatus('valid')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cookieValue.trim()) return

    setStatus('validating')
    try {
      const res = await updateSessionCookie(cookieValue.trim())
      if (res.success) {
        setStatus('valid')
        localStorage.setItem('biqa_session_cookie', cookieValue.trim())
      } else {
        setStatus('invalid')
      }
    } catch {
      setStatus('invalid')
    }
  }

  return (
    <div className="cookie-bar">
      <div className="cookie-bar-content">
        {/* Label + ajuda */}
        <div className="cookie-bar-label">
          <span className="cookie-bar-title">SESSION Cookie</span>
          <button
            type="button"
            className="cookie-help-btn"
            onClick={() => setShowHelp((v) => !v)}
            title="Como obter o SESSION"
          >
            ℹ️
          </button>
        </div>

        {/* Input + botão */}
        <Form className="cookie-bar-form" onSubmit={handleSubmit}>
          <Form.Control
            ref={inputRef}
            type="text"
            size="sm"
            placeholder="Cole o SESSION do cookie do BiQA"
            value={cookieValue}
            onChange={(e) => {
              setCookieValue(e.target.value)
              if (status === 'valid' || status === 'invalid') setStatus('idle')
            }}
            className="cookie-bar-input"
          />

          {status === 'validating' ? (
            <Button size="sm" disabled className="cookie-bar-btn">
              <Spinner as="span" animation="border" size="sm" className="me-1" />
              Validando...
            </Button>
          ) : status === 'valid' ? (
            <Button size="sm" variant="success" disabled className="cookie-bar-btn">
              ✓ Válido
            </Button>
          ) : status === 'invalid' ? (
            <Button size="sm" variant="danger" disabled className="cookie-bar-btn">
              ✗ Inválido
            </Button>
          ) : (
            <Button
              size="sm"
              type="submit"
              variant="primary"
              disabled={!cookieValue.trim()}
              className="cookie-bar-btn"
            >
              Atualizar
            </Button>
          )}
        </Form>

        {/* Status badge */}
        {status === 'valid' && (
          <Badge bg="success" className="cookie-status-badge">● Conectado</Badge>
        )}
        {status === 'invalid' && (
          <Badge bg="danger" className="cookie-status-badge">● Cookie inválido</Badge>
        )}
      </div>

      {/* Ajuda expandível */}
      {showHelp && (
        <div className="cookie-bar-help">
          Obtenha o SESSION em: <strong>BIQA</strong> → <kbd>F12</kbd> →{' '}
          <strong>Application</strong> → <strong>Cookies</strong>
        </div>
      )}
    </div>
  )
}
