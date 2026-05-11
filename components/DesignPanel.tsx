'use client'

import { useState } from 'react'
import { PaperMeta, LayoutSettings, QuestionsMap } from '@/lib/types'
import PaperPreview from './PaperPreview'

interface Props {
  meta: PaperMeta
  layout: LayoutSettings
  questions: QuestionsMap
  onMetaChange: (m: PaperMeta) => void
  onLayoutChange: (l: LayoutSettings) => void
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px',
  border: '1px solid #e0d9c8', borderRadius: '5px',
  fontSize: '13px', fontFamily: 'inherit',
  background: '#fffdf7', color: '#1a1a2e', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px',
  color: '#999', textTransform: 'uppercase', marginBottom: '4px', display: 'block',
}

function SliderRow({
  label, value, min, max, step = 1, unit = 'px',
  onChange,
}: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>{label}</label>
        <span style={{
          fontSize: '12px', fontWeight: '700', color: '#1a1a2e',
          background: '#f5f0e8', padding: '2px 8px', borderRadius: '10px',
          fontFamily: "'DM Mono', monospace",
        }}>{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#e2b96a', cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#bbb', marginTop: '2px' }}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ marginBottom: '12px', border: '1px solid #e8e3d5', borderRadius: '8px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', background: open ? '#000' : '#0f0f0f',
          color: '#fff', border: 'none', cursor: 'pointer',
          fontFamily: "'Playfair Display',Georgia,serif", fontSize: '13px', fontWeight: '700',
          letterSpacing: '0.5px',
        }}>
        {title}
        <span style={{ fontSize: '16px', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>
      {open && <div style={{ padding: '16px', background: '#fff' }}>{children}</div>}
    </div>
  )
}

export default function DesignPanel({ meta, layout, questions, onMetaChange, onLayoutChange }: Props) {
  const set = (key: keyof LayoutSettings) => (v: any) => onLayoutChange({ ...layout, [key]: v })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', maxWidth: '1200px', margin: '0 auto', padding: '28px 24px' }}>

      {/* Left: Controls */}
      <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 80px)', paddingRight: '4px' }}>

        {/* Typography */}
        <Section title="🔤 Typography">
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Font Family</label>
            <select value={layout.fontFamily} onChange={e => set('fontFamily')(e.target.value)} style={inputStyle}>
              {['Times New Roman', 'Arial', 'Georgia', 'Calibri'].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <SliderRow label="Exam Title Size" value={layout.examTitleSize} min={11} max={22} onChange={set('examTitleSize')} unit="px" />
          <SliderRow label="Section Heading Size" value={layout.sectionTitleSize} min={11} max={22} onChange={set('sectionTitleSize')} unit="px" />
          <SliderRow label="Topics Covered Text Size" value={layout.topicsCoveredFontSize} min={10} max={18} onChange={set('topicsCoveredFontSize')} unit="px" />
          <SliderRow label="Question Text Size" value={layout.questionFontSize} min={10} max={18} onChange={set('questionFontSize')} unit="px" />
          <SliderRow label="Instruction Font Size" value={layout.instructionFontSize} min={9} max={16} onChange={set('instructionFontSize')} unit="px" />
          <SliderRow label="Line Height" value={layout.lineHeight} min={1} max={2.5} step={0.1} unit="×" onChange={set('lineHeight')} />
        </Section>

        {/* Page layout */}
        <Section title="📄 Page Layout">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>Page Size</label>
              <select value={layout.pageSize} onChange={e => set('pageSize')(e.target.value)} style={inputStyle}>
                <option>A4</option>
                <option>A3</option>
                <option>Letter</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Pages per Sheet</label>
              <select value={layout.pagesPerSheet} onChange={e => set('pagesPerSheet')(e.target.value)} style={inputStyle}>
                <option value="1">1 page (normal)</option>
                <option value="2">2 pages (booklet)</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '6px' }}>
            <label style={{ ...labelStyle, marginBottom: '10px', display: 'block' }}>Margins (mm)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[['marginTop', 'Top'], ['marginBottom', 'Bottom'], ['marginLeft', 'Left'], ['marginRight', 'Right']].map(([key, label]) => (
                <div key={key}>
                  <label style={{ ...labelStyle, letterSpacing: '1px' }}>{label}</label>
                  <input
                    type="number" min={5} max={40}
                    value={(layout as any)[key]}
                    onChange={e => set(key as keyof LayoutSettings)(Number(e.target.value))}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '6px' }}>
            <label style={labelStyle}>MCQ Options Format</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {(['1-col', '2-col', '4-col'] as const).map(m => (
                <button key={m} onClick={() => set('mcqLayout')(m)} style={{
                  padding: '8px', borderRadius: '5px', border: '2px solid',
                  borderColor: layout.mcqLayout === m ? '#e2b96a' : '#e0d9c8',
                  background: layout.mcqLayout === m ? '#fffbf0' : '#fff',
                  color: layout.mcqLayout === m ? '#1a1a2e' : '#888',
                  cursor: 'pointer', fontWeight: '600', fontSize: '11px',
                }}>{m === '1-col' ? '1 Per Line' : m === '2-col' ? '2 Per Line' : 'All in 1 Line'}</button>
              ))}
            </div>
          </div>
        </Section>

        {/* Spacing */}
        <Section title="↕ Spacing">
          <SliderRow label="Space Between Sections" value={layout.sectionSpacing} min={4} max={40} onChange={set('sectionSpacing')} />
          <SliderRow label="Space Between Questions" value={layout.questionSpacing} min={2} max={24} onChange={set('questionSpacing')} />
          <SliderRow label="Q.NO. Column Width" value={layout.qNoWidth} min={20} max={100} step={2} onChange={set('qNoWidth')} />
          <SliderRow label="Topics Box Padding" value={layout.topicsCoveredBoxPadding} min={8} max={32} onChange={set('topicsCoveredBoxPadding')} />
          <SliderRow label="Topics Heading Gap" value={layout.topicsCoveredHeadingGap} min={2} max={24} onChange={set('topicsCoveredHeadingGap')} />
        </Section>

        {/* Border */}
        <Section title="🔲 Borders & Dividers">
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Table Border Style</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {(['solid', 'double', 'dashed', 'none'] as const).map(b => (
                <button key={b} onClick={() => set('tableBorder')(b)} style={{
                  padding: '8px', borderRadius: '5px',
                  border: '2px solid',
                  borderColor: layout.tableBorder === b ? '#e2b96a' : '#e0d9c8',
                  background: layout.tableBorder === b ? '#fffbf0' : '#fff',
                  color: layout.tableBorder === b ? '#1a1a2e' : '#888',
                  cursor: 'pointer', fontWeight: '600', fontSize: '12px', textTransform: 'capitalize',
                }}>{b}</button>
              ))}
            </div>
          </div>
          <SliderRow label="Border Width" value={layout.borderWidth} min={0.5} max={3} step={0.5} onChange={set('borderWidth')} />
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Header Divider</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {(['double', 'single', 'none'] as const).map(d => (
                <button key={d} onClick={() => set('headerDivider')(d)} style={{
                  padding: '8px', borderRadius: '5px', border: '2px solid',
                  borderColor: layout.headerDivider === d ? '#e2b96a' : '#e0d9c8',
                  background: layout.headerDivider === d ? '#fffbf0' : '#fff',
                  color: layout.headerDivider === d ? '#1a1a2e' : '#888',
                  cursor: 'pointer', fontWeight: '600', fontSize: '12px', textTransform: 'capitalize',
                }}>{d}</button>
              ))}
            </div>
          </div>
        </Section>

        {/* Watermark */}
        <Section title="💧 Watermark (Logo)">
          <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Enable Watermark</label>
            <input 
              type="checkbox" 
              checked={layout.watermarkEnabled} 
              onChange={e => set('watermarkEnabled')(e.target.checked)} 
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#e2b96a' }} 
            />
          </div>
          {layout.watermarkEnabled && (
            <>
              <SliderRow label="Opacity (Intensity)" value={layout.watermarkOpacity} min={0.01} max={1} step={0.01} unit="" onChange={set('watermarkOpacity')} />
              <SliderRow label="Rotation" value={layout.watermarkRotation} min={-90} max={90} step={1} unit="°" onChange={set('watermarkRotation')} />
              <SliderRow label="Scale / Size" value={layout.watermarkScale} min={20} max={300} step={5} unit="%" onChange={set('watermarkScale')} />
            </>
          )}
        </Section>

        {/* Reset */}
        <button
          onClick={() => onLayoutChange({
            pageSize: 'A4', pagesPerSheet: '1',
            marginTop: 18, marginBottom: 18, marginLeft: 20, marginRight: 20,
            logoSize: 64, logoPosition: 'center',
            schoolNameSize: 18, examTitleSize: 15, sectionTitleSize: 15, topicsCoveredFontSize: 13, questionFontSize: 13, instructionFontSize: 12,
            fontFamily: 'Times New Roman', lineHeight: 1.5,
            sectionSpacing: 12, questionSpacing: 8, qNoWidth: 40, topicsCoveredBoxPadding: 15, topicsCoveredHeadingGap: 10,
            tableBorder: 'solid', borderWidth: 1, headerDivider: 'double', mcqLayout: '2-col',
            watermarkEnabled: false, watermarkOpacity: 0.1, watermarkRotation: -45, watermarkScale: 100
          })}
          style={{
            width: '100%', padding: '10px', borderRadius: '6px',
            border: '1px solid #e0d9c8', background: '#fff',
            color: '#888', cursor: 'pointer', fontSize: '13px',
          }}>
          ↺ Reset to Defaults
        </button>
      </div>

      {/* Right: Live full preview */}
      <div>
        <div style={{
          background: '#d4cfc4', borderRadius: '10px', border: '1px solid #c4bfa4',
          padding: '20px', marginBottom: '16px', boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.1)',
          maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', overflowX: 'auto',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <div style={{
            background: 'linear-gradient(135deg,#1a1a2e,#16213e)', color: '#e2b96a',
            fontSize: '10px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase',
            padding: '4px 12px', borderRadius: '3px', marginBottom: '16px', alignSelf: 'center'
          }}>Live Full Paper Preview</div>
          
          <div style={{ zoom: 0.7, width: '210mm', paddingBottom: '40px' }}>
            <PaperPreview 
              meta={meta} 
              layout={layout} 
              questions={questions} 
              hideControls={true} 
              isEmbedded={true} 
            />
          </div>
        </div>

        {/* Layout tips */}
        <div style={{
          background: 'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius: '10px',
          padding: '20px', color: '#fff',
        }}>
          <div style={{ color: '#e2b96a', fontFamily: "'Playfair Display',Georgia,serif", fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>
            💡 Print Tips
          </div>
          {[
            ['2 pages on 1 sheet', 'Set "Pages per Sheet" → 2, then in Chrome print dialog also select "2 per sheet"'],
            ['Best PDF quality', 'Print → Save as PDF → Paper: A4 → Margins: None'],
            ['Hindi font support', 'Font family "Arial" works best for mixed Hindi-English text'],
            ['Reduce paper usage', 'Decrease Section Spacing and Question Spacing sliders'],
          ].map(([tip, desc]) => (
            <div key={tip} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#e2b96a', marginBottom: '3px' }}>→ {tip}</div>
              <div style={{ fontSize: '12px', color: '#8899aa', lineHeight: '1.5' }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
