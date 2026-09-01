import React, { useState } from 'react'
import { Form, Button, Table } from 'react-bootstrap'
import { Search, Download, Copy, Check, ChevronRight } from 'lucide-react'
import { UtteranceMatch, SUPPORTED_LANGUAGES, UtteranceTranslation } from '../../types'
import { StatusBadge } from '../ui/StatusBadge'
import { TablePagination } from '../ui/TablePagination'
import { usePagination } from '../../hooks/usePagination'
import { EmptyState } from '../ui/EmptyState'

interface SimilarMatchesTableProps {
  matches: UtteranceMatch[]
  totalMatches: number
  searchTerm: string
  onSearchTermChange: (term: string) => void
  onViewDetails: (match: UtteranceMatch, list: UtteranceMatch[]) => void
  onExportCsv: () => void
  defaultLang: string
}

export const SimilarMatchesTable: React.FC<SimilarMatchesTableProps> = ({
  matches,
  totalMatches,
  searchTerm,
  onSearchTermChange,
  onViewDetails,
  onExportCsv,
  defaultLang,
}) => {
  const [copiedUid, setCopiedUid] = useState<string | null>(null)
  const [rowLanguages, setRowLanguages] = useState<Record<string, string>>({})

  const pagination = usePagination<UtteranceMatch>({
    data: matches,
    initialPageSize: 10,
  })

  const handleCopyUid = (uid: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(uid)
    setCopiedUid(uid)
    setTimeout(() => setCopiedUid(null), 1500)
  }

  const handleRowLangChange = (uid: string, langCode: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setRowLanguages((prev) => ({
      ...prev,
      [uid]: langCode,
    }))
  }

  return (
    <div className="similar-matches-section">
      {/* Table Header Controls */}
      <div className="table-controls-bar">
        <div className="d-flex align-items-center gap-2">
          <span className="fw-semibold text-dark">Resultados Similares</span>
          <span className="badge bg-secondary-subtle text-secondary border px-2 py-0.5 rounded-pill small">
            {matches.length} {matches.length === 1 ? 'item' : 'itens'}
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Filter in results search input */}
          <div className="position-relative table-search-box">
            <Search size={14} className="table-search-icon text-muted" />
            <Form.Control
              type="text"
              size="sm"
              placeholder="Pesquisar nos resultados..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="table-search-input"
            />
          </div>

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onExportCsv}
            className="btn-export-csv"
            title="Exportar tabela atual em formato CSV"
          >
            <Download size={13} className="me-1" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Table Content */}
      {matches.length === 0 ? (
        <div className="p-4 bg-white border rounded">
          <EmptyState
            variant="search"
            title="Nenhum resultado similar encontrado"
            description={
              searchTerm
                ? `Nenhum registro corresponde ao filtro "${searchTerm}".`
                : 'Não foram encontradas correspondências adicionais para os critérios de busca.'
            }
            action={
              searchTerm ? (
                <Button variant="link" size="sm" onClick={() => onSearchTermChange('')}>
                  Limpar filtro de pesquisa
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="table-wrapper-card">
          <Table responsive hover className="mb-0 enterprise-table align-middle">
            <thead>
              <tr>
                <th style={{ width: '135px' }}>UID</th>
                <th>Descrição / Frase</th>
                <th style={{ width: '140px' }}>Idioma</th>
                <th style={{ width: '110px' }}>Status</th>
                <th style={{ width: '110px' }}>Divisão</th>
                <th style={{ width: '140px' }} className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedData.map((m) => {
                const activeLang = rowLanguages[m.uid] || m.utteranceBodyDto?.languageCode || defaultLang || 'es-MX'
                
                // Find translation in active lang if available
                const activeTranslation = (m.translations as UtteranceTranslation[] | undefined)?.find(
                  (t) => t.languageCode?.toLowerCase() === activeLang.toLowerCase()
                )

                const desc =
                  activeTranslation?.description ||
                  (m.utteranceBodyDto?.languageCode?.toLowerCase() === activeLang.toLowerCase()
                    ? m.utteranceBodyDto?.description
                    : null) ||
                  m.utteranceBodyDto?.description ||
                  '—'

                const state = m.utteranceBodyDto?.state || 'RELEASED'
                const div = m.connectedContents?.[0]?.divisionName

                return (
                  <tr
                    key={m.uid}
                    onClick={() => onViewDetails(m, matches)}
                    className="clickable-row"
                  >
                    <td>
                      <div className="d-flex align-items-center gap-1.5">
                        <code className="text-primary fw-semibold">{m.uid}</code>
                        <button
                          type="button"
                          className="btn-copy-small"
                          onClick={(e) => handleCopyUid(m.uid, e)}
                          title="Copiar UID"
                        >
                          {copiedUid === m.uid ? (
                            <Check size={12} className="text-success" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="phrase-text-wrapper">
                        <div className="phrase-text" title={desc}>
                          "{desc}"
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1 flex-wrap">
                        {SUPPORTED_LANGUAGES.map((l) => {
                          const isSelected = activeLang.toLowerCase() === l.code.toLowerCase()
                          const hasTrans = (m.translations as UtteranceTranslation[] | undefined)?.some(
                            (t) => t.languageCode?.toLowerCase() === l.code.toLowerCase()
                          ) || m.utteranceBodyDto?.languageCode?.toLowerCase() === l.code.toLowerCase()

                          return (
                            <button
                              key={l.code}
                              type="button"
                              onClick={(e) => handleRowLangChange(m.uid, l.code, e)}
                              className={`lang-mini-pill ${isSelected ? 'active' : ''} ${!hasTrans ? 'dimmed' : ''}`}
                              title={`Alternar idioma para ${l.label}`}
                            >
                              <span className="lang-mini-flag">{l.flag}</span>
                              <span className="lang-mini-code">{l.country}</span>
                            </button>
                          )
                        })}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={state} type="status" />
                    </td>
                    <td>
                      {div ? <StatusBadge status={div} type="division" /> : <span className="text-muted small">—</span>}
                    </td>
                    <td className="text-end">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="btn-action-view"
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewDetails(m, matches)
                        }}
                        title="Ver detalhes da utterance"
                      >
                        <span>Ver detalhes</span>
                        <ChevronRight size={13} className="ms-1" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>

          <TablePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      )}
    </div>
  )
}
