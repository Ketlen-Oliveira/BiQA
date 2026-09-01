import React from 'react'
import { UtteranceMatch } from '../../types'
import { ExactMatchCard } from './ExactMatchCard'
import { SimilarMatchesTable } from './SimilarMatchesTable'
import { Download, CheckCircle2 } from 'lucide-react'
import { Button } from 'react-bootstrap'

interface SearchResultsProps {
  exactMatches: UtteranceMatch[]
  similarMatches: UtteranceMatch[]
  filteredSimilarMatches: UtteranceMatch[]
  totalMatchesCount: number
  searchTerm: string
  onSearchTermChange: (term: string) => void
  onViewDetails: (match: UtteranceMatch, list: UtteranceMatch[]) => void
  onExportCsv: () => void
  selectedLang: string
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  exactMatches,
  similarMatches,
  filteredSimilarMatches,
  totalMatchesCount,
  searchTerm,
  onSearchTermChange,
  onViewDetails,
  onExportCsv,
  selectedLang,
}) => {
  const hasExact = exactMatches.length > 0
  const hasSimilar = similarMatches.length > 0
  const allMatchesList = [...exactMatches, ...similarMatches]

  return (
    <div className="search-results-wrapper">
      {/* Overview Summary Banner */}
      <div className="results-summary-card">
        <div className="summary-left">
          <div className="summary-title-row">
            <span className="summary-count-badge">
              {totalMatchesCount} {totalMatchesCount === 1 ? 'resultado encontrado' : 'resultados encontrados'}
            </span>
          </div>

          <div className="summary-subtext">
            {hasExact ? (
              <span className="text-emerald-700 fw-medium d-inline-flex align-items-center gap-1">
                <CheckCircle2 size={14} className="text-emerald-600" />
                {exactMatches.length} correspondência exata identificada.
                {hasSimilar && ` Exibindo também ${similarMatches.length} resultados similares.`}
              </span>
            ) : (
              <span className="text-secondary">
                Nenhuma correspondência exata encontrada. Exibindo resultados similares.
              </span>
            )}
          </div>
        </div>

        <div className="summary-right">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onExportCsv}
            className="d-flex align-items-center gap-1.5"
          >
            <Download size={14} />
            <span>Exportar Tudo (CSV)</span>
          </Button>
        </div>
      </div>

      {/* 1. Exact Match Section */}
      {hasExact && (
        <div className="exact-match-section mb-4">
          <div className="section-label mb-2 text-secondary fw-semibold small">
            Correspondência Exata
          </div>
          <div className="d-flex flex-column gap-3">
            {exactMatches.map((m) => (
              <ExactMatchCard
                key={m.uid}
                match={m}
                lang={selectedLang}
                onViewDetails={(match) => onViewDetails(match, allMatchesList)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 2. Similar Matches Section */}
      {hasSimilar && (
        <div className="similar-matches-wrapper">
          <SimilarMatchesTable
            matches={filteredSimilarMatches}
            totalMatches={similarMatches.length}
            searchTerm={searchTerm}
            onSearchTermChange={onSearchTermChange}
            onViewDetails={(match) => onViewDetails(match, allMatchesList)}
            onExportCsv={onExportCsv}
            defaultLang={selectedLang}
          />
        </div>
      )}
    </div>
  )
}
