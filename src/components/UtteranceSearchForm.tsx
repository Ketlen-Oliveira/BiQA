import { useState, useRef } from 'react'
import { Card, Form, Button, Alert, Spinner, Table, Pagination, Dropdown } from 'react-bootstrap'
import {
  searchUtterances,
  searchUtterancesBatch,
  fetchUtterance,
  fetchUtteranceContents,
  downloadBatchTemplate,
  processBatchUtterances,
  type ApiResponse,
  type BatchSearchData,
  type UtteranceMatch,
  type SearchResult,
} from '../api'
import { downloadCsv } from '../csvExport'
import { transformContents, transformUtterance } from '../transformContents'
import ResultTable from './ResultTable'

const SEARCH_PAGE_SIZE = 5

/**
 * Normaliza um texto para comparação de "match principal".
 */
function normalizeForMatch(text: string): string {
  if (!text) return ''
  return text
    .trim()
    .toLowerCase()
    .replace(/[!?:,;.¡¿"'`'´(){}\[\]<>\-–—_/\\|@#$%^&*+=~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Tipos internos do componente ─────────────────────────────

interface TableRow {
  uid: string
  description: string
  state: string
  languageCode: string
}

interface GroupDetail {
  uid: string
  utteranceData: unknown
  contentsData: unknown
  showTranslations: boolean
  loading: boolean
}

export default function UtteranceSearchForm() {
  const [query, setQuery] = useState<string>('')
  const [lang, setLang] = useState<string>('es-MX')
  const [maxPages] = useState<number>(50)
  const [divisionFilter, setDivisionFilter] = useState<string>('all')
  const [loading, setLoading] = useState<boolean>(false)
  const [batchData, setBatchData] = useState<BatchSearchData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [searchPages, setSearchPages] = useState<Record<number, number>>({})
  const [showSimilar, setShowSimilar] = useState<Record<number, boolean>>({})
  const [groupDetails, setGroupDetails] = useState<Record<number, GroupDetail | undefined>>({})

  // ── Estado: lote (import/export de planilha) ──
  const [batchLoading, setBatchLoading] = useState<boolean>(false)
  const [batchSuccess, setBatchSuccess] = useState<string | null>(null)
  const [batchError, setBatchError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Handler: baixar modelo de planilha ──
  const handleDownloadTemplate = () => {
    setBatchError(null)
    setBatchSuccess(null)
    downloadBatchTemplate()
  }

  // ── Handler: processar planilha em lote ──
  const handleProcessBatch = async (file: File) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setBatchError('Por favor, selecione um arquivo .xlsx.')
      return
    }
    setBatchLoading(true)
    setBatchError(null)
    setBatchSuccess(null)
    try {
      const result = await processBatchUtterances(file, lang.trim())
      if (result.success) {
        setBatchSuccess('✅ Planilha processada com sucesso! O download do arquivo preenchido foi iniciado automaticamente.')
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        setBatchError(result.error || `Erro ao processar a planilha (HTTP ${result.status_code}).`)
      }
    } catch (err) {
      setBatchError(`Falha ao conectar com o servidor: ${(err as Error).message}`)
    } finally {
      setBatchLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      setError('Por favor, digite pelo menos uma frase.')
      return
    }

    const lines = query.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
    const isBatch = lines.length > 1

    setLoading(true)
    setError(null)
    setBatchData(null)
    setSearchPages({})
    setShowSimilar({})
    setGroupDetails({})

    try {
      let res: ApiResponse
      if (isBatch) {
        res = await searchUtterancesBatch(lang.trim(), lines, maxPages)
      } else {
        res = await searchUtterances(lang.trim(), lines[0], maxPages)
      }

      if (res.success) {
        if (isBatch) {
          setBatchData(res.data as BatchSearchData)
        } else {
          // Busca única — a resposta tem "matches" direto (não "results")
          const d = res.data as unknown as {
            query: string
            lang: string
            total_matches: number
            matches: UtteranceMatch[]
            pages_searched?: number
            total_elements?: number
            max_pages?: number
          }
          setBatchData({
            lang: d.lang,
            total_queries: 1,
            total_matches: d.total_matches,
            results: [{
              query: d.query ?? '',
              lang: d.lang,
              total_matches: d.total_matches,
              matches: d.matches ?? [],
            }],
            pages_searched: d.pages_searched,
            total_elements: d.total_elements,
            max_pages: d.max_pages,
          })
        }
      } else {
        setError(res.error || `Erro: HTTP ${res.status_code}`)
      }
    } catch (err) {
      setError(`Falha ao conectar com o servidor: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  // ── Toggle de detalhes inline por grupo ──
  const handleToggleDetails = async (groupIdx: number, uid: string) => {
    const current = groupDetails[groupIdx]

    if (current?.uid === uid) {
      setGroupDetails((prev) => ({
        ...prev,
        [groupIdx]: { ...current, showTranslations: !current.showTranslations },
      }))
      return
    }

    setGroupDetails((prev) => ({
      ...prev,
      [groupIdx]: { uid, utteranceData: null, contentsData: null, showTranslations: false, loading: true },
    }))

    try {
      const [utteranceRes, contentsRes] = await Promise.all([
        fetchUtterance(uid, lang.trim()),
        fetchUtteranceContents(uid, lang.trim()),
      ])

      setGroupDetails((prev) => ({
        ...prev,
        [groupIdx]: {
          uid,
          utteranceData: utteranceRes.success ? utteranceRes.data : null,
          contentsData: contentsRes.success ? contentsRes.data : null,
          showTranslations: false,
          loading: false,
        },
      }))
    } catch {
      setGroupDetails((prev) => ({
        ...prev,
        [groupIdx]: prev[groupIdx] ? { ...prev[groupIdx]!, loading: false } : undefined,
      }))
    }
  }

  const lineCount = query.split('\n').filter((l) => l.trim().length > 0).length

  // ── Filtra matches por divisão/categoria ──
  const filterMatch = (match: UtteranceMatch): boolean => {
    const contents = match.connectedContents || []

    // Se não há connectedContents, inclui o match (não filtra)
    if (contents.length === 0) return true

    for (const c of contents) {
      const div = c.divisionName
      const cat = c.categoryName
      if (div === 'MX') continue

      if (divisionFilter === 'all') {
        if (div === 'VD' || div === 'DA') return true
      } else if (divisionFilter === 'vd-manual') {
        if (div === 'VD' && cat === 'emanual') return true
      } else if (divisionFilter === 'vd-troubleshooting') {
        if (div === 'VD' && cat === 'devicecare') return true
      } else if (divisionFilter === 'vd-service') {
        if (div === 'VD' && cat === 'svc') return true
      } else if (divisionFilter === 'da-manual') {
        if (div === 'DA' && cat === 'emanual') return true
      } else if (divisionFilter === 'da-troubleshooting') {
        if (div === 'DA' && cat === 'devicecare') return true
      } else if (divisionFilter === 'da-service') {
        if (div === 'DA' && cat === 'svc') return true
      }
    }

    // Se chegou aqui, nenhum content passou no filtro de divisão.
    // Mas se o filtro é "all", inclui mesmo assim (pode ter só MX ou outra divisão).
    if (divisionFilter === 'all') return true

    return false
  }

  const getSearchPage = (idx: number): number => searchPages[idx] || 1
  const setSearchPage = (idx: number, page: number) => setSearchPages((prev) => ({ ...prev, [idx]: page }))
  const getShowSimilar = (idx: number): boolean => showSimilar[idx] || false
  const toggleShowSimilar = (idx: number) => setShowSimilar((prev) => ({ ...prev, [idx]: !prev[idx] }))

  const handleExportGroup = (result: SearchResult) => {
    const filtered = (result.matches || []).filter(filterMatch)
    const tableRows: TableRow[] = filtered.map((m) => ({
      uid: m.uid || '',
      description: m.utteranceBodyDto?.description || '',
      state: m.utteranceBodyDto?.state || '',
      languageCode: m.utteranceBodyDto?.languageCode || '',
    }))
    downloadCsv(tableRows as unknown as Record<string, unknown>[], `busca_${result.query?.slice(0, 30) || 'resultado'}.csv`, ['uid', 'description', 'languageCode', 'state'])
  }

  return (
    <div>
      {/* ── Botão "Ações" com Dropdown (Busca em Lote) ── */}
      <div className="mb-3">
        <Dropdown>
          <Dropdown.Toggle variant="outline-secondary" id="actions-dropdown">
            Ações ⋯
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={handleDownloadTemplate}>
              ⬇ Baixar Planilha Modelo
            </Dropdown.Item>
            <Dropdown.Item onClick={() => fileInputRef.current?.click()}>
              ⬆ Upload & Processar Lote
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>


      {/* ── Card de Busca ── */}
      <Card className="shadow-sm mb-3">
        <Card.Body>
          {lineCount > 1 && (
            <Alert variant="info" className="mb-3">
              → Busca múltipla: {lineCount} frases detectadas (busca em uma única passagem).
            </Alert>
          )}

          <Form onSubmit={handleSearch}>
            <div className="d-flex gap-3 flex-wrap mb-2">
              <Form.Group style={{ flex: 2, minWidth: 250 }} className="mb-2">
                <Form.Label>
                  Utterance Context
                  <span className="text-muted small ms-2">(Pesquise uma ou mais utterances)</span>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={'Ex.: Abra as configurações do Glass\nOu digite várias utterances, uma por linha, para busca múltipla.'}
                  required
                  style={{ minHeight: 80, resize: 'vertical' }}
                />
              </Form.Group>

              <Form.Group className="mb-2" style={{ minWidth: 180 }}>
                <Form.Label>Idioma *</Form.Label>
                <Form.Select value={lang} onChange={(e) => setLang(e.target.value)} required>
                  <option value="es-MX">es-MX (Espanhol - México)</option>
                  <option value="pt-BR">pt-BR (Português - Brasil)</option>
                  <option value="en-US">en-US (Inglês - EUA)</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-2" style={{ minWidth: 180 }}>
                <Form.Label>Filtrar por Divisão</Form.Label>
                <Form.Select value={divisionFilter} onChange={(e) => setDivisionFilter(e.target.value)}>
                  <option value="all">Ambos (VD + DA)</option>
                  <option value="vd-manual">VD - Manual</option>
                  <option value="vd-troubleshooting">VD - Troubleshooting</option>
                  <option value="vd-service">VD - Service</option>
                  <option value="da-manual">DA - Manual</option>
                  <option value="da-troubleshooting">DA - Troubleshooting</option>
                  <option value="da-service">DA - Service</option>
                </Form.Select>
                <small className="text-muted d-block mt-2">⚡ Busca instantânea</small>
              </Form.Group>
            </div>

            <div className="d-flex gap-2">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? (
                  <><Spinner as="span" size="sm" animation="border" className="me-1" /> Buscando...</>
                ) : (
                  `Buscar${lineCount > 1 ? ` (${lineCount} frases)` : ''}`
                )}
              </Button>
              {batchData && batchData.total_matches > 0 && (
                <Button
                  variant="success"
                  onClick={() => batchData.results.forEach((result) => handleExportGroup(result))}
                >
                  ⬇ Exportar
                </Button>
              )}
            </div>
          </Form>
        </Card.Body>
      </Card>

      

        {/* Input de arquivo oculto — processa automaticamente ao selecionar */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleProcessBatch(file)
          }}
          style={{ display: 'none' }}
        />
      </div>

      {batchError && <Alert variant="danger">{batchError}</Alert>}
      {batchSuccess && <Alert variant="success">{batchSuccess}</Alert>}
      {batchLoading && (
        <Alert variant="info">
          <Spinner as="span" size="sm" animation="border" className="me-2" />
          Buscando utterances... Isso pode levar alguns minutos dependendo da quantidade de frases.
        </Alert>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {/* ── Informações de progresso ── */}
      {batchData && (
        <div className="text-muted small mb-2">
          ✅ {batchData.total_queries || 1} {batchData.total_queries === 1 ? 'frase buscada' : 'frases buscadas'} — {batchData.total_matches || 0} {batchData.total_matches === 1 ? 'resultado' : 'resultados'} no total.
        </div>
      )}

      {/* ── Legenda ── */}
      {batchData && batchData.total_matches > 0 && (
        <div className="d-flex gap-3 flex-wrap small text-muted mb-2">
          <span><span className="legend-dot legend-main"></span> Match principal (correspondência exata)</span>
          <span><span className="legend-dot legend-similar"></span> Resultados similares</span>
        </div>
      )}

      {/* ── Resultado da busca ── */}
      {batchData && (
        <div className="mt-3">
          <h5 className="mb-2">
            🔍 Resultados da Busca
            {batchData.total_matches != null && (
              <span className="text-muted small ms-2">
                ({batchData.total_matches} {batchData.total_matches === 1 ? 'resultado' : 'resultados'} no total)
              </span>
            )}
          </h5>

          {batchData.results && batchData.results.length > 0 ? (
            batchData.results.map((result, idx) => {
              const filteredMatches = (result.matches || []).filter(filterMatch)
              const tableRows: TableRow[] = filteredMatches.map((m) => ({
                uid: m.uid || '',
                description: m.utteranceBodyDto?.description || '',
                state: m.utteranceBodyDto?.state || '',
                languageCode: m.utteranceBodyDto?.languageCode || '',
              }))

              const queryNorm = normalizeForMatch(result.query)
              const exactMatchIdx = tableRows.findIndex(
                (r) => normalizeForMatch(r.description) === queryNorm
              )
              const hasExactMatch = exactMatchIdx !== -1
              const mainRow = hasExactMatch ? tableRows[exactMatchIdx] : null
              const similarRows = tableRows.filter((_, i) => i !== exactMatchIdx)

              const totalPages = Math.max(1, Math.ceil(similarRows.length / SEARCH_PAGE_SIZE))
              const currentPage = Math.min(getSearchPage(idx), totalPages)
              const startIdx = (currentPage - 1) * SEARCH_PAGE_SIZE
              const endIdx = startIdx + SEARCH_PAGE_SIZE
              const pageRows = similarRows.slice(startIdx, endIdx)
              const details = groupDetails[idx]

              return (
                <Card key={idx} className="shadow-sm mb-3">
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between flex-wrap mb-2">
                      <h6 className="mb-0">
                        📝 "{result.query}"
                        <span className="text-muted small ms-2">
                          — {tableRows.length} {tableRows.length === 1 ? 'match' : 'matches'}
                          {divisionFilter !== 'all' && result.total_matches !== tableRows.length && (
                            <span className="ms-1">(de {result.total_matches} brutos)</span>
                          )}
                        </span>
                      </h6>
                      {tableRows.length > 0 && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleExportGroup(result)}
                        >
                          Exportar
                        </Button>
                      )}
                    </div>

                    {tableRows.length > 0 ? (
                      <>
                        {!hasExactMatch && (() => {
                          const filterLabels: Record<string, string> = {
                            'all': 'todas as categorias (VD + DA)',
                            'vd-manual': 'VD - Manual',
                            'vd-troubleshooting': 'VD - Troubleshooting',
                            'vd-service': 'VD - Service',
                            'da-manual': 'DA - Manual',
                            'da-troubleshooting': 'DA - Troubleshooting',
                            'da-service': 'DA - Service',
                          }
                          return (
                            <Alert variant="warning" className="py-2 small">
                              ⚠️ Nenhuma correspondência exata encontrada para esta frase no filtro <strong>{filterLabels[divisionFilter] || 'todas as categorias'}</strong>. Os resultados abaixo são apenas similares.
                            </Alert>
                          )
                        })()}

                        {/* ── Match principal ── */}
                        {mainRow && (
                          <Table striped bordered hover responsive size="sm" className="mb-2">
                            <thead>
                              <tr><th>UID</th><th>Descrição</th><th>Idioma</th><th>Estado</th><th>Ações</th></tr>
                            </thead>
                            <tbody>
                              <tr className="row-main-match">
                                <td><span className="match-badge">★</span><strong>{mainRow.uid}</strong></td>
                                <td>{mainRow.description}</td>
                                <td>{mainRow.languageCode}</td>
                                <td>{mainRow.state}</td>
                                <td>
                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => handleToggleDetails(idx, mainRow.uid)}
                                  >
                                    {details?.uid === mainRow.uid
                                      ? (details.showTranslations ? '▲ Ocultar traduções' : '▼ Ver traduções')
                                      : '▼ Ver detalhes'}
                                  </Button>
                                </td>
                              </tr>
                            </tbody>
                          </Table>
                        )}

                        {/* ── Botão similares ── */}
                        {similarRows.length > 0 && (
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="mb-2"
                            onClick={() => toggleShowSimilar(idx)}
                          >
                            {getShowSimilar(idx)
                              ? `▲ Ocultar frases similares (${similarRows.length})`
                              : `▼ Ver frases similares (${similarRows.length})`}
                          </Button>
                        )}

                        {/* ── Tabela de similares ── */}
                        {similarRows.length > 0 && getShowSimilar(idx) && (
                          <>
                            <Table striped bordered hover responsive size="sm">
                              <thead>
                                <tr><th>UID</th><th>Descrição</th><th>Idioma</th><th>Estado</th><th>Ações</th></tr>
                              </thead>
                              <tbody>
                                {pageRows.map((row, ridx) => {
                                  const isSelected = details?.uid === row.uid
                                  return (
                                    <tr key={ridx} className={isSelected ? 'table-primary' : 'row-similar-match'}>
                                      <td><strong>{row.uid}</strong></td>
                                      <td>{row.description}</td>
                                      <td>{row.languageCode}</td>
                                      <td>{row.state}</td>
                                      <td>
                                        <Button
                                          variant="outline-secondary"
                                          size="sm"
                                          onClick={() => handleToggleDetails(idx, row.uid)}
                                        >
                                          {isSelected
                                            ? (details!.showTranslations ? '▲ Ocultar traduções' : '▼ Ver traduções')
                                            : '▼ Ver detalhes'}
                                        </Button>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </Table>

                            {/* Paginação dos similares */}
                            {similarRows.length > SEARCH_PAGE_SIZE && (
                              <div className="d-flex justify-content-center align-items-center gap-2">
                                <Pagination size="sm" className="mb-0">
                                  <Pagination.First onClick={() => setSearchPage(idx, 1)} disabled={currentPage === 1} />
                                  <Pagination.Prev onClick={() => setSearchPage(idx, Math.max(1, currentPage - 1))} disabled={currentPage === 1} />
                                  <span className="text-muted small px-2 d-flex align-items-center">
                                    Página {currentPage} de {totalPages} · {startIdx + 1}–{Math.min(endIdx, similarRows.length)} de {similarRows.length}
                                  </span>
                                  <Pagination.Next onClick={() => setSearchPage(idx, Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} />
                                  <Pagination.Last onClick={() => setSearchPage(idx, totalPages)} disabled={currentPage === totalPages} />
                                </Pagination>
                              </div>
                            )}
                          </>
                        )}

                        {/* ── Detalhes inline ── */}
                        {details && details.uid && (
                          <div className="mt-3 pt-3 border-top">
                            <h6 className="mb-2">Detalhes da Utterance UID: {details.uid}</h6>

                            {details.loading && (
                              <p className="text-muted">
                                <Spinner as="span" size="sm" animation="border" className="me-1" /> Carregando detalhes...
                              </p>
                            )}

                            {/* Descrições (Traduções) */}
                            {details.utteranceData != null && (
                              <div className="mt-2">
                                <div className="d-flex align-items-center gap-2 mb-2">
                                  <h6 className="mb-0">Descrições (Traduções)</h6>
                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => {
                                      setGroupDetails((prev) => ({
                                        ...prev,
                                        [idx]: prev[idx] ? { ...prev[idx]!, showTranslations: !prev[idx]!.showTranslations } : prev[idx],
                                      }))
                                    }}
                                  >
                                    {details.showTranslations ? '▲ Ocultar' : '▼ Ver traduções'}
                                  </Button>
                                </div>
                                {details.showTranslations && (
                                  <ResultTable
                                    data={transformUtterance(details.utteranceData)}
                                    exportName={`utterance_${details.uid}_${lang}`}
                                  />
                                )}
                              </div>
                            )}

                            {/* Conteúdos Associados */}
                            {details.contentsData != null && (
                              <div className="mt-3">
                                <h6 className="mb-2">Conteúdos Associados</h6>
                                <ResultTable
                                  data={transformContents(details.contentsData)}
                                  exportName={`contents_${details.uid}_${lang}`}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-muted fst-italic ps-3">
                        Nenhuma utterance encontrada com esta frase nas páginas buscadas.
                      </p>
                    )}
                  </Card.Body>
                </Card>
              )
            })
          ) : (
            <p className="text-muted fst-italic">Nenhuma utterance encontrada.</p>
          )}
        </div>
      )}
    </div>
  )
}
