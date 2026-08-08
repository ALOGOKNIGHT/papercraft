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
    <header className="pc-topbar no-print border-b border-[rgba(56,189,248,0.15)] bg-[#0d1321]">
      <div className="pc-topbar-inner flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-4 sm:px-6 py-2.5 sm:py-0 min-h-[60px] sm:h-[68px] w-full max-w-full">
        {/* Top row on mobile: Brand on left, Print button on right */}
        <div className="flex items-center justify-between gap-3 w-full sm:w-auto">
          <div className="pc-brand flex items-center gap-2.5 flex-shrink-0">
            <div className="pc-brand-mark w-8 h-8 rounded-lg bg-[#1c1c2e] text-white flex items-center justify-center font-bold text-base flex-shrink-0">
              P
            </div>
            <div className="flex flex-col">
              <div className="pc-brand-title text-sm sm:text-lg font-bold leading-tight text-white">PaperCraft</div>
              <div className="pc-brand-subtitle text-[9px] sm:text-[10px] text-[#00f2fe] font-semibold tracking-wider uppercase">Modern Exam Workspace</div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <div className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
              {totalQuestions} Q
            </div>
            <button
              type="button"
              onClick={onPrint}
              className="min-h-[44px] min-w-[44px] px-3 py-1.5 text-xs font-bold bg-[#00f2fe] text-gray-900 rounded-lg flex items-center gap-1 active:scale-95"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Tab strip: scrollable horizontally on mobile, center aligned on desktop */}
        <nav className="pc-tabnav flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none w-full sm:w-auto py-1 sm:py-0 border-t border-[rgba(56,189,248,0.12)] sm:border-t-0" aria-label="Primary">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`pc-tab-button ${tab === item.id ? 'active text-[#00f2fe] bg-[rgba(0,242,254,0.1)] border-b-2 border-[#00f2fe]' : 'text-gray-400'} min-h-[44px] px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg flex-shrink-0 transition-colors`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right actions (desktop only) */}
        <div className="pc-topbar-actions hidden sm:flex items-center gap-3 flex-shrink-0">
          <div className="pc-meta-chip text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">
            {totalQuestions} questions added
          </div>
          <button
            type="button"
            onClick={onPrint}
            className="pc-button-secondary min-h-[44px] px-4 py-2 text-xs sm:text-sm font-bold bg-[#00f2fe] text-gray-900 rounded-lg flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>Export / Print</span>
          </button>
        </div>
      </div>
    </header>
  )
}

