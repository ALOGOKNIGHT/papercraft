'use client'

import { useState, useCallback, useRef } from 'react'
import { PaperMeta, Question, QuestionsMap } from '@/lib/types'
import { SECTIONS, QUESTION_TYPES, generateId } from '@/lib/constants'
import MathText from './MathText'

interface Props {
  questions: QuestionsMap
  setQuestions: React.Dispatch<React.SetStateAction<QuestionsMap>>
  meta: PaperMeta
  setMeta: React.Dispatch<React.SetStateAction<PaperMeta>>
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  border: '1px solid rgba(120, 118, 125, 0.2)',
  borderRadius: '18px',
  fontSize: '14px',
  fontFamily: 'inherit',
  background: 'rgba(248, 243, 233, 0.84)',
  color: '#1d1c16',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.16em',
  color: '#47464c',
  textTransform: 'uppercase',
  marginBottom: '6px',
  display: 'block',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
}

function subtleButtonStyle(active = false): React.CSSProperties {
  return {
    padding: '10px 14px',
    borderRadius: '14px',
    border: '1px solid transparent',
    background: active ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.05)',
    color: active ? '#fff' : '#bfc3d4',
    fontWeight: 700,
    fontSize: '12px',
  }
}

function chipStyle(tone: 'gold' | 'soft' = 'soft'): React.CSSProperties {
  return tone === 'gold'
    ? {
        fontSize: '11px',
        background: 'rgba(226,185,106,0.18)',
        color: '#6b4a04',
        padding: '4px 10px',
        borderRadius: '999px',
        fontWeight: '700',
      }
    : {
        fontSize: '11px',
        background: 'rgba(26,26,46,0.08)',
        color: '#47464c',
        padding: '4px 10px',
        borderRadius: '999px',
        fontWeight: '700',
      }
}

/** e.g. "Stem:\na) ...\nb) ...\nc) ...\nd) ..." */
function parseMcqFromPastedBlock(raw: string): { stem: string; options: [string, string, string, string] } | null {
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
  if (!normalized) return null

  const lines = normalized.split('\n')
  const optRe = /^\s*(?:\(([a-dA-D])\)|([a-dA-D]))[\)\.\:]\s*(.+)$/

  function parseOptionLine(line: string): { letter: string; text: string } | null {
    const m = line.trim().match(optRe)
    if (!m) return null
    const letter = (m[1] || m[2]).toLowerCase()
    const text = (m[3] || '').trim()
    if (!text) return null
    return { letter, text }
  }

  const nonEmpty = lines.map((l, idx) => ({ line: l.trim(), idx })).filter((x) => x.line !== '')

  for (let p = 0; p <= nonEmpty.length - 4; p++) {
    const parsed = nonEmpty.slice(p, p + 4).map((x) => parseOptionLine(x.line))
    if (parsed.some((x) => !x)) continue
    if (parsed[0]!.letter !== 'a' || parsed[1]!.letter !== 'b' || parsed[2]!.letter !== 'c' || parsed[3]!.letter !== 'd') continue

    const firstLineIdx = nonEmpty[p].idx
    const stemLines = lines
      .slice(0, firstLineIdx)
      .map((l) => l.trim())
      .filter((l) => l !== '')
    let stem = stemLines.join('\n').trim()
    stem = stem.replace(/:\s*$/, '').trim()
    if (!stem) continue

    return {
      stem,
      options: [parsed[0]!.text, parsed[1]!.text, parsed[2]!.text, parsed[3]!.text],
    }
  }

  return null
}

function QuestionCard({
  q,
  index,
  onEdit,
  onDelete,
}: {
  q: Question
  index: number
  onEdit: (updated: Question) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(q)

  const save = () => {
    onEdit(local)
    setEditing(false)
  }

  if (editing) {
    return (
      <div
        className="pc-card"
        style={{
          padding: '18px',
          marginBottom: '14px',
          borderRadius: '22px',
          border: '1px solid rgba(226,185,106,0.55)',
          boxShadow: '0 8px 20px rgba(26,26,46,0.06)',
        }}
      >
        <textarea value={local.text} onChange={(e) => setLocal({ ...local, text: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical', marginBottom: '12px' }} />

        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>Question Image (Optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = (ev) => setLocal({ ...local, image: ev.target?.result as string })
              reader.readAsDataURL(file)
            }}
            style={{ fontSize: '12px' }}
          />
          {local.image && (
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={local.image} alt="preview" style={{ height: '60px', borderRadius: '10px' }} />
              <button
                type="button"
                onClick={() => setLocal({ ...local, image: undefined })}
                style={{ ...chipStyle('soft'), border: 'none', background: '#fff1f5', color: '#c43c72' }}
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {local.type === 'MCQ' && (
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Options</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#e2b96a', fontWeight: '700', width: '18px' }}>{String.fromCharCode(97 + i)})</span>
                  <input
                    value={local.options[i] || ''}
                    onChange={(e) => {
                      const opts = [...(local.options || ['', '', '', ''])]
                      opts[i] = e.target.value
                      setLocal({ ...local, options: opts })
                    }}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => setEditing(false)} className="pc-button-ghost">
            Cancel
          </button>
          <button type="button" onClick={save} className="pc-button-primary">
            Save
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="pc-card"
      style={{
        padding: '18px',
        marginBottom: '14px',
        borderRadius: '22px',
        borderLeft: '4px solid #e2b96a',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <span
          style={{
            minWidth: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#1a1a2e',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '700',
            flexShrink: 0,
          }}
        >
          {index + 1}
        </span>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', color: '#1a1a2e', lineHeight: '1.6' }}>{q.text ? <MathText content={q.text} /> : <em style={{ color: '#aaa' }}>Empty</em>}</div>

          {q.image && (
            <div style={{ marginTop: '10px', marginBottom: '10px' }}>
              <img src={q.image} alt="question diagram" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '10px', border: '1px solid #eee' }} />
            </div>
          )}

          {q.type === 'MCQ' && q.options?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
              {q.options.map((opt, i) => (
                <span key={i} style={{ fontSize: '13px', color: '#555', display: 'flex', gap: '4px', alignItems: 'baseline' }}>
                  <span style={{ color: '#e2b96a', fontWeight: '700' }}>{String.fromCharCode(97 + i)})</span>
                  <MathText content={opt} />
                </span>
              ))}
            </div>
          )}

          {q.hasOr && q.orText && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #ddd', fontSize: '13px', color: '#666' }}>
              <span style={{ fontWeight: '700', color: '#e2b96a', fontSize: '10px', letterSpacing: '1px', marginRight: '8px' }}>OR</span>
              <MathText content={q.orText} />
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <span style={chipStyle('gold')}>{q.type}</span>
            <span style={chipStyle()}>{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button type="button" onClick={() => setEditing(true)} className="pc-button-ghost" style={{ padding: '8px 12px' }}>
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            style={{
              padding: '8px 12px',
              borderRadius: '14px',
              border: '1px solid rgba(240,98,146,0.18)',
              background: '#fff1f5',
              color: '#c43c72',
              fontWeight: '700',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EditorPanel({ questions, setQuestions, meta, setMeta }: Props) {
  const [activeSection, setActiveSection] = useState<string>('A')
  const [newQ, setNewQ] = useState<Partial<Question>>({ text: '', type: 'MCQ', options: ['', '', '', ''], marks: 1, hasOr: false, orText: '' })
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [listening, setListening] = useState(false)
  const [aiTab, setAiTab] = useState<'text' | 'image'>('text')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageMime, setImageMime] = useState('image/jpeg')
  const [imageLoading, setImageLoading] = useState(false)
  const [imageMode] = useState<'structured' | 'text'>('structured')
  const [, setExtractedText] = useState('')
  const [imageError, setImageError] = useState('')
  const imgInputRef = useRef<HTMLInputElement>(null)
  const [manualQImage, setManualQImage] = useState<string | undefined>(undefined)
  const [provider, setProvider] = useState<'gemini' | 'groq' | 'claude' | 'grok' | 'deepseek'>('gemini')

  const section = SECTIONS.find((s) => s.id === activeSection)!

  const handleManualQuestionPaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const pasted = e.clipboardData.getData('text/plain')
      const parsed = parseMcqFromPastedBlock(pasted)
      if (!parsed) return
      e.preventDefault()
      setNewQ((q) => ({
        ...q,
        text: parsed.stem,
        type: 'MCQ',
        options: [...parsed.options],
        marks: q.marks ?? section.defaultMarks,
        hasOr: q.hasOr ?? false,
        orText: q.orText ?? '',
      }))
    },
    [section.defaultMarks]
  )

  const addQuestion = () => {
    if (!newQ.text?.trim()) return
    const q: Question = {
      id: generateId(),
      text: newQ.text || '',
      type: newQ.type || 'MCQ',
      options: newQ.options || [],
      marks: newQ.marks || section.defaultMarks,
      hasOr: newQ.hasOr || false,
      orText: newQ.orText || '',
      image: manualQImage,
    }
    setQuestions((prev) => ({ ...prev, [activeSection]: [...prev[activeSection], q] }))
    setNewQ({ text: '', type: newQ.type, options: ['', '', '', ''], marks: section.defaultMarks, hasOr: false, orText: '' })
    setManualQImage(undefined)
  }

  const deleteQ = (id: string) => setQuestions((prev) => ({ ...prev, [activeSection]: prev[activeSection].filter((q) => q.id !== id) }))

  const editQ = (id: string, updated: Question) =>
    setQuestions((prev) => ({ ...prev, [activeSection]: prev[activeSection].map((q) => (q.id === id ? { ...q, ...updated } : q)) }))

  const generateWithAI = async () => {
    if (!aiText.trim()) return
    setAiLoading(true)
    setAiError('')
    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: aiText,
          sectionId: section.id,
          sectionLabel: section.label,
          sectionDescription: section.description,
          defaultMarks: section.defaultMarks,
          defaultType: section.defaultType,
          subject: meta.subject || 'General',
          provider,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || `Server error: ${res.status}`)

      if (data.questions && Array.isArray(data.questions)) {
        if (data.questions.length === 0) throw new Error('AI returned 0 questions. Try shorter text, click Clean, or switch provider.')
        const withIds = data.questions.map((q: any) => ({ ...q, id: generateId() }))
        setQuestions((prev) => ({ ...prev, [activeSection]: [...prev[activeSection], ...withIds] }))
        setAiText('')
        const extra = data.usedFallback && data.notice ? '\n' + data.notice : ''
        setAiError('Added ' + withIds.length + ' questions.' + extra)
        setTimeout(() => setAiError(''), data.usedFallback ? 6000 : 3000)
      } else {
        throw new Error('Invalid AI response from server.')
      }
    } catch (e: any) {
      setAiError(e.message || 'Generation failed. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const cleanText = (text: string): string => {
    let t = text
    t = t.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    t = t
      .split('\n')
      .map((line) => {
        line = line.replace(/^#{1,6}\s+/, '')
        line = line.replace(/^\d+\.\s+/, '')
        line = line.replace(/^[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25CF\u25CB\u2713\u2714\u2717\u2718\u25B8\u25B6\u27A2\u2605\u2606\u00B7>\-\*]\s+/, '')
        line = line.replace(/\*\*([^*]+)\*\*/g, '$1')
        line = line.replace(/\*([^*]+)\*/g, '$1')
        line = line.replace(/__([^_]+)__/g, '$1')
        line = line.replace(/(?<![\\{a-zA-Z])_([^_\n]+)_(?![a-zA-Z}])/g, '$1')
        line = line.replace(/`{1,3}([^`]*)`{1,3}/g, '$1')
        line = line.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        if (/^[-*_]{3,}\s*$/.test(line)) line = ''
        return line.trimEnd()
      })
      .join('\n')

    t = t
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\u2014/g, '-')
      .replace(/\u2013/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/g, '')
      .replace(/\u00A0/g, ' ')

    t = t.replace(/\s*\b([a-dA-D])\)\s+/g, '\n$1) ')
    t = t.replace(/(\$|\})\s*([a-dA-D])\)/g, '$1\n$2) ')
    t = t.replace(/^\n+/, '')
    t = t.replace(/\n{3,}/g, '\n\n')
    return t.trim()
  }

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.lang = 'hi-IN'
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript
      setAiLoading(true)
      try {
        const res = await fetch('/api/format-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, sectionLabel: section.label, defaultMarks: section.defaultMarks, subject: meta.subject }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        const q: Question = { ...data.question, id: generateId() }
        setQuestions((prev) => ({ ...prev, [activeSection]: [...prev[activeSection], q] }))
      } catch (e: any) {
        setAiError('Voice processing failed: ' + e.message)
      } finally {
        setAiLoading(false)
      }
    }
    recognition.start()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageMime(file.type || 'image/jpeg')
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleManualImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setManualQImage(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const extractFromImage = async () => {
    if (!imagePreview) return
    setImageLoading(true)
    setImageError('')
    try {
      const base64 = imagePreview.split(',')[1]
      const res = await fetch('/api/extract-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: imageMime, mode: imageMode }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (imageMode === 'text') {
        setExtractedText(data.text)
      } else {
        const withIds = data.questions.map((q: any) => ({ ...q, id: generateId() }))
        setQuestions((prev) => ({ ...prev, [activeSection]: [...prev[activeSection], ...withIds] }))
        setImagePreview(null)
        setAiError('Questions extracted successfully.')
        setTimeout(() => setAiError(''), 3000)
      }
    } catch (e: any) {
      setImageError(e.message || 'Image extraction failed.')
    } finally {
      setImageLoading(false)
    }
  }

  return (
    <div className="pc-section-shell" style={{ maxWidth: '1180px', margin: '0 auto' }}>
      <div className="pc-glass-card pc-sidebar">
        <div className="pc-card-inner">
          <div className="pc-kicker">Exam Workspace</div>
          <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: "'Montserrat', sans-serif", color: '#1a1a2e', marginBottom: '6px' }}>Question Editor</div>
          <div style={{ color: '#47464c', marginBottom: '18px' }}>Draft questions, add AI suggestions, and organize each section.</div>
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '18px',
                border: '1px solid transparent',
                background: activeSection === sec.id ? 'rgba(255,212,131,0.45)' : 'transparent',
                color: activeSection === sec.id ? '#5d4200' : '#47464c',
                textAlign: 'left',
                marginBottom: '8px',
              }}
            >
              <div style={{ fontWeight: '700', fontSize: '15px', fontFamily: "'Montserrat', sans-serif" }}>{meta.customSectionNames?.[sec.id] || sec.label}</div>
              <div style={{ fontSize: '11px', opacity: 0.78, marginTop: '4px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {questions[sec.id]?.length || 0} questions · {sec.defaultMarks} marks
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="pc-glass-card" style={{ marginBottom: '18px' }}>
          <div className="pc-card-inner" style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <label style={labelStyle}>Section Custom Name</label>
            <input
              value={meta.customSectionNames?.[activeSection] || ''}
              onChange={(e) => setMeta((m) => ({ ...m, customSectionNames: { ...(m.customSectionNames || {}), [activeSection]: e.target.value } }))}
              style={{ ...inputStyle, width: '300px' }}
              placeholder={`e.g. ${section.label} or PHYSICS`}
            />
          </div>
        </div>

        <div className="pc-glass-card" style={{ background: 'linear-gradient(135deg, rgba(26,26,46,0.96), rgba(35,35,62,0.92))', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '18px' }}>
          <div className="pc-card-inner">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                <div style={{ color: '#fff', fontWeight: '800', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.16em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  AI Question Generator
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ color: '#8899aa', fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Engine</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as any)}
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '12px', fontSize: '11px', padding: '8px 10px' }}
                  >
                    <option value="gemini" style={{ background: '#1a1a2e' }}>Gemini</option>
                    <option value="groq" style={{ background: '#1a1a2e' }}>Groq (Fast)</option>
                    <option value="claude" style={{ background: '#1a1a2e' }}>Claude</option>
                    <option value="grok" style={{ background: '#1a1a2e' }}>Grok (xAI)</option>
                    <option value="deepseek" style={{ background: '#1a1a2e' }}>DeepSeek</option>
                  </select>
                </div>
              </div>

              <button type="button" onClick={startVoice} disabled={listening} className="pc-button-ghost" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.22)' }}>
                {listening ? 'Listening...' : 'Voice Input'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {(['text', 'image'] as const).map((tab) => (
                <button key={tab} type="button" onClick={() => setAiTab(tab)} style={subtleButtonStyle(aiTab === tab)}>
                  {tab === 'text' ? 'Paste Text' : 'Upload Image'}
                </button>
              ))}
            </div>

            {aiTab === 'text' && (
              <>
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    rows={4}
                    style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '18px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    placeholder="Paste raw text here..."
                  />
                  {aiText.trim() && (
                    <button
                      type="button"
                      onClick={() => setAiText(cleanText(aiText))}
                      title="Remove markdown, fancy quotes, bullet symbols and other AI formatting artifacts"
                      style={{ position: 'absolute', top: '12px', right: '12px', padding: '6px 10px', fontSize: '11px', fontWeight: '700', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '12px' }}
                    >
                      Clean
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button type="button" onClick={generateWithAI} disabled={aiLoading || !aiText.trim()} className="pc-button-secondary" style={{ background: aiLoading || !aiText.trim() ? '#888' : 'linear-gradient(135deg, #e2b96a, #c9953a)' }}>
                    {aiLoading ? 'Generating...' : 'Generate Questions'}
                  </button>
                </div>
                {aiError && <div style={{ color: aiError.toLowerCase().includes('added') || aiError.toLowerCase().includes('successfully') ? '#4ade80' : '#ff8a80', fontSize: '12px', marginTop: '8px', fontWeight: '600' }}>{aiError}</div>}
              </>
            )}

            {aiTab === 'image' && (
              <div style={{ textAlign: 'center', border: '2px dashed rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', borderRadius: '18px', padding: '30px', cursor: 'pointer' }} onClick={() => imgInputRef.current?.click()}>
                {imagePreview ? <img src={imagePreview} alt="uploaded preview" style={{ maxHeight: '160px', maxWidth: '100%' }} /> : <div style={{ color: '#8899aa', fontWeight: '600' }}>Click to upload image</div>}
                <input ref={imgInputRef} type="file" hidden onChange={handleImageUpload} />
                {imagePreview && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      extractFromImage()
                    }}
                    disabled={imageLoading}
                    className="pc-button-secondary"
                    style={{ marginTop: '16px' }}
                  >
                    {imageLoading ? 'Processing...' : 'Extract Questions'}
                  </button>
                )}
                {imageError && <div style={{ color: '#ff8a80', fontSize: '12px', marginTop: '8px' }}>{imageError}</div>}
              </div>
            )}
          </div>
        </div>

        <div className="pc-glass-card" style={{ marginBottom: '18px' }}>
          <div className="pc-card-inner">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ color: '#111', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.16em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Add to {meta.customSectionNames?.[activeSection] || section.label}
              </div>
              <select value={newQ.type} onChange={(e) => setNewQ((q) => ({ ...q, type: e.target.value as any }))} style={{ ...inputStyle, width: 'auto', padding: '10px 14px' }}>
                {QUESTION_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <textarea
              value={newQ.text}
              onChange={(e) => setNewQ((q) => ({ ...q, text: e.target.value }))}
              onPaste={handleManualQuestionPaste}
              rows={5}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Type a question, or paste an MCQ block and the options will fill automatically."
            />

            <div style={{ marginTop: '14px', marginBottom: '14px' }}>
              <label style={labelStyle}>Question Image (Optional)</label>
              <input type="file" accept="image/*" onChange={handleManualImageUpload} style={{ fontSize: '12px' }} />
              {manualQImage && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={manualQImage} alt="preview" style={{ height: '54px', borderRadius: '10px' }} />
                  <button type="button" onClick={() => setManualQImage(undefined)} style={{ ...chipStyle(), border: 'none', background: '#fff1f5', color: '#c43c72' }}>
                    Remove
                  </button>
                </div>
              )}
            </div>

            {newQ.type === 'MCQ' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#e2b96a', fontWeight: '700' }}>{String.fromCharCode(97 + i)})</span>
                    <input
                      value={newQ.options?.[i] || ''}
                      onChange={(e) => {
                        const opts = [...(newQ.options || ['', '', '', ''])]
                        opts[i] = e.target.value
                        setNewQ((q) => ({ ...q, options: opts }))
                      }}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '18px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Marks</label>
                <input type="number" value={newQ.marks || section.defaultMarks} onChange={(e) => setNewQ((q) => ({ ...q, marks: parseInt(e.target.value) }))} style={{ ...inputStyle, width: '86px', padding: '10px 12px' }} />
              </div>
              <button type="button" onClick={addQuestion} className="pc-button-primary">
                Add Question
              </button>
            </div>
          </div>
        </div>

        <div className="pc-glass-card">
          <div className="pc-card-inner">
            {!questions[activeSection]?.length ? (
              <div className="pc-empty">No questions yet.</div>
            ) : (
              questions[activeSection].map((q, i) => <QuestionCard key={q.id} q={q} index={i} onEdit={(updated) => editQ(q.id, updated)} onDelete={() => deleteQ(q.id)} />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
