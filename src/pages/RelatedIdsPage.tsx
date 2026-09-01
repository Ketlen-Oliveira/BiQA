import React, { useState, useEffect } from 'react'
import { Form, Button, Table, Badge } from 'react-bootstrap'
import { Link2, Search, Download, Copy, Check, Hash, RotateCcw, Loader2, ArrowRight } from 'lucide-react'
import { fetchRelatedIds } from '../api'
import { RelatedIdItem } from '../types'
import { StatusBadge } from '../components/ui/StatusBadge'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorAlert } from '../components/ui/ErrorAlert'
import { TablePagination } from '../components/ui/TablePagination'
import { usePagination } from '../hooks/usePagination'
import { downloadCsv } from '../csvExport'

interface RelatedIdsPageProps {
  initialCid?: string | number | null
  onClearInitialCid?: () => void
}

export const RelatedIdsPage: React.FC<RelatedIdsPageProps> = ({
  initialCid,
  onClearInitialCid,
}) => {
  const [cidInput, setCidInput] = useState<string>('')
  const [results, setResults] = useState<Record<string, unknown>[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hasSearched, setHasSearched] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [filterTerm, setFilterTerm] = useState<string>('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Handle auto-search if initialCid was provided via shortcut
  useEffect(() => {
    if (initialCid) {
      setCidInput(String(initialCid))
      handleSearch(String(initialCid))
      if (onClearInitialCid) onClearInitialCid()
    }
  }, [initialCid])

  const handleSearch = async (overrideCid?: string) => {
    const targetCid = (overrideCid !== undefined ? overrideCid : cidInput).trim()
    if (!targetCid) {
      setError('Por favor, informe um Content ID (CID) válido.')
      return
    }

    setIsLoading(true)
    setError(null)
    setHasSearched(true)
    setFilterTerm('')

    try {
      const res = await fetchRelatedIds(targetCid)
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          setResults(res.data as Record<string, unknown>[])
        } else if (typeof res.data === 'object') {
          const d = res.data as Record<string, unknown>
          let foundArray = false
          for (const k of Object.keys(d)) {
            if (Array.isArray(d[k])) {
              setResults(d[k] as Record<string, unknown>[])
              foundArray = true
              break
            }
          }
          if (!foundArray) {
            setResults([d])
          }
        }
      } else {
        setError(res.error || 'Nenhum registro relacionado retornado para este Content ID.')
        setResults([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na conexão ao buscar IDs relacionados.')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setCidInput('')
    setResults([])
    setHasSearched(false)
    setError(null)
    setFilterTerm('')
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  const filteredResults = results.filter((row) => {
    if (!filterTerm.trim()) return true
    const term = filterTerm.toLowerCase()
    return Object.values(row).some((val) =>
      String(val || '').toLowerCase().includes(term)
    )
  })

  const pagination = usePagination<Record<string, unknown>>({
    data: filteredResults,
    initialPageSize: 10,
  })

  const handleExportCsv = () => {
    if (filteredResults.length === 0) return
    const filename = `biqa_related_ids_CID_${cidInput}_${new Date().toISOString().slice(0, 10)}.csv`
    downloadCsv(filteredResults, filename)
  }

  return (
    <div className="page-container">
      {/* Search Input Box */}
      <div className="search-form-card mb-4">
        <div className="search-form-header">
          <div className="d-flex align-items-center gap-2">
            <Link2 size={18} className="text-primary" />
            <span className="fw-semibold text-dark">Consulta de IDs Relacionados</span>
          </div>
        </div>

        <div className="search-form-body">
          <Form
            onSubmit={(e) => {
              e.preventDefault()
              handleSearch()
            }}
          >
            <div className="row g-3 align-items-end">
              <div className="col-md-7">
                <Form.Label className="filter-label">Content ID (CID):</Form.Label>
                <div className="position-relative">
                  <Hash size={15} className="table-search-icon text-muted" />
                  <Form.Control
                    type="text"
                    size="sm"
                    className="table-search-input"
                    placeholder="Ex: 101, 204, ou identificador numérico..."
                    value={cidInput}
                    onChange={(e) => setCidInput(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="col-md-5 d-flex gap-2 justify-content-md-end">
                {cidInput && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleClear}
                    disabled={isLoading}
                  >
                    <RotateCcw size={14} className="me-1" />
                    Limpar
                  </Button>
                )}

                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isLoading || !cidInput.trim()}
                  className="px-3 d-flex align-items-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={14} className="spinner-rotate" />
                      Consultando...
                    </>
                  ) : (
                    <>
                      <Search size={14} />
                      Consultar IDs
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-4">
          <ErrorAlert
            message={error}
            onRetry={() => handleSearch()}
          />
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="py-5">
          <LoadingState message="Consultando grafo de dependências e IDs relacionados..." />
        </div>
      )}

      {/* Results table */}
      {!isLoading && hasSearched && (
        <div className="search-results-wrapper">
          {results.length === 0 ? (
            <div className="p-4 bg-white border rounded">
              <EmptyState
                variant="empty"
                title="Nenhum vínculo encontrado"
                description={`Não foram encontrados IDs correlacionados ao Content ID ${cidInput}.`}
              />
            </div>
          ) : (
            <div className="similar-matches-section">
              {/* Controls bar */}
              <div className="table-controls-bar">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-semibold text-dark">
                    Vínculos Relacionados ao CID {cidInput}
                  </span>
                  <span className="badge bg-secondary-subtle text-secondary border px-2 py-0.5 rounded-pill small">
                    {results.length} {results.length === 1 ? 'vínculo' : 'vínculos'}
                  </span>
                </div>

                <div className="d-flex align-items-center gap-2">
                  {results.length > 5 && (
                    <div className="position-relative table-search-box">
                      <Search size={13} className="table-search-icon text-muted" />
                      <Form.Control
                        type="text"
                        size="sm"
                        placeholder="Filtrar nesta tabela..."
                        value={filterTerm}
                        onChange={(e) => setFilterTerm(e.target.value)}
                        className="table-search-input"
                      />
                    </div>
                  )}

                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleExportCsv}
                    className="btn-export-csv"
                  >
                    <Download size={13} className="me-1" />
                    Exportar CSV
                  </Button>
                </div>
              </div>

              {/* Table wrapper */}
              <div className="table-wrapper-card">
                <Table responsive hover className="mb-0 enterprise-table">
                  <thead>
                    <tr>
                      {Object.keys(results[0] || {}).map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                      <th style={{ width: '80px' }} className="text-end">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagination.paginatedData.map((row, rowIdx) => {
                      const relatedId = String(row['Related ID'] || row['related_id'] || '')
                      return (
                        <tr key={rowIdx}>
                          {Object.entries(row).map(([key, val], cellIdx) => {
                            const valStr = String(val ?? '—')
                            const isId = key.toLowerCase().includes('id')
                            const isStatus = key.toLowerCase().includes('estado') || key.toLowerCase().includes('status')
                            const isDiv = key.toLowerCase().includes('divisão') || key.toLowerCase().includes('division')
                            const isCat = key.toLowerCase().includes('categoria') || key.toLowerCase().includes('category')

                            return (
                              <td key={cellIdx}>
                                {isStatus ? (
                                  <StatusBadge status={valStr} type="status" />
                                ) : isDiv ? (
                                  <StatusBadge status={valStr} type="division" />
                                ) : isCat ? (
                                  <StatusBadge status={valStr} type="category" />
                                ) : isId ? (
                                  <code className="text-primary fw-semibold">{valStr}</code>
                                ) : (
                                  <span className="text-dark small">{valStr}</span>
                                )}
                              </td>
                            )
                          })}
                          <td className="text-end">
                            {relatedId && (
                              <button
                                type="button"
                                className="btn-copy-small"
                                onClick={() => handleCopy(relatedId, `row_${rowIdx}`)}
                                title="Copiar Related ID"
                              >
                                {copiedKey === `row_${rowIdx}` ? (
                                  <Check size={13} className="text-success" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>

                {/* Pagination */}
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
            </div>
          )}
        </div>
      )}
    </div>
  )
}
