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
    <div className="max-w-[800px] mx-auto space-y-lg">
      {/* Upload Area Section */}
      <section className="glass-card rounded-xl p-lg relative overflow-hidden staple-accent hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-8 reveal-delay-1">
        <div className="text-center">
          <h3 className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant mb-md">Header Small Logo &amp; Sample</h3>
          <button
            type="button"
            onClick={() => logoRef.current?.click()}
            className="w-full border-2 border-dashed border-outline-variant rounded-xl p-xl flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-low transition-colors group"
          >
            {meta.logo ? (
              <img src={meta.logo} alt="logo preview" style={{ maxHeight: '112px', maxWidth: '100%', objectFit: 'contain' }} />
            ) : (
              <>
                <span className="material-symbols-outlined text-4xl text-outline mb-sm group-hover:scale-110 transition-transform">upload_file</span>
                <p className="font-body-md text-body-md text-on-surface-variant">Click to upload header image</p>
                <span className="font-caption text-caption text-outline-variant mt-xs">PNG / JPG (Max 5MB)</span>
              </>
            )}
          </button>
          <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} style={{ display: 'none' }} />
        </div>
      </section>

      {/* Exam Details Section */}
      <section className="glass-card rounded-xl p-lg space-y-lg staple-accent hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-8 reveal-delay-2">
        <div className="flex items-center gap-sm mb-md border-b border-outline-variant/20 pb-base">
          <span className="material-symbols-outlined text-secondary">description</span>
          <h2 className="font-headline-md text-headline-md text-primary">EXAM DETAILS</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {/* Date */}
          <div className="space-y-xs">
            <label className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant block">Date</label>
            <input className="w-full bg-transparent border-b-2 border-outline-variant focus:border-[#0070FF] focus:ring-0 transition-all py-sm px-xs placeholder:text-outline-variant font-body-md text-body-md hover:border-outline focus:scale-[1.01] transition-all duration-200" value={meta.examDate || ''} onChange={set('examDate')} placeholder="e.g. 23/10/2025" type="text" />
          </div>
          {/* Test Series */}
          <div className="space-y-xs">
            <label className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant block">Test Series</label>
            <input className="w-full bg-transparent border-b-2 border-outline-variant focus:border-[#0070FF] focus:ring-0 transition-all py-sm px-xs placeholder:text-outline-variant font-body-md text-body-md hover:border-outline focus:scale-[1.01] transition-all duration-200" value={meta.testSeries || ''} onChange={set('testSeries')} placeholder="e.g. End Nov 2023.23" type="text" />
          </div>
          {/* Max Marks */}
          <div className="space-y-xs">
            <label className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant block">Maximum Marks</label>
            <input className="w-full bg-transparent border-b-2 border-outline-variant focus:border-[#0070FF] focus:ring-0 transition-all py-sm px-xs placeholder:text-outline-variant font-body-md text-body-md hover:border-outline focus:scale-[1.01] transition-all duration-200" value={meta.maxMarks} onChange={set('maxMarks')} placeholder="80" type="number" />
          </div>
          {/* Time */}
          <div className="space-y-xs">
            <label className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant block">Time Allowed</label>
            <input className="w-full bg-transparent border-b-2 border-outline-variant focus:border-[#0070FF] focus:ring-0 transition-all py-sm px-xs placeholder:text-outline-variant font-body-md text-body-md hover:border-outline focus:scale-[1.01] transition-all duration-200" value={meta.time} onChange={set('time')} placeholder="3 Hours" type="text" />
          </div>
        </div>

        {/* Topics Covered */}
        <div className="space-y-xs pt-base">
          <label className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant block">Topics Covered</label>
          <textarea className="w-full bg-surface-container-low border-2 border-transparent focus:border-[#0070FF] focus:ring-0 rounded-lg transition-all p-md placeholder:text-outline-variant font-body-md text-body-md hover:bg-surface-container-high focus:scale-[1.01] transition-all duration-200" value={meta.topicsCovered || ''} onChange={set('topicsCovered')} placeholder="Write one topic per line" rows={4} />
        </div>

        {/* Instructions */}
        <div className="space-y-xs pt-base">
          <label className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant block">Instructions (One per line)</label>
          <textarea className="w-full bg-surface-container-low border-2 border-transparent focus:border-[#0070FF] focus:ring-0 rounded-lg transition-all p-md font-body-md text-body-md hover:bg-surface-container-high focus:scale-[1.01] transition-all duration-200" value={meta.instructions} onChange={set('instructions')} rows={8} />
        </div>
      </section>

      {/* Footer CTA Area */}
      <div className="flex justify-center pt-lg pb-xl">
        <button type="button" onClick={onNext} className="group relative px-xl py-md bg-primary-container text-on-primary-fixed rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFD400] to-[#0070FF] opacity-0 group-hover:opacity-20 transition-opacity"></div>
          <div className="flex items-center gap-md relative z-10">
            <span className="font-headline-md text-headline-md">Continue to Question Editor</span>
            <span className="material-symbols-outlined text-3xl group-hover:translate-x-2 transition-transform">arrow_forward</span>
          </div>
        </button>
      </div>
    </div>
  )
}
