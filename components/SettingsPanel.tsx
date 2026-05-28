'use client'

import { useRef, useState, useEffect } from 'react'
import { PaperMeta } from '@/lib/types'

interface Props {
  meta: PaperMeta
  onChange: (meta: PaperMeta) => void
  onNext: () => void
}

export default function SettingsPanel({ meta, onChange, onNext }: Props) {
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

    triggerToast('✦ Removing logo background and converting to transparent PNG...')

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
      triggerToast('✓ Logo background successfully removed!')
    }
    img.onerror = () => {
      triggerToast('✕ Failed to process logo background removal.')
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

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }} className="space-y-6 animate-fadeup delay-1">

      {/* ── Card 1: Header logo upload ─────────────────────────── */}
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
                ✕
              </button>
            </div>
          ) : (
            <>
              <span className="material-symbols-outlined pc-cyber-upload-icon">cloud_upload</span>
              <p>Click or drag to upload school logo</p>
              <span>PNG / JPG (Recommended: 200×200px)</span>
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

      {/* ── Card 2: Exam details ───────────────────────────────── */}
      <div className="pc-cyber-card">
        {/* Accent Title */}
        <div className="pc-cyber-title-wrapper">
          <div className="pc-cyber-title-bar" />
          <h2 className="pc-cyber-title">Exam Details</h2>
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
              placeholder="e.g. Mid-Term 2024"
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
              placeholder="80"
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
              placeholder="3 Hours"
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

      {/* ── Continue Button ────────────────────────────────────── */}
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