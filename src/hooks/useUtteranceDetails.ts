import { useState, useCallback, useRef } from 'react'
import { fetchUtterance, fetchUtteranceContents } from '../api'
import { UtteranceTranslation, ConnectedContent, UtteranceMatch } from '../types'

interface CacheEntry {
  translations: UtteranceTranslation[]
  connectedContents: ConnectedContent[]
}

export interface UseUtteranceDetailsResult {
  isOpen: boolean
  isLoading: boolean
  error: string | null
  activeTab: 'translations' | 'contents'
  currentUid: string | null
  currentLang: string
  currentMatch: UtteranceMatch | null
  translations: UtteranceTranslation[]
  connectedContents: ConnectedContent[]
  currentIndex: number
  totalItems: number
  hasPrevious: boolean
  hasNext: boolean
  openDetails: (match: UtteranceMatch, lang: string, list?: UtteranceMatch[]) => void
  closeDetails: () => void
  setActiveTab: (tab: 'translations' | 'contents') => void
  goToPrevious: () => void
  goToNext: () => void
}

export function useUtteranceDetails(): UseUtteranceDetailsResult {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'translations' | 'contents'>('translations')
  
  const [currentUid, setCurrentUid] = useState<string | null>(null)
  const [currentLang, setCurrentLang] = useState<string>('es-MX')
  const [currentMatch, setCurrentMatch] = useState<UtteranceMatch | null>(null)
  
  const [translations, setTranslations] = useState<UtteranceTranslation[]>([])
  const [connectedContents, setConnectedContents] = useState<ConnectedContent[]>([])
  
  const [matchesList, setMatchesList] = useState<UtteranceMatch[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(0)

  // In-memory cache for session
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map())

  const loadDataForUid = useCallback(async (uid: string, lang: string, fallbackMatch?: UtteranceMatch) => {
    setIsLoading(true)
    setError(null)

    const cacheKey = `${uid}_${lang}`
    const cached = cacheRef.current.get(cacheKey)

    if (cached) {
      setTranslations(cached.translations)
      setConnectedContents(cached.connectedContents)
      setIsLoading(false)
      return
    }

    try {
      const [transRes, contentsRes] = await Promise.all([
        fetchUtterance(uid, lang),
        fetchUtteranceContents(uid, lang),
      ])

      let transList: UtteranceTranslation[] = []
      if (transRes.success && transRes.data) {
        const d = transRes.data as Record<string, unknown>
        if (Array.isArray(d.translations)) {
          transList = d.translations as UtteranceTranslation[]
        } else if (Array.isArray(d)) {
          transList = d as UtteranceTranslation[]
        }
      }

      // If translations API returned empty, fallback to match info
      if (transList.length === 0 && fallbackMatch?.utteranceBodyDto) {
        transList = [
          {
            description: fallbackMatch.utteranceBodyDto.description || '',
            languageCode: fallbackMatch.utteranceBodyDto.languageCode || lang,
            state: fallbackMatch.utteranceBodyDto.state || 'RELEASED',
          },
        ]
      }

      let contentsList: ConnectedContent[] = []
      if (contentsRes.success && contentsRes.data) {
        if (Array.isArray(contentsRes.data)) {
          contentsList = contentsRes.data as ConnectedContent[]
        } else if (typeof contentsRes.data === 'object') {
          const d = contentsRes.data as Record<string, unknown>
          for (const k of Object.keys(d)) {
            if (Array.isArray(d[k])) {
              contentsList = d[k] as ConnectedContent[]
              break
            }
          }
        }
      }

      // Fallback connected contents from search match if endpoint is empty
      if (contentsList.length === 0 && fallbackMatch?.connectedContents && fallbackMatch.connectedContents.length > 0) {
        contentsList = fallbackMatch.connectedContents
      }

      cacheRef.current.set(cacheKey, {
        translations: transList,
        connectedContents: contentsList,
      })

      setTranslations(transList)
      setConnectedContents(contentsList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar detalhes.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const openDetails = useCallback(
    (match: UtteranceMatch, lang: string, list?: UtteranceMatch[]) => {
      const fullList = list && list.length > 0 ? list : [match]
      setMatchesList(fullList)
      
      const idx = fullList.findIndex((m) => m.uid === match.uid)
      setCurrentIndex(idx >= 0 ? idx : 0)
      
      setCurrentUid(match.uid)
      setCurrentLang(lang)
      setCurrentMatch(match)
      setIsOpen(true)
      setActiveTab('translations')

      loadDataForUid(match.uid, lang, match)
    },
    [loadDataForUid]
  )

  const closeDetails = useCallback(() => {
    setIsOpen(false)
  }, [])

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1
      const prevMatch = matchesList[prevIdx]
      if (prevMatch) {
        setCurrentIndex(prevIdx)
        setCurrentUid(prevMatch.uid)
        setCurrentMatch(prevMatch)
        loadDataForUid(prevMatch.uid, currentLang, prevMatch)
      }
    }
  }, [currentIndex, matchesList, currentLang, loadDataForUid])

  const goToNext = useCallback(() => {
    if (currentIndex < matchesList.length - 1) {
      const nextIdx = currentIndex + 1
      const nextMatch = matchesList[nextIdx]
      if (nextMatch) {
        setCurrentIndex(nextIdx)
        setCurrentUid(nextMatch.uid)
        setCurrentMatch(nextMatch)
        loadDataForUid(nextMatch.uid, currentLang, nextMatch)
      }
    }
  }, [currentIndex, matchesList, currentLang, loadDataForUid])

  return {
    isOpen,
    isLoading,
    error,
    activeTab,
    currentUid,
    currentLang,
    currentMatch,
    translations,
    connectedContents,
    currentIndex: currentIndex + 1,
    totalItems: matchesList.length,
    hasPrevious: currentIndex > 0,
    hasNext: currentIndex < matchesList.length - 1,
    openDetails,
    closeDetails,
    setActiveTab,
    goToPrevious,
    goToNext,
  }
}
