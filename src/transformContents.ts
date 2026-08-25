/**
 * Utilitários para transformar dados da API em formatos amigáveis para exibição.
 */

// ── Tipos dos dados retornados pela API ──────────────────────

interface ContentItem {
  cid?: number | string
  categoryName?: string
  divisionName?: string
  contentBody?: {
    subject?: string
    body?: string
    state?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

interface UtteranceTranslation {
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

// ── Tipos de saída tabular ───────────────────────────────────

export interface ContentRow {
  'Content ID': string | number
  'Subject': string
  'Content': string
  'Category': string
  'Division': string
  'State': string
}

export interface UtteranceRow {
  'Descrição': string
  'Idioma': string
  'Estado': string
  'Atualizado por': string | number
  'Atualizado em': string
}

// ── Funções de transformação ─────────────────────────────────

/**
 * Transforma um array de conteúdos (ou objeto com array) em formato tabular amistoso.
 */
export function transformContents(data: unknown): ContentRow[] {
  let items: ContentItem[] = []

  if (Array.isArray(data)) {
    items = data as ContentItem[]
  } else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        items = obj[key] as ContentItem[]
        break
      }
    }
    if (items.length === 0 && (obj as ContentItem).cid) {
      items = [obj as ContentItem]
    }
  }

  return items.map((item) => {
    const cb = item.contentBody || {}
    return {
      'Content ID': item.cid ?? '',
      'Subject': cb.subject ?? '',
      'Content': cb.body ?? '',
      'Category': item.categoryName ?? '',
      'Division': item.divisionName ?? '',
      'State': cb.state ?? '',
    }
  })
}

/**
 * Transforma os dados de utterance (descrições/traduções) em formato tabular amistoso.
 */
export function transformUtterance(data: unknown): UtteranceRow[] {
  let items: UtteranceTranslation[] = []

  if (Array.isArray(data)) {
    items = data as UtteranceTranslation[]
  } else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.translations)) {
      items = obj.translations as UtteranceTranslation[]
    } else {
      for (const key of Object.keys(obj)) {
        if (Array.isArray(obj[key])) {
          items = obj[key] as UtteranceTranslation[]
          break
        }
      }
      if (items.length === 0) {
        items = [obj as unknown as UtteranceTranslation]
      }
    }
  }

  return items.map((item) => {
    const updatedBy = item.updatedBy || {}
    return {
      'Descrição': item.description ?? '',
      'Idioma': item.languageCode ?? '',
      'Estado': item.state ?? '',
      'Atualizado por': updatedBy.userId ?? '',
      'Atualizado em': formatDate(item.updatedAt),
    }
  })
}

/**
 * Formata uma data ISO para exibição (dd/mm/yyyy hh:mm).
 */
function formatDate(isoStr?: string): string {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoStr
  }
}
