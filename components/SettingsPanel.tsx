'use client'

import { useRef } from 'react'
import { PaperMeta } from '@/lib/types'
import { SUBJECTS, CLASSES } from '@/lib/constants'

interface Props {
  meta: PaperMeta
  onChange: (meta: PaperMeta) => void
  onNext: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '1px solid #e0d9c8', borderRadius: '5px',
  fontSize: '13px', fontFamily: 'inherit',
  background: '#fffdf7', color: '#1a1a2e',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '10px', fontWeight: '700', letterSpacing: '1.8px',
  color: '#999', textTransform: 'uppercase', marginBottom: '5px', display: 'block',
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '8px', padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      border: '1px solid #f0eee9'
    }}>
      <div style={{
        color: '#111', fontSize: '13px', fontWeight: '800',
        textTransform: 'uppercase', marginBottom: '20px',
      }}>{title}</div>
      {children}
    </div>
  )
}

export default function SettingsPanel({ meta, onChange, onNext }: Props) {
  const logoRef = useRef<HTMLInputElement>(null)

  const set = (key: keyof PaperMeta) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    onChange({ ...meta, [key]: e.target.value })

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onChange({ ...meta, logo: ev.target?.result as string })
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
      
      {/* Centered Logo Upload */}
      <div style={{ maxWidth: '350px', margin: '0 auto 24px auto', textAlign: 'center' }}>
        <Card title="HEADER SMALL LOGO & SAMPLE">
          <div
            onClick={() => logoRef.current?.click()}
            style={{
              border: '2px dashed #e0d9c8', borderRadius: '8px', padding: '20px',
              cursor: 'pointer', background: '#fffdf7',
              transition: 'border-color 0.2s', minHeight: '100px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#e2b96a')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#e0d9c8')}
          >
            {meta.logo
              ? <img src={meta.logo} alt="logo" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
              : <div style={{ color: '#bbb', fontSize: '13px' }}>Click to upload header image<br /><span style={{ fontSize: '11px' }}>PNG / JPG</span></div>
            }
          </div>
          <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} style={{ display: 'none' }} />
        </Card>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        {/* Exam Details */}
        <Card title="EXAM DETAILS">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input value={meta.examDate || ''} onChange={set('examDate')} placeholder="e.g. 23/10/2025" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Test Series</label>
              <input value={meta.testSeries || ''} onChange={set('testSeries')} placeholder="e.g. End Nover2023.23" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Maximum Marks</label>
              <input value={meta.maxMarks} onChange={set('maxMarks')} placeholder="20" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Time Allowed</label>
              <input value={meta.time} onChange={set('time')} placeholder="14 hours" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Topics Covered</label>
            <textarea
              value={meta.topicsCovered || ''}
              onChange={set('topicsCovered')}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }}
              placeholder="Write one topic per line"
            />
          </div>

          <div>
            <label style={labelStyle}>Instructions (one per line)</label>
            <textarea
              value={meta.instructions}
              onChange={set('instructions')}
              rows={9}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }}
            />
          </div>
        </Card>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <button onClick={onNext} style={{
          padding: '15px 56px', borderRadius: '7px',
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          color: '#e2b96a', border: 'none', cursor: 'pointer',
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '16px', fontWeight: '700', letterSpacing: '1px',
          boxShadow: '0 6px 24px rgba(26,26,46,0.3)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(26,26,46,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(26,26,46,0.3)' }}
        >
          Continue to Question Editor ->
        </button>
      </div>
    </div>
  )
}
