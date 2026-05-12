'use client'

import { useRef } from 'react'
import { PaperMeta } from '@/lib/types'

interface Props {
  meta: PaperMeta
  onChange: (meta: PaperMeta) => void
  onNext: () => void
}

export default function SettingsPanel({ meta, onChange, onNext }: Props) {
  const logoRef = useRef<HTMLInputElement>(null)

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
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      <section className="pc-glass-card" style={{ marginBottom: '24px' }}>
        <div className="pc-card-inner" style={{ textAlign: 'center' }}>
          <div className="pc-kicker">Header Small Logo &amp; Sample</div>
          <button
            type="button"
            onClick={() => logoRef.current?.click()}
            className="pc-button-ghost"
            style={{
              width: '100%',
              minHeight: '180px',
              borderRadius: '22px',
              background: 'rgba(248, 243, 233, 0.72)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {meta.logo ? (
              <img src={meta.logo} alt="logo preview" style={{ maxHeight: '112px', maxWidth: '100%', objectFit: 'contain' }} />
            ) : (
              <>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: 'rgba(26, 26, 46, 0.08)',
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 700,
                    color: '#1a1a2e',
                  }}
                >
                  UP
                </div>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '18px', fontWeight: 600, color: '#1a1a2e' }}>
                  Click to upload header image
                </div>
                <div style={{ color: '#47464c', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '12px' }}>PNG / JPG</div>
              </>
            )}
          </button>
          <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} style={{ display: 'none' }} />
        </div>
      </section>

      <section className="pc-glass-card">
        <div className="pc-card-inner">
          <div className="pc-kicker">Exam Details</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div>
              <div className="pc-title" style={{ fontSize: '28px' }}>Paper Setup</div>
              <div className="pc-subtitle">Build the header details, topic coverage, and instructions before moving into question drafting.</div>
            </div>
            <div className="pc-chip">Setup Workspace</div>
          </div>

          <div className="pc-form-grid" style={{ marginBottom: '24px' }}>
            <div className="pc-field">
              <label className="pc-field-label">Date</label>
              <input className="pc-underlined-input" value={meta.examDate || ''} onChange={set('examDate')} placeholder="e.g. 23/10/2025" />
            </div>
            <div className="pc-field">
              <label className="pc-field-label">Test Series</label>
              <input className="pc-underlined-input" value={meta.testSeries || ''} onChange={set('testSeries')} placeholder="e.g. End Nov 2023.23" />
            </div>
            <div className="pc-field">
              <label className="pc-field-label">Maximum Marks</label>
              <input className="pc-underlined-input" value={meta.maxMarks} onChange={set('maxMarks')} placeholder="80" />
            </div>
            <div className="pc-field">
              <label className="pc-field-label">Time Allowed</label>
              <input className="pc-underlined-input" value={meta.time} onChange={set('time')} placeholder="3 Hours" />
            </div>
          </div>

          <div className="pc-field" style={{ marginBottom: '24px' }}>
            <label className="pc-field-label">Topics Covered</label>
            <textarea
              className="pc-textarea"
              value={meta.topicsCovered || ''}
              onChange={set('topicsCovered')}
              rows={4}
              placeholder="Write one topic per line"
            />
          </div>

          <div className="pc-field">
            <label className="pc-field-label">Instructions (One per line)</label>
            <textarea className="pc-textarea" value={meta.instructions} onChange={set('instructions')} rows={8} />
          </div>
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '28px' }}>
        <button type="button" onClick={onNext} className="pc-button-primary" style={{ padding: '16px 34px', fontSize: '15px' }}>
          Continue to Question Editor
        </button>
      </div>
    </div>
  )
}
