import { SectionConfig } from './types'

export const SECTIONS: SectionConfig[] = [
  { id: 'A', label: 'Section A', description: 'Multiple Choice Questions',    defaultMarks: 1, defaultType: 'MCQ' },
  { id: 'B', label: 'Section B', description: 'Short Answer Questions',       defaultMarks: 2, defaultType: 'Short Answer' },
  { id: 'C', label: 'Section C', description: 'Medium Answer Questions',      defaultMarks: 3, defaultType: 'Short Answer' },
  { id: 'D', label: 'Section D', description: 'Long Answer Questions',        defaultMarks: 5, defaultType: 'Long Answer' },
  { id: 'E', label: 'Section E', description: 'Case Study Based Questions',   defaultMarks: 4, defaultType: 'Case Study' },
]

export const SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Hindi',
  'Social Science', 'Physics', 'Chemistry', 'Biology',
  'Computer Science', 'Sanskrit', 'History', 'Geography',
]

export const CLASSES = [
  'Class I', 'Class II', 'Class III', 'Class IV', 'Class V',
  'Class VI', 'Class VII', 'Class VIII', 'Class IX', 'Class X',
  'Class XI', 'Class XII',
]

export const QUESTION_TYPES = [
  'MCQ', 'Fill in the Blanks', 'Short Answer',
  'Long Answer', 'Assertion-Reason', 'Case Study',
]

export const SCHOOL_QUESTION_TYPES = [
  'MCQ', 'Fill in the Blanks', 'Short Answer',
  'Long Answer', 'Match the Column',
]

export const SCHOOL_CLASSES = [
  'I', 'II', 'III', 'IV', 'V', 'VI',
  'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
]

export const DEFAULT_SCHOOL_INSTRUCTIONS = `This question paper contains 38 questions. All questions are compulsory.
This question paper is divided into five Sections - A, B, C, D, and E.
Section A comprises 20 questions of 1 mark each.
Section B comprises 5 questions of 2 marks each.
Section C comprises 6 questions of 3 marks each.
Section D comprises 4 questions of 5 marks each.
Section E comprises 3 case-based questions of 4 marks each.
Draw neat figures wherever required. Take π = 22/7 wherever required if not stated.`

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9)
}

export const DEFAULT_INSTRUCTIONS = `This Question Paper has 5 Sections A-E.
Section A has 20 MCQs carrying 01 mark each.
Section B has 5 questions carrying 02 marks each.
Section C has 6 questions carrying 03 marks each.
Section D has 4 questions carrying 05 marks each.
Section E has 3 case based questions of 04 marks each.
All Questions are compulsory.
Draw neat figures wherever required. Take π = 22/7 wherever required if not stated.`

export const DEFAULT_LAYOUT = {
  pageSize: 'A4' as const,
  pagesPerSheet: '1' as const,
  marginTop: 18,
  marginBottom: 18,
  marginLeft: 20,
  marginRight: 20,
  logoSize: 64,
  logoPosition: 'center' as const,
  logoAddressGap: 10,
  schoolNameSize: 18,
  examTitleSize: 15,
  sectionTitleSize: 15,
  topicsCoveredFontSize: 13,
  questionFontSize: 13,
  instructionFontSize: 12,
  fontFamily: 'Times New Roman' as const,
  lineHeight: 1.5,
  sectionSpacing: 12,
  questionSpacing: 8,
  qNoWidth: 40,
  topicsCoveredBoxPadding: 15,
  topicsCoveredHeadingGap: 10,
  tableBorder: 'solid' as const,
  borderWidth: 1,
  headerDivider: 'double' as const,
  mcqLayout: '2-col' as const,
  watermarkEnabled: false,
  watermarkOpacity: 0.1,
  watermarkRotation: -45,
  watermarkScale: 100,
  watermarkXOffset: 0,
  watermarkYOffset: 0,
}
