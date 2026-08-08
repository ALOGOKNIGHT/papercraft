'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SettingsPanel from '@/components/SettingsPanel'
import EditorPanel from '@/components/EditorPanel'
import SchoolEditorPanel from '@/components/SchoolEditorPanel'
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

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'settings', label: 'Setup', icon: 'settings' },
  { id: 'editor',   label: 'Editor', icon: 'edit' },
  { id: 'design',   label: 'Design', icon: 'palette' },
  { id: 'preview',  label: 'Preview', icon: 'visibility' },
]

export default function Home() {
  const [tab, setTab]           = useState<Tab>('settings')
  const [meta, setMeta]         = useState<PaperMeta>(defaultMeta)
  const [layout, setLayout]     = useState<LayoutSettings>(DEFAULT_LAYOUT)
  const [questions, setQuestions] = useState<QuestionsMap>(defaultQuestions)
  const [appMode, setAppMode]   = useState<'school' | 'coaching'>('coaching')
  const [showModeDropdown, setShowModeDropdown] = useState(false)
  const [showMobilePreviewSheet, setShowMobilePreviewSheet] = useState(false)

  // Paper Management states
  const [isLoaded, setIsLoaded] = useState(false)
  const [paperId, setPaperId] = useState<string>('')
  const [paperName, setPaperName] = useState<string>('Untitled Paper')
  const [currentPaperCreatedAt, setCurrentPaperCreatedAt] = useState<string>('')
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [paperNameError, setPaperNameError] = useState<string | null>(null)

  // Modals state
  const [showNewPaperModal, setShowNewPaperModal] = useState(false)
  const [newPaperNameInput, setNewPaperNameInput] = useState('')
  const [newPaperNameError, setNewPaperNameError] = useState<string | null>(null)
  const [showUnsavedWarningModal, setShowUnsavedWarningModal] = useState(false)

  // 1. Restore paper state on load/refresh
  useEffect(() => {
    // App mode loading
    const savedMode = localStorage.getItem('papercraft_app_mode')
    if (savedMode === 'school' || savedMode === 'coaching') {
      setAppMode(savedMode)
    }

    const savedDraft = localStorage.getItem('papercraft_current_draft')
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        setPaperId(draft.id || 'paper_' + Math.random().toString(36).substr(2, 9))
        setPaperName(draft.name ?? 'Untitled Paper')
        if (draft.mode) setAppMode(draft.mode)
        if (draft.meta) setMeta(draft.meta)
        if (draft.questions) setQuestions(draft.questions)
        if (draft.layout) setLayout(draft.layout)
        setCurrentPaperCreatedAt(draft.createdAt || new Date().toISOString())
      } catch (err) {
        console.error("Failed to parse draft", err)
        initializeFreshDraft()
      }
    } else {
      initializeFreshDraft()
    }
    setIsLoaded(true)
  }, [])

  const initializeFreshDraft = () => {
    const newId = 'paper_' + Math.random().toString(36).substr(2, 9)
    setPaperId(newId)
    setPaperName('Untitled Paper')
    setCurrentPaperCreatedAt(new Date().toISOString())
  }

  // 2. Real-time paper name duplicate check
  useEffect(() => {
    if (!isLoaded || !paperId) return

    const nameToTest = paperName.trim().toLowerCase()
    if (!nameToTest) {
      setPaperNameError(null)
      return
    }

    const libraryStr = localStorage.getItem('papercraft_library') || '[]'
    try {
      const library = JSON.parse(libraryStr)
      const duplicateExists = library.some(
        (p: any) => p.name.trim().toLowerCase() === nameToTest && p.id !== paperId
      )
      if (duplicateExists) {
        setPaperNameError(`A paper named '${paperName}' already exists in your library. Choose a different name.`)
      } else {
        setPaperNameError(null)
      }
    } catch (err) {
      console.error(err)
    }
  }, [paperName, paperId, isLoaded])

  // 3. Real-time validation for New Paper modal input
  useEffect(() => {
    const nameToTest = newPaperNameInput.trim().toLowerCase()
    if (!nameToTest) {
      setNewPaperNameError(null)
      return
    }

    const libraryStr = localStorage.getItem('papercraft_library') || '[]'
    try {
      const library = JSON.parse(libraryStr)
      const duplicateExists = library.some(
        (p: any) => p.name.trim().toLowerCase() === nameToTest
      )
      if (duplicateExists) {
        setNewPaperNameError(`A paper named '${newPaperNameInput}' already exists in your library. Choose a different name.`)
      } else {
        setNewPaperNameError(null)
      }
    } catch (err) {
      console.error(err)
    }
  }, [newPaperNameInput])

  // Helper to force save paper
  const forceSavePaper = () => {
    let resolvedName = paperName.trim();
    if (!resolvedName) {
      const now = new Date();
      const timeStr = now.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) + ', ' + now.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });
      resolvedName = `Untitled Paper (${timeStr})`;
    }

    const draftData = {
      id: paperId,
      name: paperName,
      mode: appMode,
      meta,
      questions,
      layout,
      createdAt: currentPaperCreatedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('papercraft_current_draft', JSON.stringify(draftData));

    const libraryStr = localStorage.getItem('papercraft_library') || '[]';
    const library: any[] = JSON.parse(libraryStr);
    const existingIdx = library.findIndex((p: any) => p.id === paperId);
    
    const libraryPaperData = {
      ...draftData,
      name: resolvedName,
    };

    if (existingIdx >= 0) {
      library[existingIdx] = libraryPaperData;
    } else {
      library.push(libraryPaperData);
    }
    localStorage.setItem('papercraft_library', JSON.stringify(library));
    setAutoSaveStatus('saved');
  }

  // 4. Debounced auto-save effect
  useEffect(() => {
    if (!isLoaded || !paperId) return

    if (paperNameError) {
      setAutoSaveStatus('unsaved')
      return
    }

    setAutoSaveStatus('unsaved')

    const timer = setTimeout(() => {
      setAutoSaveStatus('saving')
      try {
        forceSavePaper()
      } catch (err) {
        console.error(err)
        setAutoSaveStatus('unsaved')
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [paperName, appMode, meta, questions, layout, paperId, paperNameError, isLoaded])

  const handleSetAppMode = (mode: 'school' | 'coaching') => {
    setAppMode(mode)
    localStorage.setItem('papercraft_app_mode', mode)
  }

  const handlePrint = () => {
    setTab('preview')
    setTimeout(() => window.print(), 400)
  }

  // New Paper handlers
  const handleNewPaperClick = () => {
    if (autoSaveStatus !== 'saved') {
      setShowUnsavedWarningModal(true)
    } else {
      setNewPaperNameInput('')
      setNewPaperNameError(null)
      setShowNewPaperModal(true)
    }
  }

  const handleSaveAndNew = () => {
    if (paperNameError) {
      alert("Please resolve the duplicate paper name warning before saving.")
      return
    }
    forceSavePaper()
    setShowUnsavedWarningModal(false)
    setNewPaperNameInput('')
    setNewPaperNameError(null)
    setShowNewPaperModal(true)
  }

  const handleDiscardAndNew = () => {
    setShowUnsavedWarningModal(false)
    setNewPaperNameInput('')
    setNewPaperNameError(null)
    setShowNewPaperModal(true)
  }

  const handleConfirmNewPaper = () => {
    if (newPaperNameError || !newPaperNameInput.trim()) return
    startNewPaper(newPaperNameInput.trim())
    setShowNewPaperModal(false)
  }

  const startNewPaper = (name: string) => {
    const newId = 'paper_' + Math.random().toString(36).substr(2, 9)
    setPaperId(newId)
    setPaperName(name)
    setCurrentPaperCreatedAt(new Date().toISOString())
    setQuestions(defaultQuestions)
    setMeta({
      ...defaultMeta,
      schoolName: '',
      city: '',
      subject: '',
      className: '',
      logo: null,
      schoolBranch: ''
    })
    setLayout(DEFAULT_LAYOUT)
    setTab('settings')

    const draftData = {
      id: newId,
      name: name,
      mode: appMode,
      meta: {
        ...defaultMeta,
        schoolName: '',
        city: '',
        subject: '',
        className: '',
        logo: null,
        schoolBranch: ''
      },
      questions: defaultQuestions,
      layout: DEFAULT_LAYOUT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem('papercraft_current_draft', JSON.stringify(draftData))

    const libraryStr = localStorage.getItem('papercraft_library') || '[]'
    const library = JSON.parse(libraryStr)
    library.push(draftData)
    localStorage.setItem('papercraft_library', JSON.stringify(library))

    setAutoSaveStatus('saved')
  }

  // Count total questions added
  const totalQuestions = Object.values(questions).flat().length

  return (
    <div className="dark-workspace min-h-screen flex flex-col justify-between">
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
      <div>
        {/* ── Topbar ─────────────────────────────────────────────── */}
        <header className="pc-topbar no-print sticky top-0 z-50">
          <div className="pc-topbar-inner flex items-center justify-between gap-4 h-12 md:h-[76px] px-4 md:px-6 w-full" style={{ maxWidth: '100%' }}>
            {/* Brand and Paper Name */}
            <div className="pc-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div 
                className="pc-brand-mark" 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '8px', 
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', maxWidth: '180px' }}>
                <span className="pc-brand-name text-sm md:text-lg" style={{ lineHeight: '1.1' }}>Papercraft</span>
                <span 
                  className="pc-brand-sub text-[9px] md:text-[10px]" 
                  style={{ 
                    lineHeight: '1.2', 
                    color: '#00f2fe',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: 600
                  }}
                  title={paperName || 'Untitled Paper'}
                >
                  {paperName || 'Untitled Paper'}
                </span>
              </div>
            </div>

            {/* Library link between brand logo and tabs (desktop only) */}
            <div className="hidden md:flex items-center">
              <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.15)', marginRight: '16px' }} />
              <Link 
                href="/library" 
                className="pc-nav-tab" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  textDecoration: 'none',
                  color: '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>folder_open</span>
                <span>Library</span>
              </Link>
            </div>

            {/* Nav links (Center tabs - tablet/desktop only) */}
            <nav className="pc-topbar-nav hidden md:flex" style={{ gap: '8px', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
              {tabs.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`pc-nav-tab ${tab === item.id ? 'active' : ''} flex items-center gap-1.5 px-3 py-1.5`}
                >
                  <span className="material-symbols-outlined text-[18px] lg:hidden">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Actions (Right section) */}
            <div className="pc-topbar-actions flex items-center gap-3 md:gap-4">
              {/* Auto-save status indicator (desktop only) */}
              <div className="hidden md:flex items-center" style={{ marginRight: '4px' }}>
                {autoSaveStatus === 'saving' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '11px', fontWeight: 600 }}>
                    <span className="material-symbols-outlined spin-animation" style={{ fontSize: '15px' }}>sync</span>
                    <span>Saving...</span>
                  </div>
                )}
                {autoSaveStatus === 'saved' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '11px', fontWeight: 600 }} title={`Saved as '${paperName || 'Untitled Paper'}'`}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                    <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Saved ✓
                    </span>
                  </div>
                )}
                {autoSaveStatus === 'unsaved' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '11px', fontWeight: 600 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24' }} />
                    <span>Unsaved changes</span>
                  </div>
                )}
              </div>

              {/* Question pill badge */}
              <div className="pc-q-pill" style={{ padding: '4px 10px' }}>
                <span className="pc-q-pill-dot" />
                <span style={{ fontSize: '10px', fontWeight: 700, lineHeight: 1.1, textAlign: 'left' }}>
                  {totalQuestions} Q<br />added
                </span>
              </div>

              {/* Print / PDF Button (tablet/desktop only) */}
              <button onClick={handlePrint} className="pc-print-btn hidden md:flex" style={{ alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
                <span className="hidden lg:inline">Print / PDF</span>
              </button>

              {/* New Paper Button (tablet/desktop only) */}
              <button 
                onClick={handleNewPaperClick} 
                className="pc-print-btn hidden md:flex"
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px dashed rgba(56, 189, 248, 0.3)',
                  color: '#0ea5e9',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                <span className="hidden lg:inline">New Paper</span>
              </button>

              {/* Avatar circle repurposed as Mode Switcher */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowModeDropdown(!showModeDropdown)} 
                  className={`pc-avatar-btn ${showModeDropdown ? 'active' : ''}`} 
                  aria-label="Switch Institute Type"
                  style={{
                    borderColor: showModeDropdown ? '#00f2fe' : 'rgba(255, 255, 255, 0.3)',
                    color: showModeDropdown ? '#fff' : '#94a3b8',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                    {appMode === 'school' ? 'school' : 'track_changes'}
                  </span>
                </button>

                {showModeDropdown && (
                  <>
                    {/* Click-away backdrop */}
                    <div 
                      onClick={() => setShowModeDropdown(false)} 
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                    />
                    
                    <div 
                      className="pc-mode-dropdown animate-dropdown"
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 12px)',
                        width: '320px',
                        background: '#111827',
                        border: '1px solid rgba(6, 182, 212, 0.2)',
                        borderRadius: '16px',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 15px rgba(6, 182, 212, 0.1)',
                        padding: '16px',
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px', textAlign: 'left' }}>
                        Select Workspace Mode
                      </div>

                      {/* Mobile Only: Library Link inside avatar dropdown */}
                      <div className="md:hidden border-b border-[rgba(56,189,248,0.12)] pb-3 mb-1">
                        <Link 
                          href="/library" 
                          onClick={() => setShowModeDropdown(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            background: 'rgba(6, 182, 212, 0.08)',
                            border: '1px solid rgba(6, 182, 212, 0.2)',
                            cursor: 'pointer',
                            textDecoration: 'none'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#00f2fe' }}>folder_open</span>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>Paper Library</span>
                            <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', lineHeight: '1.3' }}>View and manage saved papers</span>
                          </div>
                        </Link>
                      </div>

                      {/* School Mode Option */}
                      <div 
                        onClick={() => {
                          handleSetAppMode('school')
                          setShowModeDropdown(false)
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          borderRadius: '10px',
                          background: appMode === 'school' ? 'rgba(6, 182, 212, 0.08)' : '#0d121f',
                          border: appMode === 'school' ? '1px solid #00f2fe' : '1px solid rgba(56, 189, 248, 0.05)',
                          borderLeft: appMode === 'school' ? '4px solid #00f2fe' : '1px solid rgba(56, 189, 248, 0.05)',
                          cursor: 'pointer',
                        }}
                        className="pc-dropdown-card"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '24px', color: appMode === 'school' ? '#00f2fe' : '#64748b' }}>
                          school
                        </span>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>School Paper</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', lineHeight: '1.3' }}>CBSE/State Board syllabus exams</span>
                        </div>
                        {appMode === 'school' && (
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#00f2fe' }}>
                            check_circle
                          </span>
                        )}
                      </div>

                      {/* Coaching Mode Option */}
                      <div 
                        onClick={() => {
                          handleSetAppMode('coaching')
                          setShowModeDropdown(false)
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          borderRadius: '10px',
                          background: appMode === 'coaching' ? 'rgba(6, 182, 212, 0.08)' : '#0d121f',
                          border: appMode === 'coaching' ? '1px solid #00f2fe' : '1px solid rgba(56, 189, 248, 0.05)',
                          borderLeft: appMode === 'coaching' ? '4px solid #00f2fe' : '1px solid rgba(56, 189, 248, 0.05)',
                          cursor: 'pointer',
                        }}
                        className="pc-dropdown-card"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '24px', color: appMode === 'coaching' ? '#00f2fe' : '#64748b' }}>
                          track_changes
                        </span>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>Coaching Institute Paper</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', lineHeight: '1.3' }}>JEE/NEET/Competitive examinations</span>
                        </div>
                        {appMode === 'coaching' && (
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#00f2fe' }}>
                            check_circle
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Horizontal scrollable step progress bar below header (mobile only, Change 1) */}
        <div className="md:hidden flex items-center overflow-x-auto whitespace-nowrap py-3 px-4 border-b border-[rgba(56,189,248,0.12)] bg-[#0d1321] gap-2 justify-between scrollbar-none no-print">
          {tabs.map((t, idx) => (
            <span key={t.id} className="flex items-center gap-2">
              {idx > 0 && <span className="text-gray-600 text-xs">→</span>}
              <button
                onClick={() => setTab(t.id)}
                className={`text-xs font-bold tracking-wide uppercase transition-all duration-200 ${
                  tab === t.id ? 'text-[#00f2fe] border-b border-[#00f2fe] pb-0.5' : 'text-gray-400'
                }`}
              >
                {`0${idx + 1} ${t.label}`}
              </button>
            </span>
          ))}
        </div>

        {/* ── Main (padding-bottom increased on mobile to clear sticky bottom actions) ──────────────── */}
        <main className={`pc-main flex-1 w-full ${(tab === 'preview' || tab === 'editor' || tab === 'design') ? 'p-0' : 'px-4 py-8 md:px-8 md:py-12'} pb-24 md:pb-6`}>
          {tab === 'settings' && (
            <SettingsPanel 
              meta={meta} 
              onChange={setMeta} 
              onNext={() => setTab('editor')} 
              appMode={appMode} 
              paperName={paperName}
              onPaperNameChange={setPaperName}
              paperNameError={paperNameError}
            />
          )}
          {tab === 'editor' && appMode === 'school' && (
            <SchoolEditorPanel questions={questions} setQuestions={setQuestions} meta={meta} setMeta={setMeta} />
          )}
          {tab === 'editor' && appMode !== 'school' && (
            <EditorPanel questions={questions} setQuestions={setQuestions} meta={meta} setMeta={setMeta} appMode={appMode} />
          )}
          {tab === 'design' && (
            <DesignPanel meta={meta} layout={layout} questions={questions} onMetaChange={setMeta} onLayoutChange={setLayout} appMode={appMode} />
          )}
          {tab === 'preview' && (
            <PaperPreview meta={meta} layout={layout} questions={questions} appMode={appMode} />
          )}
        </main>
      </div>

      {/* ── Modals for Document Management (Change 8 bottom sheets) ───────────────────── */}

      {/* ── Unsaved Changes Warning Modal ────────────────────── */}
      {showUnsavedWarningModal && (
        <div className="pc-modal-backdrop" onClick={() => setShowUnsavedWarningModal(false)}>
          <div className="pc-modal-card animate-fadeup" style={{ border: '1px solid rgba(239, 68, 68, 0.4)', boxShadow: '0 0 30px rgba(239, 68, 68, 0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '32px' }}>warning</span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>Unsaved Changes</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
              You have unsaved changes. Would you like to save this paper to your library before starting a new one?
            </p>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', justifyContent: 'flex-end' }} className="flex-col md:flex-row">
              <button 
                onClick={() => setShowUnsavedWarningModal(false)}
                className="pc-print-btn w-full md:w-auto"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDiscardAndNew}
                className="pc-print-btn w-full md:w-auto"
                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
              >
                Discard &amp; New
              </button>
              <button 
                onClick={handleSaveAndNew}
                className="pc-print-btn w-full md:w-auto"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', color: '#fff', border: 'none' }}
              >
                Save &amp; New
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Name Your Paper Modal ────────────────────────────── */}
      {showNewPaperModal && (
        <div className="pc-modal-backdrop" onClick={() => setShowNewPaperModal(false)}>
          <div className="pc-modal-card animate-fadeup" style={{ border: '1px solid rgba(6, 182, 212, 0.4)', boxShadow: '0 0 30px rgba(6, 182, 212, 0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span className="material-symbols-outlined" style={{ color: '#00f2fe', fontSize: '32px' }}>add_circle</span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>Name Your Paper</h3>
            </div>
            
            <div className="pc-cyber-field" style={{ marginBottom: '20px' }}>
              <label className="pc-cyber-label">Paper Title</label>
              <input
                className="pc-cyber-input"
                type="text"
                value={newPaperNameInput}
                onChange={e => setNewPaperNameInput(e.target.value)}
                placeholder="e.g. Class X Math Pre-Board 2025"
                onKeyDown={e => e.key === 'Enter' && handleConfirmNewPaper()}
                autoFocus
              />
              <span className="material-symbols-outlined pc-cyber-input-icon">description</span>
            </div>

            {newPaperNameError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '13px', marginBottom: '20px', fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>warning</span>
                <span>{newPaperNameError}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', justifyContent: 'flex-end' }} className="flex-col md:flex-row">
              <button 
                onClick={() => setShowNewPaperModal(false)}
                className="pc-print-btn w-full md:w-auto"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmNewPaper}
                className="pc-print-btn w-full md:w-auto"
                disabled={!!newPaperNameError || !newPaperNameInput.trim()}
                style={{ 
                  background: (newPaperNameError || !newPaperNameInput.trim()) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', 
                  color: (newPaperNameError || !newPaperNameInput.trim()) ? '#64748b' : '#fff', 
                  border: 'none',
                  cursor: (newPaperNameError || !newPaperNameInput.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                Create Paper
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Bar (Change 11) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#0d1321] border-t border-[rgba(56,189,248,0.15)] flex z-[9999] no-print">
        <button 
          onClick={() => setShowMobilePreviewSheet(true)}
          className="flex-1 flex items-center justify-center gap-2 text-[#00f2fe] font-bold text-sm border-r border-[rgba(56,189,248,0.15)] bg-transparent active:bg-[rgba(0,242,254,0.05)]"
        >
          <span className="material-symbols-outlined text-lg">visibility</span>
          <span>Preview</span>
        </button>
        <button 
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 text-white font-bold text-sm bg-transparent active:bg-[rgba(255,255,255,0.05)]"
        >
          <span className="material-symbols-outlined text-lg">print</span>
          <span>Print / PDF</span>
        </button>
      </div>

      {/* Mobile Live Preview Bottom Sheet (Change 3) */}
      {showMobilePreviewSheet && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/80 flex flex-col justify-end no-print"
          onClick={() => setShowMobilePreviewSheet(false)}
        >
          <div 
            className="bg-[#070c15] w-full h-[85vh] rounded-t-2xl border-t border-[rgba(56,189,248,0.2)] flex flex-col animate-slideup"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(56,189,248,0.12)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00f2fe]">visibility</span>
                <span className="font-bold text-white text-base">Paper Preview</span>
              </div>
              <button 
                onClick={() => setShowMobilePreviewSheet(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-auto p-4 bg-[#090d16] flex justify-center items-start">
              <div 
                style={{ 
                  zoom: 0.45, 
                  width: '210mm', 
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
                  transformOrigin: 'top center'
                }}
              >
                <PaperPreview 
                  meta={meta} 
                  layout={layout} 
                  questions={questions} 
                  hideControls={true} 
                  isEmbedded={true} 
                  appMode={appMode} 
                />
              </div>
            </div>
          </div>
        </div>
      )}


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