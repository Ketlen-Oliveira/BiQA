// ── Types for BiQA Explorer ───────────────────────────────

export interface ConnectedContentBody {
  subject?: string
  body?: string
  state?: string
  [key: string]: unknown
}

export interface ConnectedContent {
  cid?: number | string
  categoryName?: string
  divisionName?: string
  contentBody?: ConnectedContentBody
  [key: string]: unknown
}

export interface UtteranceBodyDto {
  description?: string
  state?: string
  languageCode?: string
  [key: string]: unknown
}

export interface UtteranceMatch {
  uid: string
  utteranceBodyDto?: UtteranceBodyDto
  connectedContents?: ConnectedContent[]
  [key: string]: unknown
}

export interface SearchResult {
  query: string
  lang: string
  total_matches: number
  matches: UtteranceMatch[]
}

export interface BatchSearchData {
  lang: string
  total_queries: number
  total_matches: number
  results: SearchResult[]
  pages_searched?: number
  total_elements?: number
  max_pages?: number
  [key: string]: unknown
}

export interface UtteranceTranslation {
  description?: string
  languageCode?: string
  state?: string
  updatedAt?: string
  updatedBy?: {
    userId?: string | number
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface UtteranceDetailData {
  uid: string
  translations?: UtteranceTranslation[]
  connectedContents?: ConnectedContent[]
}

export interface RelatedIdItem {
  'Content ID'?: string | number
  'Related ID'?: string | number
  'Tipo de Vínculo'?: string
  'Divisão'?: string
  'Categoria'?: string
  'Descrição'?: string
  [key: string]: unknown
}

export type SupportedLanguage = 'es-MX' | 'pt-BR' | 'en-US'

export interface LanguageOption {
  code: string
  label: string
  country: string
  shortLabel: string
  flag: string
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'es-MX', label: 'Español (México)', country: 'MX', shortLabel: 'es-MX', flag: '🇲🇽' },
  { code: 'pt-BR', label: 'Português (Brasil)', country: 'BR', shortLabel: 'pt-BR', flag: '🇧🇷' },
  { code: 'en-US', label: 'English (United States)', country: 'US', shortLabel: 'en-US', flag: '🇺🇸' },
]

export const DIVISION_OPTIONS = [
  { value: 'ALL', label: 'Todas as Divisões' },
  { value: 'VD', label: 'VD' },
  { value: 'DI', label: 'DI' },
]
