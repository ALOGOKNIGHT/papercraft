'use client'

import { useState, useRef, useEffect } from 'react'
import { PaperMeta, QuestionsMap, Question, QuestionType, SchoolSection } from '@/lib/types'
import { generateId, SCHOOL_QUESTION_TYPES } from '@/lib/constants'
import { getOrderedKeys } from './PaperPreview'

interface Props {
  questions: QuestionsMap
  setQuestions: React.Dispatch<React.SetStateAction<QuestionsMap>>
  meta: PaperMeta
  setMeta: React.Dispatch<React.SetStateAction<PaperMeta>>
}

const DEFAULT_SECTIONS: SchoolSection[] = [
  { id: 'A', title: 'Section A', description: 'Multiple Choice Questions (1 mark each)', marksPerQuestion: 1 },
]

export default function SchoolEditorPanel({ questions, setQuestions, meta, setMeta }: Props) {
  const getSectionTitle = (id: string) => {
    const custom = meta.customSectionNames?.[id]
    if (!custom) return `Section ${id}`
    if (custom === 'Core Principles' && id === 'A') return 'Section A'
    if (custom === 'Applications & Formulae' && id === 'B') return 'Section B'
    return custom
  }

  const activeKeys = Object.keys(questions).length > 0 ? getOrderedKeys(Object.keys(questions), meta.sectionOrder) : ['A']

  const schoolSections: SchoolSection[] = activeKeys.map(id => ({
    id,
    title: getSectionTitle(id),
    description: meta.customSectionDescriptions?.[id] || '',
    marksPerQuestion: meta.customSectionMarks?.[id] || 1,
  }))

  const [activeSectionId, setActiveSectionId] = useState<string>(() => {
    const keys = Object.keys(questions).sort()
    return keys[0] || 'A'
  })
  const [selectedType, setSelectedType] = useState<QuestionType>('MCQ')

  // Question form state
  const [qText, setQText] = useState('')
  const [qMarks, setQMarks] = useState(1)
  const [mcqOptions, setMcqOptions] = useState<string[]>(['', '', '', ''])
  const [correctIdx, setCorrectIdx] = useState(0)
  const [matchColA, setMatchColA] = useState<string[]>(['', '', '', ''])
  const [matchColB, setMatchColB] = useState<string[]>(['', '', '', ''])

  // OR question
  const [showOr, setShowOr] = useState(false)
  const [orText, setOrText] = useState('')
  const [orMcqOptions, setOrMcqOptions] = useState<string[]>(['', '', '', ''])
  const [orCorrectIdx, setOrCorrectIdx] = useState(0)
  const [orMatchColA, setOrMatchColA] = useState<string[]>(['', '', '', ''])
  const [orMatchColB, setOrMatchColB] = useState<string[]>(['', '', '', ''])

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState('')

  // Toast
  const [toastMsg, setToastMsg] = useState('')

  const activeSection = schoolSections.find(s => s.id === activeSectionId) || schoolSections[0]
  const activeQuestions = questions[activeSectionId] || []

  // Controlled input string states for manual marks typing
  const [secMarksInput, setSecMarksInput] = useState<string>('1')
  const [qMarksInput, setQMarksInput] = useState<string>('1')

  // Synchronize input fields whenever active section or its persistent marks change
  useEffect(() => {
    if (activeSection) {
      setSecMarksInput(String(activeSection.marksPerQuestion))
      setQMarksInput(String(activeSection.marksPerQuestion))
      setQMarks(activeSection.marksPerQuestion)
    }
  }, [activeSectionId, activeSection?.marksPerQuestion])

  // Global question number calculation
  const getGlobalStartNum = (sectionId: string): number => {
    let count = 1
    for (const sec of schoolSections) {
      if (sec.id === sectionId) break
      count += (questions[sec.id] || []).length
    }
    return count
  }

  // Grand total marks
  const grandTotal = schoolSections.reduce((sum, sec) => {
    const qs = questions[sec.id] || []
    return sum + qs.reduce((s, q) => s + q.marks, 0)
  }, 0)

  const triggerToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  // Section management
  const addSection = () => {
    const usedIds = schoolSections.map(s => s.id)
    let nextId = ''
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i)
      if (!usedIds.includes(letter)) { nextId = letter; break }
    }
    if (!nextId) return

    const newTitle = `Section ${nextId}`
    setQuestions(prev => ({ ...prev, [nextId]: [] }))
    setMeta(prev => ({
      ...prev,
      customSectionNames: { ...prev.customSectionNames, [nextId]: newTitle },
      customSectionDescriptions: { ...prev.customSectionDescriptions, [nextId]: '' },
      customSectionMarks: { ...prev.customSectionMarks, [nextId]: 1 },
    }))
    setActiveSectionId(nextId)
    triggerToast(`✓ Created Section ${nextId} successfully!`)
  }

  const deleteSection = (id: string) => {
    if (schoolSections.length <= 1) return
    const qs = questions[id] || []
    if (qs.length > 0 && !confirm(`Delete "${schoolSections.find(s => s.id === id)?.title}" with ${qs.length} question(s)?`)) return

    setQuestions(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setMeta(prev => {
      const nextNames = { ...prev.customSectionNames }
      const nextDescs = { ...prev.customSectionDescriptions }
      const nextMarks = { ...prev.customSectionMarks }
      delete nextNames[id]
      delete nextDescs[id]
      delete nextMarks[id]
      return {
        ...prev,
        customSectionNames: nextNames,
        customSectionDescriptions: nextDescs,
        customSectionMarks: nextMarks
      }
    })
    if (activeSectionId === id) {
      setActiveSectionId(schoolSections.find(s => s.id !== id)?.id || 'A')
    }
    triggerToast(`✓ Deleted Section ${id} successfully!`)
  }

  const startRename = (id: string) => {
    setRenamingId(id)
    setRenameVal(schoolSections.find(s => s.id === id)?.title || '')
  }

  const saveRename = () => {
    if (!renamingId || !renameVal.trim()) { setRenamingId(null); return }
    setMeta(prev => ({
      ...prev,
      customSectionNames: { ...prev.customSectionNames, [renamingId]: renameVal.trim() }
    }))
    setRenamingId(null)
    triggerToast(`✓ Renamed section successfully!`)
  }

  const updateSectionMarks = (id: string, marks: number) => {
    const validMarks = Math.max(1, marks)
    setMeta(prev => ({
      ...prev,
      customSectionMarks: { ...prev.customSectionMarks, [id]: validMarks }
    }))
    setQMarks(validMarks)
    setQuestions(prev => ({
      ...prev,
      [id]: (prev[id] || []).map(q => ({
        ...q,
        marks: validMarks,
        orQuestion: q.orQuestion ? { ...q.orQuestion, marks: validMarks } : undefined
      }))
    }))
  }

  const updateSectionDesc = (id: string, desc: string) => {
    setMeta(prev => ({
      ...prev,
      customSectionDescriptions: { ...prev.customSectionDescriptions, [id]: desc }
    }))
  }

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const keys = schoolSections.map(s => s.id)
    const index = keys.indexOf(id)
    if (index === -1) return
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= keys.length) return

    const newKeys = [...keys]
    const temp = newKeys[index]
    newKeys[index] = newKeys[newIndex]
    newKeys[newIndex] = temp

    setMeta(prev => ({
      ...prev,
      sectionOrder: newKeys
    }))
    triggerToast('✓ Section order updated!')
  }

  const updateQuestionMarks = (qId: string, newMarks: number) => {
    const validMarks = Math.max(1, newMarks)
    setQuestions(prev => ({
      ...prev,
      [activeSectionId]: (prev[activeSectionId] || []).map(q =>
        q.id === qId
          ? {
              ...q,
              marks: validMarks,
              orQuestion: q.orQuestion ? { ...q.orQuestion, marks: validMarks } : undefined
            }
          : q
      )
    }))
  }

  // Reset form
  const resetForm = () => {
    setQText('')
    setMcqOptions(['', '', '', ''])
    setCorrectIdx(0)
    setMatchColA(['', '', '', ''])
    setMatchColB(['', '', '', ''])
    setShowOr(false)
    setOrText('')
    setOrMcqOptions(['', '', '', ''])
    setOrCorrectIdx(0)
    setOrMatchColA(['', '', '', ''])
    setOrMatchColB(['', '', '', ''])
  }

  // Add question to paper
  const handleAdd = () => {
    if (!qText.trim() && selectedType !== 'Match the Column') {
      triggerToast('⚠ Please enter question text')
      return
    }

    const buildQuestion = (
      text: string, opts: string[], correct: number,
      colA: string[], colB: string[]
    ): Question => ({
      id: generateId(),
      text,
      type: selectedType,
      options: selectedType === 'MCQ' ? opts.filter(o => o.trim()) : [],
      marks: qMarks,
      hasOr: false,
      orText: '',
      correctIndex: selectedType === 'MCQ' ? correct : undefined,
      matchColumnA: selectedType === 'Match the Column' ? colA.filter(x => x.trim()) : undefined,
      matchColumnB: selectedType === 'Match the Column' ? colB.filter(x => x.trim()) : undefined,
    })

    const mainQ = buildQuestion(qText, mcqOptions, correctIdx, matchColA, matchColB)

    if (showOr && orText.trim()) {
      mainQ.hasOr = true
      mainQ.orQuestion = buildQuestion(orText, orMcqOptions, orCorrectIdx, orMatchColA, orMatchColB)
    }

    setQuestions(prev => ({
      ...prev,
      [activeSectionId]: [...(prev[activeSectionId] || []), mainQ]
    }))

    resetForm()
    setQMarksInput(String(activeSection?.marksPerQuestion || 1))
    setQMarks(activeSection?.marksPerQuestion || 1)
    triggerToast('✓ Question added to paper')
  }

  const removeQuestion = (qId: string) => {
    setQuestions(prev => ({
      ...prev,
      [activeSectionId]: (prev[activeSectionId] || []).filter(q => q.id !== qId)
    }))
  }

  // Styles
  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    border: active ? '1px solid #00f2fe' : '1px solid rgba(56, 189, 248, 0.12)',
    background: active ? 'rgba(0, 242, 254, 0.1)' : '#0d121f',
    color: active ? '#00f2fe' : '#94a3b8',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const,
  })

  const sectionItemStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
    background: active ? 'rgba(0, 242, 254, 0.06)' : 'transparent',
    borderLeft: active ? '3px solid #00f2fe' : '3px solid transparent',
    transition: 'all 0.15s',
  })

  // Question input form based on type
  const renderQuestionInputs = (
    text: string, setText: (v: string) => void,
    opts: string[], setOpts: (v: string[]) => void,
    correct: number, setCorrect: (v: number) => void,
    colA: string[], setColA: (v: string[]) => void,
    colB: string[], setColB: (v: string[]) => void,
    label: string
  ) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {label && <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>}

      {/* Question text */}
      <textarea
        className="pc-cyber-textarea"
        placeholder={
          selectedType === 'Fill in the Blanks'
            ? 'e.g. The SI unit of force is _____.'
            : selectedType === 'Match the Column'
            ? 'Instructions for matching (e.g. "Match the following")'
            : 'Enter your question text...'
        }
        rows={3}
        value={text}
        onChange={e => setText(e.target.value)}
        style={{ fontSize: '13px' }}
      />

      {/* MCQ options */}
      {selectedType === 'MCQ' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Options</div>
          {opts.map((opt, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setCorrect(i)}
                style={{
                  width: 22, height: 22, borderRadius: '50%', border: '2px solid',
                  borderColor: correct === i ? '#00f2fe' : 'rgba(56, 189, 248, 0.2)',
                  background: correct === i ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', color: correct === i ? '#00f2fe' : '#64748b', fontWeight: 700,
                  flexShrink: 0, transition: 'all 0.2s',
                }}
              >
                {String.fromCharCode(65 + i)}
              </button>
              <input
                className="pc-cyber-input"
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                value={opt}
                onChange={e => {
                  const next = [...opts]
                  next[i] = e.target.value
                  setOpts(next)
                }}
                style={{ flex: 1, fontSize: '12px' }}
              />
              {opts.length > 2 && (
                <button
                  onClick={() => { const next = opts.filter((_, j) => j !== i); setOpts(next); if (correct >= next.length) setCorrect(0) }}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', padding: '2px' }}
                >×</button>
              )}
            </div>
          ))}
          {opts.length < 6 && (
            <button
              onClick={() => setOpts([...opts, ''])}
              style={{
                background: 'none', border: '1px dashed rgba(56, 189, 248, 0.2)', borderRadius: '6px',
                color: '#64748b', fontSize: '12px', padding: '6px', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >+ Add Option</button>
          )}
        </div>
      )}

      {/* Match the Column */}
      {selectedType === 'Match the Column' && (
        <div style={{ display: 'flex', gap: '16px' }}>
          {/* Column A */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#00f2fe', textTransform: 'uppercase' }}>Column A</div>
            {colA.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, width: '16px' }}>{i + 1}.</span>
                <input
                  className="pc-cyber-input"
                  value={item}
                  onChange={e => { const next = [...colA]; next[i] = e.target.value; setColA(next) }}
                  placeholder={`Item ${i + 1}`}
                  style={{ flex: 1, fontSize: '12px' }}
                />
                {colA.length > 2 && (
                  <button onClick={() => setColA(colA.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}>×</button>
                )}
              </div>
            ))}
            <button onClick={() => setColA([...colA, ''])} style={{ background: 'none', border: '1px dashed rgba(56, 189, 248, 0.15)', borderRadius: '4px', color: '#64748b', fontSize: '11px', padding: '4px', cursor: 'pointer' }}>+ Row</button>
          </div>
          {/* Column B */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase' }}>Column B</div>
            {colB.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, width: '16px' }}>{String.fromCharCode(97 + i)}.</span>
                <input
                  className="pc-cyber-input"
                  value={item}
                  onChange={e => { const next = [...colB]; next[i] = e.target.value; setColB(next) }}
                  placeholder={`Match ${String.fromCharCode(97 + i)}`}
                  style={{ flex: 1, fontSize: '12px' }}
                />
                {colB.length > 2 && (
                  <button onClick={() => setColB(colB.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}>×</button>
                )}
              </div>
            ))}
            <button onClick={() => setColB([...colB, ''])} style={{ background: 'none', border: '1px dashed rgba(139, 92, 246, 0.15)', borderRadius: '4px', color: '#64748b', fontSize: '11px', padding: '4px', cursor: 'pointer' }}>+ Row</button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 76px)', overflow: 'hidden' }}>
      {/* ── LEFT SIDEBAR ──────────────────────────────────────── */}
      <aside style={{
        width: '260px', minWidth: '260px', background: '#070c15',
        borderRight: '1px solid rgba(56, 189, 248, 0.08)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid rgba(56, 189, 248, 0.08)' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#00f2fe' }}>school</span>
            School Question Editor
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Grand Total: <span style={{ color: '#00f2fe', fontWeight: 700 }}>{grandTotal} marks</span>
          </div>
        </div>

        {/* Sections list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {schoolSections.map((sec, idx) => {
            const secQs = questions[sec.id] || []
            const secTotal = secQs.reduce((s, q) => s + q.marks, 0)
            const isActive = sec.id === activeSectionId

            return (
              <div
                key={sec.id}
                style={sectionItemStyle(isActive)}
                onClick={() => { setActiveSectionId(sec.id); setQMarks(sec.marksPerQuestion) }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  {renamingId === sec.id ? (
                    <input
                      autoFocus
                      className="pc-cyber-input"
                      value={renameVal}
                      onChange={e => setRenameVal(e.target.value)}
                      onBlur={saveRename}
                      onKeyDown={e => e.key === 'Enter' && saveRename()}
                      onClick={e => e.stopPropagation()}
                      style={{ fontSize: '12px', padding: '4px 8px', height: 'auto' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div
                        style={{ fontSize: '13px', fontWeight: 600, color: isActive ? '#f8fafc' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}
                      >
                        {sec.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                        {/* Move Up */}
                        {idx > 0 && (
                          <button
                            onClick={e => { e.stopPropagation(); moveSection(sec.id, 'up') }}
                            title="Move Up"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                              color: isActive ? '#00f2fe' : '#64748b', opacity: isActive ? 0.7 : 0,
                              transition: 'opacity 0.2s', display: 'flex', alignItems: 'center'
                            }}
                            onMouseOver={e => (e.currentTarget.style.opacity = '1')}
                            onMouseOut={e => (e.currentTarget.style.opacity = isActive ? '0.7' : '0')}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_upward</span>
                          </button>
                        )}
                        {/* Move Down */}
                        {idx < schoolSections.length - 1 && (
                          <button
                            onClick={e => { e.stopPropagation(); moveSection(sec.id, 'down') }}
                            title="Move Down"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                              color: isActive ? '#00f2fe' : '#64748b', opacity: isActive ? 0.7 : 0,
                              transition: 'opacity 0.2s', display: 'flex', alignItems: 'center'
                            }}
                            onMouseOver={e => (e.currentTarget.style.opacity = '1')}
                            onMouseOut={e => (e.currentTarget.style.opacity = isActive ? '0.7' : '0')}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_downward</span>
                          </button>
                        )}
                        {/* Rename */}
                        <button
                          onClick={e => { e.stopPropagation(); startRename(sec.id) }}
                          title="Rename section"
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                            color: isActive ? '#00f2fe' : '#64748b', opacity: isActive ? 0.7 : 0,
                            transition: 'opacity 0.2s', display: 'flex', alignItems: 'center'
                          }}
                          onMouseOver={e => (e.currentTarget.style.opacity = '1')}
                          onMouseOut={e => (e.currentTarget.style.opacity = isActive ? '0.7' : '0')}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                        </button>
                      </div>
                    </div>
                  )}
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                    {secQs.length} Q · {sec.marksPerQuestion}m each · {secTotal} marks
                  </div>
                </div>
                {schoolSections.length > 1 && (
                  <button
                    onClick={e => { e.stopPropagation(); deleteSection(sec.id) }}
                    style={{
                      background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
                      fontSize: '14px', opacity: 0.5, transition: 'opacity 0.2s', padding: '2px',
                    }}
                    onMouseOver={e => (e.currentTarget.style.opacity = '1')}
                    onMouseOut={e => (e.currentTarget.style.opacity = '0.5')}
                  >×</button>
                )}
              </div>
            )
          })}
        </div>

        {/* Add section button */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(56, 189, 248, 0.08)' }}>
          <button
            onClick={addSection}
            style={{
              width: '100%', padding: '8px', borderRadius: '8px',
              background: 'rgba(0, 242, 254, 0.06)', border: '1px dashed rgba(0, 242, 254, 0.3)',
              color: '#00f2fe', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            Add Section
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ─────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: '#0a0f1a' }}>

        {/* Section header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            {/* Editable section title */}
            {renamingId === activeSectionId ? (
              <input
                autoFocus
                className="pc-cyber-input"
                value={renameVal}
                onChange={e => setRenameVal(e.target.value)}
                onBlur={saveRename}
                onKeyDown={e => e.key === 'Enter' && saveRename()}
                style={{ fontSize: '20px', fontWeight: 700, padding: '4px 10px', width: '240px', background: 'rgba(0,242,254,0.05)', border: '1px solid #00f2fe' }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  {activeSection?.title || 'Section'}
                </h2>
                <button
                  onClick={() => startRename(activeSectionId)}
                  title="Rename section"
                  style={{
                    background: 'rgba(0, 242, 254, 0.06)', border: '1px solid rgba(0, 242, 254, 0.15)',
                    borderRadius: '6px', cursor: 'pointer', padding: '4px 8px',
                    color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', fontWeight: 600, transition: 'all 0.2s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(0, 242, 254, 0.12)'; e.currentTarget.style.borderColor = '#00f2fe' }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(0, 242, 254, 0.06)'; e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.15)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                  Rename
                </button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>MARKS PER Q:</label>
              <input
                type="number"
                min={1}
                max={20}
                value={secMarksInput}
                onChange={e => {
                  const valStr = e.target.value
                  setSecMarksInput(valStr)
                  const val = parseInt(valStr)
                  if (!isNaN(val) && val >= 1) {
                    updateSectionMarks(activeSectionId, val)
                  }
                }}
                onBlur={() => {
                  const val = parseInt(secMarksInput) || 1
                  setSecMarksInput(String(val))
                  updateSectionMarks(activeSectionId, val)
                }}
                className="pc-cyber-input"
                style={{ width: '60px', fontSize: '13px', textAlign: 'center', padding: '4px 8px' }}
              />
            </div>
          </div>
          <input
            className="pc-cyber-input"
            placeholder="Section description (e.g. Section A has 20 questions of 1 mark each)"
            value={activeSection?.description || ''}
            onChange={e => updateSectionDesc(activeSectionId, e.target.value)}
            style={{ fontSize: '12px', width: '100%', background: 'rgba(9, 13, 22, 0.6)' }}
          />
        </div>

        {/* Question Type Selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {SCHOOL_QUESTION_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t as QuestionType)}
              style={pillStyle(selectedType === t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Question Input Card */}
        <div className="pc-cyber-card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <p className="pc-cyber-kicker" style={{ margin: 0 }}>
              NEW {selectedType.toUpperCase()} QUESTION
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>MARKS:</span>
              <input
                type="number"
                min={1}
                value={qMarksInput}
                onChange={e => {
                  const valStr = e.target.value
                  setQMarksInput(valStr)
                  const val = parseInt(valStr)
                  if (!isNaN(val) && val >= 1) {
                    setQMarks(val)
                  }
                }}
                onBlur={() => {
                  const val = parseInt(qMarksInput) || 1
                  setQMarksInput(String(val))
                  setQMarks(val)
                }}
                className="pc-cyber-input"
                style={{ width: '50px', fontSize: '12px', textAlign: 'center', padding: '4px 6px' }}
              />
            </div>
          </div>

          {renderQuestionInputs(qText, setQText, mcqOptions, setMcqOptions, correctIdx, setCorrectIdx, matchColA, setMatchColA, matchColB, setMatchColB, '')}

          {/* OR toggle */}
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={() => setShowOr(!showOr)}
              style={{
                background: showOr ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                border: `1px ${showOr ? 'solid' : 'dashed'} ${showOr ? '#8b5cf6' : 'rgba(56, 189, 248, 0.15)'}`,
                borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 600,
                color: showOr ? '#8b5cf6' : '#64748b', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{showOr ? 'remove' : 'add'}</span>
              {showOr ? 'Remove OR Question' : 'Add OR Question'}
            </button>
          </div>

          {/* OR question inputs */}
          {showOr && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                marginBottom: '12px',
              }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(139, 92, 246, 0.3)' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#8b5cf6', letterSpacing: '0.1em' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(139, 92, 246, 0.3)' }} />
              </div>
              {renderQuestionInputs(orText, setOrText, orMcqOptions, setOrMcqOptions, orCorrectIdx, setOrCorrectIdx, orMatchColA, setOrMatchColA, orMatchColB, setOrMatchColB, 'ALTERNATE QUESTION')}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              onClick={handleAdd}
              style={{
                flex: 1, padding: '10px 20px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                color: '#fff', border: 'none', fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)', transition: 'all 0.2s',
              }}
              onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseOut={e => (e.currentTarget.style.transform = 'none')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
              Add to Paper
            </button>
            <button
              onClick={resetForm}
              style={{
                padding: '10px 20px', borderRadius: '8px', background: 'transparent',
                border: '1px solid rgba(56, 189, 248, 0.15)', color: '#94a3b8',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* ── Added Questions List ──────────────────────────────── */}
        {activeQuestions.length > 0 && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#00f2fe' }}>list_alt</span>
              Added Questions ({activeQuestions.length})
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 400, marginLeft: 'auto' }}>
                Section Total: {activeQuestions.reduce((s, q) => s + q.marks, 0)} marks
              </span>
            </div>

            {activeQuestions.map((q, idx) => {
              const globalNum = getGlobalStartNum(activeSectionId) + idx
              return (
                <div
                  key={q.id}
                  style={{
                    background: '#0d121f', border: '1px solid rgba(56, 189, 248, 0.08)',
                    borderRadius: '10px', padding: '14px 16px', marginBottom: '8px',
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                  }}
                >
                  {/* Number */}
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '6px',
                    background: 'rgba(0, 242, 254, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, color: '#00f2fe', flexShrink: 0,
                  }}>
                    {globalNum}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                        background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', textTransform: 'uppercase',
                      }}>{q.type}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.02em' }}>MARKS:</span>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={q.marks}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 1
                            updateQuestionMarks(q.id, val)
                          }}
                          className="pc-cyber-input"
                          style={{
                            width: '38px',
                            fontSize: '10px',
                            fontWeight: 700,
                            textAlign: 'center',
                            padding: '0px 2px',
                            height: '18px',
                            background: 'rgba(7, 12, 21, 0.6)',
                            color: '#c084fc',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                      {q.hasOr && (
                        <span style={{
                          fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                          background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b',
                        }}>HAS OR</span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                      {q.text || (q.type === 'Match the Column' ? 'Match the following' : '')}
                    </div>
                    {q.type === 'MCQ' && q.options.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                        {q.options.map((opt, i) => (
                          <span key={i} style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '4px' }}>
                            {String.fromCharCode(65 + i)}) {opt.length > 30 ? opt.slice(0, 30) + '...' : opt}
                          </span>
                        ))}
                      </div>
                    )}
                    {q.hasOr && q.orQuestion && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed rgba(139, 92, 246, 0.2)' }}>
                        <span style={{ fontSize: '10px', color: '#8b5cf6', fontWeight: 700 }}>OR: </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {q.orQuestion.text.length > 60 ? q.orQuestion.text.slice(0, 60) + '...' : q.orQuestion.text}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeQuestion(q.id)}
                    style={{
                      background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
                      fontSize: '18px', padding: '4px', transition: 'color 0.2s', flexShrink: 0,
                    }}
                    onMouseOver={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseOut={e => (e.currentTarget.style.color = '#64748b')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {activeQuestions.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '40px 20px', color: '#64748b',
            border: '1px dashed rgba(56, 189, 248, 0.1)', borderRadius: '12px',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#334155', display: 'block', marginBottom: '8px' }}>quiz</span>
            <div style={{ fontSize: '13px' }}>No questions added to this section yet.</div>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>Use the form above to add questions.</div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', background: 'rgba(7, 12, 21, 0.95)',
          border: '1px solid #00f2fe', boxShadow: '0 0 15px rgba(0, 242, 254, 0.3)',
          borderRadius: '10px', padding: '12px 24px', color: '#fff', fontSize: '13px', fontWeight: 600,
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span className="material-symbols-outlined" style={{ color: '#00f2fe', fontSize: '18px' }}>info</span>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  )
}
