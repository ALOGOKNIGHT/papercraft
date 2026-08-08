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
      <div className="pc-topbar-inner flex flex-wrap md:flex-nowrap items-center justify-between gap-3 px-4 md:px-7 min-h-[60px] md:min-h-[68px] py-2 md:py-0 w-full">
        <div className="pc-brand flex items-center gap-3">
          <div className="pc-brand-mark w-9 h-9 rounded-lg bg-[#1c1c2e] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
            P
          </div>
          <div className="flex flex-col">
            <div className="pc-brand-title text-base md:text-xl font-bold leading-tight">PaperCraft</div>
            <div className="pc-brand-subtitle text-[10px] md:text-xs text-gray-400 font-medium">Modern Exam Workspace</div>
          </div>
        </div>

        <nav className="pc-tabnav flex items-center gap-1 md:gap-2 overflow-x-auto scrollbar-none w-full md:w-auto py-1" aria-label="Primary">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`pc-tab-button ${tab === item.id ? 'active' : ''} min-h-[44px] px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg flex-shrink-0 transition-colors duration-150`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pc-topbar-actions flex items-center gap-2 flex-shrink-0">
          <div className="pc-meta-chip text-xs px-2.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium hidden sm:block">
            {totalQuestions} questions added
          </div>
          <button
            type="button"
            onClick={onPrint}
            className="pc-button-secondary min-h-[44px] px-4 py-2 text-xs md:text-sm font-bold bg-[#00f2fe] text-gray-900 rounded-lg flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>Export / Print</span>
          </button>
        </div>
      </div>
    </header>
  )
}

