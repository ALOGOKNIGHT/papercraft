'use client'

import { useState } from 'react'
import { PaperMeta, LayoutSettings, QuestionsMap } from '@/lib/types'
import { SECTIONS } from '@/lib/constants'
import MathText from './MathText'
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'

interface Props {
  meta: PaperMeta
  layout: LayoutSettings
  questions: QuestionsMap
  hideControls?: boolean
  isEmbedded?: boolean
}

export default function PaperPreview({ meta, layout, questions, hideControls, isEmbedded }: Props) {
  const [printMode, setPrintMode] = useState<'single' | 'dual'>('single')
  let globalNum = 1

  const exportToWord = () => {
    const allQs = SECTIONS.flatMap((sec) => questions[sec.id] || [])

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
                    children: [new TextRun({ text: 'Corporate Office : Chaturavton ka bera, Ponjala, Mata ka than road, Jodhpur,', bold: true, size: 20 })],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: 'Ph. 9829764378,8619186133', italics: true, size: 20 })],
                  }),
                  new Paragraph({ text: '' }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: `MM : ${meta.maxMarks || '300'}`, bold: true, size: 24 }),
                      new TextRun({ text: `\t\t\t\t\t\t${meta.testSeries || 'Test Series-2025-26'}`, bold: true, size: 24 }),
                      new TextRun({ text: `\t\t\t\t\t\tTime : ${meta.time || '180 Min.'}`, bold: true, size: 24 }),
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
            ...SECTIONS.flatMap((sec) => {
              const qs = questions[sec.id] || []
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
                  children: [new TextRun({ text: ` ${(meta.customSectionNames?.[sec.id] || sec.label).toUpperCase()} `, bold: true, size: 28 })],
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
                          cellParagraphs.push(new Paragraph({ text: `(a) ${q.options[0]}      (b) ${q.options[1]}      (c) ${q.options[2]}      (d) ${q.options[3]}` }))
                        } else if (layout.mcqLayout === '1-col') {
                          q.options.forEach((opt, i) => cellParagraphs.push(new Paragraph({ text: `(${String.fromCharCode(97 + i)}) ${opt}` })))
                        } else {
                          cellParagraphs.push(new Paragraph({ text: `(a) ${q.options[0]}            (b) ${q.options[1]}` }))
                          cellParagraphs.push(new Paragraph({ text: `(c) ${q.options[2]}            (d) ${q.options[3]}` }))
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
              top: '148.5mm',
              left: '50%',
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
          ) : (
            <>
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '15px', zIndex: 1 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, border: '2px solid #000', padding: '4px 10px', fontWeight: 'bold', fontSize: '14px', background: '#fff' }}>
                  {meta.examDate || '23/06/2025'}
                </div>

                {meta.logo ? (
                  <img src={meta.logo} alt="logo" style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                ) : (
                  <div style={{ width: '100%', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', border: '1px dashed #ccc' }}>
                    [Upload Logo / Institute Name Image]
                  </div>
                )}

                <div style={{ fontSize: '12px', marginTop: '5px', lineHeight: '1.4', textAlign: 'center' }}>
                  <b>Corporate Office :</b> Chaturavton ka bera, Ponjala, Mata ka than road, Jodhpur,
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
                            <b>{parts[0]}:</b> {parts.slice(1).join(':')}
                          </div>
                        )
                      }
                      return <div key={i}>{line}</div>
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
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>General Instrutions :</div>
                  <div>
                    {meta.instructions.split('\n').filter(Boolean).map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {SECTIONS.map((sec) => {
          const qs = questions[sec.id] || []
          if (qs.length === 0) return null

          const borderStr = layout.tableBorder === 'none' ? 'none' : `${layout.borderWidth}px ${layout.tableBorder} #000`

          return (
            <div key={sec.id} style={{ breakInside: 'auto', marginBottom: `${layout.sectionSpacing}px` }}>
              <div style={{ textAlign: 'center', marginBottom: '12px', zIndex: 1, position: 'relative' }}>
                <span
                  style={{
                    border: `${layout.tableBorder === 'none' ? 2 : Math.max(2, layout.borderWidth)}px ${layout.tableBorder === 'none' ? 'solid' : layout.tableBorder} #000`,
                    padding: '6px 20px',
                    fontWeight: '900',
                    fontSize: `${layout.sectionTitleSize}px`,
                    display: 'inline-block',
                    borderRadius: '4px',
                  }}
                >
                  {(meta.customSectionNames?.[sec.id] || sec.label).toUpperCase()}
                </span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', position: 'relative', zIndex: 1 }}>
                <tbody>
                  {qs.map((q) => (
                    <tr key={q.id} style={{ breakInside: 'avoid' }}>
                      <td style={{ width: `${layout.qNoWidth || 40}px`, border: borderStr, textAlign: 'center', verticalAlign: 'top', padding: `${layout.questionSpacing}px 10px`, fontWeight: '700' }}>
                        Q.{globalNum++}.
                      </td>
                      <td style={{ border: borderStr, padding: `${layout.questionSpacing}px 15px`, verticalAlign: 'top' }}>
                        <MathText content={q.text} />

                        {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: layout.mcqLayout === '1-col' ? '1fr' : layout.mcqLayout === '4-col' ? '1fr 1fr 1fr 1fr' : '1fr 1fr',
                              gap: '8px',
                              marginTop: '10px',
                            }}
                          >
                            {q.options.map((opt, i) => (
                              <div key={i} style={{ display: 'flex', gap: '8px' }}>
                                <span style={{ fontWeight: '700' }}>({String.fromCharCode(97 + i)})</span>
                                <MathText content={opt} />
                              </div>
                            ))}
                          </div>
                        )}

                        {q.image && (
                          <div style={{ marginTop: '15px', textAlign: 'center' }}>
                            <img src={q.image} alt="diagram" style={{ maxWidth: '100%', maxHeight: '180px' }} />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </div>
  )
}
