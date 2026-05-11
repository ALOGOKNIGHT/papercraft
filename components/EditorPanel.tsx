'use client'

import { useState, useCallback, useRef } from 'react'
import { PaperMeta, Question, QuestionsMap, SectionConfig } from '@/lib/types'
import { SECTIONS, QUESTION_TYPES, generateId } from '@/lib/constants'
import MathText from './MathText'

interface Props {
  questions: QuestionsMap
  setQuestions: React.Dispatch<React.SetStateAction<QuestionsMap>>
  meta: PaperMeta
  setMeta: React.Dispatch<React.SetStateAction<PaperMeta>>
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '1px solid #e0d9c8', borderRadius: '5px',
  fontSize: '13px', fontFamily: 'inherit',
  background: '#fffdf7', color: '#1a1a2e', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '10px', fontWeight: '700', letterSpacing: '1.8px',
  color: '#999', textTransform: 'uppercase', marginBottom: '5px', display: 'block',
}

function QuestionCard({
  q, index, onEdit, onDelete,
}: { q: Question; index: number; onEdit: (updated: Question) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(q)

  const save = () => { onEdit(local); setEditing(false) }

  if (editing) {
    return (
      <div style={{ background: '#fffdf7', border: '1.5px solid #e2b96a', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
        <textarea
          value={local.text}
          onChange={e => setLocal({ ...local, text: e.target.value })}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', marginBottom: '10px' }}
        />

        {/* Edit Image Logic */}
        <div style={{ marginBottom: '10px' }}>
          <label style={labelStyle}>Question Image (Optional)</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => setLocal({ ...local, image: ev.target?.result as string });
                reader.readAsDataURL(file);
              }
            }}
            style={{ fontSize: '12px' }}
          />
          {local.image && (
            <div style={{ marginTop: '5px' }}>
              <img src={local.image} alt="preview" style={{ height: '60px', borderRadius: '4px' }} />
              <button onClick={() => setLocal({ ...local, image: undefined })} style={{ marginLeft: '10px', color: 'red', fontSize: '11px' }}>Remove</button>
            </div>
          )}
        </div>
  
        {local.type === 'MCQ' && (
          <div style={{ marginBottom: '10px' }}>
            <label style={labelStyle}>Options</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#e2b96a', fontWeight: '700', width: '18px' }}>{String.fromCharCode(97 + i)})</span>
                  <input
                    value={local.options[i] || ''}
                    onChange={e => {
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
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={() => setEditing(false)} style={{ padding: '7px 18px', borderRadius: '5px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} style={{ padding: '7px 18px', borderRadius: '5px', border: 'none', background: 'linear-gradient(135deg,#1a1a2e,#16213e)', color: '#e2b96a', cursor: 'pointer', fontWeight: '700' }}>Save</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid #f0eee9', borderLeft: '3px solid #111',
      borderRadius: '8px', padding: '16px', marginBottom: '12px',
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
    }}>
      <span style={{
        minWidth: '28px', height: '28px', borderRadius: '50%',
        background: '#111',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: '700', flexShrink: 0,
      }}>{index + 1}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', color: '#1a1a2e', lineHeight: '1.6' }}>
            {q.text ? <MathText content={q.text} /> : <em style={{ color: '#aaa' }}>Empty</em>}
        </div>

        {/* Display Image if it exists */}
        {q.image && (
          <div style={{ marginTop: '10px', marginBottom: '10px' }}>
            <img src={q.image} alt="question diagram" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '4px', border: '1px solid #eee' }} />
          </div>
        )}
        
        {q.type === 'MCQ' && q.options?.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', marginTop: '8px' }}>
            {q.options.map((opt, i) => (
              <span key={i} style={{ fontSize: '13px', color: '#555', display: 'flex', gap: '4px', alignItems: 'baseline' }}>
                <span style={{ color: '#e2b96a', fontWeight: '700' }}>{String.fromCharCode(97 + i)})</span> 
                <MathText content={opt} />
              </span>
            ))}
          </div>
        )}

        {q.hasOr && q.orText && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #ddd', fontSize: '13px', color: '#666' }}>
            <span style={{ fontWeight: '700', color: '#e2b96a', fontSize: '10px', letterSpacing: '1px', marginRight: '8px' }}>OR</span>
            <MathText content={q.orText} />
          </div>
        )}
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          <span style={{ fontSize: '11px', background: '#f5f0e8', color: '#888', padding: '2px 8px', borderRadius: '10px' }}>{q.type}</span>
          <span style={{ fontSize: '11px', background: '#f5f0e8', color: '#888', padding: '2px 8px', borderRadius: '10px' }}>{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        <button onClick={() => setEditing(true)} style={{ width: '30px', height: '30px', borderRadius: '4px', border: '1px solid #e8e3d5', background: '#fff', cursor: 'pointer', fontSize: '14px' }}>✏️</button>
        <button onClick={onDelete} style={{ width: '30px', height: '30px', borderRadius: '4px', border: '1px solid #fde8e8', background: '#fff5f5', cursor: 'pointer', fontSize: '14px' }}>🗑️</button>
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
  const [imageMode, setImageMode] = useState<'structured' | 'text'>('structured')
  const [extractedText, setExtractedText] = useState('')
  const [imageError, setImageError] = useState('')
  const imgInputRef = useRef<HTMLInputElement>(null)

  // Question Image State
  const [manualQImage, setManualQImage] = useState<string | undefined>(undefined)

  // New state for multi-provider selection
  const [provider, setProvider] = useState<'gemini' | 'groq' | 'claude' | 'grok' | 'deepseek'>('gemini')

  const section = SECTIONS.find(s => s.id === activeSection)!

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
      image: manualQImage, // Add image to the new question
    }
    setQuestions(prev => ({ ...prev, [activeSection]: [...prev[activeSection], q] }))
    setNewQ({ text: '', type: newQ.type, options: ['', '', '', ''], marks: section.defaultMarks, hasOr: false, orText: '' })
    setManualQImage(undefined) // Reset image preview
  }

  const deleteQ = (id: string) =>
    setQuestions(prev => ({ ...prev, [activeSection]: prev[activeSection].filter(q => q.id !== id) }))

  const editQ = (id: string, updated: Question) =>
    setQuestions(prev => ({ ...prev, [activeSection]: prev[activeSection].map(q => q.id === id ? { ...q, ...updated } : q) }))

  const generateWithAI = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiError('');
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
          subject: meta.subject,
          provider, // Sending selected provider to backend
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `Server error: ${res.status}`);

      if (data.questions && Array.isArray(data.questions)) {
        const withIds = data.questions.map((q: any) => ({ ...q, id: generateId() }));
        setQuestions(prev => ({ ...prev, [activeSection]: [...prev[activeSection], ...withIds] }));
        setAiText('');
        setAiError('✅ Added ' + withIds.length + ' questions!');
        setTimeout(() => setAiError(''), 3000);
      }
    } catch (e: any) {
      setAiError(e.message || 'Generation failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // Cleans AI-generated text: removes markdown, fancy quotes, special symbols — no API needed
  const cleanText = (text: string): string => {
    let t = text;

    // ── Step 1: Normalize line endings first ──
    t = t.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // ── Step 2: Strip markdown per-line (headings, bold, italic, bullets) ──
    t = t.split('\n').map(line => {
      // Remove heading markers: ## Heading → Heading
      line = line.replace(/^#{1,6}\s+/, '');
      // Remove numbered list prefix: 1. text → text  (but keep standalone numbers)
      line = line.replace(/^\d+\.\s+/, '');
      // Remove bullet/decorative symbols at start of line
      line = line.replace(/^[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25CF\u25CB\u2713\u2714\u2717\u2718\u25B8\u25B6\u27A2\u2605\u2606\u00B7>\-\*]\s+/, '');
      // Remove bold: **text** → text  (non-greedy, no dotAll, handles **1.** correctly)
      line = line.replace(/\*\*([^*]+)\*\*/g, '$1');
      // Remove italic: *text* → text  (must run after bold to avoid partial matches)
      line = line.replace(/\*([^*]+)\*/g, '$1');
      // Remove bold underscore: __text__ → text
      line = line.replace(/__([^_]+)__/g, '$1');
      // Remove italic underscore: _text_ → text  (only when NOT inside LaTeX \cmd)
      // Avoid stripping _ that's part of LaTeX subscript or variable names
      line = line.replace(/(?<![\\{a-zA-Z])_([^_\n]+)_(?![a-zA-Z}])/g, '$1');
      // Remove backtick code: `code` → code
      line = line.replace(/`{1,3}([^`]*)`{1,3}/g, '$1');
      // Remove markdown links: [text](url) → text
      line = line.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      // Remove markdown horizontal rules (--- or *** or ___) that are whole lines
      if (/^[-*_]{3,}\s*$/.test(line)) line = '';
      return line.trimEnd();
    }).join('\n');

    // ── Step 3: Global character normalization ──
    t = t
      // Normalize curly/fancy quotes
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      // Normalize dashes
      .replace(/\u2014/g, '-')   // em dash —
      .replace(/\u2013/g, '-')   // en dash –
      // Normalize ellipsis
      .replace(/\u2026/g, '...')
      // Remove zero-width and invisible characters
      .replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/g, '')
      // Replace non-breaking spaces
      .replace(/\u00A0/g, ' ');

    // ── Step 4: MCQ formatting — put inline options on separate lines ──
    // Detects patterns like "...?a) ..." or "...text b) ..." and adds newlines before each option
    t = t.replace(/\s*\b([a-dA-D])\)\s+/g, '\n$1) ');
    // Handle case where option follows immediately after $ (LaTeX end) with no space: "$}$a)"
    t = t.replace(/(\$|\})\s*([a-dA-D])\)/g, '$1\n$2) ');
    // Remove any leading newline the above might have introduced
    t = t.replace(/^\n+/, '');

    // ── Step 5: Clean up whitespace ──
    // Collapse 3+ blank lines into 2
    t = t.replace(/\n{3,}/g, '\n\n');

    return t.trim();
  };

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
        setQuestions(prev => ({ ...prev, [activeSection]: [...prev[activeSection], q] }))
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
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleManualImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setManualQImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

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
        setQuestions(prev => ({ ...prev, [activeSection]: [...prev[activeSection], ...withIds] }))
        setImagePreview(null)
        setAiError('✅ Questions extracted successfully!');
        setTimeout(() => setAiError(''), 3000);
      }
    } catch (e: any) {
      setImageError(e.message || 'Image extraction failed.')
    } finally {
      setImageLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px', maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
      
      {/* Section sidebar */}
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #f0eee9', padding: '16px', height: 'fit-content', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', color: '#111', marginBottom: '16px' }}>SECTIONS</div>
        {SECTIONS.map(sec => (
          <button key={sec.id} onClick={() => setActiveSection(sec.id)} style={{
            width: '100%', padding: '12px 14px', borderRadius: '6px', border: 'none',
            background: activeSection === sec.id ? '#111' : 'transparent',
            color: activeSection === sec.id ? '#fff' : '#555',
            cursor: 'pointer', textAlign: 'left', marginBottom: '4px',
          }}>
            <div style={{ fontWeight: '700', fontSize: '14px' }}>{meta.customSectionNames?.[sec.id] || sec.label}</div>
            <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>{questions[sec.id]?.length || 0} Q · {sec.defaultMarks}mk</div>
          </button>
        ))}
      </div>

      {/* Editor main */}
      <div>
        {/* Section Title Editor */}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #f0eee9', padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <label style={{ fontWeight: '800', color: '#111', fontSize: '13px', textTransform: 'uppercase' }}>SECTION CUSTOM NAME:</label>
          <input
            value={meta.customSectionNames?.[activeSection] || ''}
            onChange={e => setMeta(m => ({ ...m, customSectionNames: { ...(m.customSectionNames || {}), [activeSection]: e.target.value } }))}
            style={{ ...inputStyle, width: '300px' }}
            placeholder={`e.g. ${section.label} or PHYSICS`}
          />
        </div>

        {/* AI Generator Panel */}
        <div style={{ background: '#111', borderRadius: '8px', padding: '24px', marginBottom: '16px', border: '1px solid #000', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ color: '#fff', fontWeight: '800', fontSize: '13px', textTransform: 'uppercase' }}>✨ AI Question Generator</div>
              
              {/* Engine Switch Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ color: '#8899aa', fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Engine:</label>
                <select 
                  value={provider} 
                  onChange={(e) => setProvider(e.target.value as any)}
                  style={{ 
                    background: 'rgba(255,255,255,0.1)', 
                    color: '#fff', 
                    border: '1px solid rgba(255,255,255,0.3)', 
                    borderRadius: '4px',
                    fontSize: '11px',
                    padding: '4px 8px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="gemini" style={{ background: '#1a1a2e' }}>Gemini</option>
                  <option value="groq" style={{ background: '#1a1a2e' }}>Groq (Fast)</option>
                  <option value="claude" style={{ background: '#1a1a2e' }}>Claude</option>
                  <option value="grok" style={{ background: '#1a1a2e' }}>Grok (xAI)</option>
                  <option value="deepseek" style={{ background: '#1a1a2e' }}>DeepSeek</option>
                </select>
              </div>
            </div>

            <button onClick={startVoice} disabled={listening} style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', fontWeight: '600' }}>
              🎙 {listening ? 'Listening...' : 'Speak Question'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {(['text', 'image'] as const).map(t => (
              <button key={t} onClick={() => setAiTab(t)} style={{ padding: '8px 20px', borderRadius: '6px', background: aiTab === t ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', color: aiTab === t ? '#fff' : '#8899aa', cursor: 'pointer', border: '1px solid transparent', fontWeight: '600' }}>
                {t === 'text' ? '📝 Paste Text' : '🖼 Upload Image'}
              </button>
            ))}
          </div>

          {aiTab === 'text' && (
            <>
              <div style={{ position: 'relative' }}>
                <textarea 
                  value={aiText} 
                  onChange={e => setAiText(e.target.value)} 
                  rows={4} 
                  style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', boxSizing: 'border-box', fontFamily: 'inherit' }} 
                  placeholder="Paste raw text here..." 
                />
                {aiText.trim() && (
                  <button
                    type="button"
                    onClick={() => setAiText(cleanText(aiText))}
                    title="Remove markdown, fancy quotes, bullet symbols and other AI formatting artifacts"
                    style={{
                      position: 'absolute', top: '10px', right: '10px',
                      padding: '4px 10px', fontSize: '11px', fontWeight: '700',
                      background: 'rgba(255,255,255,0.15)', color: '#fff',
                      border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px',
                      cursor: 'pointer', letterSpacing: '0.5px',
                    }}
                  >
                    🧹 Clean
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
                <button 
                  onClick={generateWithAI} 
                  disabled={aiLoading || !aiText.trim()} 
                  style={{ 
                    padding: '10px 24px', 
                    background: aiLoading || !aiText.trim() ? '#333' : '#fff', 
                    color: aiLoading || !aiText.trim() ? '#777' : '#111',
                    border: 'none', borderRadius: '6px', fontWeight: '800', cursor: aiLoading ? 'not-allowed' : 'pointer' 
                  }}
                >
                  {aiLoading ? '⏳ Generating...' : '⚡ Generate Questions'}
                </button>
              </div>
              {aiError && <div style={{ color: aiError.includes('✅') ? '#4ade80' : '#ff8a80', fontSize: '12px', marginTop: '8px', fontWeight: '600' }}>{aiError}</div>}
            </>
          )}

          {aiTab === 'image' && (
            <div style={{ textAlign: 'center', border: '2px dashed rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '30px', cursor: 'pointer' }} onClick={() => imgInputRef.current?.click()}>
              {imagePreview ? <img src={imagePreview} style={{ maxHeight: '160px', maxWidth: '100%' }} /> : <div style={{ color: '#8899aa', fontWeight: '600' }}>📷 Click to upload image</div>}
              <input ref={imgInputRef} type="file" hidden onChange={handleImageUpload} />
              {imagePreview && (
                <button 
                  onClick={(e) => { e.stopPropagation(); extractFromImage() }} 
                  disabled={imageLoading}
                  style={{ marginTop: '16px', padding: '10px 20px', background: imageLoading ? '#333' : '#fff', color: imageLoading ? '#777' : '#111', border: 'none', borderRadius: '6px', cursor: imageLoading ? 'not-allowed' : 'pointer', fontWeight: '800' }}
                >
                  {imageLoading ? '⏳ Processing...' : 'Extract Questions'}
                </button>
              )}
              {imageError && <div style={{ color: '#ff8a80', fontSize: '12px', marginTop: '8px' }}>{imageError}</div>}
            </div>
          )}
        </div>

        {/* Manual Add Form */}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #f0eee9', padding: '24px', marginBottom: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
            <div style={{ color: '#111', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase' }}>ADD TO {meta.customSectionNames?.[activeSection] || section.label}</div>
            <select value={newQ.type} onChange={e => setNewQ(q => ({ ...q, type: e.target.value as any }))} style={{ ...inputStyle, width: 'auto', padding: '6px 12px' }}>
              {QUESTION_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <textarea value={newQ.text} onChange={e => setNewQ(q => ({ ...q, text: e.target.value }))} rows={3} style={inputStyle} placeholder="Type question here..." />

          {/* Manual Image Upload for specific question */}
          <div style={{ marginTop: '12px', marginBottom: '12px' }}>
            <label style={labelStyle}>Question Image (Optional)</label>
            <input type="file" accept="image/*" onChange={handleManualImageUpload} style={{ fontSize: '12px' }} />
            {manualQImage && (
              <div style={{ marginTop: '5px' }}>
                <img src={manualQImage} alt="preview" style={{ height: '50px', borderRadius: '4px' }} />
                <button onClick={() => setManualQImage(undefined)} style={{ marginLeft: '10px', color: 'red', fontSize: '11px' }}>Remove</button>
              </div>
            )}
          </div>
          
          {newQ.type === 'MCQ' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#e2b96a', fontWeight: '700' }}>{String.fromCharCode(97 + i)})</span>
                  <input value={newQ.options?.[i] || ''} onChange={e => { const opts = [...(newQ.options || ['', '', '', ''])]; opts[i] = e.target.value; setNewQ(q => ({ ...q, options: opts })) }} style={{ ...inputStyle, flex: 1 }} />
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={labelStyle}>Marks</label>
              <input type="number" value={newQ.marks || section.defaultMarks} onChange={e => setNewQ(q => ({ ...q, marks: parseInt(e.target.value) }))} style={{ ...inputStyle, width: '70px' }} />
            </div>
            <button onClick={addQuestion} style={{ padding: '10px 28px', background: '#111', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>+ Add Question</button>
          </div>
        </div>

        {/* Questions List */}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #f0eee9', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          {!questions[activeSection]?.length
            ? <div style={{ textAlign: 'center', padding: '48px', color: '#ccc' }}>No questions yet.</div>
            : questions[activeSection].map((q, i) => (
              <QuestionCard key={q.id} q={q} index={i} onEdit={updated => editQ(q.id, updated)} onDelete={() => deleteQ(q.id)} />
            ))
          }
        </div>
      </div>
    </div>
  )
}