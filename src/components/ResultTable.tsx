import { useState, useMemo } from 'react'
import { Table, Button, InputGroup, Form, Pagination, Badge } from 'react-bootstrap'
import { downloadCsv } from '../csvExport'

interface ResultTableProps {
  data: unknown
  exportName?: string
  pageSize?: number
}

/**
 * Componente reutilizável para exibição de resultados em tabela.
 *
 * Funcionalidades:
 *  - Detecta colunas automaticamente a partir dos dados.
 *  - Campo de filtro que busca em todas as colunas.
 *  - Paginação (3 registros por página).
 *  - Células com texto longo são truncadas com (...) e expansíveis ao clicar.
 *  - Botão de exportação CSV (exporta TODOS os registros filtrados).
 *  - Fallback para JSON viewer quando os dados não são um array de objetos.
 */
export default function ResultTable({ data, exportName = 'resultado', pageSize = 3 }: ResultTableProps) {
  const [filter, setFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [expandedCells, setExpandedCells] = useState<Record<string, boolean>>({})

  const rows = useMemo(() => normalizeToArray(data), [data])

  const columns = useMemo<string[]>(() => {
    if (rows.length === 0) return []
    return Object.keys(rows[0])
  }, [rows])

  const filteredRows = useMemo(() => {
    if (!filter.trim()) return rows
    const lower = filter.toLowerCase()
    return rows.filter((row) =>
      columns.some((col) =>
        String(row[col] ?? '').toLowerCase().includes(lower),
      ),
    )
  }, [rows, columns, filter])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const startIdx = (safePage - 1) * pageSize
  const endIdx = startIdx + pageSize
  const pageRows = filteredRows.slice(startIdx, endIdx)

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value)
    setCurrentPage(1)
  }

  const toggleCell = (rowIdx: number, col: string) => {
    const key = `${rowIdx}-${col}`
    setExpandedCells((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const MAX_CELL_LENGTH = 100

  // Caso os dados não sejam tabulares, mostra JSON
  if (rows.length === 0) {
    return (
      <div>
        <h6 className="mb-2">Resposta da API</h6>
        <pre className="json-viewer p-3 rounded">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div>
      {/* Toolbar: contador + filtro + exportar */}
      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <h6 className="mb-0">
          <Badge bg="secondary">{filteredRows.length}</Badge>{' '}
          {filteredRows.length === 1 ? 'registro' : 'registros'}
        </h6>
        <div className="d-flex gap-2">
          <InputGroup style={{ maxWidth: 220 }}>
            <Form.Control
              size="sm"
              placeholder="🔍 Filtrar resultados..."
              value={filter}
              onChange={handleFilterChange}
            />
          </InputGroup>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => downloadCsv(filteredRows, `${exportName}.csv`, columns)}
            title="Exporta todos os registros filtrados"
          >
            ⬇ CSV ({filteredRows.length})
          </Button>
        </div>
      </div>

      <Table striped bordered hover responsive size="sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageRows.map((row, idx) => {
            const rowIdx = startIdx + idx
            return (
              <tr key={rowIdx}>
                {columns.map((col) => {
                  const rawValue = formatCell(row[col])
                  const isLong = rawValue.length > MAX_CELL_LENGTH
                  const cellKey = `${rowIdx}-${col}`
                  const isExpanded = expandedCells[cellKey]

                  return (
                    <td key={col} title={isLong && !isExpanded ? rawValue : undefined} style={{ maxWidth: 300 }}>
                      {isLong ? (
                        <>
                          {isExpanded ? (
                            <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{rawValue}</span>
                          ) : (
                            <span>{rawValue.slice(0, MAX_CELL_LENGTH)}</span>
                          )}
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 align-baseline"
                            style={{ fontSize: '0.8rem' }}
                            onClick={() => toggleCell(rowIdx, col)}
                          >
                            {isExpanded ? ' (...menos)' : ' (...)'}
                          </Button>
                        </>
                      ) : (
                        rawValue
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </Table>

      {/* Paginação */}
      {filteredRows.length > pageSize && (
        <div className="d-flex justify-content-center align-items-center gap-2 mt-2">
          <Pagination size="sm" className="mb-0">
            <Pagination.First onClick={() => setCurrentPage(1)} disabled={safePage === 1} />
            <Pagination.Prev onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} />
            <span className="text-muted small px-2 d-flex align-items-center">
              Página {safePage} de {totalPages} · {startIdx + 1}–{Math.min(endIdx, filteredRows.length)} de {filteredRows.length}
            </span>
            <Pagination.Next onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} />
            <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages} />
          </Pagination>
        </div>
      )}
    </div>
  )
}

// ── Funções auxiliares ────────────────────────────────────────

function normalizeToArray(data: unknown): Record<string, unknown>[] {
  if (data == null) return []
  if (Array.isArray(data)) {
    return data.filter((item) => item && typeof item === 'object') as Record<string, unknown>[]
  }
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key]) && (obj[key] as unknown[]).length > 0) {
        return (obj[key] as unknown[]).filter((item) => item && typeof item === 'object') as Record<string, unknown>[]
      }
    }
    return [obj]
  }
  return []
}

function formatCell(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
