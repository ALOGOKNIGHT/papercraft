'use client'

import { useState, useEffect, useRef } from 'react'
import { PaperMeta, QuestionsMap, Question } from '@/lib/types'
import { getOrderedKeys } from './PaperPreview'

// ── Subject-specific AI system prompts ─────────────────────────────────
const MATH_PROMPT = `You are a math question parser for Indian exam papers.
Parse the pasted questions and return ONLY a valid JSON array.
Rules:
- Preserve all math symbols as unicode exactly:
  ∈ ∉ ⊂ ⊃ ∪ ∩ ∅ φ ℕ ℤ ℝ ² ³ √ π ∞ ≤ ≥ ≠
  Σ ∫ ∂ Δ α β γ θ sin cos tan log ln f(x) P(A)
- Never write x2 instead of x², H2 instead of H²
- Detect MCQ options (a)(b)(c)(d) on same line OR separate lines
- Never confuse { } brackets inside options as new option markers
- Split questions by their number (1. or 1 or 1))
- Detect OR alternative questions
Return this exact JSON format, nothing else:
[{"questionNumber":1,"type":"mcq","questionText":"question here",
"hasOR":false,"orQuestionText":"","options":{"a":"","b":"","c":"","d":""},"marks":1}]
For non-MCQ remove options field.
For match column add columnA[] and columnB[] arrays.
For fill blanks use "______" for blanks.
Return ONLY raw JSON. No explanation. No backticks.`

const CHEMISTRY_PROMPT = `You are a chemistry question parser for Indian exam papers.
Parse the pasted questions and return ONLY a valid JSON array.
Rules:
- Preserve all chemical formulas using subscripts exactly:
  H₂O H₂SO₄ CO₂ NaCl CaCO₃ NH₃ HCl NaOH
  CH₄ C₆H₁₂O₆ Fe₂O₃ Na₂CO₃ KMnO₄
- Never write H2O instead of H₂O or CO2 instead of CO₂
- Preserve reaction symbols exactly:
  → (reaction) ⇌ (equilibrium) ↑ (gas) ↓ (precipitate) Δ (heat)
- Preserve ionic charges exactly: Fe²⁺ Fe³⁺ Cu²⁺ SO₄²⁻ OH⁻
- Detect MCQ options (a)(b)(c)(d) on same line OR separate lines
- Split questions by their number (1. or 1 or 1))
- Detect OR alternative questions
Return this exact JSON format, nothing else:
[{"questionNumber":1,"type":"mcq","questionText":"question here",
"hasOR":false,"orQuestionText":"","options":{"a":"","b":"","c":"","d":""},"marks":1}]
For non-MCQ remove options field.
For match column add columnA[] and columnB[] arrays.
For fill blanks use "______" for blanks.
Return ONLY raw JSON. No explanation. No backticks.`

const PHYSICS_PROMPT = `You are a physics question parser for Indian exam papers.
Parse the pasted questions and return ONLY a valid JSON array.
Rules:
- Preserve all physics symbols as unicode exactly:
  → (vector) ω α ε μ λ ρ η Ω ° θ φ
- Preserve units exactly:
  m/s m/s² N/m J W kWh μC μF kΩ °C K
- Preserve formulas exactly:
  E=mc² F=ma v²=u²+2as P=mv F=qvB
- Preserve subscripts and superscripts:
  v₀ v₁ aₓ Fₙ m² m³ s²
- Detect MCQ options (a)(b)(c)(d) on same line OR separate lines
- Split questions by their number (1. or 1 or 1))
- Detect OR alternative questions
Return this exact JSON format, nothing else:
[{"questionNumber":1,"type":"mcq","questionText":"question here",
"hasOR":false,"orQuestionText":"","options":{"a":"","b":"","c":"","d":""},"marks":1}]
For non-MCQ remove options field.
For match column add columnA[] and columnB[] arrays.
For fill blanks use "______" for blanks.
Return ONLY raw JSON. No explanation. No backticks.`

// Robust local parser for multiple MCQ formatting combinations (A, B, C, D marked)
function parseLocalQuestionAndOptions(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return null

  // 1. Check for Inline Single-Line/Multi-Line Patterns
  const inlinePatterns = [
    /^(.+?)\s+(?:A|a)\)\s+(.+?)\s+(?:B|b)\)\s+(.+?)\s+(?:C|c)\)\s+(.+?)\s+(?:D|d)\)\s+(.+)$/s,
    /^(.+?)\s+\((?:A|a)\)\s+(.+?)\s+\((?:B|b)\)\s+(.+?)\s+\((?:C|c)\)\s+(.+?)\s+\((?:D|d)\)\s+(.+)$/s,
    /^(.+?)\s+(?:A|a)\.\s+(.+?)\s+(?:B|b)\.\s+(.+?)\s+(?:C|c)\.\s+(.+?)\s+(?:D|d)\.\s+(.+)$/s,
    /^(.+?)\s+\[(?:A|a)\]\s+(.+?)\s+\[(?:B|b)\]\s+(.+?)\s+\[(?:C|c)\]\s+(.+?)\s+\[(?:D|d)\]\s+(.+)$/s,
    /^(.+?)\s+1\)\s+(.+?)\s+2\)\s+(.+?)\s+3\)\s+(.+?)\s+4\)\s+(.+)$/s,
    /^(.+?)\s+\(1\)\s+(.+?)\s+\(2\)\s+(.+?)\s+\(3\)\s+(.+?)\s+\(4\)\s+(.+)$/s,
    /^(.+?)\s+1\.\s+(.+?)\s+2\.\s+(.+?)\s+3\.\s+(.+?)\s+4\.\s+(.+)$/s,
    /^(.+?)\s+\[1\]\s+(.+?)\s+\[2\]\s+(.+?)\s+\[3\]\s+(.+?)\s+\[4\]\s+(.+)$/s,
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
  if (lines.length >= 2) {
    const optionRegex = /^\s*(?:\(?([A-Ea-e1-5])\)?[\.\)-]|\[([A-Ea-e1-5])\])\s*(.+)$/
    const extracted: { index: number; label: string; text: string }[] = []

    lines.forEach((line, i) => {
      const match = line.match(optionRegex)
      if (match) {
        const label = (match[1] || match[2]).toUpperCase()
        const textVal = match[3].trim()
        extracted.push({ index: i, label, text: textVal })
      }
    })

    let optionStartIndex = -1
    let finalOptions: string[] = []

    // Search for a valid option sequence near the end of lines
    for (let startIdx = extracted.length - 1; startIdx >= Math.max(0, extracted.length - 3); startIdx--) {
      const lastItem = extracted[startIdx]
      const lastLabel = lastItem.label
      let expectedSequence: string[] = []
      if (lastLabel === 'D') expectedSequence = ['A', 'B', 'C', 'D']
      else if (lastLabel === 'E') expectedSequence = ['A', 'B', 'C', 'D', 'E']
      else if (lastLabel === '4') expectedSequence = ['1', '2', '3', '4']
      else if (lastLabel === '5') expectedSequence = ['1', '2', '3', '4', '5']
      else if (lastLabel === 'C') expectedSequence = ['A', 'B', 'C']
      else if (lastLabel === '3') expectedSequence = ['1', '2', '3']

      if (expectedSequence.length > 0) {
        let seqIdx = expectedSequence.length - 1
        const tempOpts: number[] = new Array(expectedSequence.length)
        let matchCount = 0
        let lastFoundLineIdx = lines.length

        for (let i = startIdx; i >= 0; i--) {
          const item = extracted[i]
          if (item.label === expectedSequence[seqIdx] && item.index < lastFoundLineIdx) {
            tempOpts[seqIdx] = item.index
            lastFoundLineIdx = item.index
            seqIdx--
            matchCount++
            if (seqIdx < 0) break
          }
        }

        if (matchCount === expectedSequence.length) {
          optionStartIndex = tempOpts[0]
          
          finalOptions = []
          for (let k = 0; k < tempOpts.length; k++) {
            const currentLineIdx = tempOpts[k]
            const nextLineIdx = (k < tempOpts.length - 1) ? tempOpts[k + 1] : lines.length
            
            const firstLineOfOption = lines[currentLineIdx]
            const matchFirst = firstLineOfOption.match(optionRegex)
            const firstLineText = matchFirst ? matchFirst[3].trim() : firstLineOfOption
            
            const remainingLines = lines.slice(currentLineIdx + 1, nextLineIdx)
            const optionText = [firstLineText, ...remainingLines].join('\n').trim()
            finalOptions.push(optionText)
          }
          break
        }
      }
    }

    if (optionStartIndex !== -1) {
      const statement = lines.slice(0, optionStartIndex).join('\n').trim()
      const finalOpts = [...finalOptions]
      while (finalOpts.length < 4) {
        finalOpts.push(`Option ${String.fromCharCode(65 + finalOpts.length)}`)
      }
      return {
        statement,
        options: finalOpts
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
  appMode?: 'school' | 'coaching'
}

export default function EditorPanel({ questions, setQuestions, meta, setMeta, appMode = 'coaching' }: Props) {
  const [activeSectionId, setActiveSectionId] = useState<string>('A')
  const [isAiSheetOpen, setIsAiSheetOpen] = useState(false)

  // Image Compression Utility (Change 12)
  const compressImage = (base64Str: string, maxBytes: number, callback: (compressed: string) => void) => {
    const img = new Image()
    img.src = base64Str
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      const maxDim = 800
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        callback(base64Str)
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      let quality = 0.8
      let compressed = canvas.toDataURL('image/jpeg', quality)

      while (compressed.length * 0.75 > maxBytes && quality > 0.1) {
        quality -= 0.15
        compressed = canvas.toDataURL('image/jpeg', quality)
      }

      callback(compressed)
    }
    img.onerror = () => {
      callback(base64Str)
    }
  }

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
  const [aiQuestionType, setAiQuestionType] = useState<string>('MCQ')
  const [aiSubject, setAiSubject] = useState<'math' | 'chemistry' | 'physics'>('math')

  // Preview modal state
  const [previewQuestions, setPreviewQuestions] = useState<Array<{
    id: string
    text: string
    type: string
    options: string[]
    marks: number
    hasOr: boolean
    orText: string
  }> | null>(null)
  const [previewTargetSection, setPreviewTargetSection] = useState<string>('')

  // References
  const imgInputRef = useRef<HTMLInputElement>(null)

  // Derived sections list and active section
  const sectionsList = getOrderedKeys(Object.keys(questions), meta.sectionOrder).map(id => ({
    id,
    title: meta.customSectionNames?.[id] || (id === 'A' ? 'Core Principles' : id === 'B' ? 'Applications & Formulae' : `Section ${id}`)
  }))

  const activeSection = sectionsList.find(s => s.id === activeSectionId) || sectionsList[0] || { id: 'A', title: 'Core Principles' }

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const keys = sectionsList.map(s => s.id)
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
      triggerToast('Please paste questions or describe a topic first!')
      return
    }

    setIsGenerating(true)
    triggerToast(`✦ AI is parsing your questions using ${aiProvider === 'gemini' ? 'Gemini' : 'Groq'}...`)

    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: aiTopic.trim(),
          sectionLabel: activeSectionId,
          sectionDescription: meta.customSectionNames?.[activeSectionId] || `Section ${activeSectionId}`,
          defaultMarks: 1,
          subject: meta.subject || 'General',
          defaultType: aiQuestionType,
          provider: aiProvider,
          appMode: appMode,
          subjectPrompt:
            aiSubject === 'math' ? MATH_PROMPT :
            aiSubject === 'chemistry' ? CHEMISTRY_PROMPT :
            PHYSICS_PROMPT,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to generate questions.')
      }

      const data = await res.json()
      if (data.questions && data.questions.length > 0) {
        // Normalize each question's options to a clean 4-element array
        const parsed = data.questions.map((q: any) => {
          let opts: string[] = []
          if (Array.isArray(q.options)) {
            opts = q.options.map(String)
          }
          while (opts.length < 4) opts.push(`Option ${String.fromCharCode(65 + opts.length)}`)
          return {
            id: 'q_' + Math.random().toString(36).substr(2, 9),
            text: q.text || '',
            type: q.type || aiQuestionType,
            options: opts.slice(0, 4),
            marks: q.marks || 1,
            hasOr: q.hasOr || false,
            orText: q.orText || '',
          }
        })

        if (parsed.length === 1) {
          // Single question — fill the form fields directly, no confirmation needed
          setStatement(parsed[0].text)
          setOptions(parsed[0].options)
          setCorrectIndex(0)
          setAiTopic('')
          setIsAiSheetOpen(false)
          triggerToast('✓ Question loaded into the editor! Review and click "Add to Paper".')
        } else {
          // Multiple questions — add all directly to the paper, no confirmation needed
          const newQs: Question[] = parsed.map((pq: any) => ({
            id: pq.id,
            text: pq.text,
            type: pq.type as Question['type'],
            options: pq.options,
            correctIndex: 0,
            marks: pq.marks,
            hasOr: pq.hasOr,
            orText: pq.orText,
          }))
          setQuestions(prev => ({
            ...prev,
            [activeSectionId]: [...(prev[activeSectionId] || []), ...newQs]
          }))
          setAiTopic('')
          setIsAiSheetOpen(false)
          triggerToast(`✓ Added ${newQs.length} questions to Section ${activeSectionId}!`)
        }
      } else {
        triggerToast('✕ AI could not extract any structured questions. Try rephrasing or switching provider.')
      }
    } catch (error: any) {
      console.error(error)
      triggerToast(`✕ Error: ${error.message || 'AI generation failed.'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // Add all previewed questions to the paper
  const handleAddPreviewedToPaper = () => {
    if (!previewQuestions || previewQuestions.length === 0) return
    const newQs: Question[] = previewQuestions.map(pq => ({
      id: pq.id,
      text: pq.text,
      type: pq.type as Question['type'],
      options: pq.options,
      correctIndex: 0,
      marks: pq.marks,
      hasOr: pq.hasOr,
      orText: pq.orText,
    }))
    setQuestions(prev => ({
      ...prev,
      [previewTargetSection]: [...(prev[previewTargetSection] || []), ...newQs]
    }))
    setPreviewQuestions(null)
    setAiTopic('')
    triggerToast(`✓ Added ${newQs.length} question${newQs.length > 1 ? 's' : ''} to Section ${previewTargetSection}!`)
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
    if (!pastedText) return

    // Helper to split into potential question blocks
    const splitIntoQuestionBlocks = (text: string): string[] => {
      let blocks = text.split(/\n\n+/).map(b => b.trim()).filter(Boolean);
      if (blocks.length <= 1) {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const numberedPattern = /^\s*(?:Q\.?\s*)?\d+[\.)]/i;
        const matchingLinesCount = lines.filter(line => numberedPattern.test(line)).length;
        if (matchingLinesCount >= 2) {
          const chunks: string[] = [];
          let currentChunk = "";
          for (const line of lines) {
            if (numberedPattern.test(line)) {
              if (currentChunk.trim()) chunks.push(currentChunk.trim());
              currentChunk = line;
            } else {
              currentChunk += "\n" + line;
            }
          }
          if (currentChunk.trim()) chunks.push(currentChunk.trim());
          blocks = chunks;
        }
      }
      return blocks;
    };

    const blocks = splitIntoQuestionBlocks(pastedText)
    const parsedQuestions: Array<{ statement: string; options: string[] }> = []

    for (const block of blocks) {
      const parsed = parseLocalQuestionAndOptions(block)
      if (parsed) {
        parsedQuestions.push(parsed)
      }
    }

    if (parsedQuestions.length >= 2) {
      e.preventDefault()
      const newQuestionsList: Question[] = parsedQuestions.map(pq => ({
        id: 'q_' + Math.random().toString(36).substr(2, 9),
        text: pq.statement,
        type: 'MCQ',
        options: pq.options,
        correctIndex: 0,
        marks: 1,
        hasOr: false,
        orText: ''
      }))

      setQuestions(prev => ({
        ...prev,
        [activeSectionId]: [...(prev[activeSectionId] || []), ...newQuestionsList]
      }))

      triggerToast(`✓ Automatically added ${newQuestionsList.length} questions from clipboard!`)
    } else if (parsedQuestions.length === 1) {
      e.preventDefault()
      setStatement(parsedQuestions[0].statement)
      setOptions(parsedQuestions[0].options)
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
      const base64 = ev.target?.result as string
      compressImage(base64, 500 * 1024, (compressed) => {
        setQuestionImage(compressed)
        triggerToast('✓ Image uploaded successfully!')
      })
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

  const handleDeleteSection = (id: string) => {
    // Don't allow deleting the last section
    if (sectionsList.length <= 1) {
      triggerToast('✕ Cannot delete the only section!')
      return
    }
    // Remove section from questions map
    setQuestions(prev => {
      const updated = { ...prev }
      delete updated[id]
      return updated
    })
    // Remove from customSectionNames and sectionOrder
    setMeta(prev => {
      const updatedNames = { ...(prev.customSectionNames || {}) }
      delete updatedNames[id]
      const updatedOrder = (prev.sectionOrder || []).filter((s: string) => s !== id)
      return { ...prev, customSectionNames: updatedNames, sectionOrder: updatedOrder }
    })
    // Switch active section to first remaining
    const remaining = sectionsList.filter(s => s.id !== id)
    setActiveSectionId(remaining[0]?.id || 'A')
    triggerToast(`✕ Section ${id} and its questions deleted.`)
  }

  return (
    <div className="pc-editor-container animate-fadeup delay-1">
      {/* ── Left Sidebar ────────────────────────────────────────── */}
      <aside className="pc-editor-sidebar" style={{ minWidth: '240px' }}>
        <div className="pc-editor-sidebar-header">
          <h3 className="pc-editor-sidebar-title">Question Builder</h3>
          <p className="pc-editor-sidebar-subtitle">
            {appMode === 'school' ? 'Manage School Exam' : 'Manage Coaching Exam'}
          </p>
        </div>

        <nav className="pc-editor-sidebar-nav" style={{ flex: 1, overflowY: 'auto' }}>
          {sectionsList.map((sec, idx) => (
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', zIndex: 10 }}>
                    {/* Move Up */}
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          moveSection(sec.id, 'up')
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: activeSectionId === sec.id ? '#00f2fe' : '#64748b',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '2px',
                          opacity: 0.6,
                        }}
                        title="Move Up"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_upward</span>
                      </button>
                    )}
                    {/* Move Down */}
                    {idx < sectionsList.length - 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          moveSection(sec.id, 'down')
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: activeSectionId === sec.id ? '#00f2fe' : '#64748b',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '2px',
                          opacity: 0.6,
                        }}
                        title="Move Down"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_downward</span>
                      </button>
                    )}
                    {/* Rename */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startRenaming(sec.id, sec.title);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: activeSectionId === sec.id ? '#00f2fe' : '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '2px',
                      }}
                      title="Rename section"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                    </button>
                    {/* Delete — hidden when only 1 section */}
                    {sectionsList.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSection(sec.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '2px',
                          opacity: 0.7,
                        }}
                        title="Delete section and its questions"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                      </button>
                    )}
                  </div>
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

        {/* AI generator rendering function */}
        {(() => {
          const renderAiGeneratorForm = (isMobileSheet = false) => (
            <>
              {/* Subject Toggle Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</label>
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  {([
                    { key: 'math',      label: 'Mathematics', icon: 'calculate' },
                    { key: 'chemistry', label: 'Chemistry',   icon: 'science' },
                    { key: 'physics',   label: 'Physics',     icon: 'bolt' },
                  ] as const).map(({ key, label, icon }) => (
                    <button
                      key={key}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setAiSubject(key)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: aiSubject === key
                          ? '1px solid #00f2fe'
                          : '1px solid rgba(56, 189, 248, 0.12)',
                        background: aiSubject === key
                          ? 'rgba(0, 242, 254, 0.1)'
                          : '#0d121f',
                        color: aiSubject === key ? '#00f2fe' : '#64748b',
                        fontSize: '13px',
                        fontWeight: aiSubject === key ? 700 : 500,
                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                        fontFamily: 'inherit',
                        boxShadow: aiSubject === key ? '0 0 10px rgba(0, 242, 254, 0.12)' : 'none',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 1: Section and Type selectors */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                {/* Target Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '140px' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Add to Section</label>
                  <select
                    value={activeSectionId}
                    disabled={isGenerating}
                    onChange={(e) => setActiveSectionId(e.target.value)}
                    style={{
                      background: '#0d121f',
                      border: '1px solid rgba(56, 189, 248, 0.12)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      width: '100%',
                    }}
                  >
                    {sectionsList.map(sec => (
                      <option key={sec.id} value={sec.id}>Section {sec.id}: {sec.title}</option>
                    ))}
                  </select>
                </div>

                {/* Question Type */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '160px' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Question Type</label>
                  <select
                    value={aiQuestionType}
                    disabled={isGenerating}
                    onChange={(e) => setAiQuestionType(e.target.value)}
                    style={{
                      background: '#0d121f',
                      border: '1px solid rgba(56, 189, 248, 0.12)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      width: '100%',
                    }}
                  >
                    <option value="MCQ">MCQ (Multiple Choice)</option>
                    <option value="Short Answer">Short Answer</option>
                    <option value="Long Answer">Long Answer</option>
                    <option value="Fill in the Blanks">Fill in the Blanks</option>
                    <option value="Assertion-Reason">Assertion-Reason</option>
                  </select>
                </div>

                {/* AI Provider */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '130px', flex: isMobileSheet ? '1 1 100%' : 'none' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Engine</label>
                  <select
                    value={aiProvider}
                    disabled={isGenerating}
                    onChange={(e) => setAiProvider(e.target.value as 'gemini' | 'groq')}
                    style={{
                      background: '#0d121f',
                      border: '1px solid rgba(56, 189, 248, 0.12)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      width: '100%',
                    }}
                  >
                    <option value="gemini">Gemini 3.5</option>
                    <option value="groq">Groq (Llama)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Text input + generate button */}
              <div className="pc-ai-gen-form" style={{ display: 'flex', flexDirection: isMobileSheet ? 'column' : 'row', gap: '12px' }}>
                <textarea
                  rows={4}
                  placeholder={appMode === 'school' ? 'Paste one or more questions here (numbered 1. 2. 3. ...) or describe a topic...' : 'Paste competitive questions here (numbered 1. 2. 3. ...) or describe a topic (e.g. Sets and Functions)...'}
                  className="pc-cyber-textarea"
                  style={{ flex: 1, resize: 'vertical', minHeight: '80px', fontSize: '13px', width: '100%' }}
                  value={aiTopic}
                  disabled={isGenerating}
                  onChange={(e) => setAiTopic(e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={handleAIGenerate} 
                  disabled={isGenerating}
                  className="pc-ai-gen-btn"
                  style={{ opacity: isGenerating ? 0.7 : 1, cursor: isGenerating ? 'not-allowed' : 'pointer', alignSelf: isMobileSheet ? 'stretch' : 'flex-end', width: isMobileSheet ? '100%' : 'auto' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    {isGenerating ? 'pending' : 'auto_awesome'}
                  </span>
                  <span>{isGenerating ? 'Parsing...' : 'Parse & Preview'}</span>
                </button>
              </div>
            </>
          );

          return (
            <>
              {/* Trigger button for mobile bottom sheet */}
              <button
                type="button"
                onClick={() => setIsAiSheetOpen(true)}
                className="pc-ai-trigger-btn"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px dashed #00f2fe',
                  color: '#00f2fe',
                  fontWeight: 600,
                  fontSize: '14px',
                  marginBottom: '24px',
                  cursor: 'pointer'
                }}
              >
                <span className="material-symbols-outlined">auto_awesome</span>
                <span>Generate Questions with AI</span>
              </button>

              {/* Inline AI card for desktop */}
              <div className="pc-ai-gen-card pc-ai-gen-card-inline">
                <div className="pc-ai-gen-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined">auto_awesome</span>
                    <span>AI Question Generator</span>
                  </div>
                </div>
                {renderAiGeneratorForm(false)}
              </div>

              {/* Mobile bottom sheet for AI generator */}
              {isAiSheetOpen && (
                <div className="pc-modal-backdrop" onClick={() => setIsAiSheetOpen(false)}>
                  <div className="pc-modal-card" onClick={(e) => e.stopPropagation()} style={{ background: '#0b111e', border: '1px solid rgba(6, 182, 212, 0.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f2fe', fontWeight: 700 }}>
                        <span className="material-symbols-outlined">auto_awesome</span>
                        <span>AI Question Generator</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAiSheetOpen(false)}
                        style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                    {renderAiGeneratorForm(true)}
                  </div>
                </div>
              )}
            </>
          );
        })()}

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

        {/* ── Questions in Active Section ───────────────────────── */}
        <div style={{ marginTop: '48px', borderTop: '2px dashed rgba(56, 189, 248, 0.15)', paddingTop: '32px' }}>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px', color: '#fff', marginBottom: '4px' }}>
            Questions in Section {activeSection.id}: {activeSection.title}
          </h3>
          <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '20px' }}>
            {(questions[activeSectionId] || []).length} question{(questions[activeSectionId] || []).length !== 1 ? 's' : ''} in this section
          </p>

          {(questions[activeSectionId] || []).length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>
              No questions in this section yet. Use the editor above to add questions.
            </p>
          ) : (
            <div className="space-y-4">
              {(questions[activeSectionId] || []).map((q, idx) => (
                <div key={q.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', paddingBottom: idx !== (questions[activeSectionId] || []).length - 1 ? '16px' : '0', borderBottom: idx !== (questions[activeSectionId] || []).length - 1 ? '1px dashed rgba(255,255,255,0.04)' : 'none' }}>
                  <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#00f2fe', fontSize: '11px', fontWeight: 700, borderRadius: '4px', padding: '2px 6px', marginTop: '2px' }}>
                    Q{idx + 1}
                  </span>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <p style={{ fontSize: '13px', color: '#f8fafc', fontWeight: 500, marginBottom: '8px', lineHeight: 1.5 }}>
                        {q.text}
                      </p>

                      {q.image && (
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(56, 189, 248, 0.15)', borderRadius: '6px', padding: '6px', width: 'fit-content', marginBottom: '8px' }}>
                          <img src={q.image} alt="question thumbnail" style={{ maxHeight: '80px', maxWidth: '160px', objectFit: 'contain', borderRadius: '2px' }} />
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
                    onClick={() => handleRemoveAddedQuestion(activeSectionId, q.id)}
                    style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                    title="Delete question"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                  </button>
                </div>
              ))}
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

      {/* ── AI Parse Preview Modal ──────────────────────────────── */}
      {previewQuestions && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 99999, padding: '24px'
        }}>
          <div style={{
            background: '#0b111e',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            borderRadius: '16px',
            boxShadow: '0 0 40px rgba(6, 182, 212, 0.15)',
            width: '100%',
            maxWidth: '720px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(56, 189, 248, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined" style={{ color: '#00f2fe', fontSize: '24px' }}>preview</span>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Review Parsed Questions
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0, marginTop: '2px' }}>
                    {previewQuestions.length} question{previewQuestions.length !== 1 ? 's' : ''} parsed • Adding to Section {previewTargetSection}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewQuestions(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
              </button>
            </div>

            {/* Scrollable Questions List */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {previewQuestions.map((pq, idx) => (
                <div
                  key={pq.id}
                  style={{
                    background: 'rgba(56, 189, 248, 0.03)',
                    border: '1px solid rgba(56, 189, 248, 0.1)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    position: 'relative',
                  }}
                >
                  {/* Remove button */}
                  <button
                    onClick={() => setPreviewQuestions(prev => prev ? prev.filter((_, i) => i !== idx) : null)}
                    style={{
                      position: 'absolute', top: '10px', right: '10px',
                      background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#ef4444', borderRadius: '6px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', padding: '3px 6px', gap: '4px', fontSize: '11px', fontWeight: 600
                    }}
                    title="Remove this question"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                    Remove
                  </button>

                  {/* Question number + text */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px', paddingRight: '80px' }}>
                    <span style={{
                      background: 'rgba(0, 242, 254, 0.12)', color: '#00f2fe',
                      fontSize: '11px', fontWeight: 700, borderRadius: '4px',
                      padding: '2px 7px', flexShrink: 0, marginTop: '1px'
                    }}>
                      Q{idx + 1}
                    </span>
                    <p style={{ fontSize: '13px', color: '#f8fafc', fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
                      {pq.text}
                    </p>
                  </div>

                  {/* Options */}
                  {pq.options && pq.options.some(o => o) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', paddingLeft: '28px' }}>
                      {pq.options.map((opt, oIdx) => (
                        <div key={oIdx} style={{
                          fontSize: '12px', color: '#94a3b8',
                          display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: 1.4
                        }}>
                          <span style={{ fontWeight: 700, color: '#64748b', flexShrink: 0 }}>
                            ({String.fromCharCode(97 + oIdx)})
                          </span>
                          <span>{opt || <em style={{ color: '#475569' }}>empty</em>}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {previewQuestions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '40px', display: 'block', marginBottom: '8px' }}>delete_sweep</span>
                  All questions removed. Click Cancel.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(56, 189, 248, 0.1)',
              display: 'flex', justifyContent: 'flex-end', gap: '12px',
              flexShrink: 0,
            }}>
              <button
                onClick={() => setPreviewQuestions(null)}
                style={{
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#94a3b8', borderRadius: '8px', padding: '10px 20px',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddPreviewedToPaper}
                disabled={previewQuestions.length === 0}
                style={{
                  background: previewQuestions.length === 0 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                  border: 'none', color: previewQuestions.length === 0 ? '#64748b' : '#fff',
                  borderRadius: '8px', padding: '10px 24px',
                  fontSize: '13px', fontWeight: 700, cursor: previewQuestions.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: previewQuestions.length > 0 ? '0 4px 15px rgba(14, 165, 233, 0.3)' : 'none'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
                Add {previewQuestions.length} Question{previewQuestions.length !== 1 ? 's' : ''} to Paper
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}