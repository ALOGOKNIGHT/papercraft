'use client'

import { useState } from 'react'
import { PaperMeta, LayoutSettings, QuestionsMap } from '@/lib/types'
import { SECTIONS } from '@/lib/constants'
import MathText from './MathText'
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'

// Helper function to render bold text marked with double asterisks e.g. **text**
function renderFormattedText(text: string) {
  if (!text) return null
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        return part
      })}
    </>
  )
}

interface Props {
  meta: PaperMeta
  layout: LayoutSettings
  questions: QuestionsMap
  hideControls?: boolean
  isEmbedded?: boolean
  appMode?: 'school' | 'coaching'
}

export const getOrderedKeys = (questionsKeys: string[], sectionOrder?: string[]): string[] => {
  const order = sectionOrder || []
  const ordered = questionsKeys.filter(k => order.includes(k)).sort((a, b) => order.indexOf(a) - order.indexOf(b))
  const unordered = questionsKeys.filter(k => !order.includes(k)).sort()
  return [...ordered, ...unordered]
}

export default function PaperPreview({ meta, layout, questions, hideControls, isEmbedded, appMode = 'coaching' }: Props) {
  const [printMode, setPrintMode] = useState<'single' | 'dual'>('single')
  let globalNum = 1

  const exportToWord = () => {
    const allQs = getOrderedKeys(Object.keys(questions), meta.sectionOrder).flatMap((secId) => questions[secId] || [])

    if (allQs.length === 0) {
      alert('No questions available to export.')
      return
    }

    let docxQNum = 1

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            ...(meta.headerType === 'custom'
              ? [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: 'Custom Header (See PDF for full formatting)', bold: true, size: 24, color: '888888' })],
                  }),
                  new Paragraph({ text: '' }),
                ]
              : [
                  new Paragraph({ children: [new TextRun({ text: meta.examDate || '23/06/2025', bold: true, size: 24 })] }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: '[ Logo / Institute Name Image Placeholder ]', bold: true, size: 24, color: '999999' })],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: 'ADDRESS : Chaturavton ka bera, Ponjala, Mata ka than road, Jodhpur,', bold: true, size: 20 })],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: 'Ph. 9829764378,8619186133', italics: true, size: 20 })],
                  }),
                  new Paragraph({ text: '' }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: `MM : ${meta.maxMarks || (appMode === 'school' ? '80' : '300')}`, bold: true, size: 24 }),
                      new TextRun({ text: `\t\t\t\t\t\t${meta.testSeries || (appMode === 'school' ? 'Half-Yearly Exam-2025-26' : 'Test Series-2025-26')}`, bold: true, size: 24 }),
                      new TextRun({ text: `\t\t\t\t\t\tTime : ${meta.time || (appMode === 'school' ? '3 Hours' : '180 Min.')}`, bold: true, size: 24 }),
                    ],
                  }),
                  new Paragraph({ text: '' }),
                  new Paragraph({ children: [new TextRun({ text: 'Topics Covered:', bold: true, size: 24 })] }),
                  ...(meta.topicsCovered
                    ? meta.topicsCovered
                        .split('\n')
                        .filter(Boolean)
                        .map((line) => new Paragraph({ children: [new TextRun({ text: line, size: 24 })] }))
                    : [
                        new Paragraph({ children: [new TextRun({ text: 'Physics: Motion in 1-D', size: 24 })] }),
                        new Paragraph({ children: [new TextRun({ text: 'Chemistry: Redox Reaction', size: 24 })] }),
                        new Paragraph({ children: [new TextRun({ text: 'Biology: Cell', size: 24 })] }),
                      ]),
                  new Paragraph({ text: '' }),
                  ...(meta.instructions
                    ? [
                        new Paragraph({ children: [new TextRun({ text: 'General Instrutions :', bold: true, size: 24 })] }),
                        ...meta.instructions
                          .split('\n')
                          .filter(Boolean)
                          .map((line) => new Paragraph({ children: [new TextRun({ text: line, size: 24 })] })),
                        new Paragraph({ text: '' }),
                      ]
                    : []),
                ]),
            ...getOrderedKeys(Object.keys(questions), meta.sectionOrder).flatMap((secId) => {
              const qs = questions[secId] || []
              if (qs.length === 0) return []

              return [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  border: {
                    top: { style: 'single', size: 12, color: '000000' },
                    bottom: { style: 'single', size: 12, color: '000000' },
                    left: { style: 'single', size: 12, color: '000000' },
                    right: { style: 'single', size: 12, color: '000000' },
                  },
                  children: [new TextRun({ text: ` ${(meta.customSectionNames?.[secId] || `Section ${secId}`).toUpperCase()} `, bold: true, size: 28 })],
                }),
                new Paragraph({ text: '' }),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    ...qs.map((q) => {
                      const cellParagraphs = [new Paragraph({ text: q.text })]
                      if (q.type === 'MCQ' && q.options && q.options.length > 0) {
                        cellParagraphs.push(new Paragraph({ text: '' }))
                        if (layout.mcqLayout === '4-col') {
                          cellParagraphs.push(new Paragraph({ text: `A) ${q.options[0]}      B) ${q.options[1]}      C) ${q.options[2]}      D) ${q.options[3]}` }))
                        } else if (layout.mcqLayout === '1-col') {
                          q.options.forEach((opt, i) => cellParagraphs.push(new Paragraph({ text: `${String.fromCharCode(65 + i)}) ${opt}` })))
                        } else {
                          cellParagraphs.push(new Paragraph({ text: `A) ${q.options[0]}            B) ${q.options[1]}` }))
                          cellParagraphs.push(new Paragraph({ text: `C) ${q.options[2]}            D) ${q.options[3]}` }))
                        }
                      }

                      const qNoPct = Math.max(5, Math.min(25, (layout.qNoWidth || 40) / 4))
                      return new TableRow({
                        children: [
                          new TableCell({ width: { size: qNoPct, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: `Q.${docxQNum++}.` })] }),
                          new TableCell({ width: { size: 100 - qNoPct, type: WidthType.PERCENTAGE }, children: cellParagraphs }),
                        ],
                      })
                    }),
                  ],
                }),
                new Paragraph({ text: '' }),
                new Paragraph({ text: '' }),
              ]
            }),
          ],
        },
      ],
    })
    Packer.toBlob(doc).then((blob) => saveAs(blob, `${meta.subject || 'Exam'}_Paper.docx`))
  }

  const handlePrint = (mode: 'single' | 'dual') => {
    setPrintMode(mode)
    setTimeout(() => {
      window.print()
    }, 200)
  }

  return (
    <div className="preview-shell" style={{ background: isEmbedded ? 'transparent' : 'transparent', minHeight: isEmbedded ? 'auto' : '100vh', padding: isEmbedded ? '0' : '24px' }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          .no-print { display: none !important; }
          .preview-shell {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
          }
          @page {
            size: ${printMode === 'dual' ? 'A4 landscape' : 'A4 portrait'};
            margin: 0 !important;
          }
          body, html {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
          }
          .paper-sheet {
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
          }
          .watermark-img {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
          }
          .unified-columns {
            column-count: 2 !important;
            column-fill: auto !important;
            -webkit-column-fill: auto !important;
            -moz-column-fill: auto !important;
            column-gap: 28px !important;
            column-rule: 1px dashed rgba(0,0,0,0.1) !important;
          }
        }
      `,
        }}
      />

      {!hideControls && (
        <div className="no-print" style={{ maxWidth: '1180px', margin: '0 auto 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="pc-glass-card">
            <div className="pc-card-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <div className="pc-kicker">Final Preview</div>
                <div style={{ fontSize: '28px', fontWeight: '700', fontFamily: "'Montserrat', sans-serif", color: '#1a1a2e', marginBottom: '6px' }}>Print &amp; Export</div>
                <div style={{ color: '#47464c' }}>Review the final paper and export it without changing the existing question paper template.</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button className="pc-button-ghost" onClick={() => handlePrint('single')}>
                  Print 1-Per-Sheet
                </button>
                <button className="pc-button-secondary" onClick={() => handlePrint('dual')}>
                  Print 2-Per-Sheet
                </button>
                <button className="pc-button-primary" onClick={exportToWord}>
                  Download Word
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="paper-sheet"
        style={{
          background: '#fff',
          width: printMode === 'dual' ? '297mm' : '210mm',
          minHeight: printMode === 'dual' ? '210mm' : '297mm',
          margin: '0 auto',
          padding: `${layout.marginTop}mm ${layout.marginRight}mm ${layout.marginBottom}mm ${layout.marginLeft}mm`,
          boxSizing: 'border-box',
          columnCount: printMode === 'dual' ? 2 : 1,
          columnGap: printMode === 'dual' ? '25mm' : 'normal',
          columnRule: printMode === 'dual' ? '1.5px solid #000' : 'none',
          fontFamily: layout.fontFamily,
          fontSize: layout.questionFontSize + 'px',
          lineHeight: layout.lineHeight,
          color: '#000',
          position: 'relative',
        }}
      >
        {layout.watermarkEnabled && meta.logo && (
          <img
            className="watermark-img"
            src={meta.logo}
            alt="watermark"
            style={{
              position: 'absolute',
              top: `calc(148.5mm + ${layout.watermarkYOffset || 0}mm)`,
              left: `calc(50% + ${layout.watermarkXOffset || 0}mm)`,
              transform: `translate(-50%, -50%) rotate(${layout.watermarkRotation}deg) scale(${layout.watermarkScale / 100})`,
              opacity: layout.watermarkOpacity,
              pointerEvents: 'none',
              zIndex: 0,
              maxWidth: '80%',
              maxHeight: '80%',
            }}
          />
        )}

        <div style={{ breakInside: 'avoid', marginBottom: '20px' }}>
          {meta.headerType === 'custom' ? (
            <div className="custom-header-preview" dangerouslySetInnerHTML={{ __html: meta.customHeaderHTML || '<div style="text-align: center; color: #999;">Empty Custom Header</div>' }} />
          ) : appMode === 'school' ? (
            /* ── SCHOOL MODE HEADER ─────────────────────────── */
            <div style={{ fontFamily: "'Times New Roman', serif" }}>
              {/* Row 1: Logo + School Name */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '4px' }}>
                {meta.logo && (
                  <img src={meta.logo} alt="school logo" style={{ height: `${layout.logoSize || 64}px`, objectFit: 'contain' }} />
                )}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: `${layout.schoolNameSize || 18}px`, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {meta.schoolName || 'School Name'}
                  </div>
                  {/* Row 2: Branch */}
                  {(meta.schoolBranch || meta.city) && (
                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '2px' }}>
                      {meta.schoolBranch || meta.city}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Examination Name */}
              <div style={{ textAlign: 'center', fontSize: `${layout.examTitleSize || 15}px`, fontWeight: 'bold', marginTop: '6px', marginBottom: '8px' }}>
                ({meta.examTitle || 'Examination Name'})
              </div>

              {/* Divider */}
              <hr style={{ border: 'none', borderTop: '2px solid #000', margin: '6px 0' }} />

              {/* Row 4: Class / Subject / Time / FM */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', padding: '6px 0' }}>
                <span>Class:- {meta.className || 'X'}</span>
                <span>Subject:- {meta.subject || 'Mathematics'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', paddingBottom: '6px' }}>
                <span>Time:- {meta.time || '3 Hrs.'}</span>
                <span>F.M.:- {meta.maxMarks || '80'}</span>
              </div>

              {/* Divider */}
              <hr style={{ border: 'none', borderTop: '2px solid #000', margin: '6px 0' }} />

              {/* General Instructions */}
              {meta.instructions && (
                <div style={{ marginTop: '10px', marginBottom: '10px', fontSize: `${layout.instructionFontSize}px`, lineHeight: '1.6' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px', textDecoration: 'underline' }}>General Instructions:</div>
                  <div>
                    {meta.instructions.split('\n').filter(Boolean).map((line, i) => (
                      <div key={i} style={{ paddingLeft: '8px' }}>
                        {i + 1}. {renderFormattedText(line)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Divider */}
              <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '6px 0 14px' }} />
            </div>
          ) : (
            /* ── COACHING MODE HEADER (original, unchanged) ─── */
            <>
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '15px', zIndex: 1 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, border: '2px solid #000', padding: '4px 10px', fontWeight: 'bold', fontSize: '14px', background: '#fff' }}>
                  {meta.examDate || '23/06/2025'}
                </div>

                {meta.logo ? (
                  <img src={meta.logo} alt="logo" style={{ maxHeight: `${layout.logoSize || 120}px`, maxWidth: '100%', objectFit: 'contain', display: 'block', marginLeft: 'auto', marginRight: 'auto', marginBottom: `${layout.logoAddressGap ?? 10}px` }} />
                ) : (
                  <div style={{ width: '100%', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', border: '1px dashed #ccc', marginBottom: `${layout.logoAddressGap ?? 10}px` }}>
                    [Upload Logo / Institute Name Image]
                  </div>
                )}

                <div style={{ fontSize: '12px', marginTop: '0px', lineHeight: '1.4', textAlign: 'center' }}>
                  <b>ADDRESS :</b> Chaturavton ka bera, Ponjala, Mata ka than road, Jodhpur,
                  <br />
                  <i>Ph. 9829764378,8619186133</i>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginBottom: '15px' }}>
                <span>MM : {meta.maxMarks || '300'}</span>
                <span>{meta.testSeries || 'Test Series-2025-26'}</span>
                <span>Time : {meta.time || '180 Min.'}</span>
              </div>

              <div style={{ border: '1px solid #999', borderRadius: '15px', padding: `${layout.topicsCoveredBoxPadding}px`, background: '#e8e8e8', marginBottom: '20px' }}>
                <div style={{ fontWeight: 'bold', fontSize: `${layout.topicsCoveredFontSize}px`, marginBottom: `${layout.topicsCoveredHeadingGap}px` }}>Topics Covered:</div>
                <div style={{ lineHeight: '1.8', fontSize: `${layout.topicsCoveredFontSize}px` }}>
                  {meta.topicsCovered ? (
                    meta.topicsCovered.split('\n').filter(Boolean).map((line, i) => {
                      const parts = line.split(':')
                      if (parts.length > 1) {
                        return (
                          <div key={i}>
                            <b>{renderFormattedText(parts[0])}:</b> {renderFormattedText(parts.slice(1).join(':'))}
                          </div>
                        )
                      }
                      return <div key={i}>{renderFormattedText(line)}</div>
                    })
                  ) : (
                    <>
                      <div>
                        <b>Physics:</b> Motion in 1-D
                      </div>
                      <div>
                        <b>Chemistry:</b> Redox Reaction
                      </div>
                      <div>
                        <b>Biology:</b> Cell
                      </div>
                    </>
                  )}
                </div>
              </div>

              {meta.instructions && (
                <div style={{ border: '1px solid #000', padding: '10px', marginBottom: '20px', fontSize: `${layout.instructionFontSize}px`, lineHeight: '1.5' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>General Instructions :</div>
                  <div>
                    {meta.instructions.split('\n').filter(Boolean).map((line, i) => (
                      <div key={i}>{renderFormattedText(line)}</div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {(() => {
          const activeSections = getOrderedKeys(Object.keys(questions), meta.sectionOrder).filter(secId => (questions[secId] || []).length > 0)

          if (activeSections.length === 0) {
            return (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontFamily: 'inherit' }}>
                No questions added yet. Please add questions in the Editor.
              </div>
            )
          }

          const firstSecId = activeSections[0]
          const otherSecIds = activeSections.slice(1)

          // Compile a flat list of direct children for the columns container
          const columnItems: (
            | { type: 'heading'; secId: string; title: string; description: string }
            | { type: 'question'; q: any; globalIndex: number }
          )[] = []

          let globalQIndex = 1

          // First section's questions go directly into the columns flow (its heading is rendered outside)
          const firstSecQs = questions[firstSecId] || []
          firstSecQs.forEach(q => {
            columnItems.push({
              type: 'question',
              q,
              globalIndex: globalQIndex++
            })
          })

          // Subsequent sections and their questions
          otherSecIds.forEach(secId => {
            columnItems.push({
              type: 'heading',
              secId,
              title: meta.customSectionNames?.[secId] || `Section ${secId}`,
              description: meta.customSectionDescriptions?.[secId] || ''
            })

            const secQs = questions[secId] || []
            secQs.forEach(q => {
              columnItems.push({
                type: 'question',
                q,
                globalIndex: globalQIndex++
              })
            })
          })

          const borderStr = layout.tableBorder === 'none' ? 'none' : `${layout.borderWidth}px ${layout.tableBorder} #000`

          return (
            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* First Section Heading: Centered at full width above columns */}
              <div style={{ textAlign: 'center', marginBottom: '20px', zIndex: 1, position: 'relative' }}>
                <span
                  style={{
                    border: `${layout.tableBorder === 'none' ? 2 : Math.max(2, layout.borderWidth)}px ${layout.tableBorder === 'none' ? 'solid' : layout.tableBorder} #000`,
                    padding: '6px 20px',
                    fontWeight: '900',
                    fontSize: `${layout.sectionTitleSize}px`,
                    display: 'inline-block',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  {(meta.customSectionNames?.[firstSecId] || `Section ${firstSecId}`).toUpperCase()}
                </span>
                {meta.customSectionDescriptions?.[firstSecId] && (
                  <div style={{ fontSize: `${layout.questionFontSize - 1}px`, fontStyle: 'italic', marginTop: '6px', color: '#333', fontWeight: 500 }}>
                    {meta.customSectionDescriptions[firstSecId]}
                  </div>
                )}
              </div>

              {/* Single Unified Two-Column Container */}
              <div
                className="unified-columns"
                style={{
                  columnCount: 2,
                  columnFill: 'balance', // Screen preview defaults to balanced to display columns properly without page limits
                  columnGap: '28px',
                  columnRule: '1px dashed rgba(0,0,0,0.1)',
                  width: '100%',
                  position: 'relative',
                  zIndex: 1,
                  boxSizing: 'border-box'
                }}
              >
                {columnItems.map((item, idx) => {
                  if (item.type === 'heading') {
                    return (
                      <div
                        key={`heading-${item.secId}`}
                        style={{
                          textAlign: 'center',
                          marginTop: '20px',
                          marginBottom: '16px',
                          breakInside: 'avoid',
                          boxSizing: 'border-box'
                        }}
                      >
                        <span
                          style={{
                            border: `${layout.tableBorder === 'none' ? 2 : Math.max(2, layout.borderWidth)}px ${layout.tableBorder === 'none' ? 'solid' : layout.tableBorder} #000`,
                            padding: '6px 20px',
                            fontWeight: '900',
                            fontSize: `${layout.sectionTitleSize}px`,
                            display: 'inline-block',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.title.toUpperCase()}
                        </span>
                        {item.description && (
                          <div style={{ fontSize: `${layout.questionFontSize - 1}px`, fontStyle: 'italic', marginTop: '6px', color: '#333', fontWeight: 500 }}>
                            {item.description}
                          </div>
                        )}
                      </div>
                    )
                  } else {
                    const { q, globalIndex } = item
                    return (
                      <div
                        key={q.id}
                        style={{
                          display: 'flex',
                          gap: '10px',
                          alignItems: 'flex-start',
                          padding: `${layout.questionSpacing}px 0`,
                          borderBottom: borderStr,
                          breakInside: 'avoid',
                          boxSizing: 'border-box'
                        }}
                      >
                        <span style={{ fontWeight: '700', flexShrink: 0, minWidth: '24px', textAlign: 'right' }}>
                          {globalIndex}.
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: `${layout.questionFontSize}px`, lineHeight: layout.lineHeight, color: '#000', fontWeight: 500 }}>
                            <MathText content={q.text} />
                          </div>

                          {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: layout.mcqLayout === '1-col' ? '1fr' : layout.mcqLayout === '4-col' ? '1fr 1fr 1fr 1fr' : '1fr 1fr',
                                gap: '6px',
                                marginTop: '8px',
                                fontSize: `${layout.questionFontSize - 1}px`,
                              }}
                            >
                              {q.options.map((opt: string, i: number) => (
                                <div key={i} style={{ display: 'flex', gap: '4px', alignItems: 'baseline', color: '#000' }}>
                                  <span style={{ fontWeight: '700' }}>{String.fromCharCode(65 + i)})</span>
                                  <MathText content={opt} />
                                </div>
                              ))}
                            </div>
                          )}

                          {q.image && (
                            <div style={{ marginTop: '10px', textAlign: 'center' }}>
                              <img src={q.image} alt="diagram" style={{ maxWidth: '100%', maxHeight: '140px', objectFit: 'contain' }} />
                            </div>
                          )}

                          {/* Match the Column table */}
                          {q.type === 'Match the Column' && q.matchColumnA && q.matchColumnB && (
                            <div style={{ marginTop: '10px' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: `${layout.questionFontSize - 1}px` }}>
                                <thead>
                                  <tr>
                                    <th style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 'bold', textAlign: 'center', width: '50%' }}>Column A</th>
                                    <th style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 'bold', textAlign: 'center', width: '50%' }}>Column B</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Array.from({ length: Math.max(q.matchColumnA.length, q.matchColumnB.length) }).map((_, i) => (
                                    <tr key={i}>
                                      <td style={{ border: '1px solid #000', padding: '4px 8px' }}>
                                        {q.matchColumnA![i] ? `${i + 1}. ${q.matchColumnA![i]}` : ''}
                                      </td>
                                      <td style={{ border: '1px solid #000', padding: '4px 8px' }}>
                                        {q.matchColumnB![i] ? `${String.fromCharCode(97 + i)}. ${q.matchColumnB![i]}` : ''}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* OR question */}
                          {q.hasOr && q.orQuestion && (
                            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #000' }}>
                              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', margin: '4px 0 8px' }}>OR</div>
                              <div style={{ fontSize: `${layout.questionFontSize}px`, lineHeight: layout.lineHeight, color: '#000', fontWeight: 500 }}>
                                <MathText content={q.orQuestion.text} />
                              </div>
                              {q.orQuestion.type === 'MCQ' && q.orQuestion.options && q.orQuestion.options.length > 0 && (
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: layout.mcqLayout === '1-col' ? '1fr' : layout.mcqLayout === '4-col' ? '1fr 1fr 1fr 1fr' : '1fr 1fr',
                                  gap: '6px', marginTop: '8px', fontSize: `${layout.questionFontSize - 1}px`,
                                }}>
                                  {q.orQuestion.options.map((opt: string, i: number) => (
                                    <div key={i} style={{ display: 'flex', gap: '4px', alignItems: 'baseline', color: '#000' }}>
                                      <span style={{ fontWeight: '700' }}>{String.fromCharCode(65 + i)})</span>
                                      <MathText content={opt} />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }
                })}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
