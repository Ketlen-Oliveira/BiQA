import { useState } from 'react'
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap'
import { fetchRelatedIds, type ApiResponse } from '../api'
import ResultTable from './ResultTable'

/**
 * Formulário para o Endpoint 2:
 *   /api/v1/contents/{cid}/related-id/search
 *
 * Permite ao usuário informar `cid`, disparar a consulta
 * e visualizar os IDs relacionados em tabela ou JSON.
 */
export default function RelatedIdForm() {
  const [cid, setCid] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cid.trim()) {
      setError('Por favor, informe o CID do conteúdo.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res: ApiResponse = await fetchRelatedIds(cid.trim())
      if (res.success) {
        setResult(res.data)
      } else {
        setError(res.error || `Erro: HTTP ${res.status_code}`)
        if (res.data) setResult(res.data)
      }
    } catch (err) {
      setError(`Falha ao conectar com o servidor: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>CID do Conteúdo *</Form.Label>
            <Form.Control
              type="text"
              value={cid}
              onChange={(e) => setCid(e.target.value)}
              placeholder="Ex.: content-123"
              required
            />
          </Form.Group>

          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (
              <><Spinner as="span" size="sm" animation="border" className="me-1" /> Consultando...</>
            ) : (
              '🔍 Consultar'
            )}
          </Button>
        </Form>

        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

        {result != null && (
          <div className="mt-4">
            <ResultTable data={result} exportName={`related_ids_${cid}`} />
          </div>
        )}
      </Card.Body>
    </Card>
  )
}
