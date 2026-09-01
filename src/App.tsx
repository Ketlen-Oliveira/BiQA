import React, { useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { UtteranceSearchPage } from './pages/UtteranceSearchPage'
import { RelatedIdsPage } from './pages/RelatedIdsPage'

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  search: {
    title: 'Buscar Utterance por Frase',
    subtitle: 'Digite uma ou mais frases para localizar o UID correspondente, conferir traduções e conteúdos associados.',
  },
  related: {
    title: 'IDs Relacionados',
    subtitle: 'Consulte os vínculos cruzados e dependências técnicas associadas a um Content ID.',
  },
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('search')
  const [selectedCidForRelated, setSelectedCidForRelated] = useState<string | number | null>(null)

  const handleNavigateToRelated = (cid: string | number) => {
    setSelectedCidForRelated(cid)
    setActiveTab('related')
  }

  const currentMeta = PAGE_META[activeTab] || PAGE_META.search

  return (
    <AppShell
      activeTab={activeTab}
      onSelectTab={(tabId) => setActiveTab(tabId)}
      title={currentMeta.title}
      subtitle={currentMeta.subtitle}
    >
      {activeTab === 'search' && (
        <UtteranceSearchPage onNavigateToRelated={handleNavigateToRelated} />
      )}
      {activeTab === 'related' && (
        <RelatedIdsPage
          initialCid={selectedCidForRelated}
          onClearInitialCid={() => setSelectedCidForRelated(null)}
        />
      )}
    </AppShell>
  )
}
