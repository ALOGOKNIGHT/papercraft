export type QuestionType =
  | 'MCQ'
  | 'Fill in the Blanks'
  | 'Short Answer'
  | 'Long Answer'
  | 'Assertion-Reason'
  | 'Case Study'
  | 'Match the Column'

export interface Question {
  id: string
  text: string
  type: QuestionType
  options: string[]       // for MCQ
  marks: number
  hasOr: boolean
  orText: string
  image?: string          // base64 for diagram
  correctIndex?: number   // for MCQ correct answer tracking
  orQuestion?: Question   // nested OR alternative question (school mode)
  matchColumnA?: string[] // Column A items for Match the Column
  matchColumnB?: string[] // Column B items for Match the Column
}

export interface SchoolSection {
  id: string
  title: string           // e.g. "PART-A", "SECTION I"
  description: string     // e.g. "Section I has 16 questions of 1 mark each"
  marksPerQuestion: number
}

export interface SectionConfig {
  id: 'A' | 'B' | 'C' | 'D' | 'E'
  label: string
  description: string
  defaultMarks: number
  defaultType: QuestionType
}
export interface PaperMeta {
  schoolName: string
  city: string
  session: string
  examTitle: string
  subject: string
  className: string
  maxMarks: string
  time: string
  examDate?: string
  testSeries?: string
  topicsCovered?: string
  logo: string | null
  instructions: string
  headerType?: 'standard' | 'custom'
  customHeaderHTML?: string
  customSectionNames?: Record<string, string>
  customSectionDescriptions?: Record<string, string>
  customSectionMarks?: Record<string, number>
  schoolBranch?: string   // School location/branch (school mode)
  sectionOrder?: string[]
}

export type QuestionsMap = Record<string, Question[]>

export interface LayoutSettings {
  // Page
  pageSize: 'A4' | 'A3' | 'Letter'
  pagesPerSheet: '1' | '2'
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number

  // Logo
  logoSize: number        // px height
  logoPosition: 'left' | 'center' | 'right'
  logoAddressGap: number

  // Typography
  schoolNameSize: number
  examTitleSize: number
  sectionTitleSize: number
  topicsCoveredFontSize: number
  questionFontSize: number
  instructionFontSize: number
  fontFamily: 'Times New Roman' | 'Arial' | 'Georgia' | 'Calibri'

  // Spacing
  lineHeight: number
  sectionSpacing: number   // px gap between sections
  questionSpacing: number  // px gap between questions
  qNoWidth: number         // px width of Q.NO column
  topicsCoveredBoxPadding: number
  topicsCoveredHeadingGap: number

  // Border
  tableBorder: 'solid' | 'double' | 'dashed' | 'none'
  borderWidth: number

  // Header divider
  headerDivider: 'double' | 'single' | 'none'

  // MCQ Format
  mcqLayout: '1-col' | '2-col' | '4-col'

  // Watermark
  watermarkEnabled: boolean
  watermarkOpacity: number
  watermarkRotation: number
  watermarkScale: number
  watermarkXOffset: number
  watermarkYOffset: number
}

export interface SavedPaper {
  id: string
  name: string
  mode: 'school' | 'coaching'
  meta: PaperMeta
  questions: QuestionsMap
  layout: LayoutSettings
  createdAt: string
  updatedAt: string
}

