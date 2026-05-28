'use client'

import { useState } from 'react'
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
  customSectionNames: {
    A: 'Core Principles',
    B: 'Applications & Formulae'
  }
}

const defaultQuestions: QuestionsMap = {
  A: [
    {
      id: 'q1',
      text: 'Which of the following pigments is primarily responsible for absorbing light energy during the light-dependent reactions of photosynthesis in green plants?',
      type: 'MCQ',
      options: [
        'Chlorophyll a',
        'Chlorophyll b',
        'Carotenoids',
        'Xanthophylls'
      ],
      correctIndex: 0,
      marks: 1,
      hasOr: false,
      orText: '',
      image: undefined
    }
  ],
  B: []
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'settings', label: 'Setup' },
  { id: 'editor',   label: 'Editor' },
  { id: 'design',   label: 'Design' },
  { id: 'preview',  label: 'Preview' },
]

export default function Home() {
  const [tab, setTab]           = useState<Tab>('settings')
  const [meta, setMeta]         = useState<PaperMeta>(defaultMeta)
  const [layout, setLayout]     = useState<LayoutSettings>(DEFAULT_LAYOUT)
  const [questions, setQuestions] = useState<QuestionsMap>(defaultQuestions)

  const handlePrint = () => {
    setTab('preview')
    setTimeout(() => window.print(), 400)
  }

  // Count total questions added
  const totalQuestions = Object.values(questions).flat().length

  return (
    <div className="dark-workspace min-h-screen flex flex-col justify-between">
      <div>
        {/* ── Topbar ─────────────────────────────────────────────── */}
        <header className="pc-topbar no-print sticky top-0 z-50">
          <div className="pc-topbar-inner" style={{ maxWidth: '100%', padding: '0 24px', height: '76px' }}>
            {/* Brand */}
            <div className="pc-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div 
                className="pc-brand-mark" 
                style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '10px', 
                  background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', 
                  display: 'grid', 
                  placeItems: 'center',
                  boxShadow: '0 0 10px rgba(14, 165, 233, 0.4)'
                }}
              >
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjTGK5Yuks8vnVB9kN9G-AY01tkN-0r9dlP2c3-ynqnowykO2g5HFJWCHIAXeLQ_8YU2BH_QMS4bm-I5sorSP9450KkrZKmOuzcjmqgUK-jbpwpI2ctDlEvPxZ8RaMoqfd8fsCRHs33g9iHbOFLSIO32v_BTTGk9SNPy76bMyTX_xdhSmCyD4x9MbLH6xVRpWSXq8Y1XpOQCXPOgxvato_XIOnHKsLIDT28iO3gFWpuIDMIz8EFT0bcxA-XwL8kCCdLJp6meSd1w_5"
                  alt="PaperCraft"
                  style={{ width: '70%', height: '70%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <span className="pc-brand-name" style={{ fontSize: '18px', lineHeight: '1.1' }}>Papercraft</span>
                <span className="pc-brand-sub" style={{ fontSize: '8px', lineHeight: '1' }}>SCHOOL EXAM GENERATOR</span>
              </div>
            </div>

            {/* Nav links (Center tabs) */}
            <nav className="pc-topbar-nav" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {tabs.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`pc-nav-tab ${tab === item.id ? 'active' : ''}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Actions (Right section) */}
            <div className="pc-topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Question pill badge */}
              <div className="pc-q-pill">
                <span className="pc-q-pill-dot" />
                <span style={{ fontSize: '11px', fontWeight: 700, lineHeight: 1.1, textAlign: 'left' }}>
                  {totalQuestions} Q<br />added
                </span>
              </div>

              {/* Print / PDF Button */}
              <button onClick={handlePrint} className="pc-print-btn">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
                <span>Print / PDF</span>
              </button>

              {/* Avatar circle */}
              <button className="pc-avatar-btn" aria-label="Account">
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>person</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── Main ─────────────────────────────────────────────── */}
        <main className={`pc-main ${(tab === 'preview' || tab === 'editor' || tab === 'design') ? 'p-0' : ''}`} style={{ padding: (tab === 'preview' || tab === 'editor' || tab === 'design') ? '0' : '48px 24px' }}>
          {tab === 'settings' && (
            <SettingsPanel meta={meta} onChange={setMeta} onNext={() => setTab('editor')} />
          )}
          {tab === 'editor' && (
            <EditorPanel questions={questions} setQuestions={setQuestions} meta={meta} setMeta={setMeta} />
          )}
          {tab === 'design' && (
            <DesignPanel meta={meta} layout={layout} questions={questions} onMetaChange={setMeta} onLayoutChange={setLayout} />
          )}
          {tab === 'preview' && (
            <PaperPreview meta={meta} layout={layout} questions={questions} />
          )}
        </main>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="pc-footer no-print" style={{ background: '#0b111e', borderTop: '1px solid rgba(56, 189, 248, 0.12)', padding: '24px' }}>
        <div className="pc-footer-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span className="pc-footer-brand" style={{ color: '#fff', fontSize: '13px' }}>Papercraft Academic Systems</span>
            <span className="pc-footer-copy" style={{ color: '#64748b', fontSize: '12px' }}>© 2026 Papercraft Academic Systems</span>
          </div>
          <nav className="pc-footer-links" style={{ display: 'flex', gap: '20px' }}>
            <a href="#" style={{ color: '#64748b', fontSize: '12px' }}>Privacy Policy</a>
            <a href="#" style={{ color: '#64748b', fontSize: '12px' }}>Terms of Service</a>
            <a href="#" style={{ color: '#64748b', fontSize: '12px' }}>Faculty Portal</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}