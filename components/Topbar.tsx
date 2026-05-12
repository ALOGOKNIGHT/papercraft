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
    <header className="pc-topbar no-print">
      <div className="pc-topbar-inner">
        <div className="pc-brand">
          <div className="pc-brand-mark">P</div>
          <div>
            <div className="pc-brand-title">PaperCraft</div>
            <div className="pc-brand-subtitle">Modern Exam Workspace</div>
          </div>
        </div>

        <nav className="pc-tabnav" aria-label="Primary">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`pc-tab-button${tab === item.id ? ' active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pc-topbar-actions">
          <div className="pc-meta-chip">{totalQuestions} questions added</div>
          <button type="button" onClick={onPrint} className="pc-button-secondary">
            Export / Print
          </button>
        </div>
      </div>
    </header>
  )
}
