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
  appMode?: 'school' | 'coaching'
}

/* ────────────────────────────────────────────────
   Shared inline‐style tokens (dark cyber theme)
   ──────────────────────────────────────────────── */
const cyberCard: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(6, 182, 212, 0.12)',
  borderRadius: '16px',
  padding: '24px',
  boxSizing: 'border-box',
}

const cyberLabel: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.16em',
  color: '#94a3b8',
  textTransform: 'uppercase' as const,
  marginBottom: '8px',
  display: 'block',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
}

const cyberInput: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid rgba(56, 189, 248, 0.15)',
  borderRadius: '8px',
  fontSize: '13px',
  fontFamily: 'inherit',
  background: '#0d121f',
  color: '#e2e8f0',
  boxSizing: 'border-box',
  outline: 'none',
}

/* ── SliderRow ──────────────────────────────────────────────── */
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <label style={{ ...cyberLabel, marginBottom: 0 }}>{label}</label>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#00f2fe',
            background: 'rgba(0, 242, 254, 0.08)',
            padding: '3px 10px',
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
        className="pc-design-slider"
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#475569', marginTop: '4px' }}>
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

/* ── ToggleGroup ────────────────────────────────────────────── */
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
      <label style={cyberLabel}>{label}</label>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
          gap: '4px',
          background: '#0d121f',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid rgba(56, 189, 248, 0.08)',
        }}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            style={{
              padding: '8px 6px',
              borderRadius: '8px',
              border: value === option.value ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid transparent',
              background: value === option.value ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
              color: value === option.value ? '#00f2fe' : '#64748b',
              fontWeight: 600,
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Toggle Switch ──────────────────────────────────────────── */
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: '42px',
        height: '22px',
        borderRadius: '11px',
        border: 'none',
        background: checked ? '#06b6d4' : '#1e293b',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: '3px',
          left: checked ? '23px' : '3px',
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </button>
  )
}

/* ── Section (collapsible card) ─────────────────────────────── */
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)

  return (
    <div style={{ ...cyberCard, marginBottom: '14px', overflow: 'hidden', padding: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        style={{
          width: '100%',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: open ? 'rgba(6, 182, 212, 0.06)' : '#111827',
          color: '#e2e8f0',
          border: 'none',
          borderBottom: open ? '1px solid rgba(56, 189, 248, 0.08)' : '1px solid transparent',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#00f2fe' }}>{icon}</span>
        <span style={{ flex: 1, textAlign: 'left' }}>{title}</span>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: '18px',
            color: '#475569',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        >
          expand_more
        </span>
      </button>
      {open && <div style={{ padding: '20px' }}>{children}</div>}
    </div>
  )
}

/* ── Sidebar nav items ──────────────────────────────────────── */
type NavSection = 'layout' | 'typography' | 'header' | 'footer' | 'spacing' | 'borders' | 'watermark'

const navItems: { id: NavSection; label: string; icon: string }[] = [
  { id: 'layout', label: 'Layout', icon: 'grid_view' },
  { id: 'typography', label: 'Typography', icon: 'text_fields' },
  { id: 'spacing', label: 'Spacing', icon: 'space_bar' },
  { id: 'borders', label: 'Borders', icon: 'border_style' },
  { id: 'watermark', label: 'Watermark', icon: 'branding_watermark' },
]

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function DesignPanel({ meta, layout, questions, onLayoutChange, appMode = 'coaching' }: Props) {
  const set = (key: keyof LayoutSettings) => (v: any) => onLayoutChange({ ...layout, [key]: v })
  const [activeNav, setActiveNav] = useState<NavSection>('layout')

  return (
    <div className="pc-design-shell animate-fadeup delay-1">
      {/* ── Left Navigation Sidebar ───────────────────────────── */}
      <aside className="pc-design-sidebar">
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid rgba(56, 189, 248, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#00f2fe' }}>design_services</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Studio Tools</div>
              <div style={{ fontSize: '10px', color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Design Mode</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveNav(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeNav === item.id ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
                color: activeNav === item.id ? '#00f2fe' : '#94a3b8',
                fontWeight: activeNav === item.id ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                textAlign: 'left',
                width: '100%',
                borderLeft: activeNav === item.id ? '3px solid #00f2fe' : '3px solid transparent',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Generate Paper button at bottom */}
        <div style={{ padding: '16px', marginTop: 'auto' }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              color: '#0d121f',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
            Generate Paper
          </button>
        </div>
      </aside>

      {/* ── Center: Live Preview ───────────────────────────────── */}
      <div className="pc-design-center">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(56, 189, 248, 0.08)',
          width: '100%',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#00f2fe' }}>visibility</span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Live Preview</span>
        </div>

        <div className="pc-design-preview-paper" style={{ width: '100%', display: 'flex', justifyContent: 'center', background: '#090d16', padding: '24px 0', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.06)' }}>
          <div style={{ zoom: 0.58, width: '210mm', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)' }}>
            <PaperPreview meta={meta} layout={layout} questions={questions} hideControls={true} isEmbedded={true} appMode={appMode} />
          </div>
        </div>
      </div>

      {/* ── Right: Design Configuration ──────────────────────── */}
      <div className="pc-design-preview">
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#f8fafc',
            fontFamily: "'Montserrat', sans-serif",
            marginBottom: '4px',
          }}>
            Design Configuration
          </h1>
          <p style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.4 }}>
            Fine-tune layout and typography.
          </p>
        </div>

        {/* Show active section's controls */}
        <div className="pc-design-controls-scroll" style={{ width: '100%' }}>
          {activeNav === 'layout' && (
            <>
              <Section title="Layout Settings" icon="grid_view">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label style={cyberLabel}>Page Size</label>
                    <select value={layout.pageSize} onChange={(e) => set('pageSize')(e.target.value)} style={cyberInput}>
                      <option>A4</option>
                      <option>A3</option>
                      <option>Letter</option>
                    </select>
                  </div>
                  <div>
                    <label style={cyberLabel}>Pages per Sheet</label>
                    <select value={layout.pagesPerSheet} onChange={(e) => set('pagesPerSheet')(e.target.value)} style={cyberInput}>
                      <option value="1">Single</option>
                      <option value="2">Double</option>
                    </select>
                  </div>
                </div>

                <label style={cyberLabel}>Margins (mm)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {[
                    ['marginTop', 'Top'],
                    ['marginBottom', 'Bottom'],
                    ['marginLeft', 'Left'],
                    ['marginRight', 'Right'],
                  ].map(([key, name]) => (
                    <div key={key}>
                      <label style={{ ...cyberLabel, marginBottom: '4px', fontSize: '9px' }}>{name}</label>
                      <input
                        type="number"
                        min={5}
                        max={40}
                        value={(layout as any)[key]}
                        onChange={(e) => set(key as keyof LayoutSettings)(Number(e.target.value))}
                        style={cyberInput}
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
            </>
          )}

          {activeNav === 'typography' && (
            <Section title="Typography" icon="text_fields">
              <div style={{ marginBottom: '16px' }}>
                <label style={cyberLabel}>Font Family</label>
                <select value={layout.fontFamily} onChange={(e) => set('fontFamily')(e.target.value)} style={cyberInput}>
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
          )}

          {activeNav === 'spacing' && (
            <Section title="Spacing" icon="space_bar">
              <SliderRow label="Space Between Sections" value={layout.sectionSpacing} min={4} max={40} onChange={set('sectionSpacing')} />
              <SliderRow label="Space Between Questions" value={layout.questionSpacing} min={2} max={24} onChange={set('questionSpacing')} />
              <SliderRow label="Q.NO. Column Width" value={layout.qNoWidth} min={20} max={100} step={2} onChange={set('qNoWidth')} />
              <SliderRow label="Topics Box Padding" value={layout.topicsCoveredBoxPadding} min={8} max={32} onChange={set('topicsCoveredBoxPadding')} />
              <SliderRow label="Topics Heading Gap" value={layout.topicsCoveredHeadingGap} min={2} max={24} onChange={set('topicsCoveredHeadingGap')} />
              <SliderRow label="Logo Size" value={layout.logoSize} min={30} max={200} step={5} unit="px" onChange={set('logoSize')} />
              <SliderRow label="Logo & Address Gap" value={layout.logoAddressGap ?? 10} min={-50} max={50} step={1} unit="px" onChange={set('logoAddressGap')} />
            </Section>
          )}

          {activeNav === 'borders' && (
            <Section title="Borders & Dividers" icon="border_style">
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
          )}

          {activeNav === 'watermark' && (
            <Section title="Watermark" icon="branding_watermark">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>Enable Watermark</div>
                  <div style={{ fontSize: '10px', color: '#475569' }}>Overlay logo on paper</div>
                </div>
                <ToggleSwitch checked={layout.watermarkEnabled} onChange={(v) => set('watermarkEnabled')(v)} />
              </div>
              {layout.watermarkEnabled && (
                <>
                  <SliderRow label="Opacity" value={layout.watermarkOpacity} min={0.01} max={1} step={0.01} unit="" onChange={set('watermarkOpacity')} />
                  <SliderRow label="Rotation" value={layout.watermarkRotation} min={-90} max={90} step={1} unit="deg" onChange={set('watermarkRotation')} />
                  <SliderRow label="Scale / Size" value={layout.watermarkScale} min={20} max={300} step={5} unit="%" onChange={set('watermarkScale')} />
                  <SliderRow label="X Offset (Left/Right)" value={layout.watermarkXOffset ?? 0} min={-120} max={120} step={1} unit="mm" onChange={set('watermarkXOffset')} />
                  <SliderRow label="Y Offset (Up/Down)" value={layout.watermarkYOffset ?? 0} min={-180} max={180} step={1} unit="mm" onChange={set('watermarkYOffset')} />
                </>
              )}
            </Section>
          )}

          {/* Reset to Defaults */}
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
                logoAddressGap: 10,
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
                watermarkXOffset: 0,
                watermarkYOffset: 0,
              })
            }
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: '10px',
              border: '1px dashed rgba(56, 189, 248, 0.2)',
              background: 'rgba(6, 182, 212, 0.03)',
              color: '#64748b',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginTop: '8px',
            }}
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  )
}
