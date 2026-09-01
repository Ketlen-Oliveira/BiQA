import { useState, useMemo, useCallback } from 'react'
import { searchUtterances, searchUtterancesBatch } from '../api'
import { UtteranceMatch, SearchResult, BatchSearchData } from '../types'
import { downloadCsv } from '../csvExport'

function normalizeStr(text: string): string {
  if (!text) return ''
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[!?:,;.¡¿"'`'´(){}\[\]<>\-–—_/\\|@#$%^&*+=~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface UseUtteranceSearchResult {
  queryText: string
  selectedLang: string
  selectedDivision: string
  searchWithinResults: string
  isLoading: boolean
  hasSearched: boolean
  error: string | null
  totalMatchesCount: number
  isBatchSearch: boolean
  batchData: BatchSearchData | null
  exactMatches: UtteranceMatch[]
  similarMatches: UtteranceMatch[]
  filteredSimilarMatches: UtteranceMatch[]
  allMatches: UtteranceMatch[]
  hasExactMatch: boolean
  setQueryText: (text: string) => void
  setSelectedLang: (lang: string) => void
  setSelectedDivision: (div: string) => void
  setSearchWithinResults: (term: string) => void
  performSearch: (overrideQuery?: string) => Promise<void>
  clearSearch: () => void
  exportResultsCsv: () => void
}

export function useUtteranceSearch(): UseUtteranceSearchResult {
  const [queryText, setQueryText] = useState('')
  const [selectedLang, setSelectedLang] = useState('es-MX')
  const [selectedDivision, setSelectedDivision] = useState('ALL')
  const [searchWithinResults, setSearchWithinResults] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [rawMatches, setRawMatches] = useState<UtteranceMatch[]>([])
  const [batchData, setBatchData] = useState<BatchSearchData | null>(null)
  const [isBatchSearch, setIsBatchSearch] = useState(false)
  const [activeSearchedQueries, setActiveSearchedQueries] = useState<string[]>([])

  const performSearch = useCallback(async (overrideQuery?: string) => {
    const textToSearch = overrideQuery !== undefined ? overrideQuery : queryText
    const lines = textToSearch
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    if (lines.length === 0) {
      setError('Por favor, digite pelo menos uma frase para pesquisar.')
      return
    }

    setIsLoading(true)
    setError(null)
    setHasSearched(true)
    setSearchWithinResults('')
    setActiveSearchedQueries(lines)

    try {
      if (lines.length === 1) {
        setIsBatchSearch(false)
        setBatchData(null)
        const res = await searchUtterances(selectedLang, lines[0])

        if (!res.success) {
          setError(res.error || 'Erro ao realizar a busca.')
          setRawMatches([])
        } else {
          const data = res.data as { matches?: UtteranceMatch[] } | null
          setRawMatches(data?.matches || [])
        }
      } else {
        // Multi-line batch search
        setIsBatchSearch(true)
        const res = await searchUtterancesBatch(selectedLang, lines)

        if (!res.success) {
          setError(res.error || 'Erro ao realizar a busca em lote.')
          setRawMatches([])
          setBatchData(null)
        } else {
          const bData = res.data as BatchSearchData
          setBatchData(bData)
          
          // Flatten all matches without duplicate UIDs
          const aggregated: UtteranceMatch[] = []
          const seen = new Set<string>()

          bData.results?.forEach((r: SearchResult) => {
            r.matches?.forEach((m: UtteranceMatch) => {
              if (!seen.has(m.uid)) {
                seen.add(m.uid)
                aggregated.push(m)
              }
            })
          })

          setRawMatches(aggregated)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na conexão com o servidor.')
      setRawMatches([])
    } finally {
      setIsLoading(false)
    }
  }, [queryText, selectedLang])

  const clearSearch = useCallback(() => {
    setQueryText('')
    setSearchWithinResults('')
    setRawMatches([])
    setBatchData(null)
    setHasSearched(false)
    setError(null)
    setActiveSearchedQueries([])
  }, [])

  // Apply division filter
  const divisionFilteredMatches = useMemo(() => {
    if (selectedDivision === 'ALL') {
      return rawMatches
    }

    return rawMatches.filter((match) => {
      if (!match.connectedContents || match.connectedContents.length === 0) {
        return true // Keep if division isn't strictly defined
      }
      return match.connectedContents.some((c) => {
        const divName = (c.divisionName || '').toUpperCase()
        if (selectedDivision.toUpperCase() === 'DI') {
          return divName === 'DI' || divName === 'DA'
        }
        return divName === selectedDivision.toUpperCase()
      })
    })
  }, [rawMatches, selectedDivision])

  // Partition into exact matches and similar matches
  const { exactMatches, similarMatches } = useMemo(() => {
    if (activeSearchedQueries.length === 0) {
      return { exactMatches: [], similarMatches: divisionFilteredMatches }
    }

    const normQueries = activeSearchedQueries.map(normalizeStr)

    const exact: UtteranceMatch[] = []
    const similar: UtteranceMatch[] = []

    divisionFilteredMatches.forEach((m) => {
      const desc = normalizeStr(m.utteranceBodyDto?.description || '')
      const isExact = normQueries.some((q) => q === desc)
      if (isExact) {
        exact.push(m)
      } else {
        similar.push(m)
      }
    })

    return { exactMatches: exact, similarMatches: similar }
  }, [divisionFilteredMatches, activeSearchedQueries])

  // Filter similar matches by internal search box
  const filteredSimilarMatches = useMemo(() => {
    if (!searchWithinResults.trim()) {
      return similarMatches
    }

    const term = normalizeStr(searchWithinResults)

    return similarMatches.filter((m) => {
      const uid = normalizeStr(m.uid)
      const desc = normalizeStr(m.utteranceBodyDto?.description || '')
      const lang = normalizeStr(m.utteranceBodyDto?.languageCode || '')
      const state = normalizeStr(m.utteranceBodyDto?.state || '')
      const div = normalizeStr(m.connectedContents?.[0]?.divisionName || '')
      const cat = normalizeStr(m.connectedContents?.[0]?.categoryName || '')

      return (
        uid.includes(term) ||
        desc.includes(term) ||
        lang.includes(term) ||
        state.includes(term) ||
        div.includes(term) ||
        cat.includes(term)
      )
    })
  }, [similarMatches, searchWithinResults])

  const exportResultsCsv = useCallback(() => {
    const dataToExport = [
      ...exactMatches.map((m) => ({
        'Tipo': 'Correspondência Exata',
        'UID': m.uid,
        'Descrição': m.utteranceBodyDto?.description || '',
        'Idioma': m.utteranceBodyDto?.languageCode || selectedLang,
        'Estado': m.utteranceBodyDto?.state || '',
        'Divisão': m.connectedContents?.[0]?.divisionName || '',
        'Categoria': m.connectedContents?.[0]?.categoryName || '',
        'Assunto': m.connectedContents?.[0]?.contentBody?.subject || '',
      })),
      ...filteredSimilarMatches.map((m) => ({
        'Tipo': 'Similar',
        'UID': m.uid,
        'Descrição': m.utteranceBodyDto?.description || '',
        'Idioma': m.utteranceBodyDto?.languageCode || selectedLang,
        'Estado': m.utteranceBodyDto?.state || '',
        'Divisão': m.connectedContents?.[0]?.divisionName || '',
        'Categoria': m.connectedContents?.[0]?.categoryName || '',
        'Assunto': m.connectedContents?.[0]?.contentBody?.subject || '',
      })),
    ]

    const filename = `biqa_utterances_${selectedLang}_${new Date().toISOString().slice(0, 10)}.csv`
    downloadCsv(dataToExport, filename)
  }, [exactMatches, filteredSimilarMatches, selectedLang])

  return {
    queryText,
    selectedLang,
    selectedDivision,
    searchWithinResults,
    isLoading,
    hasSearched,
    error,
    totalMatchesCount: divisionFilteredMatches.length,
    isBatchSearch,
    batchData,
    exactMatches,
    similarMatches,
    filteredSimilarMatches,
    allMatches: divisionFilteredMatches,
    hasExactMatch: exactMatches.length > 0,
    setQueryText,
    setSelectedLang,
    setSelectedDivision,
    setSearchWithinResults,
    performSearch,
    clearSearch,
    exportResultsCsv,
  }
}
