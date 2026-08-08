'use client'

import { useState, useEffect } from 'react'
import { PaperMeta, LayoutSettings, QuestionsMap } from '@/lib/types'
import { SECTIONS } from '@/lib/constants'
import MathText from './MathText'
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, ImageRun, BorderStyle, VerticalAlign, PageOrientation } from 'docx'
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

function docxRenderFormattedText(text: string, options: any = {}): TextRun[] {
  if (!text) return []
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part) => {
    const isBold = part.startsWith('**') && part.endsWith('**')
    const cleanText = isBold ? part.slice(2, -2) : part
    return new TextRun({
      text: cleanText,
      bold: isBold || options.bold,
      size: options.size,
      color: options.color,
      font: options.font,
      underline: options.underline,
    })
  })
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
  const [printMode, setPrintMode] = useState<'single' | 'dual'>(
    layout.pagesPerSheet === '2' ? 'dual' : 'single'
  )

  useEffect(() => {
    setPrintMode(layout.pagesPerSheet === '2' ? 'dual' : 'single')
  }, [layout.pagesPerSheet])

  let globalNum = 1

  const exportToWord = () => {
    const allQs = getOrderedKeys(Object.keys(questions), meta.sectionOrder).flatMap((secId) => questions[secId] || [])

    if (allQs.length === 0) {
      alert('No questions available to export.')
      return
    }

    let docxQNum = 1

    // Helper to extract base64 data and decode to Uint8Array for docx ImageRun
    const getImageData = (imageStr: string | null | undefined): Uint8Array | null => {
      if (!imageStr) return null
      const match = imageStr.match(/^data:image\/(\w+);base64,(.+)$/)
      if (match) {
        try {
          const base64Data = match[2]
          const binaryString = window.atob(base64Data)
          const len = binaryString.length
          const bytes = new Uint8Array(len)
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          return bytes
        } catch (e) {
          console.error("Failed to decode base64 image", e)
          return null
        }
      }
      return null
    }

    const logoBytes = getImageData(meta.logo)
    let logoImageRun: ImageRun | null = null
    if (logoBytes) {
      const logoH = layout.logoSize || (appMode === 'school' ? 64 : 120)
      logoImageRun = new ImageRun({
        data: logoBytes,
        transformation: {
          width: logoH,
          height: logoH,
        },
      })
    }

    // Build the header children
    const headerChildren: any[] = []

    if (meta.headerType === 'custom') {
      headerChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Custom Header (See PDF for full formatting)', bold: true, size: 24, color: '888888' })],
        }),
        new Paragraph({ text: '' })
      )
    } else if (appMode === 'school') {
      // Row 1: School Name + Logo (if any)
      headerChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          },
          rows: [
            new TableRow({
              children: [
                ...(logoImageRun
                  ? [
                      new TableCell({
                        width: { size: 15, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        children: [new Paragraph({ children: [logoImageRun], alignment: AlignmentType.RIGHT })],
                      }),
                    ]
                  : []),
                new TableCell({
                  width: { size: logoImageRun ? 85 : 100, type: WidthType.PERCENTAGE },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: (meta.schoolName || 'School Name').toUpperCase(),
                          bold: true,
                          size: (layout.schoolNameSize || 18) * 2,
                        }),
                      ],
                    }),
                    ...((meta.schoolBranch || meta.city)
                      ? [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: meta.schoolBranch || meta.city,
                                bold: true,
                                size: 24,
                              }),
                            ],
                          }),
                        ]
                      : []),
                  ],
                }),
              ],
            }),
          ],
        }),
        new Paragraph({ text: '' })
      )

      // Row 3: Examination Name
      headerChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `(${meta.examTitle || 'Examination Name'})`,
              bold: true,
              size: (layout.examTitleSize || 15) * 2,
            }),
          ],
        })
      )

      // Divider Line 1
      headerChildren.push(
        new Paragraph({
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 16, color: '000000' }
          },
          text: ''
        }),
        new Paragraph({ text: '' })
      )

      // Row 4: Class / Subject / Time / FM
      headerChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Class:- ${meta.className || 'X'}`,
                          bold: true,
                          size: 24,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({
                          text: `Subject:- ${meta.subject || 'Mathematics'}`,
                          bold: true,
                          size: 24,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Time:- ${meta.time || '3 Hrs.'}`,
                          bold: true,
                          size: 24,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({
                          text: `F.M.:- ${meta.maxMarks || '80'}`,
                          bold: true,
                          size: 24,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      )

      // Divider Line 2
      headerChildren.push(
        new Paragraph({
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 16, color: '000000' }
          },
          text: ''
        }),
        new Paragraph({ text: '' })
      )

      // General Instructions
      if (meta.instructions) {
        headerChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'General Instructions:',
                bold: true,
                underline: {},
                size: (layout.instructionFontSize || 12) * 2,
              }),
            ],
          })
        )
        meta.instructions.split('\n').filter(Boolean).forEach((line, i) => {
          headerChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${i + 1}. `,
                  size: (layout.instructionFontSize || 12) * 2,
                }),
                ...docxRenderFormattedText(line, { size: (layout.instructionFontSize || 12) * 2 }),
              ],
            })
          )
        })
        headerChildren.push(new Paragraph({ text: '' }))
      }
    } else {
      // Coaching Mode Header
      // Row 1: Date + Logo/Placeholder
      headerChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 16, color: '000000' },
                    bottom: { style: BorderStyle.SINGLE, size: 16, color: '000000' },
                    left: { style: BorderStyle.SINGLE, size: 16, color: '000000' },
                    right: { style: BorderStyle.SINGLE, size: 16, color: '000000' },
                  },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: meta.examDate || '23/06/2025',
                          bold: true,
                          size: 24,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    ...(logoImageRun
                      ? [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [logoImageRun],
                          }),
                        ]
                      : [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: '[ Logo / Institute Name Image Placeholder ]',
                                bold: true,
                                size: 24,
                                color: '999999',
                              }),
                            ],
                          }),
                        ]),
                  ],
                }),
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  children: [],
                }),
              ],
            }),
          ],
        }),
        new Paragraph({ text: '' })
      )

      // Address & Phone
      headerChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'ADDRESS : ',
              bold: true,
              size: 20,
            }),
            new TextRun({
              text: 'Chaturavton ka bera, Ponjala, Mata ka than road, Jodhpur,',
              size: 20,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Ph. 9829764378,8619186133',
              italics: true,
              size: 20,
            }),
          ],
        }),
        new Paragraph({ text: '' })
      )

      // Test Series
      headerChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: meta.testSeries || 'Test Series-2025-26',
              bold: true,
              size: 28,
            }),
          ],
        }),
        new Paragraph({ text: '' })
      )

      // Topics Covered shaded box
      const topicsParagraphs: Paragraph[] = [
        new Paragraph({
          children: [
            new TextRun({
              text: 'Topics Covered:',
              bold: true,
              size: (layout.topicsCoveredFontSize || 12) * 2,
            }),
          ],
        }),
      ]

      if (meta.topicsCovered) {
        meta.topicsCovered.split('\n').filter(Boolean).forEach((line) => {
          let inBold = false;
          let splitIndex = -1;
          for (let idx = 0; idx < line.length; idx++) {
            if (line[idx] === '*' && line[idx + 1] === '*') {
              inBold = !inBold;
              idx++;
            } else if (line[idx] === ':' && !inBold) {
              splitIndex = idx;
              break;
            }
          }

          const fontSize = (layout.topicsCoveredFontSize || 12) * 2;
          if (splitIndex !== -1) {
            const left = line.substring(0, splitIndex);
            const right = line.substring(splitIndex + 1);
            topicsParagraphs.push(
              new Paragraph({
                children: [
                  ...docxRenderFormattedText(left, { bold: true, size: fontSize }),
                  new TextRun({ text: ':', bold: true, size: fontSize }),
                  ...docxRenderFormattedText(right, { size: fontSize }),
                ],
              })
            )
          } else {
            topicsParagraphs.push(
              new Paragraph({
                children: docxRenderFormattedText(line, { size: fontSize }),
              })
            )
          }
        })
      } else {
        topicsParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Physics: ', bold: true, size: (layout.topicsCoveredFontSize || 12) * 2 }),
              new TextRun({ text: 'Motion in 1-D', size: (layout.topicsCoveredFontSize || 12) * 2 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Chemistry: ', bold: true, size: (layout.topicsCoveredFontSize || 12) * 2 }),
              new TextRun({ text: 'Redox Reaction', size: (layout.topicsCoveredFontSize || 12) * 2 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Biology: ', bold: true, size: (layout.topicsCoveredFontSize || 12) * 2 }),
              new TextRun({ text: 'Cell', size: (layout.topicsCoveredFontSize || 12) * 2 }),
            ],
          })
        )
      }

      headerChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 8, color: '999999' },
                    bottom: { style: BorderStyle.SINGLE, size: 8, color: '999999' },
                    left: { style: BorderStyle.SINGLE, size: 8, color: '999999' },
                    right: { style: BorderStyle.SINGLE, size: 8, color: '999999' },
                  },
                  shading: {
                    fill: 'E8E8E8',
                  },
                  margins: {
                    top: 100,
                    bottom: 100,
                    left: 150,
                    right: 150,
                  },
                  children: topicsParagraphs,
                }),
              ],
            }),
          ],
        }),
        new Paragraph({ text: '' })
      )

      // General Instructions box
      if (meta.instructions) {
        const instructionParagraphs: Paragraph[] = [
          new Paragraph({
            children: [
              new TextRun({
                text: 'General Instructions :',
                bold: true,
                size: (layout.instructionFontSize || 12) * 2,
              }),
            ],
          }),
        ]

        meta.instructions.split('\n').filter(Boolean).forEach((line) => {
          instructionParagraphs.push(
            new Paragraph({
              children: docxRenderFormattedText(line, { size: (layout.instructionFontSize || 12) * 2 }),
            })
          )
        })

        headerChildren.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
                      bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
                      left: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
                      right: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
                    },
                    margins: {
                      top: 100,
                      bottom: 100,
                      left: 150,
                      right: 150,
                    },
                    children: instructionParagraphs,
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: '' })
        )
      }
    }

    const isDual = printMode === 'dual' || layout.pagesPerSheet === '2'

    const getPageDimensions = () => {
      const isLandscape = isDual
      const size = layout.pageSize || 'A4'
      if (size === 'A3') {
        return {
          width: isLandscape ? 23811 : 16838,
          height: isLandscape ? 16838 : 23811,
        }
      } else if (size === 'Letter') {
        return {
          width: isLandscape ? 15840 : 12240,
          height: isLandscape ? 12240 : 15840,
        }
      } else {
        // A4
        return {
          width: isLandscape ? 16838 : 11906,
          height: isLandscape ? 11906 : 16838,
        }
      }
    }

    const { width: pageW, height: pageH } = getPageDimensions()

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: layout.fontFamily || 'Calibri',
            },
            paragraph: {
              spacing: {
                line: (layout.lineHeight || 1.15) * 240,
                after: 60,
              },
            },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              size: {
                width: pageW,
                height: pageH,
                orientation: isDual ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
              },
              margin: {
                top: (layout.marginTop || 20) * 56.7, // twips
                bottom: (layout.marginBottom || 20) * 56.7,
                left: (layout.marginLeft || 20) * 56.7,
                right: (layout.marginRight || 20) * 56.7,
              },
            },
            column: {
              count: 2,
              space: 1417, // 25mm in twips
              separate: true,
            },
          },
          children: [
            ...headerChildren,
            ...getOrderedKeys(Object.keys(questions), meta.sectionOrder).flatMap((secId) => {
              const qs = questions[secId] || []
              if (qs.length === 0) return []

              const borderStyle = layout.tableBorder === 'none' ? BorderStyle.NONE : BorderStyle.SINGLE
              const borderSize = layout.borderWidth ? Math.min(36, Math.max(4, layout.borderWidth * 8)) : 8
              const questionRowBorders = {
                bottom: layout.tableBorder === 'none'
                  ? { style: BorderStyle.NONE, size: 0, color: 'auto' }
                  : {
                      style: layout.tableBorder === 'double' ? BorderStyle.DOUBLE : layout.tableBorder === 'dashed' ? BorderStyle.DASHED : BorderStyle.SINGLE,
                      size: borderSize,
                      color: '000000',
                    },
              }

              return [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  border: {
                    top: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
                    bottom: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
                    left: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
                    right: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
                  },
                  children: [new TextRun({ text: ` ${(meta.customSectionNames?.[secId] || `Section ${secId}`).toUpperCase()} `, bold: true, size: (layout.sectionTitleSize || 14) * 2 })],
                }),
                new Paragraph({ text: '' }),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  margins: {
                    top: 0,
                    bottom: (layout.questionSpacing || 12) * 15,
                    left: 100,
                    right: 100,
                  },
                  borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                    insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  },
                  rows: qs.map((q) => {
                    const cellParagraphs: (Paragraph | Table)[] = [
                      new Paragraph({
                        children: [new TextRun({ text: q.text, size: layout.questionFontSize * 2 })],
                      }),
                    ]

                    // Embed Question Image if exists
                    const qBytes = getImageData(q.image)
                    if (qBytes) {
                      cellParagraphs.push(
                        new Paragraph({ text: '' }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new ImageRun({
                              data: qBytes,
                              transformation: {
                                width: 150,
                                height: 100,
                              },
                            }),
                          ],
                        })
                      )
                    }

                    // Handle MCQ options
                    if (q.type === 'MCQ' && q.options && q.options.length > 0) {
                      cellParagraphs.push(new Paragraph({ text: '' }))
                      if (layout.mcqLayout === '4-col') {
                        cellParagraphs.push(
                          new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            margins: { top: 40, bottom: 40, left: 100, right: 100 },
                            borders: {
                              top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                              bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                              left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                              right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                              insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                            },
                            rows: [
                              new TableRow({
                                children: Array.from({ length: 4 }).map((_, i) => (
                                  new TableCell({
                                    width: { size: 25, type: WidthType.PERCENTAGE },
                                    children: [
                                      new Paragraph({
                                        children: [
                                          new TextRun({ text: `${String.fromCharCode(65 + i)}) `, bold: true, size: (layout.questionFontSize - 1) * 2 }),
                                          new TextRun({ text: q.options[i] || '', size: (layout.questionFontSize - 1) * 2 }),
                                        ],
                                      }),
                                    ],
                                  })
                                )),
                              }),
                            ],
                          })
                        )
                      } else if (layout.mcqLayout === '2-col') {
                        cellParagraphs.push(
                          new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            margins: { top: 40, bottom: 40, left: 100, right: 100 },
                            borders: {
                              top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                              bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                              left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                              right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                              insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                            },
                            rows: [
                              new TableRow({
                                children: [
                                  new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    children: [
                                      new Paragraph({
                                        children: [
                                          new TextRun({ text: 'A) ', bold: true, size: (layout.questionFontSize - 1) * 2 }),
                                          new TextRun({ text: q.options[0] || '', size: (layout.questionFontSize - 1) * 2 }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    children: [
                                      new Paragraph({
                                        children: [
                                          new TextRun({ text: 'B) ', bold: true, size: (layout.questionFontSize - 1) * 2 }),
                                          new TextRun({ text: q.options[1] || '', size: (layout.questionFontSize - 1) * 2 }),
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              new TableRow({
                                children: [
                                  new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    children: [
                                      new Paragraph({
                                        children: [
                                          new TextRun({ text: 'C) ', bold: true, size: (layout.questionFontSize - 1) * 2 }),
                                          new TextRun({ text: q.options[2] || '', size: (layout.questionFontSize - 1) * 2 }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    children: [
                                      new Paragraph({
                                        children: [
                                          new TextRun({ text: 'D) ', bold: true, size: (layout.questionFontSize - 1) * 2 }),
                                          new TextRun({ text: q.options[3] || '', size: (layout.questionFontSize - 1) * 2 }),
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          })
                        )
                      } else {
                        // 1-col
                        q.options.forEach((opt: string, i: number) => {
                          cellParagraphs.push(
                            new Paragraph({
                              children: [
                                new TextRun({ text: `${String.fromCharCode(65 + i)}) `, bold: true, size: (layout.questionFontSize - 1) * 2 }),
                                new TextRun({ text: opt, size: (layout.questionFontSize - 1) * 2 }),
                              ],
                            })
                          )
                        })
                      }
                    }

                    // Handle Match the Column
                    if (q.type === 'Match the Column' && q.matchColumnA && q.matchColumnB) {
                      cellParagraphs.push(new Paragraph({ text: '' }))
                      const rowCount = Math.max(q.matchColumnA.length, q.matchColumnB.length)
                      cellParagraphs.push(
                        new Table({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          margins: { top: 60, bottom: 60, left: 100, right: 100 },
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
                            bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
                            left: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
                            right: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
                            insideHorizontal: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
                            insideVertical: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
                          },
                          rows: [
                            new TableRow({
                              children: [
                                new TableCell({
                                  width: { size: 50, type: WidthType.PERCENTAGE },
                                  shading: { fill: 'F3F4F6' },
                                  children: [
                                    new Paragraph({
                                      alignment: AlignmentType.CENTER,
                                      children: [new TextRun({ text: 'Column A', bold: true, size: (layout.questionFontSize - 1) * 2 })],
                                    }),
                                  ],
                                }),
                                new TableCell({
                                  width: { size: 50, type: WidthType.PERCENTAGE },
                                  shading: { fill: 'F3F4F6' },
                                  children: [
                                    new Paragraph({
                                      alignment: AlignmentType.CENTER,
                                      children: [new TextRun({ text: 'Column B', bold: true, size: (layout.questionFontSize - 1) * 2 })],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            ...Array.from({ length: rowCount }).map((_, i) => (
                              new TableRow({
                                children: [
                                  new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    children: [
                                      new Paragraph({
                                        children: [new TextRun({ text: q.matchColumnA![i] ? `${i + 1}. ${q.matchColumnA![i]}` : '', size: (layout.questionFontSize - 1) * 2 })],
                                      }),
                                    ],
                                  }),
                                  new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    children: [
                                      new Paragraph({
                                        children: [new TextRun({ text: q.matchColumnB![i] ? `${String.fromCharCode(97 + i)}. ${q.matchColumnB![i]}` : '', size: (layout.questionFontSize - 1) * 2 })],
                                      }),
                                    ],
                                  }),
                                ],
                              })
                            )),
                          ],
                        })
                      )
                    }

                    // Handle OR alternative question
                    if (q.hasOr && q.orQuestion) {
                      cellParagraphs.push(
                        new Paragraph({
                          border: {
                            top: { style: BorderStyle.DASHED, size: 8, color: '000000' },
                          },
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: 'OR', bold: true, size: 24 })],
                        }),
                        new Paragraph({
                          children: [new TextRun({ text: q.orQuestion.text, size: layout.questionFontSize * 2 })],
                        })
                      )

                      if (q.orQuestion.type === 'MCQ' && q.orQuestion.options && q.orQuestion.options.length > 0) {
                        cellParagraphs.push(new Paragraph({ text: '' }))
                        if (layout.mcqLayout === '4-col') {
                          cellParagraphs.push(
                            new Table({
                              width: { size: 100, type: WidthType.PERCENTAGE },
                              margins: { top: 40, bottom: 40, left: 100, right: 100 },
                              borders: {
                                top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                                bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                                left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                                right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                                insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                              },
                              rows: [
                                new TableRow({
                                  children: Array.from({ length: 4 }).map((_, i) => (
                                    new TableCell({
                                      width: { size: 25, type: WidthType.PERCENTAGE },
                                      children: [
                                        new Paragraph({
                                          children: [
                                            new TextRun({ text: `${String.fromCharCode(65 + i)}) `, bold: true, size: (layout.questionFontSize - 1) * 2 }),
                                            new TextRun({ text: q.orQuestion!.options![i] || '', size: (layout.questionFontSize - 1) * 2 }),
                                          ],
                                        }),
                                      ],
                                    })
                                  )),
                                }),
                              ],
                            })
                          )
                        } else if (layout.mcqLayout === '2-col') {
                          cellParagraphs.push(
                            new Table({
                              width: { size: 100, type: WidthType.PERCENTAGE },
                              margins: { top: 40, bottom: 40, left: 100, right: 100 },
                              borders: {
                                top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                                bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                                left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                                right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                                insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                              },
                              rows: [
                                new TableRow({
                                  children: [
                                    new TableCell({
                                      width: { size: 50, type: WidthType.PERCENTAGE },
                                      children: [
                                        new Paragraph({
                                          children: [
                                            new TextRun({ text: 'A) ', bold: true, size: (layout.questionFontSize - 1) * 2 }),
                                            new TextRun({ text: q.orQuestion.options[0] || '', size: (layout.questionFontSize - 1) * 2 }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    new TableCell({
                                      width: { size: 50, type: WidthType.PERCENTAGE },
                                      children: [
                                        new Paragraph({
                                          children: [
                                            new TextRun({ text: 'B) ', bold: true, size: (layout.questionFontSize - 1) * 2 }),
                                            new TextRun({ text: q.orQuestion.options[1] || '', size: (layout.questionFontSize - 1) * 2 }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                new TableRow({
                                  children: [
                                    new TableCell({
                                      width: { size: 50, type: WidthType.PERCENTAGE },
                                      children: [
                                        new Paragraph({
                                          children: [
                                            new TextRun({ text: 'C) ', bold: true, size: (layout.questionFontSize - 1) * 2 }),
                                            new TextRun({ text: q.orQuestion.options[2] || '', size: (layout.questionFontSize - 1) * 2 }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    new TableCell({
                                      width: { size: 50, type: WidthType.PERCENTAGE },
                                      children: [
                                        new Paragraph({
                                          children: [
                                            new TextRun({ text: 'D) ', bold: true, size: (layout.questionFontSize - 1) * 2 }),
                                            new TextRun({ text: q.orQuestion.options[3] || '', size: (layout.questionFontSize - 1) * 2 }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            })
                          )
                        } else {
                          q.orQuestion.options.forEach((opt: string, i: number) => {
                            cellParagraphs.push(
                              new Paragraph({
                                children: [
                                  new TextRun({ text: `${String.fromCharCode(65 + i)}) `, bold: true, size: (layout.questionFontSize - 1) * 2 }),
                                  new TextRun({ text: opt, size: (layout.questionFontSize - 1) * 2 }),
                                ],
                              })
                            )
                          })
                        }
                      }
                    }

                    const qNoPct = Math.max(5, Math.min(25, (layout.qNoWidth || 40) / 4))
                    return new TableRow({
                      children: [
                        new TableCell({
                          width: { size: qNoPct, type: WidthType.PERCENTAGE },
                          borders: {
                            bottom: questionRowBorders.bottom,
                            top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                            right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                          },
                          children: [new Paragraph({ children: [new TextRun({ text: `${docxQNum++}.`, bold: true, size: layout.questionFontSize * 2 })] })],
                        }),
                        new TableCell({
                          width: { size: 100 - qNoPct, type: WidthType.PERCENTAGE },
                          borders: {
                            bottom: questionRowBorders.bottom,
                            top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                            right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                          },
                          children: cellParagraphs,
                        }),
                      ],
                    })
                  }),
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
          html, body, #__next, .dark-workspace, .flex-1, main, .pc-main, .preview-shell {
            background: white !important;
            background-color: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
          }
          @page {
            size: ${printMode === 'dual' ? 'A4 landscape' : 'A4 portrait'};
            margin: 0 !important;
            border: none !important;
          }
          .paper-sheet {
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            border: none !important;
            outline: none !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .watermark-img {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
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
                <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: "'Montserrat', sans-serif", color: '#fff', marginBottom: '6px' }}>Print &amp; Export</div>
                <div style={{ color: '#94a3b8', fontSize: '13px' }}>Review the final paper and export it without changing the existing question paper template.</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', width: '100%', maxWidth: '500px' }} className="sm:w-auto">
                <button className="pc-button-ghost min-h-[44px] px-3.5 py-2 text-xs md:text-sm font-semibold border border-white/20 rounded-lg text-white" onClick={() => handlePrint('single')}>
                  Print 1-Per-Sheet
                </button>
                <button className="pc-button-secondary min-h-[44px] px-3.5 py-2 text-xs md:text-sm font-semibold bg-[#00f2fe] text-gray-900 rounded-lg" onClick={() => handlePrint('dual')}>
                  Print 2-Per-Sheet
                </button>
                <button className="pc-button-primary min-h-[44px] px-3.5 py-2 text-xs md:text-sm font-semibold bg-gradient-to-r from-sky-500 to-purple-600 text-white rounded-lg" onClick={exportToWord}>
                  Download Word
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* On-screen horizontally scrollable paper container for small screen widths */}
      <div className="w-full overflow-x-auto py-2 flex justify-start md:justify-center scrollbar-none">
        <div
          className="paper-sheet flex-shrink-0"
          style={{
            background: '#fff',
            width: printMode === 'dual' ? '297mm' : '210mm',
            minHeight: printMode === 'dual' ? '210mm' : '297mm',
            margin: '0 auto',
            padding: `${layout.marginTop}mm ${layout.marginRight}mm ${layout.marginBottom}mm ${layout.marginLeft}mm`,
            boxSizing: 'border-box',

            fontFamily: layout.fontFamily,
            fontSize: layout.questionFontSize + 'px',
            lineHeight: layout.lineHeight,
            color: '#000',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
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

              <div style={{ display: 'flex', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', marginBottom: '15px' }}>
                <span>{meta.testSeries || 'Test Series-2025-26'}</span>
              </div>

              <div style={{ border: '1px solid #999', borderRadius: '15px', padding: `${layout.topicsCoveredBoxPadding}px`, background: '#e8e8e8', marginBottom: '20px', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <div style={{ fontWeight: 'bold', fontSize: `${layout.topicsCoveredFontSize}px`, marginBottom: `${layout.topicsCoveredHeadingGap}px` }}>Topics Covered:</div>
                <div style={{ lineHeight: '1.8', fontSize: `${layout.topicsCoveredFontSize}px` }}>
                  {meta.topicsCovered ? (
                    meta.topicsCovered.split('\n').filter(Boolean).map((line, i) => {
                      let inBold = false;
                      let splitIndex = -1;
                      for (let idx = 0; idx < line.length; idx++) {
                        if (line[idx] === '*' && line[idx + 1] === '*') {
                          inBold = !inBold;
                          idx++;
                        } else if (line[idx] === ':' && !inBold) {
                          splitIndex = idx;
                          break;
                        }
                      }

                      if (splitIndex !== -1) {
                        const left = line.substring(0, splitIndex);
                        const right = line.substring(splitIndex + 1);
                        return (
                          <div key={i}>
                            <b>{renderFormattedText(left)}:</b> {renderFormattedText(right)}
                          </div>
                        );
                      }
                      return <div key={i}>{renderFormattedText(line)}</div>;
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
                  columnFill: 'auto',
                  columnGap: '28px',
                  columnRule: '1px dashed rgba(0,0,0,0.1)',
                  width: '100%',
                  position: 'relative',
                  zIndex: 1,
                  boxSizing: 'border-box',
                  flex: 1,
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
    </div>
  )
}

