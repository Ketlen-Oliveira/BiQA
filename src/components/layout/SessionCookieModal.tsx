import React, { useState, useEffect } from 'react'
import { Modal, Button, Form, Alert, Collapse } from 'react-bootstrap'
import { KeyRound, ShieldCheck, Check, Copy, Trash2, CheckCircle2, AlertCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { updateSessionCookie } from '../../api'

interface SessionCookieModalProps {
  show: boolean
  onHide: () => void
  onCookieSaved?: (cookie: string | null) => void
  currentCookie: string | null
}

const STORAGE_KEY = 'biqa_session_cookie'

export const SessionCookieModal: React.FC<SessionCookieModalProps> = ({
  show,
  onHide,
  onCookieSaved,
  currentCookie,
}) => {
  const [cookieInput, setCookieInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    if (show) {
      setCookieInput(currentCookie || localStorage.getItem(STORAGE_KEY) || '')
      setFeedback(null)
      setShowInstructions(false)
    }
  }, [show, currentCookie])

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSaving(true)
    setFeedback(null)

    const clean = cookieInput.trim()

    try {
      const res = await updateSessionCookie(clean)
      if (res.success) {
        if (clean) {
          localStorage.setItem(STORAGE_KEY, clean)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
        if (onCookieSaved) onCookieSaved(clean || null)
        setFeedback({
          type: 'success',
          text: clean ? 'Sessão atualizada com sucesso!' : 'Sessão desvinculada.',
        })
        setTimeout(() => {
          onHide()
        }, 1000)
      } else {
        setFeedback({
          type: 'danger',
          text: res.error || 'Não foi possível salvar o cookie de sessão.',
        })
      }
    } catch {
      setFeedback({
        type: 'danger',
        text: 'Erro de conexão ao atualizar sessão.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClear = () => {
    setCookieInput('')
  }

  const handleCopy = () => {
    if (!cookieInput) return
    navigator.clipboard.writeText(cookieInput)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isConfigured = Boolean(currentCookie || localStorage.getItem(STORAGE_KEY))

  return (
    <Modal show={show} onHide={onHide} centered className="session-cookie-clean-modal" size="md">
      <Modal.Header closeButton className="border-0 pb-1 pt-3 px-4">
        <div className="d-flex align-items-center gap-2.5">
          <div className="session-modal-icon-badge">
            <KeyRound size={18} />
          </div>
          <div>
            <Modal.Title className="h6 fw-bold mb-0 text-dark">Sessão da API</Modal.Title>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>Autenticação com o backend BiQA</span>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body className="pt-2 pb-3 px-4">
        {/* Status card */}
        <div className="d-flex align-items-center justify-content-between mb-3 px-3 py-2 rounded-3 bg-slate-50 border">
          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted">Status:</span>
            {isConfigured ? (
              <span className="status-pill status-pill-active">
                <CheckCircle2 size={12} className="me-1" />
                Sessão conectada
              </span>
            ) : (
              <span className="status-pill status-pill-inactive">
                <AlertCircle size={12} className="me-1" />
                Não conectada
              </span>
            )}
          </div>
          {currentCookie && (
            <code className="text-muted small">
              {currentCookie.slice(0, 8)}...{currentCookie.slice(-6)}
            </code>
          )}
        </div>

        {feedback && (
          <Alert variant={feedback.type} className="py-2 px-3 small mb-3 d-flex align-items-center gap-2 rounded-3">
            {feedback.type === 'success' ? <Check size={15} /> : <AlertCircle size={15} />}
            <span>{feedback.text}</span>
          </Alert>
        )}

        <Form onSubmit={handleSave}>
          <Form.Group className="mb-2">
            <Form.Label className="small fw-semibold text-secondary mb-1">
              Token de Sessão (SESSION Cookie)
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Cole o valor do cookie SESSION aqui..."
              value={cookieInput}
              onChange={(e) => setCookieInput(e.target.value)}
              className="cookie-textarea-clean font-monospace"
            />
          </Form.Group>

          {/* Toggle instructions */}
          <div className="mb-3">
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-decoration-none d-flex align-items-center gap-1 text-secondary"
              onClick={() => setShowInstructions(!showInstructions)}
              style={{ fontSize: '0.78rem' }}
            >
              <HelpCircle size={13} />
              <span>Como obter o cookie?</span>
              {showInstructions ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            <Collapse in={showInstructions}>
              <div className="mt-2 p-2.5 bg-slate-50 border rounded-3 text-muted" style={{ fontSize: '0.76rem', lineHeight: '1.4' }}>
                <ol className="mb-0 ps-3">
                  <li>Acesse o portal interno do <strong>BiQA</strong> no seu navegador.</li>
                  <li>Abra as Ferramentas do Desenvolvedor (<kbd>F12</kbd>) &rarr; aba <strong>Application / Storage</strong> &rarr; <strong>Cookies</strong>.</li>
                  <li>Copie o valor correspondente ao cookie <code>SESSION</code> e cole no campo acima.</li>
                </ol>
              </div>
            </Collapse>
          </div>

          <div className="d-flex justify-content-between align-items-center pt-1 border-top">
            <div className="d-flex gap-2">
              {cookieInput && (
                <>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleCopy}
                    className="btn-clean-action"
                    title="Copiar token"
                  >
                    <Copy size={13} className="me-1" />
                    {copied ? 'Copiado' : 'Copiar'}
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={handleClear}
                    className="btn-clean-action"
                    title="Limpar campo"
                  >
                    <Trash2 size={13} className="me-1" />
                    Limpar
                  </Button>
                </>
              )}
            </div>

            <div className="d-flex gap-2">
              <Button variant="light" size="sm" onClick={onHide} className="px-3">
                Fechar
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isSaving}
                className="btn-clean-primary px-3"
              >
                <ShieldCheck size={14} className="me-1.5" />
                {isSaving ? 'Salvando...' : 'Salvar Sessão'}
              </Button>
            </div>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  )
}
