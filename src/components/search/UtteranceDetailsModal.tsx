import React, { useState, useEffect } from 'react'
import { Modal, Button, Tabs, Tab, Table, Form, Badge } from 'react-bootstrap'
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Globe,
  Layers,
  Search,
  ExternalLink,
  Calendar,
  User,
  Hash,
} from 'lucide-react'
import { UtteranceTranslation, ConnectedContent, UtteranceMatch, SUPPORTED_LANGUAGES } from '../../types'
import { StatusBadge } from '../ui/StatusBadge'
import { LoadingState } from '../ui/LoadingState'
import { EmptyState } from '../ui/EmptyState'
import { ErrorAlert } from '../ui/ErrorAlert'
import { TablePagination } from '../ui/TablePagination'
import { usePagination } from '../../hooks/usePagination'

interface UtteranceDetailsModalProps {
  show: boolean
  onHide: () => void
  uid: string | null
  lang: string
  match: UtteranceMatch | null
  translations: UtteranceTranslation[]
  connectedContents: ConnectedContent[]
  isLoading: boolean
  error: string | null
  currentIndex: number
  totalItems: number
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
  onNavigateToRelated?: (cid: string | number) => void
}

export const UtteranceDetailsModal: React.FC<UtteranceDetailsModalProps> = ({
  show,
  onHide,
  uid,
  lang,
  match,
  translations,
  connectedContents,
  isLoading,
  error,
  currentIndex,
  totalItems,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onNavigateToRelated,
}) => {
  const [activeTab, setActiveTab] = useState<'translations' | 'contents'>('translations')
  const [copiedUid, setCopiedUid] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [selectedLang, setSelectedLang] = useState<string>(lang || 'es-MX')
  const [translationSearch, setTranslationSearch] = useState('')
  const [contentSearch, setContentSearch] = useState('')
  const [expandedContentCid, setExpandedContentCid] = useState<number | string | null>(null)

  // Reset internal states on UID switch
  useEffect(() => {
    setTranslationSearch('')
    setContentSearch('')
    setExpandedContentCid(null)
    setSelectedLang(lang || 'es-MX')
  }, [uid, lang])

  // Keyboard navigation inside modal
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (!show) return
      if (e.key === 'ArrowLeft' && hasPrevious) {
        onPrevious()
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [show, hasPrevious, hasNext, onPrevious, onNext])

  const handleCopyUid = () => {
    if (!uid) return
    navigator.clipboard.writeText(uid)
    setCopiedUid(true)
    setTimeout(() => setCopiedUid(false), 1500)
  }

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 1500)
  }

  // Active translation matching selected language
  const activeTranslation = translations.find(
    (t) => t.languageCode?.toLowerCase() === selectedLang.toLowerCase()
  )

  const currentDesc =
    activeTranslation?.description ||
    (match?.utteranceBodyDto?.languageCode?.toLowerCase() === selectedLang.toLowerCase()
      ? match?.utteranceBodyDto?.description
      : null) ||
    match?.utteranceBodyDto?.description ||
    translations[0]?.description ||
    '—'

  const currentState =
    activeTranslation?.state || match?.utteranceBodyDto?.state || translations[0]?.state || 'RELEASED'

  // Sort and filter translations: prioritize es-MX, pt-BR, en-US, then other returned languages
  const sortedTranslations = [...translations].sort((a, b) => {
    const priority = ['es-mx', 'pt-br', 'en-us']
    const codeA = (a.languageCode || '').toLowerCase()
    const codeB = (b.languageCode || '').toLowerCase()
    const idxA = priority.indexOf(codeA)
    const idxB = priority.indexOf(codeB)
    if (idxA !== -1 && idxB !== -1) return idxA - idxB
    if (idxA !== -1) return -1
    if (idxB !== -1) return 1
    return codeA.localeCompare(codeB)
  })

  const filteredTranslations = sortedTranslations.filter((t) => {
    if (!translationSearch.trim()) return true
    const term = translationSearch.toLowerCase()
    return (
      (t.languageCode || '').toLowerCase().includes(term) ||
      (t.description || '').toLowerCase().includes(term) ||
      (t.state || '').toLowerCase().includes(term) ||
      String(t.updatedBy?.userId || '').toLowerCase().includes(term)
    )
  })

  // Filtered contents
  const filteredContents = connectedContents.filter((c) => {
    if (!contentSearch.trim()) return true
    const term = contentSearch.toLowerCase()
    const cb = c.contentBody || {}
    return (
      String(c.cid || '').toLowerCase().includes(term) ||
      (cb.subject || '').toLowerCase().includes(term) ||
      (cb.body || '').toLowerCase().includes(term) ||
      (c.categoryName || '').toLowerCase().includes(term) ||
      (c.divisionName || '').toLowerCase().includes(term)
    )
  })

  const translationsPagination = usePagination<UtteranceTranslation>({
    data: filteredTranslations,
    initialPageSize: 8,
  })

  const contentsPagination = usePagination<ConnectedContent>({
    data: filteredContents,
    initialPageSize: 5,
  })

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      className="utterance-details-modal"
      scrollable
    >
      {/* Modal Top Header with Title & Result Navigation */}
      <Modal.Header closeButton className="details-modal-header border-bottom">
        <div className="d-flex align-items-center justify-content-between w-100 pe-3 flex-wrap gap-2">
          {/* Left: Title, UID & Badges */}
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h5 className="modal-title-custom mb-0 text-dark fw-bold">Detalhes da utterance</h5>
              <div className="d-flex align-items-center gap-1.5 ms-2">
                <span className="text-muted small fw-medium">UID:</span>
                <code className="details-header-uid">{uid}</code>
                <button
                  type="button"
                  className="btn-copy-small"
                  onClick={handleCopyUid}
                  title="Copiar UID"
                >
                  {copiedUid ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                </button>
              </div>

              <StatusBadge status={currentState} type="status" />
              <StatusBadge status={selectedLang} type="lang" />
            </div>
          </div>

          {/* Right: Previous / Next Navigation */}
          {totalItems > 1 && (
            <div className="d-flex align-items-center gap-2">
              <div className="result-nav-group">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={onPrevious}
                  disabled={!hasPrevious || isLoading}
                  className="btn-nav-arrow"
                  title="Utterance anterior (Seta esquerda)"
                >
                  <ChevronLeft size={15} />
                  <span className="d-none d-sm-inline ms-1">Anterior</span>
                </Button>

                <span className="result-nav-counter">
                  <span className="fw-semibold">{currentIndex}</span> de{' '}
                  <span className="fw-semibold">{totalItems}</span>
                </span>

                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={onNext}
                  disabled={!hasNext || isLoading}
                  className="btn-nav-arrow"
                  title="Próxima utterance (Seta direita)"
                >
                  <span className="d-none d-sm-inline me-1">Próxima</span>
                  <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal.Header>

      <Modal.Body className="p-0">
        {/* Main Phrase Card Banner with Language Selector */}
        <div className="details-phrase-banner">
          <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-1.5 flex-wrap">
              <span className="text-muted small fw-semibold d-flex align-items-center gap-1 me-1">
                <Globe size={14} className="text-primary" />
                Idioma selecionado:
              </span>
              {SUPPORTED_LANGUAGES.map((l) => {
                const isSelected = selectedLang.toLowerCase() === l.code.toLowerCase()
                const hasTrans = translations.some(
                  (t) => t.languageCode?.toLowerCase() === l.code.toLowerCase()
                ) || match?.utteranceBodyDto?.languageCode?.toLowerCase() === l.code.toLowerCase()

                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setSelectedLang(l.code)}
                    className={`lang-switch-pill ${isSelected ? 'active' : ''} ${!hasTrans ? 'muted' : ''}`}
                    title={`Exibir no idioma ${l.label}`}
                  >
                    <span className="lang-pill-flag">{l.flag}</span>
                    <span className="lang-pill-text">{l.label}</span>
                    {isSelected && <span className="lang-pill-dot" />}
                  </button>
                )
              })}
            </div>

            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => handleCopyText(currentDesc)}
              className="btn-copy-phrase-action"
              title="Copiar frase exibida"
            >
              {copiedText === currentDesc ? (
                <>
                  <Check size={13} className="text-success me-1" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy size={13} className="me-1" />
                  Copiar Frase
                </>
              )}
            </Button>
          </div>

          <div className="details-phrase-text">
            "{currentDesc}"
          </div>
        </div>

        {error && (
          <div className="p-3">
            <ErrorAlert error={error} />
          </div>
        )}

        {isLoading ? (
          <div className="py-5">
            <LoadingState message="Carregando detalhes e conteúdos da utterance..." />
          </div>
        ) : (
          <div className="details-modal-tabs-wrapper">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab((k as 'translations' | 'contents') || 'translations')}
              className="details-custom-tabs px-3 pt-2"
            >
              {/* ── TAB 1: TRADUÇÕES ── */}
              <Tab
                eventKey="translations"
                title={
                  <span className="d-flex align-items-center gap-1.5">
                    <Globe size={15} />
                    <span>Traduções</span>
                    <Badge bg="light" text="dark" className="border ms-1 rounded-pill small">
                      {translations.length}
                    </Badge>
                  </span>
                }
              >
                <div className="tab-content-container p-3">
                  {/* Table Search */}
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <div className="text-muted small">
                      Traduções registradas para esta utterance. Priorizando Espanhol, Português e Inglês.
                    </div>
                    {translations.length > 3 && (
                      <div className="position-relative" style={{ width: '240px' }}>
                        <Search size={13} className="table-search-icon text-muted" />
                        <Form.Control
                          type="text"
                          size="sm"
                          placeholder="Filtrar traduções..."
                          value={translationSearch}
                          onChange={(e) => setTranslationSearch(e.target.value)}
                          className="table-search-input"
                        />
                      </div>
                    )}
                  </div>

                  {filteredTranslations.length === 0 ? (
                    <EmptyState
                      variant="search"
                      title="Nenhuma tradução encontrada"
                      description={
                        translationSearch
                          ? 'Nenhum resultado para o filtro aplicado.'
                          : 'Nenhuma tradução cadastrada para esta utterance.'
                      }
                    />
                  ) : (
                    <div className="table-wrapper-card">
                      <Table responsive hover className="mb-0 enterprise-table align-middle">
                        <thead>
                          <tr>
                            <th style={{ width: '150px' }}>Idioma</th>
                            <th>Descrição / Frase</th>
                            <th style={{ width: '110px' }}>Estado</th>
                            <th style={{ width: '180px' }}>Atualizado Por</th>
                            <th style={{ width: '140px' }}>Atualizado Em</th>
                          </tr>
                        </thead>
                        <tbody>
                          {translationsPagination.paginatedData.map((t, idx) => {
                            const isCurrentSelected = t.languageCode?.toLowerCase() === selectedLang.toLowerCase()
                            return (
                              <tr
                                key={`${t.languageCode}_${idx}`}
                                className={isCurrentSelected ? 'table-primary-subtle' : ''}
                                onClick={() => t.languageCode && setSelectedLang(t.languageCode)}
                                style={{ cursor: 'pointer' }}
                              >
                                <td>
                                  <div className="d-flex align-items-center gap-1.5">
                                    <StatusBadge status={t.languageCode || '—'} type="lang" />
                                    {isCurrentSelected && (
                                      <span className="badge bg-primary text-white px-1.5 py-0.5 rounded-pill" style={{ fontSize: '0.65rem' }}>
                                        Visualizando
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <div className="d-flex align-items-center justify-content-between gap-2">
                                    <span className={`phrase-text ${isCurrentSelected ? 'fw-semibold text-primary' : 'text-dark'}`}>
                                      "{t.description || '—'}"
                                    </span>
                                    {t.description && (
                                      <button
                                        type="button"
                                        className="btn-copy-small"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleCopyText(t.description || '')
                                        }}
                                        title="Copiar texto da tradução"
                                      >
                                        {copiedText === t.description ? (
                                          <Check size={12} className="text-success" />
                                        ) : (
                                          <Copy size={12} />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <StatusBadge status={t.state || 'RELEASED'} type="status" />
                                </td>
                                <td>
                                  <div className="small text-secondary d-flex align-items-center gap-1">
                                    <User size={12} className="text-muted" />
                                    <span>{t.updatedBy?.userId ? String(t.updatedBy.userId) : '—'}</span>
                                  </div>
                                </td>
                                <td>
                                  <div className="small text-secondary d-flex align-items-center gap-1">
                                    <Calendar size={12} className="text-muted" />
                                    <span>
                                      {t.updatedAt
                                        ? new Date(t.updatedAt).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                          })
                                        : '—'}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </Table>

                      {filteredTranslations.length > 8 && (
                        <TablePagination
                          currentPage={translationsPagination.currentPage}
                          totalPages={translationsPagination.totalPages}
                          totalItems={translationsPagination.totalItems}
                          pageSize={translationsPagination.pageSize}
                          startIndex={translationsPagination.startIndex}
                          endIndex={translationsPagination.endIndex}
                          onPageChange={translationsPagination.setPage}
                          onPageSizeChange={translationsPagination.setPageSize}
                        />
                      )}
                    </div>
                  )}
                </div>
              </Tab>

              {/* ── TAB 2: CONTEÚDOS ASSOCIADOS ── */}
              <Tab
                eventKey="contents"
                title={
                  <span className="d-flex align-items-center gap-1.5">
                    <Layers size={15} />
                    <span>Conteúdos Associados</span>
                    <Badge bg="light" text="dark" className="border ms-1 rounded-pill small">
                      {connectedContents.length}
                    </Badge>
                  </span>
                }
              >
                <div className="tab-content-container p-3">
                  {/* Table Search */}
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <div className="text-muted small">
                      Documentos técnicos, tópicos de ajuda e manuais vinculados à utterance.
                    </div>
                    {connectedContents.length > 3 && (
                      <div className="position-relative" style={{ width: '240px' }}>
                        <Search size={13} className="table-search-icon text-muted" />
                        <Form.Control
                          type="text"
                          size="sm"
                          placeholder="Filtrar conteúdos..."
                          value={contentSearch}
                          onChange={(e) => setContentSearch(e.target.value)}
                          className="table-search-input"
                        />
                      </div>
                    )}
                  </div>

                  {filteredContents.length === 0 ? (
                    <EmptyState
                      variant="empty"
                      title="Nenhum conteúdo associado"
                      description={
                        contentSearch
                          ? 'Nenhum conteúdo encontrado para o filtro aplicado.'
                          : 'Não há tópicos de e-manual ou suporte vinculados a esta utterance.'
                      }
                    />
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {contentsPagination.paginatedData.map((c, idx) => {
                        const cb = c.contentBody || {}
                        const cid = c.cid || idx
                        const isExpanded = expandedContentCid === cid
                        const bodyText = cb.body || ''
                        const isLong = bodyText.length > 200

                        return (
                          <div key={cid} className="connected-content-item-card">
                            <div className="content-item-header">
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="content-cid-badge">
                                  <Hash size={13} className="me-0.5" />
                                  Content ID: {c.cid || 'N/A'}
                                </span>

                                {c.divisionName && (
                                  <StatusBadge status={c.divisionName} type="division" />
                                )}
                                {c.categoryName && (
                                  <StatusBadge status={c.categoryName} type="category" />
                                )}
                                {cb.state && (
                                  <StatusBadge status={cb.state} type="status" />
                                )}
                              </div>

                              {onNavigateToRelated && c.cid && (
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="btn-quick-related"
                                  onClick={() => {
                                    onHide()
                                    onNavigateToRelated(c.cid!)
                                  }}
                                  title="Pesquisar IDs relacionados a este Content ID"
                                >
                                  <ExternalLink size={13} className="me-1" />
                                  Buscar IDs Relacionados
                                </Button>
                              )}
                            </div>

                            <div className="content-item-body">
                              {cb.subject && (
                                <h6 className="content-item-subject">{cb.subject}</h6>
                              )}

                              {bodyText ? (
                                <div className="content-item-text">
                                  {isLong && !isExpanded
                                    ? `${bodyText.slice(0, 200)}...`
                                    : bodyText}
                                  {isLong && (
                                    <button
                                      type="button"
                                      className="btn-toggle-expand"
                                      onClick={() => setExpandedContentCid(isExpanded ? null : cid)}
                                    >
                                      {isExpanded ? 'Recolher texto' : 'Ver texto completo'}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted small fst-italic">
                                  Nenhum corpo de texto registrado para este conteúdo.
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}

                      {filteredContents.length > 5 && (
                        <TablePagination
                          currentPage={contentsPagination.currentPage}
                          totalPages={contentsPagination.totalPages}
                          totalItems={contentsPagination.totalItems}
                          pageSize={contentsPagination.pageSize}
                          startIndex={contentsPagination.startIndex}
                          endIndex={contentsPagination.endIndex}
                          onPageChange={contentsPagination.setPage}
                          onPageSizeChange={contentsPagination.setPageSize}
                        />
                      )}
                    </div>
                  )}
                </div>
              </Tab>
            </Tabs>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-top pt-3 pb-3 px-4 d-flex justify-content-between align-items-center">
        <div className="text-muted small">
          Atalhos de teclado: <kbd>&larr;</kbd> Anterior &bull; <kbd>&rarr;</kbd> Próxima &bull; <kbd>Esc</kbd> Fechar
        </div>
        <Button variant="secondary" size="sm" onClick={onHide} className="px-4">
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
