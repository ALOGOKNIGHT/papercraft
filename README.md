# 📝 PaperCraft — School Exam Paper Generator

AI-powered school exam paper generator built with **Next.js 14**, **TypeScript**, **Gemini API**, and voice input.

---

## ✨ Features

- **School Header** — Logo upload, school name, session, exam title
- **5 Sections (A–E)** — MCQ, Short Answer, Long Answer, Case Study, Assertion-Reason
- **AI Generator** — Paste raw text → Gemini formats it into clean questions
- **🎙 Voice Input** — Speak your question → AI cleans and structures it (Hindi + English)
- **Manual Add** — Type any question with MCQ options, marks, OR variant
- **Edit & Delete** — Click ✏️ on any question to modify inline
- **Live Preview** — Exact Indian school exam format with table layout
- **Print to PDF** — One click → A4 paper-ready PDF

---

## 🚀 Setup

### 1. Clone / Copy this project

```bash
cd papercraft
npm install
```

### 2. Get your Gemini API key

Go to → https://aistudio.google.com/app/apikey  
Create a key (it's free)

### 3. Add your API key

Open `.env.local` and replace the placeholder:

```
GEMINI_API_KEY=your_actual_key_here
```

### 4. Run the app

```bash
npm run dev
```

Open → http://localhost:3000

---

## 🗂 Project Structure

```
papercraft/
├── app/
│   ├── layout.tsx              # Root layout (fonts, metadata)
│   ├── page.tsx                # Main app with tab state
│   ├── globals.css             # Global styles + print CSS
│   └── api/
│       ├── generate-questions/ # POST: AI text → questions[]
│       └── format-voice/       # POST: voice transcript → question
├── components/
│   ├── Topbar.tsx              # Navigation bar
│   ├── SettingsPanel.tsx       # School + exam details form
│   ├── EditorPanel.tsx         # Question editor (manual + AI + voice)
│   └── PaperPreview.tsx        # Print-ready paper preview
├── lib/
│   ├── types.ts                # TypeScript interfaces
│   └── constants.ts            # Sections, subjects, classes config
├── .env.local                  # 🔑 Your Gemini API key goes here
└── package.json
```

---

## 🖨 How to Print as PDF

1. Click **Preview** tab
2. Click **Print / Save as PDF**
3. In the browser print dialog:
   - Printer: **Save as PDF**
   - Paper size: **A4**
   - Margins: **Minimum** or **None**
   - Turn OFF headers/footers

---

## 🎙 Voice Input

- Works in **Chrome** only (uses Web Speech API)
- Supports **Hindi** (`hi-IN`) and English automatically
- Speak naturally: *"What is the powerhouse of the cell? Options are nucleus, mitochondria, ribosome, golgi body"*
- Gemini cleans up filler words and structures it as an MCQ

---

## 📦 Adding More Subjects or Classes

Edit `lib/constants.ts` → add to `SUBJECTS` or `CLASSES` arrays.

---

## 🔮 Future Enhancements

- [ ] Save papers locally (localStorage)
- [ ] Export as `.docx` (Word file)
- [ ] Math equation support (KaTeX / MathJax)
- [ ] Image/diagram upload per question
- [ ] Answer key generation
- [ ] Multi-language UI (Hindi interface)
