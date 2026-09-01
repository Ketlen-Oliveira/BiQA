import React, { useState } from 'react'
import { SearchForm } from '../components/search/SearchForm'
import { SearchResults } from '../components/search/SearchResults'
import { UtteranceDetailsModal } from '../components/search/UtteranceDetailsModal'
import { BatchUploadModal } from '../components/search/BatchUploadModal'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorAlert } from '../components/ui/ErrorAlert'
import { EmptyState } from '../components/ui/EmptyState'
import { useUtteranceSearch } from '../hooks/useUtteranceSearch'
import { useUtteranceDetails } from '../hooks/useUtteranceDetails'
import { UtteranceMatch } from '../types'

interface UtteranceSearchPageProps {
  onNavigateToRelated?: (cid: string | number) => void
}

export const UtteranceSearchPage: React.FC<UtteranceSearchPageProps> = ({
  onNavigateToRelated,
}) => {
  const [showBatchModal, setShowBatchModal] = useState(false)

  const search = useUtteranceSearch()
  const details = useUtteranceDetails()

  const handleViewDetails = (match: UtteranceMatch, list?: UtteranceMatch[]) => {
    details.openDetails(match, search.selectedLang, list || search.allMatches)
  }

  return (
    <div className="page-container">
      {/* Search Input Box */}
      <SearchForm
        queryText={search.queryText}
        selectedLang={search.selectedLang}
        selectedDivision={search.selectedDivision}
        isLoading={search.isLoading}
        onQueryChange={search.setQueryText}
        onLangChange={search.setSelectedLang}
        onDivisionChange={search.setSelectedDivision}
        onSearch={search.performSearch}
        onClear={search.clearSearch}
        onOpenBatchModal={() => setShowBatchModal(true)}
      />

      {/* Error alert if any */}
      {search.error && (
        <div className="mt-3">
          <ErrorAlert
            message={search.error}
            onDismiss={() => {}}
            onRetry={() => search.performSearch()}
          />
        </div>
      )}

      {/* Loading state during search */}
      {search.isLoading && (
        <div className="py-5 mt-3">
          <LoadingState message="Consultando base de utterances e processando correspondências..." />
        </div>
      )}

      {/* Results Area */}
      {!search.isLoading && search.hasSearched && (
        <div className="mt-4">
          {search.allMatches.length === 0 ? (
            <div className="p-4 bg-white border rounded">
              <EmptyState
                variant="search"
                title="Nenhuma utterance encontrada"
                description={`Não encontramos correspondências para a frase pesquisada no idioma "${search.selectedLang}". Tente outro termo ou verifique a ortografia.`}
              />
            </div>
          ) : (
            <SearchResults
              exactMatches={search.exactMatches}
              similarMatches={search.similarMatches}
              filteredSimilarMatches={search.filteredSimilarMatches}
              totalMatchesCount={search.totalMatchesCount}
              searchTerm={search.searchWithinResults}
              onSearchTermChange={search.setSearchWithinResults}
              onViewDetails={handleViewDetails}
              onExportCsv={search.exportResultsCsv}
              selectedLang={search.selectedLang}
            />
          )}
        </div>
      )}

      {/* Batch Upload Modal */}
      <BatchUploadModal
        show={showBatchModal}
        onHide={() => setShowBatchModal(false)}
        defaultLang={search.selectedLang}
      />

      {/* Utterance Details Modal with Result Carousel Navigation */}
      <UtteranceDetailsModal
        show={details.isOpen}
        onHide={details.closeDetails}
        uid={details.currentUid}
        lang={details.currentLang}
        match={details.currentMatch}
        translations={details.translations}
        connectedContents={details.connectedContents}
        isLoading={details.isLoading}
        error={details.error}
        currentIndex={details.currentIndex}
        totalItems={details.totalItems}
        hasPrevious={details.hasPrevious}
        hasNext={details.hasNext}
        onPrevious={details.goToPrevious}
        onNext={details.goToNext}
        onNavigateToRelated={onNavigateToRelated}
      />
    </div>
  )
}
