
// ── Tipos de resposta padronizada ────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  status_code: number
  data: T | null
  error: string | null
}

// ── Tipos de dados da API ────────────────────────────────────

export interface ConnectedContent {
  cid?: number
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

// ── Função auxiliar ──────────────────────────────────────────

/**
 * Tenta extrair JSON da resposta. Se a resposta não for JSON válido
 * (ex: HTML de fallback do Vite), retorna um objeto de erro padronizado.
 */
async function parseJson(res: Response): Promise<ApiResponse> {
  const contentType = res.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    return {
      success: false,
      status_code: res.status,
      data: null,
      error: res.status === 401
        ? 'Não autenticado. Verifique as credenciais em config.py.'
        : `Resposta inesperada do servidor (HTTP ${res.status}).`,
    }
  }

  return res.json()
}

// ── Endpoints ────────────────────────────────────────────────

/**
 * Verifica se o backend está online.
 */
export async function checkHealth(): Promise<ApiResponse> {
  const res = await fetch('/api/health')
  return parseJson(res)
}

/**
 * Atualiza o cookie 
 */
export async function updateSessionCookie(sessionCookie: string): Promise<ApiResponse> {
  const res = await fetch('/api/session/cookie', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_cookie: sessionCookie }),
  })
  return parseJson(res)
}


/**
 * Busca a utterance (descrições/traduções) de um UID.
 */
export async function fetchUtterance(uid: string, lang: string): Promise<ApiResponse> {
  const res = await fetch(`/api/utterances/${encodeURIComponent(uid)}/${encodeURIComponent(lang)}`)
  return parseJson(res)
}

/**
 * Busca os conteúdos de uma utterance (Endpoint 1).
 */
export async function fetchUtteranceContents(uid: string, lang: string): Promise<ApiResponse> {
  const res = await fetch(`/api/utterances/${encodeURIComponent(uid)}/${encodeURIComponent(lang)}/contents`)
  return parseJson(res)
}

/**
 * Pesquisa IDs relacionados a um conteúdo (Endpoint 2).
 */
export async function fetchRelatedIds(cid: string): Promise<ApiResponse> {
  const res = await fetch(`/api/contents/${encodeURIComponent(cid)}/related-id/search`)
  return parseJson(res)
}

/**
 * Busca utterances por texto na descrição (frase).
 */
export async function searchUtterances(lang: string, query: string, maxPages = 50): Promise<ApiResponse> {
  const params = new URLSearchParams({
    lang,
    q: query,
    max_pages: String(maxPages),
  })
  const res = await fetch(`/api/utterances/search?${params}`)
  return parseJson(res)
}

/**
 * Busca múltiplas utterances por texto em uma única passagem.
 */
export async function searchUtterancesBatch(lang: string, queries: string[], maxPages = 50): Promise<ApiResponse> {
  const res = await fetch('/api/utterances/search/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lang, queries, max_pages: maxPages }),
  })
  return parseJson(res)
}

/**
 * Busca os country-codes (endpoint auxiliar de teste).
 */
export async function fetchCountryCodes(): Promise<ApiResponse> {
  const res = await fetch('/api/contents/country-codes')
  return parseJson(res)
}

/**
 * Baixa o modelo de planilha .xlsx para preenchimento em lote.
 * Dispara o download do arquivo no navegador.
 */
export function downloadBatchTemplate(): void {
  const link = document.createElement('a')
  link.href = '/api/utterances/batch/template'
  link.download = 'modelo_batch_utterance.xlsx'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Processa uma planilha .xlsx preenchida pelo usuário, buscando os
 * conteúdos de cada utterance e retornando um .xlsx preenchido com
 * os resultados.
 */
export async function processBatchUtterances(file: File, lang: string): Promise<ApiResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('lang', lang)

  const res = await fetch('/api/utterances/batch/process', {
    method: 'POST',
    body: formData,
  })

  // Se a resposta é JSON, houve um erro de validação
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json()
  }

  // Sucesso — o backend retorna um arquivo .xlsx
  if (!res.ok) {
    return {
      success: false,
      status_code: res.status,
      data: null,
      error: `Erro do servidor (HTTP ${res.status}).`,
    }
  }

  // Converte o blob em download
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `resultado_batch_utterance_${lang}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  return { success: true, status_code: 200, data: null, error: null }
}
