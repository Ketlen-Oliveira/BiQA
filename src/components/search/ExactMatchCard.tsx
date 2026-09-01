import React, { useState } from 'react'
import { Button } from 'react-bootstrap'
import { CheckCircle2, Copy, Check, ChevronRight, Layers, Globe } from 'lucide-react'
import { UtteranceMatch, SUPPORTED_LANGUAGES, UtteranceTranslation } from '../../types'
import { StatusBadge } from '../ui/StatusBadge'

interface ExactMatchCardProps {
  match: UtteranceMatch
  lang: string
  onViewDetails: (match: UtteranceMatch) => void
}

export const ExactMatchCard: React.FC<ExactMatchCardProps> = ({
  match,
  lang,
  onViewDetails,
}) => {
  const [copied, setCopied] = useState(false)
  const [currentLang, setCurrentLang] = useState<string>(
    match.utteranceBodyDto?.languageCode || lang || 'es-MX'
  )

  const handleCopyUid = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(match.uid)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // Find translation matching active language if available
  const activeTranslation = (match.translations as UtteranceTranslation[] | undefined)?.find(
    (t) => t.languageCode?.toLowerCase() === currentLang.toLowerCase()
  )

  const displayedPhrase =
    activeTranslation?.description ||
    (match.utteranceBodyDto?.languageCode?.toLowerCase() === currentLang.toLowerCase()
      ? match.utteranceBodyDto?.description
      : null) ||
    match.utteranceBodyDto?.description ||
    'Sem descrição'

  const primaryContent = match.connectedContents?.[0]
  const contentBody = primaryContent?.contentBody

  return (
    <div className="exact-match-card" onClick={() => onViewDetails(match)}>
      <div className="exact-match-header">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="badge-exact-match">
            <CheckCircle2 size={13} className="me-1" />
            Correspondência Exata
          </span>

          <div className="d-flex align-items-center gap-1">
            <span className="text-muted small fw-medium">UID:</span>
            <code className="exact-match-uid">{match.uid}</code>
            <button
              type="button"
              className="btn-copy-small"
              onClick={handleCopyUid}
              title="Copiar UID"
            >
              {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
            </button>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <StatusBadge status={match.utteranceBodyDto?.state || 'RELEASED'} type="status" />
        </div>
      </div>

      <div className="exact-match-body">
        {/* Language selector chips for quick preview */}
        <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
          <div className="d-flex align-items-center gap-1.5 flex-wrap">
            <span className="text-muted small fw-medium d-flex align-items-center gap-1 me-1">
              <Globe size={13} />
              Idioma da frase:
            </span>
            {SUPPORTED_LANGUAGES.map((l) => {
              const isSelected = currentLang.toLowerCase() === l.code.toLowerCase()
              const hasTrans = (match.translations as UtteranceTranslation[] | undefined)?.some(
                (t) => t.languageCode?.toLowerCase() === l.code.toLowerCase()
              ) || match.utteranceBodyDto?.languageCode?.toLowerCase() === l.code.toLowerCase()

              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentLang(l.code)
                  }}
                  className={`lang-switch-pill ${isSelected ? 'active' : ''} ${!hasTrans ? 'muted' : ''}`}
                  title={`Ver frase em ${l.label}`}
                >
                  <span className="lang-pill-flag">{l.flag}</span>
                  <span className="lang-pill-text">{l.shortLabel}</span>
                  {isSelected && <span className="lang-pill-dot" />}
                </button>
              )
            })}
          </div>

          <StatusBadge status={currentLang} type="lang" />
        </div>

        <div className="exact-match-phrase">
          "{displayedPhrase}"
        </div>

        {primaryContent && (
          <div className="exact-match-content-preview mt-3">
            <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
              <Layers size={14} className="text-primary" />
              <span className="text-muted small fw-semibold">Conteúdo Vinculado (CID {primaryContent.cid}):</span>
              {primaryContent.divisionName && (
                <StatusBadge status={primaryContent.divisionName} type="division" />
              )}
              {primaryContent.categoryName && (
                <StatusBadge status={primaryContent.categoryName} type="category" />
              )}
            </div>

            {contentBody?.subject && (
              <div className="exact-content-subject">{contentBody.subject}</div>
            )}
          </div>
        )}
      </div>

      <div className="exact-match-footer">
        <span className="text-muted small">
          Clique no card ou no botão ao lado para abrir os detalhes completos.
        </span>

        <Button
          variant="primary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails(match)
          }}
          className="d-flex align-items-center gap-1 btn-view-details"
        >
          <span>Ver detalhes</span>
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  )
}
