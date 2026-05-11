'use client'

type Tab = 'settings' | 'editor' | 'design' | 'preview'

interface TopbarProps {
  tab: Tab
  setTab: (t: Tab) => void
  totalQuestions: number
  onPrint: () => void
}

export default function Topbar({ tab, setTab, totalQuestions, onPrint }: TopbarProps) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'settings', label: 'Paper Setup' },
    { id: 'editor', label: 'Question Editor' },
    { id: 'design', label: 'Design & Layout' },
    { id: 'preview', label: 'Final Preview' },
  ]

  return (
    // ADDED: Wrapper with 'no-print' class to hide this during PDF export
    <div className="no-print">
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #e2b96a, #c9953a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px',
          }}>📝</div>
          <div>
            <div style={{ color: '#e2b96a', fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: '700' }}>PaperCraft</div>
            <div style={{ color: '#8899aa', fontSize: '10px', letterSpacing: '2px' }}>SCHOOL EXAM GENERATOR</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '10px 24px',
              background: tab === t.id ? 'rgba(226,185,106,0.1)' : 'transparent',
              color: tab === t.id ? '#e2b96a' : '#8899aa',
              border: 'none', cursor: 'pointer',
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '13px', fontWeight: tab === t.id ? '700' : '400',
              borderBottom: tab === t.id ? '2px solid #e2b96a' : '2px solid transparent',
              transition: 'all 0.2s',
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ color: '#8899aa', fontSize: '12px', fontFamily: "'DM Mono', monospace" }}>
            {totalQuestions} Q added
          </div>
          <button onClick={onPrint} style={{
            padding: '8px 22px', borderRadius: '5px',
            background: 'linear-gradient(135deg, #e2b96a, #c9953a)',
            color: '#1a1a2e', border: 'none', cursor: 'pointer',
            fontWeight: '700', fontSize: '13px',
          }}>
            🖨 Print / PDF
          </button>
        </div>
      </div>
    </div>
  )
}