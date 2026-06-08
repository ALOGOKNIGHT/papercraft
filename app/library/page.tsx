'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { SavedPaper } from '@/lib/types'

export default function LibraryPage() {
  const [papers, setPapers] = useState<SavedPaper[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [modeFilter, setModeFilter] = useState<'all' | 'school' | 'coaching'>('all')
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'az'>('latest')
  
  // Modals state
  const [paperToDelete, setPaperToDelete] = useState<SavedPaper | null>(null)
  
  const [paperToDuplicate, setPaperToDuplicate] = useState<SavedPaper | null>(null)
  const [duplicateNameInput, setDuplicateNameInput] = useState('')
  const [duplicateNameError, setDuplicateNameError] = useState<string | null>(null)

  const [importedPaper, setImportedPaper] = useState<any | null>(null)
  const [importRenameInput, setImportRenameInput] = useState('')
  const [importRenameError, setImportRenameError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load papers from localStorage
  useEffect(() => {
    const libraryStr = localStorage.getItem('papercraft_library') || '[]'
    try {
      const parsed = JSON.parse(libraryStr)
      if (Array.isArray(parsed)) {
        setPapers(parsed)
      }
    } catch (err) {
      console.error('Failed to parse papercraft_library', err)
    }
  }, [])

  // Duplicate name validation for duplication modal
  useEffect(() => {
    if (!paperToDuplicate) return
    const nameToTest = duplicateNameInput.trim().toLowerCase()
    if (!nameToTest) {
      setDuplicateNameError(null)
      return
    }

    const duplicateExists = papers.some(
      (p) => p.name.trim().toLowerCase() === nameToTest
    )

    if (duplicateExists) {
      setDuplicateNameError(`A paper named '${duplicateNameInput}' already exists in your library. Choose a different name.`)
    } else {
      setDuplicateNameError(null)
    }
  }, [duplicateNameInput, paperToDuplicate, papers])

  // Duplicate name validation for import rename modal
  useEffect(() => {
    if (!importedPaper) return
    const nameToTest = importRenameInput.trim().toLowerCase()
    if (!nameToTest) {
      setImportRenameError(null)
      return
    }

    const duplicateExists = papers.some(
      (p) => p.name.trim().toLowerCase() === nameToTest
    )

    if (duplicateExists) {
      setImportRenameError(`A paper named '${importRenameInput}' already exists in your library. Choose a different name.`)
    } else {
      setImportRenameError(null)
    }
  }, [importRenameInput, importedPaper, papers])

  // Delete Action
  const handleDeleteConfirm = () => {
    if (!paperToDelete) return
    
    const updated = papers.filter(p => p.id !== paperToDelete.id)
    localStorage.setItem('papercraft_library', JSON.stringify(updated))
    setPapers(updated)

    // If deleting the active draft, clear current draft from storage
    const currentDraftStr = localStorage.getItem('papercraft_current_draft')
    if (currentDraftStr) {
      try {
        const draft = JSON.parse(currentDraftStr)
        if (draft.id === paperToDelete.id) {
          localStorage.removeItem('papercraft_current_draft')
        }
      } catch (err) {
        console.error(err)
      }
    }

    setPaperToDelete(null)
  }

  // Duplicate Action
  const handleDuplicateConfirm = () => {
    if (!paperToDuplicate || duplicateNameError || !duplicateNameInput.trim()) return

    const newId = 'paper_' + Math.random().toString(36).substr(2, 9)
    const newPaper: SavedPaper = {
      ...paperToDuplicate,
      id: newId,
      name: duplicateNameInput.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updated = [...papers, newPaper]
    localStorage.setItem('papercraft_library', JSON.stringify(updated))
    setPapers(updated)
    setPaperToDuplicate(null)
  }

  // Export Action
  const handleExport = (paper: SavedPaper) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(paper, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `${paper.name}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Import Trigger
  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  // File Import handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        
        // Simple structure check
        if (!parsed.name || !parsed.questions || !parsed.meta) {
          alert("Invalid paper json structure. Make sure it's an exported PaperCraft file.")
          return
        }

        // Check if name already exists
        const nameToTest = parsed.name.trim().toLowerCase()
        const duplicateExists = papers.some(
          p => p.name.trim().toLowerCase() === nameToTest
        )

        if (duplicateExists) {
          setImportedPaper(parsed)
          setImportRenameInput(parsed.name + " (Copy)")
          setImportRenameError(null)
        } else {
          // Import immediately
          const newId = 'paper_' + Math.random().toString(36).substr(2, 9)
          const newPaper: SavedPaper = {
            ...parsed,
            id: newId,
            createdAt: parsed.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          const updated = [...papers, newPaper]
          localStorage.setItem('papercraft_library', JSON.stringify(updated))
          setPapers(updated)
          alert(`Paper '${newPaper.name}' successfully imported!`)
        }
      } catch (err) {
        alert("Failed to read or parse file.")
      }
    }
    reader.readAsText(file)
    e.target.value = '' // Clear input
  }

  // Import Rename Confirm
  const handleImportRenameConfirm = () => {
    if (!importedPaper || importRenameError || !importRenameInput.trim()) return

    const newId = 'paper_' + Math.random().toString(36).substr(2, 9)
    const newPaper: SavedPaper = {
      ...importedPaper,
      id: newId,
      name: importRenameInput.trim(),
      createdAt: importedPaper.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const updated = [...papers, newPaper]
    localStorage.setItem('papercraft_library', JSON.stringify(updated))
    setPapers(updated)
    setImportedPaper(null)
    alert(`Paper '${newPaper.name}' successfully imported!`)
  }

  // Open and Edit Action
  const handleOpenEdit = (paper: SavedPaper) => {
    // Save as current draft
    localStorage.setItem('papercraft_current_draft', JSON.stringify(paper))
    localStorage.setItem('papercraft_app_mode', paper.mode)
  }

  // Filter & Sort Logic
  const filteredPapers = papers
    .filter(p => {
      // 1. Search filter
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.meta.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.meta.className || '').toLowerCase().includes(searchQuery.toLowerCase())
      
      // 2. Mode filter
      const matchesMode = modeFilter === 'all' || p.mode === modeFilter

      return matchesSearch && matchesMode
    })
    .sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      if (sortBy === 'az') {
        return a.name.localeCompare(b.name)
      }
      return 0
    })

  return (
    <div className="dark-workspace min-h-screen flex flex-col justify-between">
      <div>
        {/* ── Topbar ─────────────────────────────────────────────── */}
        <header className="pc-topbar sticky top-0 z-50">
          <div className="pc-topbar-inner" style={{ maxWidth: '100%', padding: '0 24px', height: '76px' }}>
            {/* Brand */}
            <div className="pc-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div 
                className="pc-brand-mark" 
                style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '10px', 
                  background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', 
                  display: 'grid', 
                  placeItems: 'center',
                  boxShadow: '0 0 10px rgba(14, 165, 233, 0.4)'
                }}
              >
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjTGK5Yuks8vnVB9kN9G-AY01tkN-0r9dlP2c3-ynqnowykO2g5HFJWCHIAXeLQ_8YU2BH_QMS4bm-I5sorSP9450KkrZKmOuzcjmqgUK-jbpwpI2ctDlEvPxZ8RaMoqfd8fsCRHs33g9iHbOFLSIO32v_BTTGk9SNPy76bMyTX_xdhSmCyD4x9MbLH6xVRpWSXq8Y1XpOQCXPOgxvato_XIOnHKsLIDT28iO3gFWpuIDMIz8EFT0bcxA-XwL8kCCdLJp6meSd1w_5"
                  alt="PaperCraft"
                  style={{ width: '70%', height: '70%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <span className="pc-brand-name" style={{ fontSize: '18px', lineHeight: '1.1' }}>Papercraft</span>
                <span className="pc-brand-sub" style={{ fontSize: '10px', color: '#64748b' }}>Paper Library</span>
              </div>
            </div>

            {/* Library Active Nav tab */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.15)', marginRight: '16px' }} />
              <Link 
                href="/library" 
                className="pc-nav-tab active" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  textDecoration: 'none',
                  color: '#00f2fe',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '8px 12px',
                  borderRadius: '6px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>folder_open</span>
                <span>Library</span>
              </Link>
            </div>

            <div style={{ flex: 1 }} />

            {/* Back to Editor Action */}
            <div className="pc-topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link href="/" className="pc-print-btn" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', border: 'none', color: '#fff' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                <span>Back to Editor</span>
              </Link>
            </div>
          </div>
        </header>

        {/* ── Main Library Content ──────────────────────────────── */}
        <main style={{ padding: '48px 24px', maxWidth: '1200px', margin: '0 auto' }} className="pb-24 md:pb-12">
          
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#00f2fe' }}>Saved Papers</span>
                <span style={{ fontSize: '16px', background: 'rgba(0, 242, 254, 0.1)', border: '1px solid rgba(0, 242, 254, 0.3)', color: '#00f2fe', padding: '2px 10px', borderRadius: '12px', fontWeight: 600 }}>
                  {papers.length} total
                </span>
              </h1>
              <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>Manage, duplicate, edit, or share your saved examinations</p>
            </div>
            
            {/* Import Button */}
            <div className="hidden md:block">
              <button 
                onClick={handleImportClick} 
                className="pc-print-btn"
                style={{
                  background: 'rgba(139, 92, 246, 0.12)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#c084fc',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>upload_file</span>
                <span>Import Paper (.json)</span>
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".json" 
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Search, Filter and Sorting toolbar */}
          <div className="pc-cyber-card flex flex-col md:flex-row gap-4 md:gap-5 items-stretch md:items-center" style={{ padding: '16px 20px', marginBottom: '32px', background: 'rgba(9, 13, 22, 0.6)' }}>
            
            {/* Search Input */}
            <div className="pc-cyber-field" style={{ flex: 1, minWidth: '280px', margin: 0 }}>
              <input
                className="pc-cyber-input"
                type="text"
                placeholder="Search by paper name, subject, class..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ height: '42px', paddingLeft: '40px' }}
              />
              <span className="material-symbols-outlined pc-cyber-input-icon" style={{ top: '9px' }}>search</span>
            </div>

            {/* Mode Filters */}
            <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none py-1 w-full md:w-auto">
              <button 
                onClick={() => setModeFilter('all')} 
                style={{
                  padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: '1px solid',
                  borderColor: modeFilter === 'all' ? '#00f2fe' : 'rgba(56, 189, 248, 0.12)',
                  background: modeFilter === 'all' ? 'rgba(0, 242, 254, 0.1)' : '#070c15',
                  color: modeFilter === 'all' ? '#00f2fe' : '#94a3b8',
                  transition: 'all 0.2s'
                }}
              >
                All
              </button>
              <button 
                onClick={() => setModeFilter('school')} 
                style={{
                  padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: '1px solid',
                  borderColor: modeFilter === 'school' ? '#10b981' : 'rgba(56, 189, 248, 0.12)',
                  background: modeFilter === 'school' ? 'rgba(16, 185, 129, 0.1)' : '#070c15',
                  color: modeFilter === 'school' ? '#10b981' : '#94a3b8',
                  transition: 'all 0.2s'
                }}
              >
                School
              </button>
              <button 
                onClick={() => setModeFilter('coaching')} 
                style={{
                  padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: '1px solid',
                  borderColor: modeFilter === 'coaching' ? '#8b5cf6' : 'rgba(56, 189, 248, 0.12)',
                  background: modeFilter === 'coaching' ? 'rgba(139, 92, 246, 0.1)' : '#070c15',
                  color: modeFilter === 'coaching' ? '#8b5cf6' : '#94a3b8',
                  transition: 'all 0.2s'
                }}
              >
                Coaching
              </button>
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="w-full md:w-auto justify-between">
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="pc-cyber-input"
                style={{
                  height: '42px', padding: '0 32px 0 12px', background: '#070c15', width: '150px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 600, color: '#f8fafc', appearance: 'none'
                }}
              >
                <option value="latest">Latest Edited</option>
                <option value="oldest">Oldest Created</option>
                <option value="az">Name A-Z</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredPapers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ display: 'grid', gap: '24px' }}>
              {filteredPapers.map(paper => {
                const totalQ = Object.values(paper.questions || {}).flat().length
                const updatedAtDate = new Date(paper.updatedAt || paper.createdAt)
                const formattedDate = updatedAtDate.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })

                return (
                  <div 
                    key={paper.id}
                    className="pc-cyber-card animate-fadeup"
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      minHeight: '230px',
                      background: 'linear-gradient(135deg, #0b111e, #070c15)',
                      border: '1px solid rgba(56, 189, 248, 0.08)',
                      transition: 'transform 0.2s, border-color 0.2s',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = paper.mode === 'school' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(139, 92, 246, 0.4)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.08)'
                      e.currentTarget.style.transform = 'none'
                    }}
                  >
                    <div>
                      {/* Header row: title and badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', margin: 0, lineHeight: 1.3 }}>
                          {paper.name}
                        </h3>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          background: paper.mode === 'school' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(139, 92, 246, 0.12)',
                          color: paper.mode === 'school' ? '#10b981' : '#a78bfa',
                          border: paper.mode === 'school' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(139, 92, 246, 0.2)',
                          flexShrink: 0
                        }}>
                          {paper.mode}
                        </span>
                      </div>

                      {/* Info Row: Subject & Class */}
                      <div style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#64748b' }}>menu_book</span>
                          <span>{paper.meta.subject || 'No Subject Specified'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#64748b' }}>
                            {paper.mode === 'school' ? 'group' : 'bookmark'}
                          </span>
                          <span>
                            {paper.mode === 'school' 
                              ? `Class ${paper.meta.className || 'N/A'}` 
                              : `Series: ${paper.meta.testSeries || 'N/A'}`}
                          </span>
                        </div>
                      </div>

                      {/* Chip tags derived from metadata */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
                        {paper.meta.subject && (
                          <span style={{ fontSize: '10px', color: '#64748b', background: '#0a0f18', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            {paper.meta.subject.slice(0, 15)}
                          </span>
                        )}
                        {paper.meta.className && (
                          <span style={{ fontSize: '10px', color: '#64748b', background: '#0a0f18', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            Class {paper.meta.className}
                          </span>
                        )}
                        <span style={{ fontSize: '10px', color: '#64748b', background: '#0a0f18', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                          {totalQ} Questions
                        </span>
                      </div>
                    </div>

                    {/* Footer Row: Date and Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '14px', display: 'flex' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                        Edited {formattedDate}
                      </span>
                      
                      <div className="flex items-center gap-1.5 w-full sm:w-auto sm:justify-end" style={{ display: 'flex', gap: '6px' }}>
                        {/* Open & Edit */}
                        <Link 
                          href="/" 
                          onClick={() => handleOpenEdit(paper)}
                          className="pc-print-btn flex-1 sm:flex-initial h-11 sm:h-auto flex items-center justify-center"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            background: paper.mode === 'school' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                            border: '1px solid ' + (paper.mode === 'school' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(139, 92, 246, 0.3)'),
                            color: paper.mode === 'school' ? '#10b981' : '#c084fc',
                            textDecoration: 'none',
                          }}
                        >
                          Open &amp; Edit
                        </Link>
                        
                        {/* Duplicate */}
                        <button 
                          onClick={() => {
                            setPaperToDuplicate(paper)
                            setDuplicateNameInput(paper.name + " (Copy)")
                          }}
                          className="pc-print-btn flex-1 sm:flex-initial h-11 sm:h-auto flex items-center justify-center"
                          style={{ padding: '6px 10px', fontSize: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}
                          title="Duplicate Paper"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
                        </button>

                        {/* Export */}
                        <button 
                          onClick={() => handleExport(paper)}
                          className="pc-print-btn flex-1 sm:flex-initial h-11 sm:h-auto flex items-center justify-center"
                          style={{ padding: '6px 10px', fontSize: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}
                          title="Export JSON"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                        </button>

                        {/* Delete */}
                        <button 
                          onClick={() => setPaperToDelete(paper)}
                          className="pc-print-btn flex-1 sm:flex-initial h-11 sm:h-auto flex items-center justify-center"
                          style={{ padding: '6px 10px', fontSize: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                          title="Delete Paper"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '80px 20px', color: '#64748b', background: 'rgba(11, 17, 30, 0.4)',
              border: '1px dashed rgba(56, 189, 248, 0.1)', borderRadius: '16px', marginTop: '20px'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '64px', color: '#1e293b', display: 'block', marginBottom: '16px' }}>folder_off</span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                {papers.length === 0 ? "No papers saved yet" : "No matching papers found"}
              </h3>
              <p style={{ fontSize: '14px', marginTop: '8px', color: '#64748b', maxWidth: '400px', margin: '8px auto 24px' }}>
                {papers.length === 0 
                  ? "Start by creating a new exam paper or import an existing configuration file." 
                  : "Try adjusting your search keywords or workspace mode filters."}
              </p>
              
              {papers.length === 0 && (
                <Link 
                  href="/" 
                  onClick={() => localStorage.removeItem('papercraft_current_draft')}
                  className="pc-print-btn"
                  style={{
                    background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                  <span>Create Your First Paper</span>
                </Link>
              )}
            </div>
          )}
        </main>

        {/* Mobile Sticky Import Footer */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#070c15] border-t border-slate-800 p-4 z-40">
          <button
            onClick={handleImportClick}
            className="w-full h-12 rounded-xl bg-purple-900/30 border border-purple-500/30 text-purple-400 font-bold flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">upload_file</span>
            <span>Import Paper (.json)</span>
          </button>
        </div>
      </div>

      {/* ── Library Modals ────────────────────────────────────── */}

      {/* ── Delete Confirmation Modal ────────────────────────── */}
      {paperToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div className="pc-cyber-card animate-fadeup" style={{ width: '450px', padding: '24px', background: '#0b111e', border: '1px solid rgba(239, 68, 68, 0.4)', boxShadow: '0 0 30px rgba(239, 68, 68, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '32px' }}>delete_forever</span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>Delete Paper</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
              Are you sure you want to delete <b style={{ color: '#fff' }}>'{paperToDelete.name}'</b>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setPaperToDelete(null)}
                className="pc-print-btn"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="pc-print-btn"
                style={{ background: '#ef4444', color: '#fff', border: 'none' }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Duplicate Paper Modal ────────────────────────────── */}
      {paperToDuplicate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div className="pc-cyber-card animate-fadeup" style={{ width: '450px', padding: '24px', background: '#0b111e', border: '1px solid rgba(6, 182, 212, 0.4)', boxShadow: '0 0 30px rgba(6, 182, 212, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span className="material-symbols-outlined" style={{ color: '#00f2fe', fontSize: '32px' }}>content_copy</span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>Duplicate Paper</h3>
            </div>
            
            <div className="pc-cyber-field" style={{ marginBottom: '20px' }}>
              <label className="pc-cyber-label">Name for the Copy</label>
              <input
                className="pc-cyber-input"
                type="text"
                value={duplicateNameInput}
                onChange={e => setDuplicateNameInput(e.target.value)}
                placeholder="Enter new paper name"
                onKeyDown={e => e.key === 'Enter' && handleDuplicateConfirm()}
                autoFocus
              />
              <span className="material-symbols-outlined pc-cyber-input-icon">description</span>
            </div>

            {duplicateNameError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '13px', marginBottom: '20px', fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>warning</span>
                <span>{duplicateNameError}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setPaperToDuplicate(null)}
                className="pc-print-btn"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDuplicateConfirm}
                className="pc-print-btn"
                disabled={!!duplicateNameError || !duplicateNameInput.trim()}
                style={{ 
                  background: (duplicateNameError || !duplicateNameInput.trim()) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', 
                  color: (duplicateNameError || !duplicateNameInput.trim()) ? '#64748b' : '#fff', 
                  border: 'none',
                  cursor: (duplicateNameError || !duplicateNameInput.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                Duplicate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Rename Prompt Modal ───────────────────────── */}
      {importedPaper && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div className="pc-cyber-card animate-fadeup" style={{ width: '450px', padding: '24px', background: '#0b111e', border: '1px solid rgba(6, 182, 212, 0.4)', boxShadow: '0 0 30px rgba(6, 182, 212, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span className="material-symbols-outlined" style={{ color: '#00f2fe', fontSize: '32px' }}>upload_file</span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>Import Duplicate Paper</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5', marginBottom: '16px' }}>
              A paper named <b style={{ color: '#fff' }}>'{importedPaper.name}'</b> already exists in your library. Enter a new name to import this paper:
            </p>
            
            <div className="pc-cyber-field" style={{ marginBottom: '20px' }}>
              <label className="pc-cyber-label">Import Name</label>
              <input
                className="pc-cyber-input"
                type="text"
                value={importRenameInput}
                onChange={e => setImportRenameInput(e.target.value)}
                placeholder="Enter name for imported paper"
                onKeyDown={e => e.key === 'Enter' && handleImportRenameConfirm()}
                autoFocus
              />
              <span className="material-symbols-outlined pc-cyber-input-icon">description</span>
            </div>

            {importRenameError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '13px', marginBottom: '20px', fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>warning</span>
                <span>{importRenameError}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setImportedPaper(null)}
                className="pc-print-btn"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleImportRenameConfirm}
                className="pc-print-btn"
                disabled={!!importRenameError || !importRenameInput.trim()}
                style={{ 
                  background: (importRenameError || !importRenameInput.trim()) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', 
                  color: (importRenameError || !importRenameInput.trim()) ? '#64748b' : '#fff', 
                  border: 'none',
                  cursor: (importRenameError || !importRenameInput.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                Import Paper
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="pc-footer no-print" style={{ background: '#0b111e', borderTop: '1px solid rgba(56, 189, 248, 0.12)', padding: '24px' }}>
        <div className="pc-footer-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span className="pc-footer-brand" style={{ color: '#fff', fontSize: '13px' }}>Papercraft Academic Systems</span>
            <span className="pc-footer-copy" style={{ color: '#64748b', fontSize: '12px' }}>© 2026 Papercraft Academic Systems</span>
          </div>
          <nav className="pc-footer-links" style={{ display: 'flex', gap: '20px' }}>
            <a href="#" style={{ color: '#64748b', fontSize: '12px' }}>Privacy Policy</a>
            <a href="#" style={{ color: '#64748b', fontSize: '12px' }}>Terms of Service</a>
            <a href="#" style={{ color: '#64748b', fontSize: '12px' }}>Faculty Portal</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
