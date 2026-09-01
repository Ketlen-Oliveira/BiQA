import React, { KeyboardEvent } from 'react'
import { Form, Button } from 'react-bootstrap'
import { Search, Upload, Download, RotateCcw, Loader2, SlidersHorizontal, Globe } from 'lucide-react'
import { SUPPORTED_LANGUAGES, DIVISION_OPTIONS } from '../../types'
import { downloadBatchTemplate } from '../../api'

interface SearchFormProps {
  queryText: string
  selectedLang: string
  selectedDivision: string
  isLoading: boolean
  onQueryChange: (text: string) => void
  onLangChange: (lang: string) => void
  onDivisionChange: (division: string) => void
  onSearch: () => void
  onClear: () => void
  onOpenBatchModal: () => void
}

export const SearchForm: React.FC<SearchFormProps> = ({
  queryText,
  selectedLang,
  selectedDivision,
  isLoading,
  onQueryChange,
  onLangChange,
  onDivisionChange,
  onSearch,
  onClear,
  onOpenBatchModal,
}) => {
  const lineCount = queryText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean).length

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (!isLoading && queryText.trim()) {
        onSearch()
      }
    }
  }

  return (
    <div className="search-form-card">
      <div className="search-form-header">
        <div className="d-flex align-items-center gap-2">
          <Search size={18} className="text-primary" />
          <span className="fw-semibold text-dark">Buscar Utterance por Frase</span>
        </div>
        {lineCount > 1 && (
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 small rounded-pill">
            Modo em Lote: {lineCount} frases
          </span>
        )}
      </div>

      <div className="search-form-body">
        {/* Main Textarea */}
        <div className="position-relative mb-3">
          <Form.Control
            as="textarea"
            rows={3}
            className="search-textarea"
            placeholder="Digite uma frase ou cole várias frases, uma por linha..."
            value={queryText}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <div className="search-textarea-hint">
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              Dica: Pressione <kbd className="key-hint">Ctrl</kbd> + <kbd className="key-hint">Enter</kbd> para buscar
            </span>
          </div>
        </div>

        {/* Controls Bar: Filters & Action Buttons */}
        <div className="search-controls-bar">
          <div className="search-filters-group">
            {/* Language filter */}
            <div className="filter-item">
              <label htmlFor="select-lang" className="filter-label">
                <Globe size={12} className="me-1" />
                Idioma
              </label>
              <Form.Select
                id="select-lang"
                size="sm"
                className="filter-select"
                value={selectedLang}
                onChange={(e) => onLangChange(e.target.value)}
                disabled={isLoading}
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.label}
                  </option>
                ))}
              </Form.Select>
            </div>

            {/* Division filter */}
            <div className="filter-item">
              <label htmlFor="select-division" className="filter-label">
                <SlidersHorizontal size={12} className="me-1" />
                Divisão
              </label>
              <Form.Select
                id="select-division"
                size="sm"
                className="filter-select"
                value={selectedDivision}
                onChange={(e) => onDivisionChange(e.target.value)}
                disabled={isLoading}
              >
                {DIVISION_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="search-actions-group">
            {queryText && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={onClear}
                disabled={isLoading}
                title="Limpar formulário"
                className="btn-clear-action"
              >
                <RotateCcw size={14} className="me-1" />
                Limpar
              </Button>
            )}

            <Button
              variant="outline-primary"
              size="sm"
              onClick={onOpenBatchModal}
              disabled={isLoading}
              className="btn-batch-upload"
            >
              <Upload size={14} className="me-1" />
              Upload Planilha
            </Button>

            <Button
              variant="outline-secondary"
              size="sm"
              onClick={downloadBatchTemplate}
              title="Baixar modelo de planilha XLSX"
              className="btn-template-download"
            >
              <Download size={14} className="me-1" />
              Modelo
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => onSearch()}
              disabled={isLoading || !queryText.trim()}
              className="btn-search-primary"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="spinner-rotate me-1" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search size={15} className="me-1" />
                  Buscar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
