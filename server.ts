import express from 'express'
import path from 'path'
import { createServer as createViteServer } from 'vite'
import multer from 'multer'
import * as XLSX from 'xlsx'

const app = express()
const PORT = 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const upload = multer({ storage: multer.memoryStorage() })

// In-memory session store
let currentSessionCookie: string | null = null

// Mock dataset of utterances and contents
interface UtteranceItem {
  uid: string
  descriptions: Record<string, string> // lang -> text
  state: string
  updatedAt: string
  updatedBy: string
  connectedContents: Array<{
    cid: number
    categoryName: string
    divisionName: string
    contentBody: {
      subject: string
      body: string
      state: string
    }
  }>
}

const UTTERANCE_DATABASE: UtteranceItem[] = [
  {
    uid: 'UTT-1001',
    descriptions: {
      'pt-BR': 'Abra as configurações do Glass',
      'es-MX': 'Abra la configuración de Glass',
      'en-US': 'Open Glass settings',
    },
    state: 'RELEASED',
    updatedAt: '2026-01-15T14:30:00Z',
    updatedBy: 'admin@biqa.internal',
    connectedContents: [
      {
        cid: 101,
        categoryName: 'emanual',
        divisionName: 'VD',
        contentBody: {
          subject: 'Configurações Gerais do Glass',
          body: 'Guia completo para acessar o menu de ajustes rápidos e configurações de tela do Glass.',
          state: 'ACTIVE',
        },
      },
      {
        cid: 102,
        categoryName: 'devicecare',
        divisionName: 'VD',
        contentBody: {
          subject: 'Diagnóstico de Display do Glass',
          body: 'Instruções para calibração de brilho, nitidez e reinicialização de fábrica.',
          state: 'ACTIVE',
        },
      },
    ],
  },
  {
    uid: 'UTT-1002',
    descriptions: {
      'pt-BR': 'Como conectar o Wi-Fi na TV',
      'es-MX': 'Cómo conectar Wi-Fi en la TV',
      'en-US': 'How to connect Wi-Fi on TV',
    },
    state: 'RELEASED',
    updatedAt: '2026-02-10T09:15:00Z',
    updatedBy: 'qa_lead@biqa.internal',
    connectedContents: [
      {
        cid: 103,
        categoryName: 'emanual',
        divisionName: 'VD',
        contentBody: {
          subject: 'Conexão de Rede Sem Fio',
          body: 'Acesse Menu > Rede > Configurações de Rede > Selecione sua rede Wi-Fi e digite a senha.',
          state: 'ACTIVE',
        },
      },
      {
        cid: 104,
        categoryName: 'devicecare',
        divisionName: 'VD',
        contentBody: {
          subject: 'Solução de Problemas de Conexão Wi-Fi',
          body: 'Verifique se o roteador está operando na faixa de 2.4GHz ou 5GHz e redefina o IP se necessário.',
          state: 'ACTIVE',
        },
      },
    ],
  },
  {
    uid: 'UTT-1003',
    descriptions: {
      'pt-BR': 'Ajustar temperatura da geladeira',
      'es-MX': 'Ajustar la temperatura del refrigerador',
      'en-US': 'Adjust refrigerator temperature',
    },
    state: 'RELEASED',
    updatedAt: '2026-02-14T11:00:00Z',
    updatedBy: 'da_expert@biqa.internal',
    connectedContents: [
      {
        cid: 201,
        categoryName: 'emanual',
        divisionName: 'DI',
        contentBody: {
          subject: 'Painel de Controle de Temperatura',
          body: 'Pressione o botão Freezer ou Fridge para alternar entre as faixas recomendadas (-19°C / 3°C).',
          state: 'ACTIVE',
        },
      },
      {
        cid: 202,
        categoryName: 'devicecare',
        divisionName: 'DI',
        contentBody: {
          subject: 'Resfriamento Rápido e Power Freeze',
          body: 'Ative a função Power Cool para acelerar a refrigeração de novos alimentos armazenados.',
          state: 'ACTIVE',
        },
      },
    ],
  },
  {
    uid: 'UTT-1004',
    descriptions: {
      'pt-BR': 'Código de erro no painel da máquina de lavar',
      'es-MX': 'Código de error en el panel de la lavadora',
      'en-US': 'Error code on washing machine panel',
    },
    state: 'RELEASED',
    updatedAt: '2026-02-18T16:45:00Z',
    updatedBy: 'svc_team@biqa.internal',
    connectedContents: [
      {
        cid: 203,
        categoryName: 'svc',
        divisionName: 'DI',
        contentBody: {
          subject: 'Tabela de Códigos de Erro DI',
          body: 'Códigos 4C, 5C, dC e UB: significado, inspeção do filtro de detritos e nivelamento.',
          state: 'ACTIVE',
        },
      },
      {
        cid: 204,
        categoryName: 'devicecare',
        divisionName: 'DI',
        contentBody: {
          subject: 'Limpeza e Manutenção do Tambor Eco',
          body: 'Execute o ciclo de lavagem do tambor a cada 40 lavagens para evitar odores e resíduos.',
          state: 'ACTIVE',
        },
      },
    ],
  },
  {
    uid: 'UTT-1005',
    descriptions: {
      'pt-BR': 'Atualizar software da Smart TV',
      'es-MX': 'Actualizar el software del Smart TV',
      'en-US': 'Update Smart TV software',
    },
    state: 'RELEASED',
    updatedAt: '2026-03-01T10:20:00Z',
    updatedBy: 'firmware_ops@biqa.internal',
    connectedContents: [
      {
        cid: 105,
        categoryName: 'svc',
        divisionName: 'VD',
        contentBody: {
          subject: 'Atualização de Firmware via USB / OTA',
          body: 'Vá para Suporte > Atualização de Software > Atualizar Agora ou conecte pendrive com firmware.',
          state: 'ACTIVE',
        },
      },
    ],
  },
  {
    uid: 'UTT-1006',
    descriptions: {
      'pt-BR': 'Emparelhar controle remoto SolarCell',
      'es-MX': 'Vincular el control remoto SolarCell',
      'en-US': 'Pair SolarCell remote control',
    },
    state: 'RELEASED',
    updatedAt: '2026-03-05T08:00:00Z',
    updatedBy: 'support_admin@biqa.internal',
    connectedContents: [
      {
        cid: 106,
        categoryName: 'emanual',
        divisionName: 'VD',
        contentBody: {
          subject: 'Emparelhamento Bluetooth do Controle Remoto',
          body: 'Pressione os botões Voltar e Reproduzir/Pausar simultaneamente por 3 segundos.',
          state: 'ACTIVE',
        },
      },
    ],
  },
]

function normalizeSearchStr(text: string): string {
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

function findMatchesForQuery(queryText: string, lang: string) {
  const normQ = normalizeSearchStr(queryText)
  const qTokens = normQ.split(' ').filter(Boolean)

  const scored = UTTERANCE_DATABASE.map((item) => {
    // Get description in specified lang, or fallback to any
    const desc = item.descriptions[lang] || item.descriptions['pt-BR'] || item.descriptions['es-MX'] || item.descriptions['en-US'] || ''
    const normDesc = normalizeSearchStr(desc)
    let score = 0

    if (normDesc === normQ) {
      score += 100 // exact match
    } else if (normDesc.includes(normQ) || normQ.includes(normDesc)) {
      score += 50
    } else {
      const matchedTokens = qTokens.filter((token) => normDesc.includes(token))
      score += (matchedTokens.length / Math.max(1, qTokens.length)) * 40
    }

    return {
      item,
      desc,
      score,
    }
  })

  // Filter positive scores or if no direct token match, include closest items as similar
  let matches = scored.filter((s) => s.score > 0)

  // If nothing matched at all, create a synthetic matching utterance entry so user queries always work nicely
  if (matches.length === 0 && queryText.trim().length > 0) {
    const syntheticUid = `UTT-${Math.floor(1000 + Math.random() * 9000)}`
    const defaultTranslations = [
      {
        languageCode: 'es-MX',
        description: lang === 'es-MX' ? queryText.trim() : `${queryText.trim()} (ES)`,
        state: 'RELEASED',
        updatedAt: new Date().toISOString(),
        updatedBy: { userId: 'qa_auto@biqa.internal' },
      },
      {
        languageCode: 'pt-BR',
        description: lang === 'pt-BR' ? queryText.trim() : `${queryText.trim()} (PT)`,
        state: 'RELEASED',
        updatedAt: new Date().toISOString(),
        updatedBy: { userId: 'qa_auto@biqa.internal' },
      },
      {
        languageCode: 'en-US',
        description: lang === 'en-US' ? queryText.trim() : `${queryText.trim()} (EN)`,
        state: 'RELEASED',
        updatedAt: new Date().toISOString(),
        updatedBy: { userId: 'qa_auto@biqa.internal' },
      },
    ]

    return [
      {
        uid: syntheticUid,
        utteranceBodyDto: {
          description: queryText.trim(),
          state: 'RELEASED',
          languageCode: lang,
        },
        translations: defaultTranslations,
        connectedContents: [
          {
            cid: Math.floor(100 + Math.random() * 900),
            categoryName: 'emanual',
            divisionName: 'VD',
            contentBody: {
              subject: `Conteúdo Relacionado: ${queryText.trim()}`,
              body: `Instruções e documentação técnica para o termo pesquisado "${queryText.trim()}".`,
              state: 'ACTIVE',
            },
          },
        ],
      },
    ]
  }

  // Sort by score desc
  matches.sort((a, b) => b.score - a.score)

  return matches.map((m) => {
    const translations = Object.entries(m.item.descriptions).map(([l, descText]) => ({
      languageCode: l,
      description: descText,
      state: m.item.state,
      updatedAt: m.item.updatedAt,
      updatedBy: { userId: m.item.updatedBy },
    }))

    return {
      uid: m.item.uid,
      utteranceBodyDto: {
        description: m.desc,
        state: m.item.state,
        languageCode: lang,
      },
      translations,
      connectedContents: m.item.connectedContents,
    }
  })
}

// ── API Routes ──────────────────────────────────────────

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status_code: 200,
    data: {
      status: 'online',
      cookie_configured: currentSessionCookie !== null,
      service: 'BiQA API Explorer Mock / Proxy Server',
    },
    error: null,
  })
})

// 2. Cookie update
app.post('/api/session/cookie', (req, res) => {
  const { session_cookie } = req.body || {}
  currentSessionCookie = session_cookie || null
  res.json({
    success: true,
    status_code: 200,
    data: {
      cookie_set: true,
      length: currentSessionCookie ? currentSessionCookie.length : 0,
    },
    error: null,
  })
})

// 3. Search utterances (single query)
app.get('/api/utterances/search', (req, res) => {
  const lang = (req.query.lang as string) || 'es-MX'
  const q = (req.query.q as string) || ''
  const maxPages = parseInt((req.query.max_pages as string) || '50', 10)

  const matches = findMatchesForQuery(q, lang)

  res.json({
    success: true,
    status_code: 200,
    data: {
      query: q,
      lang,
      total_matches: matches.length,
      matches,
      pages_searched: 1,
      total_elements: matches.length,
      max_pages: maxPages,
    },
    error: null,
  })
})

// 4. Search utterances (batch queries)
app.post('/api/utterances/search/batch', (req, res) => {
  const { lang = 'es-MX', queries = [], max_pages = 50 } = req.body || {}
  const queryList: string[] = Array.isArray(queries) ? queries : []

  const results = queryList.map((q) => {
    const matches = findMatchesForQuery(q, lang)
    return {
      query: q,
      lang,
      total_matches: matches.length,
      matches,
    }
  })

  const totalMatches = results.reduce((acc, r) => acc + r.total_matches, 0)

  res.json({
    success: true,
    status_code: 200,
    data: {
      lang,
      total_queries: queryList.length,
      total_matches: totalMatches,
      results,
      pages_searched: 1,
      max_pages,
    },
    error: null,
  })
})

// 5. Utterance details by UID & Lang
app.get('/api/utterances/:uid/:lang', (req, res) => {
  const { uid, lang } = req.params
  const found = UTTERANCE_DATABASE.find((u) => u.uid.toLowerCase() === uid.toLowerCase())

  if (found) {
    const translations = Object.entries(found.descriptions).map(([l, desc]) => ({
      description: desc,
      languageCode: l,
      state: found.state,
      updatedAt: found.updatedAt,
      updatedBy: { userId: found.updatedBy },
    }))

    return res.json({
      success: true,
      status_code: 200,
      data: {
        uid: found.uid,
        translations,
      },
      error: null,
    })
  }

  // Fallback synthetic data
  res.json({
    success: true,
    status_code: 200,
    data: {
      uid,
      translations: [
        {
          description: `Descrição da utterance ${uid}`,
          languageCode: lang,
          state: 'RELEASED',
          updatedAt: new Date().toISOString(),
          updatedBy: { userId: 'system@biqa.internal' },
        },
      ],
    },
    error: null,
  })
})

// 6. Utterance contents by UID & Lang
app.get('/api/utterances/:uid/:lang/contents', (req, res) => {
  const { uid } = req.params
  const found = UTTERANCE_DATABASE.find((u) => u.uid.toLowerCase() === uid.toLowerCase())

  if (found && found.connectedContents.length > 0) {
    return res.json({
      success: true,
      status_code: 200,
      data: found.connectedContents,
      error: null,
    })
  }

  res.json({
    success: true,
    status_code: 200,
    data: [
      {
        cid: 101,
        categoryName: 'emanual',
        divisionName: 'VD',
        contentBody: {
          subject: `Manual e Configurações para ${uid}`,
          body: `Conteúdo detalhado das etapas operacionais vinculadas à utterance ${uid}.`,
          state: 'ACTIVE',
        },
      },
    ],
    error: null,
  })
})

// 7. Related IDs for Content ID
app.get('/api/contents/:cid/related-id/search', (req, res) => {
  const { cid } = req.params

  res.json({
    success: true,
    status_code: 200,
    data: [
      {
        'Content ID': cid,
        'Related ID': `REL-${cid}-A`,
        'Tipo de Vínculo': 'Referência Cruzada',
        'Divisão': 'VD',
        'Categoria': 'emanual',
        'Descrição': 'Guia de operação avançada e parâmetros complementares.',
      },
      {
        'Content ID': cid,
        'Related ID': `REL-${cid}-B`,
        'Tipo de Vínculo': 'Dependência Técnica',
        'Divisão': 'DA',
        'Categoria': 'devicecare',
        'Descrição': 'Checklist de diagnósticos e rotinas de manutenção periódica.',
      },
    ],
    error: null,
  })
})

// 8. Country Codes
app.get('/api/contents/country-codes', (req, res) => {
  res.json({
    success: true,
    status_code: 200,
    data: ['BR', 'MX', 'US', 'AR', 'CL', 'CO', 'PE', 'KR', 'GB'],
    error: null,
  })
})

// 9. Download batch Excel template
app.get('/api/utterances/batch/template', (req, res) => {
  const templateRows = [
    {
      'Utterance Phrase': 'Abra as configurações do Glass',
      'Language': 'es-MX',
      'Division': 'VD',
      'Notes': 'Exemplo 1: Busca no e-manual / settings',
    },
    {
      'Utterance Phrase': 'Como conectar o Wi-Fi na TV',
      'Language': 'pt-BR',
      'Division': 'VD',
      'Notes': 'Exemplo 2: Rede e conectividade',
    },
    {
      'Utterance Phrase': 'Ajustar temperatura da geladeira',
      'Language': 'pt-BR',
      'Division': 'DA',
      'Notes': 'Exemplo 3: Eletrodomésticos',
    },
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(templateRows)
  XLSX.utils.book_append_sheet(wb, ws, 'Utterances')
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  res.setHeader('Content-Disposition', 'attachment; filename="modelo_batch_utterance.xlsx"')
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.send(buffer)
})

// 10. Process batch Excel upload
app.post('/api/utterances/batch/process', upload.single('file'), (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        status_code: 400,
        data: null,
        error: 'Nenhum arquivo enviado.',
      })
    }

    const lang = (req.body.lang as string) || 'es-MX'
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

    const outputRows: Array<Record<string, unknown>> = []

    for (const r of rows) {
      // Find possible text column
      const phrase = String(
        r['Utterance Phrase'] ||
        r['Frase'] ||
        r['Utterance'] ||
        r['Query'] ||
        r['Texto'] ||
        Object.values(r)[0] ||
        ''
      ).trim()

      if (!phrase) continue

      const matches = findMatchesForQuery(phrase, lang)
      const topMatch = matches[0]

      outputRows.push({
        'Frase Pesquisada': phrase,
        'Idioma': lang,
        'UID Encontrado': topMatch?.uid || 'N/A',
        'Descrição Correspondente': topMatch?.utteranceBodyDto?.description || 'Nenhuma correspondência exata',
        'Estado': topMatch?.utteranceBodyDto?.state || 'N/A',
        'Divisão': topMatch?.connectedContents?.[0]?.divisionName || 'N/A',
        'Categoria': topMatch?.connectedContents?.[0]?.categoryName || 'N/A',
        'Assunto do Conteúdo': topMatch?.connectedContents?.[0]?.contentBody?.subject || 'N/A',
      })
    }

    const outWb = XLSX.utils.book_new()
    const outWs = XLSX.utils.json_to_sheet(outputRows)
    XLSX.utils.book_append_sheet(outWb, outWs, 'Resultados')
    const outBuffer = XLSX.write(outWb, { type: 'buffer', bookType: 'xlsx' })

    res.setHeader('Content-Disposition', `attachment; filename="resultado_batch_utterance_${lang}.xlsx"`)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.send(outBuffer)
  } catch (err) {
    res.status(500).json({
      success: false,
      status_code: 500,
      data: null,
      error: `Erro ao processar planilha: ${(err as Error).message}`,
    })
  }
})

// ── Vite & Static Serving ────────────────────────────────

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  } else {
    const distPath = path.join(process.cwd(), 'dist')
    app.use(express.static(distPath))
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BiQA server running on http://0.0.0.0:${PORT}`)
  })
}

startServer()
