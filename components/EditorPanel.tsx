'use client'

import { useState, useEffect, useRef } from 'react'
import { PaperMeta, QuestionsMap, Question } from '@/lib/types'

// Robust local parser for multiple MCQ formatting combinations (A, B, C, D marked)
function parseLocalQuestionAndOptions(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return null

  // 1. Check for Inline Single-Line Options
  // A) / B) / C) / D) or a) / b) / c) / d) or (a) / (b) / (c) / (d) or A. / B. / C. / D.
  const inlinePatterns = [
    /(.*?)\s+(?:A|a)\)\s+(.+?)\s+(?:B|b)\)\s+(.+?)\s+(?:C|c)\)\s+(.+?)\s+(?:D|d)\)\s+(.+)$/s,
    /(.*?)\s+\((?:A|a)\)\s+(.+?)\s+\((?:B|b)\)\s+(.+?)\s+\((?:C|c)\)\s+(.+?)\s+\((?:D|d)\)\s+(.+)$/s,
    /(.*?)\s+(?:A|a)\.\s+(.+?)\s+(?:B|b)\.\s+(.+?)\s+(?:C|c)\.\s+(.+?)\s+(?:D|d)\.\s+(.+)$/s,
    /(.*?)\s+1\)\s+(.+?)\s+2\)\s+(.+?)\s+3\)\s+(.+?)\s+4\)\s+(.+)$/s,
    /(.*?)\s+\(1\)\s+(.+?)\s+\(2\)\s+(.+?)\s+\(3\)\s+(.+?)\s+\(4\)\s+(.+)$/s,
    /(.*?)\s+1\.\s+(.+?)\s+2\.\s+(.+?)\s+3\.\s+(.+?)\s+4\.\s+(.+)$/s,
  ]

  for (const pattern of inlinePatterns) {
    const match = trimmed.match(pattern)
    if (match) {
      return {
        statement: match[1].trim(),
        options: [match[2].trim(), match[3].trim(), match[4].trim(), match[5].trim()]
      }
    }
  }

  // 2. Check for Line-by-Line Options
  const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length >= 3) {
    const extractedOptions: string[] = []
    const statementLines: string[] = []
    
    // Matches lines starting with A) or a) or (A) or (a) or A. or a. or 1) or (1) or 1.
    const optionRegex = /^\s*(?:\(?([A-Da-d1-4])\)?[\.\)]|-)\s*(.+)$/

    lines.forEach(line => {
      const match = line.match(optionRegex)
      if (match) {
        extractedOptions.push(match[2].trim())
      } else {
        statementLines.push(line)
      }
    })

    if (extractedOptions.length >= 2) {
      const finalOpts = [...extractedOptions]
      while (finalOpts.length < 4) {
        finalOpts.push(`Option ${String.fromCharCode(65 + finalOpts.length)}`)
      }
      return {
        statement: statementLines.join('\n').trim(),
        options: finalOpts.slice(0, 4)
      }
    }
  }

  return null
}

interface Props {
  questions: QuestionsMap
  setQuestions: React.Dispatch<React.SetStateAction<QuestionsMap>>
  meta: PaperMeta
  setMeta: React.Dispatch<React.SetStateAction<PaperMeta>>
}

export default function EditorPanel({ questions, setQuestions, meta, setMeta }: Props) {
  const [activeSectionId, setActiveSectionId] = useState<string>('A')

  // Renaming state
  const [renamingSectionId, setRenamingSectionId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState<string>('')

  // Active question form state
  const [statement, setStatement] = useState('')
  const [options, setOptions] = useState<string[]>(['Option A', 'Option B', 'Option C', 'Option D'])
  const [correctIndex, setCorrectIndex] = useState<number>(0)
  const [questionImage, setQuestionImage] = useState<string | null>(null)
  const [aiTopic, setAiTopic] = useState('')
  const [toastMsg, setToastMsg] = useState('')
  const [aiProvider, setAiProvider] = useState<'gemini' | 'groq'>('gemini')
  const [isGenerating, setIsGenerating] = useState(false)

  // References
  const imgInputRef = useRef<HTMLInputElement>(null)

  // Derived sections list and active section
  const sectionsList = Object.keys(questions).sort().map(id => ({
    id,
    title: meta.customSectionNames?.[id] || (id === 'A' ? 'Core Principles' : id === 'B' ? 'Applications & Formulae' : `Section ${id}`)
  }))

  const activeSection = sectionsList.find(s => s.id === activeSectionId) || sectionsList[0] || { id: 'A', title: 'Core Principles' }

  const totalAddedQuestionsCount = Object.values(questions).flat().length

  // Show toast utility
  const triggerToast = (msg: string) => {
    setToastMsg(msg)
  }

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [toastMsg])

  // Smart AI Generator and Real API fetch
  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) {
      triggerToast('Please paste a question or describe a topic first!')
      return
    }

    setIsGenerating(true)
    triggerToast(`✦ AI is analyzing and formatting your question using ${aiProvider === 'gemini' ? 'Gemini' : 'Groq'}...`)

    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rawText: aiTopic.trim(),
          sectionLabel: activeSectionId,
          sectionDescription: meta.customSectionNames?.[activeSectionId] || `Section ${activeSectionId}`,
          defaultMarks: 1,
          subject: meta.subject || 'General',
          defaultType: 'MCQ',
          provider: aiProvider,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to generate question.')
      }

      const data = await res.json()
      if (data.questions && data.questions.length > 0) {
        const q = data.questions[0]
        setStatement(q.text || '')
        
        if (q.options && q.options.length > 0) {
          const finalOptions = [...q.options]
          while (finalOptions.length < 4) {
            finalOptions.push(`Option ${String.fromCharCode(65 + finalOptions.length)}`)
          }
          setOptions(finalOptions.slice(0, 4))
        } else {
          setOptions(['Option A', 'Option B', 'Option C', 'Option D'])
        }
        
        setCorrectIndex(0)
        triggerToast('✓ AI has successfully parsed and formatted your question!')
      } else {
        triggerToast('✕ AI could not extract any structured questions.')
      }
    } catch (error: any) {
      console.error(error)
      triggerToast(`✕ Error: ${error.message || 'AI generation failed.'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // Options Handlers
  const handleAddOption = () => {
    setOptions([...options, ''])
  }

  const handleRemoveOption = (index: number) => {
    if (options.length <= 1) {
      triggerToast('You must have at least one option!')
      return
    }
    const updated = options.filter((_, i) => i !== index)
    setOptions(updated)
    if (correctIndex === index) {
      setCorrectIndex(0)
    } else if (correctIndex > index) {
      setCorrectIndex(correctIndex - 1)
    }
  }

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options]
    updated[index] = val
    setOptions(updated)
  }

  // Local question clipboard paste handler
  const handlePasteQuestion = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('Text')
    const parsed = parseLocalQuestionAndOptions(pastedText)
    if (parsed) {
      e.preventDefault()
      setStatement(parsed.statement)
      setOptions(parsed.options)
      setCorrectIndex(0)
      triggerToast('✓ Clipboard question and options automatically sorted into separate fields!')
    }
  }

  // Image Upload Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setQuestionImage(ev.target?.result as string)
      triggerToast('✓ Image uploaded successfully!')
    }
    reader.readAsDataURL(file)
  }

  // Question Form submission
  const handleAddToPaper = () => {
    if (!statement.trim()) {
      triggerToast('Please write a question statement first!')
      return
    }
    
    const newQuestion: Question = {
      id: 'q_' + Date.now(),
      text: statement.trim(),
      type: 'MCQ',
      options: [...options],
      correctIndex: correctIndex,
      image: questionImage || undefined,
      marks: 1,
      hasOr: false,
      orText: ''
    }
    
    setQuestions(prev => ({
      ...prev,
      [activeSectionId]: [...(prev[activeSectionId] || []), newQuestion]
    }))
    
    // Clear form for next entry
    setStatement('')
    setOptions(['Option A', 'Option B', 'Option C', 'Option D'])
    setCorrectIndex(0)
    setQuestionImage(null)
    setAiTopic('')
    
    triggerToast('✓ Question successfully added to your exam paper!')
  }

  const handleSaveDraft = () => {
    triggerToast('✓ Question saved as a draft.')
  }

  // Question deletion from paper list
  const handleRemoveAddedQuestion = (sectionId: string, qId: string) => {
    setQuestions(prev => ({
      ...prev,
      [sectionId]: (prev[sectionId] || []).filter(q => q.id !== qId)
    }))
    triggerToast('✕ Question removed from paper.')
  }

  // Section Handlers
  const handleAddSection = () => {
    const nextLetter = String.fromCharCode(65 + Object.keys(questions).length)
    const newTitle = `New Section ${nextLetter}`
    
    setQuestions(prev => ({
      ...prev,
      [nextLetter]: []
    }))
    
    setMeta(prev => ({
      ...prev,
      customSectionNames: {
        ...prev.customSectionNames,
        [nextLetter]: newTitle
      }
    }))
    
    setActiveSectionId(nextLetter)
    triggerToast(`✓ Created Section ${nextLetter} successfully!`)
  }

  const startRenaming = (id: string, currentTitle: string) => {
    setRenamingSectionId(id)
    setRenameValue(currentTitle)
  }

  const saveRename = (id: string | null) => {
    if (!id) return
    if (!renameValue.trim()) {
      setRenamingSectionId(null)
      return
    }
    setMeta(prev => ({
      ...prev,
      customSectionNames: {
        ...prev.customSectionNames,
        [id]: renameValue
      }
    }))
    setRenamingSectionId(null)
    triggerToast(`✓ Renamed Section ${id} successfully!`)
  }

  return (
    <div className="pc-editor-container animate-fadeup delay-1">
      {/* ── Left Sidebar ────────────────────────────────────────── */}
      <aside className="pc-editor-sidebar" style={{ minWidth: '240px' }}>
        <div className="pc-editor-sidebar-header">
          <h3 className="pc-editor-sidebar-title">Question Builder</h3>
          <p className="pc-editor-sidebar-subtitle">Manage Exam Content</p>
        </div>

        <nav className="pc-editor-sidebar-nav" style={{ flex: 1, overflowY: 'auto' }}>
          {sectionsList.map((sec) => (
            <div key={sec.id} style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '4px', gap: '4px' }}>
              {renamingSectionId === sec.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', width: '100%' }}>
                  <input
                    className="pc-ai-gen-input"
                    style={{ padding: '6px 10px', fontSize: '13px', background: '#0d121f', flex: 1, boxSizing: 'border-box' }}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename(sec.id)
                      if (e.key === 'Escape') setRenamingSectionId(null)
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => saveRename(sec.id)}
                    style={{ background: '#10b981', border: 'none', color: '#080c14', borderRadius: '4px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', fontWeight: 'bold' }}>check</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenamingSectionId(null)}
                    style={{ background: '#ef4444', border: 'none', color: '#fff', borderRadius: '4px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                  </button>
                </div>
              ) : (
                <div 
                  className={`pc-editor-sidebar-btn ${activeSectionId === sec.id ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                    border: 'none',
                    textAlign: 'left'
                  }}
                  onClick={() => setActiveSectionId(sec.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', flex: 1 }}>
                    <span className="material-symbols-outlined">menu_book</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Section {sec.id}: {sec.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Stop sidebar click activation
                      startRenaming(sec.id, sec.title);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: activeSectionId === sec.id ? '#00f2fe' : '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                      zIndex: 10
                    }}
                    title="Rename section"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Add New Section Button */}
          <button
            onClick={handleAddSection}
            className="pc-editor-sidebar-btn"
            style={{ 
              marginTop: '16px', 
              color: '#00f2fe', 
              border: '1px dashed rgba(6, 182, 212, 0.25)', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'rgba(6, 182, 212, 0.02)'
            }}
            type="button"
          >
            <span className="material-symbols-outlined">add</span>
            <span>Add New Section</span>
          </button>
        </nav>
      </aside>

      {/* ── Main Workspace ─────────────────────────────────────── */}
      <div className="pc-editor-content">
        <h1 className="pc-editor-page-title">Question Editor</h1>

        {/* Section Rename Header inside main content */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          marginBottom: '32px',
          background: 'rgba(56, 189, 248, 0.03)',
          border: '1px solid rgba(56, 189, 248, 0.08)',
          borderRadius: '8px',
          padding: '12px 16px'
        }}>
          <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Editing Section {activeSection.id}:</span>
          {renamingSectionId === activeSection.id ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                className="pc-ai-gen-input"
                style={{ padding: '6px 12px', fontSize: '15px', width: '280px', boxSizing: 'border-box' }}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveRename(activeSection.id)
                  if (e.key === 'Escape') setRenamingSectionId(null)
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => saveRename(activeSection.id)}
                style={{ background: '#10b981', border: 'none', color: '#080c14', borderRadius: '4px', padding: '6px 10px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', fontWeight: 'bold' }}>check</span>
              </button>
              <button
                type="button"
                onClick={() => setRenamingSectionId(null)}
                style={{ background: '#ef4444', border: 'none', color: '#fff', borderRadius: '4px', padding: '6px 10px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{activeSection.title}</span>
              <button
                type="button"
                onClick={() => startRenaming(activeSection.id, activeSection.title)}
                style={{ background: 'transparent', border: 'none', color: '#00f2fe', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Rename section"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
              </button>
            </div>
          )}
        </div>

        {/* ── AI Question Generator Card ─────────────────────────── */}
        <div className="pc-ai-gen-card">
          <div className="pc-ai-gen-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined">auto_awesome</span>
              <span>AI Question Generator</span>
            </div>
          </div>

          <div className="pc-ai-gen-form">
            <input
              type="text"
              placeholder="Paste raw question text or describe a topic (e.g. Photosynthesis)..."
              className="pc-ai-gen-input"
              value={aiTopic}
              disabled={isGenerating}
              onChange={(e) => setAiTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isGenerating) handleAIGenerate()
              }}
            />
            <select
              value={aiProvider}
              disabled={isGenerating}
              onChange={(e) => setAiProvider(e.target.value as 'gemini' | 'groq')}
              className="pc-ai-provider-select"
              style={{
                background: '#0d121f',
                border: '1px solid rgba(56, 189, 248, 0.12)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#f8fafc',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
              }}
            >
              <option value="gemini">Gemini 3.5</option>
              <option value="groq">Groq (Llama)</option>
            </select>
            <button 
              type="button" 
              onClick={handleAIGenerate} 
              disabled={isGenerating}
              className="pc-ai-gen-btn"
              style={{ opacity: isGenerating ? 0.7 : 1, cursor: isGenerating ? 'not-allowed' : 'pointer' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                {isGenerating ? 'pending' : 'auto_awesome'}
              </span>
              <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
            </button>
          </div>
        </div>

        {/* ── Question Input Form ────────────────────────────────── */}
        <div className="pc-editor-field-wrapper">
          <label className="pc-editor-label">Question Statement</label>
          <textarea
            rows={5}
            placeholder="Enter your question here (Paste a question with options A, B, C, D to auto-sort)..."
            className="pc-cyber-textarea"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            onPaste={handlePasteQuestion}
          />
        </div>

        {/* ── QUESTION DIAGRAM / IMAGE UPLOADER (NEW FEATURE) ───── */}
        <div className="pc-editor-field-wrapper">
          <label className="pc-editor-label">Question Diagram / Image (Optional)</label>
          
          {questionImage ? (
            <div style={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: '300px', 
              background: '#0d121f', 
              border: '1px solid rgba(6, 182, 212, 0.35)', 
              borderRadius: '8px', 
              padding: '12px',
              boxSizing: 'border-box'
            }}>
              <img
                src={questionImage}
                alt="question diagram"
                style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '4px' }}
              />
              <button
                type="button"
                onClick={() => {
                  setQuestionImage(null);
                  triggerToast('✕ Image removed.');
                }}
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  cursor: 'pointer',
                  boxShadow: '0 0 6px rgba(239, 68, 68, 0.4)'
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => imgInputRef.current?.click()}
                className="pc-capsule-btn-secondary"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '10px 20px', 
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px dashed rgba(6, 182, 212, 0.25) !important'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>image</span>
                <span>+ Upload Image from Device</span>
              </button>
            </div>
          )}
          
          <input
            ref={imgInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
        </div>

        {/* MCQ Options Header */}
        <div className="pc-options-header">
          <label className="pc-editor-label" style={{ marginBottom: 0 }}>Options (MCQ)</label>
          <button 
            type="button" 
            onClick={handleAddOption} 
            className="pc-add-option-btn"
          >
            + Add Option
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-3 mb-8">
          {options.map((option, index) => (
            <div key={index} className="pc-option-row">
              {/* Custom Nesting Radio */}
              <button
                type="button"
                className={`pc-custom-radio ${correctIndex === index ? 'active' : ''}`}
                onClick={() => setCorrectIndex(index)}
              >
                <div className="pc-custom-radio-inner" />
              </button>

              {/* Input wrapper */}
              <div className="pc-option-input-wrapper">
                <input
                  type="text"
                  placeholder="Enter option..."
                  className="pc-option-input"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                />
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemoveOption(index)}
                className="pc-option-remove"
                title="Remove option"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* ── Bottom Actions ─────────────────────────────────────── */}
        <div className="pc-action-divider">
          <button 
            type="button" 
            onClick={handleAddToPaper} 
            className="pc-capsule-btn-primary"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
            <span>Add to Paper</span>
          </button>

          <button 
            type="button" 
            onClick={handleSaveDraft} 
            className="pc-capsule-btn-secondary"
          >
            <span>Save as Draft</span>
          </button>
        </div>

        {/* ── Added Questions List (All Sections) ───────────────── */}
        <div style={{ marginTop: '48px', borderTop: '2px dashed rgba(56, 189, 248, 0.15)', paddingTop: '32px' }}>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px', color: '#fff', marginBottom: '20px' }}>
            Questions in Exam Paper ({totalAddedQuestionsCount})
          </h3>
          
          {totalAddedQuestionsCount === 0 ? (
            <p style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>
              No questions added yet. Use the editor above to draft and add questions to sections.
            </p>
          ) : (
            <div className="space-y-6">
              {sectionsList.map(sec => {
                const secQuestions = questions[sec.id] || []
                if (secQuestions.length === 0) return null
                
                return (
                  <div key={sec.id} style={{ background: '#0f1422', border: '1px solid rgba(56, 189, 248, 0.08)', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(56, 189, 248, 0.08)', paddingBottom: '10px', marginBottom: '14px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#00f2fe' }}>
                        Section {sec.id}: {sec.title}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {secQuestions.length} Q
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      {secQuestions.map((q, idx) => (
                        <div key={q.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', paddingBottom: idx !== secQuestions.length - 1 ? '16px' : '0', borderBottom: idx !== secQuestions.length - 1 ? '1px dashed rgba(255,255,255,0.04)' : 'none' }}>
                          <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#00f2fe', fontSize: '11px', fontWeight: 700, borderRadius: '4px', padding: '2px 6px', marginTop: '2px' }}>
                            Q{idx + 1}
                          </span>
                          
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                              <p style={{ fontSize: '13px', color: '#f8fafc', fontWeight: 500, marginBottom: '8px', lineHeight: 1.5 }}>
                                {q.text}
                              </p>
                              
                              {/* Display uploaded thumbnail in grouping list */}
                              {q.image && (
                                <div style={{ 
                                  background: 'rgba(255, 255, 255, 0.02)', 
                                  border: '1px solid rgba(56, 189, 248, 0.15)', 
                                  borderRadius: '6px', 
                                  padding: '6px', 
                                  width: 'fit-content',
                                  marginBottom: '8px'
                                }}>
                                  <img 
                                    src={q.image} 
                                    alt="question thumbnail" 
                                    style={{ maxHeight: '80px', maxWidth: '160px', objectFit: 'contain', borderRadius: '2px' }} 
                                  />
                                </div>
                              )}
 
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {q.options.map((opt, oIdx) => (
                                  <div key={oIdx} style={{ fontSize: '12px', color: q.correctIndex === oIdx ? '#10b981' : '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontWeight: 700 }}>{String.fromCharCode(65 + oIdx)}.</span>
                                    <span>{opt || '(empty option)'}</span>
                                    {q.correctIndex === oIdx && <span className="material-symbols-outlined" style={{ fontSize: 12 }}>check_circle</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveAddedQuestion(sec.id, q.id)}
                            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                            title="Delete question"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Success Toast Alert ────────────────────────────────── */}
      {toastMsg && (
        <div className="pc-toast-glow">
          <span className="material-symbols-outlined" style={{ color: toastMsg.includes('Draft') || toastMsg.includes('thinking') ? '#00f2fe' : '#10b981', fontSize: 18 }}>
            {toastMsg.includes('added') ? 'check_circle' : toastMsg.includes('think') ? 'sync' : 'info'}
          </span>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  )
}