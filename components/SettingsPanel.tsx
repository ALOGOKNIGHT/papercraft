'use client'

import { useRef, useState, useEffect } from 'react'
import { PaperMeta } from '@/lib/types'
import { SCHOOL_CLASSES, DEFAULT_SCHOOL_INSTRUCTIONS } from '@/lib/constants'

interface Props {
  meta: PaperMeta
  onChange: (meta: PaperMeta) => void
  onNext: () => void
  appMode?: 'school' | 'coaching'
  paperName: string
  onPaperNameChange: (name: string) => void
  paperNameError: string | null
}

export default function SettingsPanel({
  meta,
  onChange,
  onNext,
  appMode = 'coaching',
  paperName,
  onPaperNameChange,
  paperNameError
}: Props) {
  const logoRef = useRef<HTMLInputElement>(null)
  const topicsRef = useRef<HTMLTextAreaElement>(null)
  const instRef = useRef<HTMLTextAreaElement>(null)

  const insertBoldText = (textareaRef: React.RefObject<HTMLTextAreaElement>, key: keyof PaperMeta) => {
    const el = textareaRef.current
    if (!el) return

    const start = el.selectionStart
    const end = el.selectionEnd
    const text = el.value

    const selectedText = text.substring(start, end)
    const before = text.substring(0, start)
    const after = text.substring(end)

    const replacement = `**${selectedText || 'bold text'}**`
    const newValue = before + replacement + after

    onChange({ ...meta, [key]: newValue })

    setTimeout(() => {
      el.focus()
      const newCursorPos = start + 2 + (selectedText ? selectedText.length : 9)
      el.setSelectionRange(newCursorPos, newCursorPos)
    }, 50)
  }

  const [toastMsg, setToastMsg] = useState('')

  const triggerToast = (msg: string) => {
    setToastMsg(msg)
  }

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [toastMsg])

  const removeLogoBackground = () => {
    if (!meta.logo) return

    triggerToast('âœ¦ Removing logo background and converting to transparent PNG...')

    const img = new Image()
    img.src = meta.logo
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(img, 0, 0)
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imgData.data

      // Detect background color from corners (top-left pixel)
      const rRef = data[0]
      const gRef = data[1]
      const bRef = data[2]

      // Turn solid/near-solid background pixels transparent
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i+1]
        const b = data[i+2]

        const distToRef = Math.sqrt((r - rRef) ** 2 + (g - gRef) ** 2 + (b - bRef) ** 2)
        const distToWhite = Math.sqrt((r - 255) ** 2 + (g - 255) ** 2 + (b - 255) ** 2)

        if (distToRef < 50 || distToWhite < 50) {
          data[i+3] = 0 // transparent
        }
      }

      ctx.putImageData(imgData, 0, 0)
      const transparentBase64 = canvas.toDataURL('image/png')
      onChange({ ...meta, logo: transparentBase64 })
      triggerToast('âœ“ Logo background successfully removed!')
    }
    img.onerror = () => {
      triggerToast('âœ• Failed to process logo background removal.')
    }
  }

  const set =
    (key: keyof PaperMeta) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...meta, [key]: e.target.value })

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onChange({ ...meta, logo: ev.target?.result as string })
    reader.readAsDataURL(file)
  }

  // School mode: handle select change for class dropdown
  const handleSelectChange = (key: keyof PaperMeta) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    onChange({ ...meta, [key]: e.target.value })

  const renderPaperNameInput = () => (
    <div className="pc-cyber-card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '2px solid rgba(0, 242, 254, 0.3)', paddingBottom: '12px', transition: 'border-color 0.2s' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#00f2fe', flexShrink: 0 }}>description</span>
        <input
          type="text"
          value={paperName}
          onChange={(e) => onPaperNameChange(e.target.value)}
          placeholder="Enter paper name e.g. Class X Math Pre-Board 2025"
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#fff',
            width: '100%',
            fontFamily: 'inherit',
          }}
        />
        <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#64748b', flexShrink: 0 }}>edit</span>
      </div>
      {paperNameError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '13px', marginTop: '10px', fontWeight: 600 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>warning</span>
          <span>{paperNameError}</span>
        </div>
      )}
    </div>
  )

  // â”€â”€ SCHOOL MODE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (appMode === 'school') {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }} className="space-y-6 animate-fadeup delay-1">
        {renderPaperNameInput()}

        {/* â”€â”€ Card 1: School Identity â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="pc-cyber-card">
          <div className="pc-cyber-title-wrapper">
            <div className="pc-cyber-title-bar" />
            <h2 className="pc-cyber-title">School Identity</h2>
          </div>

          {/* Logo upload */}
          <p className="pc-cyber-kicker" style={{ marginTop: '16px' }}>SCHOOL LOGO / CREST</p>
          <div
            className="pc-cyber-upload"
            onClick={() => logoRef.current?.click()}
          >
            {meta.logo ? (
              <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <img
                  src={meta.logo}
                  alt="logo preview"
                  style={{ maxHeight: 110, maxWidth: '100%', objectFit: 'contain', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px' }}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', zIndex: 10 }}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeLogoBackground() }}
                    style={{
                      background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', color: '#fff', border: 'none',
                      borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                      boxShadow: '0 0 10px rgba(14, 165, 233, 0.3)', transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'none')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>auto_fix_high</span>
                    <span>Remove Background</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onChange({ ...meta, logo: null }) }}
                  style={{
                    position: 'absolute', top: -10, right: -10, background: 'rgba(239, 68, 68, 0.9)',
                    color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                    cursor: 'pointer', zIndex: 20
                  }}
                >âœ•</button>
              </div>
            ) : (
              <>
                <span className="material-symbols-outlined pc-cyber-upload-icon">cloud_upload</span>
                <p>Click or drag to upload school logo / crest</p>
                <span>PNG / JPG (Recommended: 200Ã—200px)</span>
              </>
            )}
          </div>
          <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} style={{ display: 'none' }} />

          {/* School Name */}
          <div className="pc-cyber-field" style={{ marginTop: '20px' }}>
            <label className="pc-cyber-label">School Name</label>
            <input
              className="pc-cyber-input"
              type="text"
              placeholder='e.g. Delhi Public School'
              value={meta.schoolName}
              onChange={set('schoolName')}
            />
            <span className="material-symbols-outlined pc-cyber-input-icon">school</span>
          </div>

          {/* School Branch */}
          <div className="pc-cyber-field" style={{ marginTop: '16px' }}>
            <label className="pc-cyber-label">School Location / Branch</label>
            <input
              className="pc-cyber-input"
              type="text"
              placeholder='e.g. Sail Township, Ranchi'
              value={meta.schoolBranch || ''}
              onChange={(e) => onChange({ ...meta, schoolBranch: e.target.value })}
            />
            <span className="material-symbols-outlined pc-cyber-input-icon">location_on</span>
          </div>
        </div>

        {/* â”€â”€ Card 2: Examination Details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="pc-cyber-card">
          <div className="pc-cyber-title-wrapper">
            <div className="pc-cyber-title-bar" />
            <h2 className="pc-cyber-title">Examination Details</h2>
          </div>

          {/* Examination Name */}
          <div className="pc-cyber-field" style={{ marginTop: '16px' }}>
            <label className="pc-cyber-label">Examination Name</label>
            <input
              className="pc-cyber-input"
              type="text"
              placeholder='e.g. Pre Board - I Examination (2024-2025)'
              value={meta.examTitle}
              onChange={set('examTitle')}
            />
            <span className="material-symbols-outlined pc-cyber-input-icon">assignment</span>
          </div>

          {/* 2x2 grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6" style={{ marginTop: '16px' }}>
            {/* Class */}
            <div className="pc-cyber-field">
              <label className="pc-cyber-label">Class</label>
              <select
                className="pc-cyber-input"
                value={meta.className}
                onChange={handleSelectChange('className')}
                style={{ appearance: 'none', cursor: 'pointer' }}
              >
                <option value="">Select Class</option>
                {SCHOOL_CLASSES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="material-symbols-outlined pc-cyber-input-icon">group</span>
            </div>

            {/* Subject */}
            <div className="pc-cyber-field">
              <label className="pc-cyber-label">Subject</label>
              <input
                className="pc-cyber-input"
                type="text"
                placeholder='e.g. Mathematics (Standard)'
                value={meta.subject}
                onChange={set('subject')}
              />
              <span className="material-symbols-outlined pc-cyber-input-icon">menu_book</span>
            </div>

            {/* Time */}
            <div className="pc-cyber-field">
              <label className="pc-cyber-label">Time</label>
              <input
                className="pc-cyber-input"
                type="text"
                placeholder='e.g. 3 Hrs.'
                value={meta.time}
                onChange={set('time')}
              />
              <span className="material-symbols-outlined pc-cyber-input-icon">schedule</span>
            </div>

            {/* Full Marks */}
            <div className="pc-cyber-field">
              <label className="pc-cyber-label">Full Marks (FM)</label>
              <input
                className="pc-cyber-input"
                type="number"
                placeholder='e.g. 80'
                value={meta.maxMarks}
                onChange={set('maxMarks')}
              />
              <span className="material-symbols-outlined pc-cyber-input-icon">star</span>
            </div>
          </div>
        </div>

        {/* â”€â”€ Card 3: General Instructions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="pc-cyber-card">
          <div className="pc-cyber-title-wrapper">
            <div className="pc-cyber-title-bar" />
            <h2 className="pc-cyber-title">General Instructions</h2>
          </div>

          <div className="pc-cyber-field" style={{ marginTop: '16px' }}>
            <label className="pc-cyber-label">Instructions (one per line)</label>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <div style={{ display: 'flex', gap: '8px', background: '#090d16', border: '1px solid rgba(56, 189, 248, 0.12)', borderBottom: 'none', padding: '6px 12px', borderRadius: '8px 8px 0 0', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => insertBoldText(instRef, 'instructions')}
                  style={{
                    background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer',
                    fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '4px 8px', borderRadius: '4px', transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                  title="Bold Text"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#00f2fe' }}>format_bold</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>Bold</span>
                </button>
                {/* Load default school instructions */}
                <button
                  type="button"
                  onClick={() => onChange({ ...meta, instructions: DEFAULT_SCHOOL_INSTRUCTIONS })}
                  style={{
                    background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer',
                    fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '4px 8px', borderRadius: '4px', transition: 'all 0.2s', marginLeft: 'auto',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)'; e.currentTarget.style.color = '#00f2fe' }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
                  title="Load default CBSE-style instructions"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>restart_alt</span>
                  <span>Load Defaults</span>
                </button>
              </div>
              <textarea
                ref={instRef}
                className="pc-cyber-textarea"
                style={{ borderRadius: '0 0 8px 8px', borderTop: 'none' }}
                placeholder="Write instructions... one per line. These appear on the paper header."
                rows={10}
                value={meta.instructions}
                onChange={set('instructions')}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Tip: Highlight text and click <b>Bold</b> above.
              </span>
              <div className="pc-markdown-badge" style={{ margin: 0 }}>MARKDOWN SUPPORTED</div>
            </div>
          </div>
        </div>

        {/* â”€â”€ Continue Button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <button type="button" onClick={onNext} className="pc-cyber-btn-outline">
          <div className="pc-cyber-btn-outline-inner">
            <span style={{ textAlign: 'center' }}>
              CONTINUE TO QUESTION<br />EDITOR
            </span>
            <span className="material-symbols-outlined pc-cyber-btn-arrow">east</span>
          </div>
        </button>

        {/* Toast */}
        {toastMsg && (
          <div className="pc-toast active animate-fadeup" style={{
            position: 'fixed', bottom: '24px', right: '24px', background: 'rgba(7, 12, 21, 0.95)',
            border: '1px solid #00f2fe', boxShadow: '0 0 15px rgba(0, 242, 254, 0.3)',
            borderRadius: '10px', padding: '12px 24px', color: '#fff', fontSize: '13px', fontWeight: 600, zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <span className="material-symbols-outlined" style={{ color: '#00f2fe', fontSize: '18px' }}>info</span>
            <span>{toastMsg}</span>
          </div>
        )}
      </div>
    )
  }

  // â”€â”€ COACHING MODE (original, unchanged) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }} className="space-y-6 animate-fadeup delay-1">
      {renderPaperNameInput()}

      {/* â”€â”€ Card 1: Header logo upload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="pc-cyber-card">
        <p className="pc-cyber-kicker">HEADER SMALL LOGO &amp; SAMPLE</p>

        <div
          className="pc-cyber-upload"
          onClick={() => logoRef.current?.click()}
        >
          {meta.logo ? (
            <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <img
                src={meta.logo}
                alt="logo preview"
                style={{ maxHeight: 110, maxWidth: '100%', objectFit: 'contain', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px' }}
              />
              
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', zIndex: 10 }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeLogoBackground()
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 0 10px rgba(14, 165, 233, 0.3)',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'none')}
                  title="Remove white/solid background using canvas extraction"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>auto_fix_high</span>
                  <span>Remove Background</span>
                </button>
              </div>

              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange({ ...meta, logo: null });
                }}
                style={{
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  background: 'rgba(239, 68, 68, 0.9)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  cursor: 'pointer',
                  zIndex: 20
                }}
              >
                âœ•
              </button>
            </div>
          ) : (
            <>
              <span className="material-symbols-outlined pc-cyber-upload-icon">cloud_upload</span>
              <p>Click or drag to upload school logo</p>
              <span>PNG / JPG (Recommended: 200Ã—200px)</span>
            </>
          )}
        </div>
        <input
          ref={logoRef}
          type="file"
          accept="image/*"
          onChange={handleLogo}
          style={{ display: 'none' }}
        />
      </div>

      {/* â”€â”€ Card 2: Exam details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="pc-cyber-card">
        {/* Accent Title */}
        <div className="pc-cyber-title-wrapper">
          <div className="pc-cyber-title-bar" />
          <h2 className="pc-cyber-title">Coaching Exam Details</h2>
        </div>

        {/* 2x2 Form grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mb-6">
          <div className="pc-cyber-field">
            <label className="pc-cyber-label">Date</label>
            <input
              className="pc-cyber-input"
              type="text"
              placeholder="e.g. 23/10/2025"
              value={meta.examDate || ''}
              onChange={set('examDate')}
            />
            <span className="material-symbols-outlined pc-cyber-input-icon">event</span>
          </div>

          <div className="pc-cyber-field">
            <label className="pc-cyber-label">Test Series</label>
            <input
              className="pc-cyber-input"
              type="text"
              placeholder="e.g. Part Test-1 or JEE Crash Course"
              value={meta.testSeries || ''}
              onChange={set('testSeries')}
            />
            <span className="material-symbols-outlined pc-cyber-input-icon">library_books</span>
          </div>

          <div className="pc-cyber-field">
            <label className="pc-cyber-label">Maximum Marks</label>
            <input
              className="pc-cyber-input"
              type="text"
              placeholder="e.g. 300 or 720"
              value={meta.maxMarks}
              onChange={set('maxMarks')}
            />
            <span className="material-symbols-outlined pc-cyber-input-icon">star</span>
          </div>

          <div className="pc-cyber-field">
            <label className="pc-cyber-label">Time Allowed</label>
            <input
              className="pc-cyber-input"
              type="text"
              placeholder="e.g. 180 Min. or 3 Hours"
              value={meta.time}
              onChange={set('time')}
            />
            <span className="material-symbols-outlined pc-cyber-input-icon">schedule</span>
          </div>
        </div>

        {/* Topics Covered */}
        <div className="pc-cyber-field mb-6">
          <label className="pc-cyber-label">Topics Covered</label>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {/* Formatting Toolbar */}
            <div style={{ display: 'flex', gap: '8px', background: '#090d16', border: '1px solid rgba(56, 189, 248, 0.12)', borderBottom: 'none', padding: '6px 12px', borderRadius: '8px 8px 0 0', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => insertBoldText(topicsRef, 'topicsCovered')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                title="Bold Text"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#00f2fe' }}>format_bold</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>Bold</span>
              </button>
            </div>
            <textarea
              ref={topicsRef}
              className="pc-cyber-textarea"
              style={{ borderRadius: '0 0 8px 8px', borderTop: 'none' }}
              placeholder="Write one topic per line... Highlight text and click 'Bold' above."
              rows={3}
              value={meta.topicsCovered || ''}
              onChange={set('topicsCovered')}
            />
          </div>
          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', display: 'block' }}>
            Tip: Highlight text and click <b>Bold</b> above.
          </span>
        </div>

        {/* Instructions */}
        <div className="pc-cyber-field">
          <label className="pc-cyber-label">Instructions (one per line)</label>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {/* Formatting Toolbar */}
            <div style={{ display: 'flex', gap: '8px', background: '#090d16', border: '1px solid rgba(56, 189, 248, 0.12)', borderBottom: 'none', padding: '6px 12px', borderRadius: '8px 8px 0 0', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => insertBoldText(instRef, 'instructions')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                title="Bold Text"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#00f2fe' }}>format_bold</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>Bold</span>
              </button>
            </div>
            <textarea
              ref={instRef}
              className="pc-cyber-textarea"
              style={{ borderRadius: '0 0 8px 8px', borderTop: 'none' }}
              placeholder="Write instructions... Highlight text and click 'Bold' above."
              rows={10}
              value={meta.instructions}
              onChange={set('instructions')}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Tip: Highlight text and click <b>Bold</b> above.
            </span>
            <div className="pc-markdown-badge" style={{ margin: 0 }}>MARKDOWN SUPPORTED</div>
          </div>
        </div>
      </div>

      {/* â”€â”€ Continue Button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <button type="button" onClick={onNext} className="pc-cyber-btn-outline">
        <div className="pc-cyber-btn-outline-inner">
          <span style={{ textAlign: 'center' }}>
            CONTINUE TO QUESTION<br />EDITOR
          </span>
          <span className="material-symbols-outlined pc-cyber-btn-arrow">east</span>
        </div>
      </button>

      {/* Toast Notification */}
      {toastMsg && (
        <div 
          className="pc-toast active animate-fadeup" 
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'rgba(7, 12, 21, 0.95)',
            border: '1px solid #00f2fe',
            boxShadow: '0 0 15px rgba(0, 242, 254, 0.3)',
            borderRadius: '10px',
            padding: '12px 24px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span className="material-symbols-outlined" style={{ color: '#00f2fe', fontSize: '18px' }}>info</span>
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  )
}
