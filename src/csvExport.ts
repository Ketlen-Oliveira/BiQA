/**
 * Utilitário para exportação de dados em formato CSV.
 *
 * Converte um array de objetos em CSV e dispara o download
 * no navegador do usuário.
 */

/**
 * Escapa um valor para inclusão segura em CSV.
 * Se o valor contiver vírgula, aspas ou quebra de linha,
 * ele é envolvido em aspas duplas (e aspas internas são duplicadas).
 */
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Gera o conteúdo CSV a partir de um array de objetos.
 */
export function toCsv(data: Record<string, unknown>[], columns: string[] | null = null): string {
  if (!Array.isArray(data) || data.length === 0) return ''

  const cols = columns || Object.keys(data[0])

  const header = cols.map(escapeCsvValue).join(',')
  const rows = data.map((row) =>
    cols.map((col) => escapeCsvValue(row[col])).join(','),
  )

  return [header, ...rows].join('\r\n')
}

/**
 * Dispara o download de um arquivo CSV no navegador.
 */
export function downloadCsv(
  data: Record<string, unknown>[],
  filename = 'resultado.csv',
  columns: string[] | null = null,
): void {
  const csv = toCsv(data, columns)
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
