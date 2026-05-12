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
  width: '100%',
  padding: '12px 14px',
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

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit = 'px',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>{label}</label>
        <span
          style={{
            fontSize: '12px',
            fontWeight: '700',
            color: '#1a1a2e',
            background: 'rgba(255,255,255,0.76)',
            padding: '4px 10px',
            borderRadius: '999px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#1a1a2e', cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#8a8792', marginTop: '4px' }}>
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  )
}

function ToggleGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle}>{label}</label>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
          gap: '8px',
          background: 'rgba(242, 237, 227, 0.9)',
          padding: '6px',
          borderRadius: '18px',
        }}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            style={{
              padding: '10px 8px',
              borderRadius: '14px',
              border: '1px solid transparent',
              background: value === option.value ? '#ffffff' : 'transparent',
              color: value === option.value ? '#1a1a2e' : '#6d6972',
              fontWeight: '700',
              fontSize: '12px',
              boxShadow: value === option.value ? '0 6px 14px rgba(26,26,46,0.08)' : 'none',
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="pc-glass-card" style={{ marginBottom: '14px', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        style={{
          width: '100%',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: open ? '#1a1a2e' : '#23233e',
          color: '#fff',
          border: 'none',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '13px',
          fontWeight: '700',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {title}
        <span style={{ fontSize: '16px', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>v</span>
      </button>
      {open && <div style={{ padding: '18px', background: 'rgba(255,255,255,0.88)' }}>{children}</div>}
    </div>
  )
}

export default function DesignPanel({ meta, layout, questions, onLayoutChange }: Props) {
  const set = (key: keyof LayoutSettings) => (v: any) => onLayoutChange({ ...layout, [key]: v })

  return (
    <div className="pc-section-shell" style={{ gridTemplateColumns: '380px minmax(0, 1fr)', maxWidth: '1240px', margin: '0 auto' }}>
      <div className="pc-sidebar" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 110px)', paddingRight: '4px' }}>
        <div style={{ marginBottom: '18px' }}>
          <div className="pc-kicker">Style Customization</div>
          <div style={{ fontSize: '28px', fontWeight: '700', fontFamily: "'Montserrat', sans-serif", color: '#1a1a2e', marginBottom: '6px' }}>
            Design &amp; Layout
          </div>
          <div style={{ color: '#47464c' }}>
            Fine-tune typography, spacing, borders, and export settings without changing the actual paper template structure.
          </div>
        </div>

        <Section title="Typography">
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Font Family</label>
            <select value={layout.fontFamily} onChange={(e) => set('fontFamily')(e.target.value)} style={inputStyle}>
              {['Times New Roman', 'Arial', 'Georgia', 'Calibri'].map((font) => (
                <option key={font}>{font}</option>
              ))}
            </select>
          </div>
          <SliderRow label="Exam Title Size" value={layout.examTitleSize} min={11} max={22} onChange={set('examTitleSize')} />
          <SliderRow label="Section Heading Size" value={layout.sectionTitleSize} min={11} max={22} onChange={set('sectionTitleSize')} />
          <SliderRow label="Topics Covered Text Size" value={layout.topicsCoveredFontSize} min={10} max={18} onChange={set('topicsCoveredFontSize')} />
          <SliderRow label="Question Text Size" value={layout.questionFontSize} min={10} max={18} onChange={set('questionFontSize')} />
          <SliderRow label="Instruction Font Size" value={layout.instructionFontSize} min={9} max={16} onChange={set('instructionFontSize')} />
          <SliderRow label="Line Height" value={layout.lineHeight} min={1} max={2.5} step={0.1} unit="x" onChange={set('lineHeight')} />
        </Section>

        <Section title="Page Layout">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Page Size</label>
              <select value={layout.pageSize} onChange={(e) => set('pageSize')(e.target.value)} style={inputStyle}>
                <option>A4</option>
                <option>A3</option>
                <option>Letter</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Pages per Sheet</label>
              <select value={layout.pagesPerSheet} onChange={(e) => set('pagesPerSheet')(e.target.value)} style={inputStyle}>
                <option value="1">1 page</option>
                <option value="2">2 pages</option>
              </select>
            </div>
          </div>

          <label style={labelStyle}>Margins (mm)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {[
              ['marginTop', 'Top'],
              ['marginBottom', 'Bottom'],
              ['marginLeft', 'Left'],
              ['marginRight', 'Right'],
            ].map(([key, name]) => (
              <div key={key}>
                <label style={{ ...labelStyle, marginBottom: '4px' }}>{name}</label>
                <input
                  type="number"
                  min={5}
                  max={40}
                  value={(layout as any)[key]}
                  onChange={(e) => set(key as keyof LayoutSettings)(Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>

          <ToggleGroup
            label="MCQ Option Format"
            value={layout.mcqLayout}
            onChange={set('mcqLayout')}
            options={[
              { value: '1-col', label: '1 per line' },
              { value: '2-col', label: '2 per line' },
              { value: '4-col', label: 'All in line' },
            ]}
          />
        </Section>

        <Section title="Spacing">
          <SliderRow label="Space Between Sections" value={layout.sectionSpacing} min={4} max={40} onChange={set('sectionSpacing')} />
          <SliderRow label="Space Between Questions" value={layout.questionSpacing} min={2} max={24} onChange={set('questionSpacing')} />
          <SliderRow label="Q.NO. Column Width" value={layout.qNoWidth} min={20} max={100} step={2} onChange={set('qNoWidth')} />
          <SliderRow label="Topics Box Padding" value={layout.topicsCoveredBoxPadding} min={8} max={32} onChange={set('topicsCoveredBoxPadding')} />
          <SliderRow label="Topics Heading Gap" value={layout.topicsCoveredHeadingGap} min={2} max={24} onChange={set('topicsCoveredHeadingGap')} />
        </Section>

        <Section title="Borders & Dividers">
          <ToggleGroup
            label="Table Border Style"
            value={layout.tableBorder}
            onChange={set('tableBorder')}
            options={[
              { value: 'solid', label: 'Solid' },
              { value: 'double', label: 'Double' },
              { value: 'dashed', label: 'Dashed' },
              { value: 'none', label: 'None' },
            ]}
          />
          <SliderRow label="Border Width" value={layout.borderWidth} min={0.5} max={3} step={0.5} unit="pt" onChange={set('borderWidth')} />
          <ToggleGroup
            label="Header Divider"
            value={layout.headerDivider}
            onChange={set('headerDivider')}
            options={[
              { value: 'double', label: 'Double' },
              { value: 'single', label: 'Single' },
              { value: 'none', label: 'None' },
            ]}
          />
        </Section>

        <Section title="Watermark">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Enable Watermark</label>
            <input type="checkbox" checked={layout.watermarkEnabled} onChange={(e) => set('watermarkEnabled')(e.target.checked)} style={{ width: '18px', height: '18px' }} />
          </div>
          {layout.watermarkEnabled && (
            <>
              <SliderRow label="Opacity" value={layout.watermarkOpacity} min={0.01} max={1} step={0.01} unit="" onChange={set('watermarkOpacity')} />
              <SliderRow label="Rotation" value={layout.watermarkRotation} min={-90} max={90} step={1} unit="deg" onChange={set('watermarkRotation')} />
              <SliderRow label="Scale / Size" value={layout.watermarkScale} min={20} max={300} step={5} unit="%" onChange={set('watermarkScale')} />
            </>
          )}
        </Section>

        <button
          type="button"
          onClick={() =>
            onLayoutChange({
              pageSize: 'A4',
              pagesPerSheet: '1',
              marginTop: 18,
              marginBottom: 18,
              marginLeft: 20,
              marginRight: 20,
              logoSize: 64,
              logoPosition: 'center',
              schoolNameSize: 18,
              examTitleSize: 15,
              sectionTitleSize: 15,
              topicsCoveredFontSize: 13,
              questionFontSize: 13,
              instructionFontSize: 12,
              fontFamily: 'Times New Roman',
              lineHeight: 1.5,
              sectionSpacing: 12,
              questionSpacing: 8,
              qNoWidth: 40,
              topicsCoveredBoxPadding: 15,
              topicsCoveredHeadingGap: 10,
              tableBorder: 'solid',
              borderWidth: 1,
              headerDivider: 'double',
              mcqLayout: '2-col',
              watermarkEnabled: false,
              watermarkOpacity: 0.1,
              watermarkRotation: -45,
              watermarkScale: 100,
            })
          }
          style={{
            width: '100%',
            padding: '13px 18px',
            borderRadius: '999px',
            border: '1px dashed rgba(120,118,125,0.35)',
            background: 'rgba(255,255,255,0.72)',
            color: '#47464c',
            fontSize: '13px',
            fontWeight: '700',
          }}
        >
          Reset to Defaults
        </button>
      </div>

      <div>
        <div className="pc-preview-shell" style={{ marginBottom: '16px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', overflowX: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="pc-preview-badge" style={{ marginBottom: '16px' }}>
            Live Full Paper Preview
          </div>

          <div style={{ zoom: 0.7, width: '210mm', paddingBottom: '40px' }}>
            <PaperPreview meta={meta} layout={layout} questions={questions} hideControls={true} isEmbedded={true} />
          </div>
        </div>

        <div className="pc-glass-card">
          <div className="pc-card-inner" style={{ background: 'linear-gradient(135deg, rgba(26,26,46,0.97), rgba(35,35,62,0.94))', color: '#fff' }}>
            <div style={{ color: '#e2b96a', fontFamily: "'Montserrat', sans-serif", fontSize: '15px', fontWeight: '700', marginBottom: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Print Tips
            </div>
            {[
              ['2 pages on 1 sheet', 'Set "Pages per Sheet" to 2, then choose 2 pages per sheet in the browser print dialog too.'],
              ['Best PDF quality', 'Use Save as PDF, A4 paper size, and minimum or no margins in the final print dialog.'],
              ['Hindi font support', 'Arial usually gives the most stable mixed Hindi-English output when printing.'],
              ['Reduce paper usage', 'Decrease section spacing and question spacing when you need a tighter paper layout.'],
            ].map(([tip, desc]) => (
              <div key={tip} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#e2b96a', marginBottom: '3px' }}>{tip}</div>
                <div style={{ fontSize: '12px', color: '#b3b7c5', lineHeight: '1.5' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
