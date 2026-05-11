'use client'

import { useState } from 'react'
import Topbar from '@/components/Topbar'
import SettingsPanel from '@/components/SettingsPanel'
import EditorPanel from '@/components/EditorPanel'
import DesignPanel from '@/components/DesignPanel'
import PaperPreview from '@/components/PaperPreview'
import { PaperMeta, QuestionsMap, LayoutSettings } from '@/lib/types'
import { SECTIONS, DEFAULT_INSTRUCTIONS, DEFAULT_LAYOUT } from '@/lib/constants'

type Tab = 'settings' | 'editor' | 'design' | 'preview'

const defaultMeta: PaperMeta = {
  schoolName: '',
  city: '',
  session: '2024-25',
  examTitle: 'FINAL EXAMINATION - 2024',
  subject: '',
  className: '',
  maxMarks: '80',
  time: '3 Hours',
  logo: null,
  instructions: DEFAULT_INSTRUCTIONS,
}

const emptyQuestions: QuestionsMap = Object.fromEntries(SECTIONS.map(s => [s.id, []]))

export default function Home() {
  const [tab, setTab] = useState<Tab>('settings')
  const [meta, setMeta] = useState<PaperMeta>(defaultMeta)
  const [layout, setLayout] = useState<LayoutSettings>(DEFAULT_LAYOUT)
  const [questions, setQuestions] = useState<QuestionsMap>(emptyQuestions)

  const totalQuestions = Object.values(questions).reduce((a, b) => a + b.length, 0)

  const handlePrint = () => {
    setTab('preview')
    setTimeout(() => window.print(), 400)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f5f0e6' }}>
      <Topbar tab={tab} setTab={setTab} totalQuestions={totalQuestions} onPrint={handlePrint} />

      {tab === 'settings' && (
        <SettingsPanel meta={meta} onChange={setMeta} onNext={() => setTab('editor')} />
      )}
      {tab === 'editor' && (
        <EditorPanel questions={questions} setQuestions={setQuestions} meta={meta} setMeta={setMeta} />
      )}
      {tab === 'design' && (
        <DesignPanel
          meta={meta}
          layout={layout}
          questions={questions}
          onMetaChange={setMeta}
          onLayoutChange={setLayout}
        />
      )}
      {tab === 'preview' && (
        <PaperPreview meta={meta} layout={layout} questions={questions} />
      )}
    </main>
  )
}
