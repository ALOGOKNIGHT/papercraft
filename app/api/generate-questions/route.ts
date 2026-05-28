import { GoogleGenerativeAI } from '@google/generative-ai';
import { Anthropic } from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

function requiredKey(provider: string): { envName: string; display: string } | null {
  switch (provider) {
    case 'gemini':
      return { envName: 'GEMINI_API_KEY', display: 'Gemini' };
    case 'groq':
      return { envName: 'GROQ_API_KEY', display: 'Groq' };
    case 'claude':
      return { envName: 'ANTHROPIC_API_KEY', display: 'Claude (Anthropic)' };
    case 'grok':
      return { envName: 'GROK_API_KEY', display: 'Grok (xAI)' };
    case 'deepseek':
      return { envName: 'DEEPSEEK_API_KEY', display: 'DeepSeek' };
    default:
      return null;
  }
}

function isPlaceholderKey(v: string) {
  const t = v.trim().toLowerCase();
  return (
    t === '' ||
    t.includes('your_') ||
    t.includes('_here') ||
    t.includes('placeholder') ||
    t.includes('change_me')
  );
}

function extractJson(text: string) {
  const cleaned = text.replace(/```(?:json)?/gi, '```').replace(/```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // keep going
  }

  const firstObj = cleaned.indexOf('{');
  const firstArr = cleaned.indexOf('[');
  const start = firstObj === -1 ? firstArr : firstArr === -1 ? firstObj : Math.min(firstObj, firstArr);
  if (start === -1) throw new Error('AI returned no JSON. Try again or switch provider.');

  const open = cleaned[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === open) depth++;
    else if (ch === close) depth--;
    if (depth === 0) {
      const candidate = cleaned.slice(start, i + 1);
      return JSON.parse(candidate);
    }
  }

  throw new Error('Could not parse AI JSON response. Try again or switch provider.');
}

/** Pull a question array out of assorted model JSON shapes */
function coerceQuestionsArray(parsed: unknown): unknown[] {
  if (parsed == null) return [];
  if (Array.isArray(parsed)) {
    if (parsed.length && parsed.every((x) => typeof x === 'string')) return parsed;
    return parsed;
  }

  if (typeof parsed === 'object') {
    const o = parsed as Record<string, unknown>;
    if (pickText(o)) return [parsed];
    const keys = ['questions', 'data', 'items', 'results', 'output', 'parsed'];
    for (const k of keys) {
      const v = o[k];
      if (Array.isArray(v)) return v;
    }
    // Single nested object that might hold the array
    for (const v of Object.values(o)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const inner = v as Record<string, unknown>;
        for (const k of keys) {
          const arr = inner[k];
          if (Array.isArray(arr)) return arr;
        }
      }
    }
    // First array property on the object
    for (const v of Object.values(o)) {
      if (Array.isArray(v) && v.length > 0) return v;
    }
  }
  return [];
}

function pickText(raw: Record<string, unknown>): string {
  const candidates = [
    raw.text,
    raw.question,
    raw.stem,
    raw.prompt,
    raw.q,
    raw.questionText,
    raw.body,
    raw.content,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return '';
}

function pickMarks(raw: Record<string, unknown>, defaultMarks: number): number {
  const m = raw.marks ?? raw.mark ?? raw.score;
  if (typeof m === 'number' && Number.isFinite(m)) return m;
  if (typeof m === 'string') {
    const n = parseFloat(m);
    if (Number.isFinite(n)) return n;
  }
  return Number(defaultMarks) || 1;
}

function normalizeItems(rawItems: unknown[], defaultMarks: number, defaultType: string) {
  const safeTypes = ['MCQ', 'Short Answer', 'Long Answer', 'Fill in the Blanks', 'Assertion-Reason', 'Case Study'] as const;
  const safeType = safeTypes.includes(defaultType as (typeof safeTypes)[number]) ? defaultType : 'Short Answer';
  const dm = Number(defaultMarks) || 1;

  const rows: Array<{
    text: string;
    type: string;
    options: string[];
    marks: number;
    hasOr: boolean;
    orText: string;
  }> = [];

  for (const item of rawItems) {
    if (item == null) continue;

    if (typeof item === 'string') {
      const text = item.trim();
      if (!text) continue;
      rows.push({
        text,
        type: safeType,
        options: safeType === 'MCQ' ? ['', '', '', ''] : [],
        marks: dm,
        hasOr: false,
        orText: '',
      });
      continue;
    }

    if (typeof item !== 'object') continue;
    const q = item as Record<string, unknown>;
    const text =
      (typeof q.text === 'string' ? q.text.trim() : '') || pickText(q);
    if (!text) continue;

    const options = Array.isArray(q.options) ? (q.options as string[]).map(String) : [];
    let type =
      typeof q.type === 'string'
        ? q.type
        : typeof q.questionType === 'string'
          ? (q.questionType as string)
          : safeType;
    if (!safeTypes.includes(type as (typeof safeTypes)[number])) {
      type = options.filter(Boolean).length >= 4 ? 'MCQ' : safeType;
    }

    rows.push({
      text,
      type,
      options,
      marks: pickMarks(q, dm),
      hasOr: Boolean(q.hasOr ?? q.or),
      orText: typeof q.orText === 'string' ? q.orText : typeof q.alt === 'string' ? q.alt : '',
    });
  }

  return rows;
}

/** Gemini SDK sometimes returns empty from .text(); read candidates parts. */
function geminiResponseText(result: { response?: { text?: () => string; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> } }): string {
  try {
    const t = result.response?.text?.();
    if (typeof t === 'string' && t.trim()) return t;
  } catch {
    /* ignore */
  }
  const parts = result.response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const joined = parts.map((p) => (typeof p?.text === 'string' ? p.text : '')).join('');
    if (joined.trim()) return joined;
  }
  return '';
}

type FallbackQuestion = {
  text: string;
  type: string;
  options: string[];
  marks: number;
  hasOr: boolean;
  orText: string;
};

function normalizePowersOutsideMath(input: string): string {
  if (!input.trim()) return input;

  return input
    .split(/(\$[^$]*\$)/g)
    .map((part, index) => {
      if (index % 2 === 1) return part;
      return part.replace(
        /(?<![\\$])((?:\([^\n()]+\)|\b[a-zA-Z0-9]+))\^(\{[^{}]+\}|\([^\n()]+\)|-?\d+|[a-zA-Z]+)/g,
        (_, base: string, exponent: string) => {
          const normalizedExponent = exponent.startsWith('{')
            ? exponent
            : `{${exponent.replace(/^\(|\)$/g, '')}}`;
          return `$${base}^${normalizedExponent}$`;
        }
      );
    })
    .join('');
}

function normalizeQuestionMath<T extends { text: string; options: string[]; orText: string }>(rows: T[]): T[] {
  return rows.map((row) => ({
    ...row,
    text: normalizePowersOutsideMath(row.text),
    options: row.options.map((option) => normalizePowersOutsideMath(option)),
    orText: normalizePowersOutsideMath(row.orText),
  }));
}

/** When models return empty JSON or unusable shapes, split pasted paper text into questions. */
function fallbackFromPlaintext(rawText: string, defaultMarks: number, defaultType: string): FallbackQuestion[] {
  const text = rawText.replace(/\r\n/g, '\n').trim();
  if (!text) return [];

  const stripLeadNum = (s: string) => s.replace(/^\s*(?:Q\.?\s*)?\d+[\.)]\s*/i, '').trim();

  const tryMcq = (block: string): Pick<FallbackQuestion, 'text' | 'options' | 'type'> | null => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const stem: string[] = [];
    const opts: string[] = ['', '', '', ''];
    let sawOpt = false;
    for (const line of lines) {
      const m = line.match(/^\(?([a-dA-D])\)?[\.)]\s*(.+)$/);
      if (m) {
        sawOpt = true;
        const i = m[1].toLowerCase().charCodeAt(0) - 97;
        if (i >= 0 && i < 4) opts[i] = m[2].trim();
      } else if (!sawOpt) stem.push(line);
      else {
        const lastIdx = opts.map((o, idx) => (o ? idx : -1)).filter((i) => i >= 0).pop();
        if (lastIdx !== undefined && opts[lastIdx]) opts[lastIdx] += ' ' + line;
      }
    }
    if (sawOpt && opts.every((o) => o.length > 0)) {
      return { text: stem.join('\n').trim() || stripLeadNum(block.split('\n')[0] || block), options: opts, type: 'MCQ' };
    }
    return null;
  };

  const numberedSplit = (input: string): string[] => {
    const lines = input.split('\n');
    const chunks: string[] = [];
    let buf: string[] = [];
    const newQ = /^\s*(?:Q\.?\s*)?\d+[\.)]\s+/;
    for (const line of lines) {
      if (newQ.test(line) && buf.length) {
        chunks.push(buf.join('\n').trim());
        buf = [line];
      } else buf.push(line);
    }
    if (buf.length) chunks.push(buf.join('\n').trim());
    return chunks.map(stripLeadNum).filter(Boolean);
  };

  let blocks = numberedSplit(text).filter((b) => b.length > 3);
  if (blocks.length <= 1 && /\n\s*\d+[\.)]\s/.test(text)) {
    blocks = text
      .split(/\n(?=\s*(?:Q\.?\s*)?\d+[\.)]\s+)/)
      .map((b) => stripLeadNum(b.trim()))
      .filter((b) => b.length > 3);
  }
  if (blocks.length === 0) blocks = [stripLeadNum(text)];
  if (blocks.length === 1 && text.includes('\n\n')) {
    blocks = text
      .split(/\n\n+/)
      .map((b) => stripLeadNum(b.trim()))
      .filter((b) => b.length > 3);
  }

  const marks = Number(defaultMarks) || 1;
  const useMcq = defaultType === 'MCQ';

  return blocks.map((block) => {
    const mcq = useMcq ? tryMcq(block) : null;
    if (mcq) {
      return { ...mcq, marks, hasOr: false, orText: '' };
    }
    return {
      text: stripLeadNum(block),
      type: defaultType,
      options: useMcq ? ['', '', '', ''] : [],
      marks,
      hasOr: false,
      orText: '',
    };
  });
}

const GROQ_JSON_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant'];

export async function POST(req: NextRequest) {
  try {
    const {
      rawText,
      sectionLabel,
      sectionDescription,
      defaultMarks,
      subject,
      defaultType = 'Short Answer',
      provider = 'gemini',
    } = await req.json();

    if (!rawText?.trim()) {
      return NextResponse.json({ error: 'No input text provided' }, { status: 400 });
    }

    const keyInfo = requiredKey(provider);
    if (!keyInfo) {
      return NextResponse.json({ error: `Unknown AI provider "${provider}".` }, { status: 400 });
    }

    const apiKey = process.env[keyInfo.envName];
    if (!apiKey || isPlaceholderKey(apiKey)) {
      return NextResponse.json(
        { error: `${keyInfo.display} is not configured. Set ${keyInfo.envName} in .env.local and restart the dev server.` },
        { status: 400 }
      );
    }

    // One JSON shape for all providers: { "questions": [ ... ] } (works with Gemini JSON mode + Groq json_object).
    const escapedInput = JSON.stringify(rawText);
    const objectPrompt = `You are an expert Indian school exam paper formatter.
Convert this text into structured JSON for section "${sectionLabel}" (${sectionDescription}) for subject "${subject}".

IMPORTANT: Respond with VALID JSON ONLY. No markdown, no prose, no code fences.
Shape: exactly one JSON object:
{"questions":[{"text":"...","type":"MCQ","options":["","","",""],"marks":${defaultMarks},"hasOr":false,"orText":""}]}

Rules:
- "questions" is a non-empty array when the input contains at least one question.
- Each item MUST include "text" (the question wording). Strip leading numbers like "1." from text.
- "type": one of "MCQ", "Short Answer", "Long Answer", "Fill in the Blanks", "Assertion-Reason", "Case Study"
- For MCQ: "options" must have exactly 4 strings. For non-MCQ: use []
- "marks": number, use ${defaultMarks} when not stated
- "hasOr"/"orText": alternate branch if present in input

Math: put LaTeX inside $...$ e.g. $\\frac{a}{b}$
- For powers/exponents, NEVER leave plain caret notation like x^2 or 10^-3 outside math mode.
- Write exponents as LaTeX such as $x^{2}$, $10^{-3}$, $(a+b)^{2}$

Input Text (verbatim JSON string â€” parse mentally, do not echo this line as JSON output):
${escapedInput}`;

    let resultText = '';

    // --- PROVIDER LOGIC (clients created lazily to avoid module-load crashes) ---

    if (provider === 'groq') {
      const groq = new Groq({ apiKey });
      let groqLastErr: unknown = null;
      resultText = '';
      for (const modelName of GROQ_JSON_MODELS) {
        try {
          const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: objectPrompt }],
            model: modelName,
            response_format: { type: 'json_object' },
          });
          const content = completion.choices[0]?.message?.content?.trim();
          if (content) {
            resultText = content;
            groqLastErr = null;
            break;
          }
        } catch (e) {
          groqLastErr = e;
        }
      }
      if (!resultText.trim() && groqLastErr) throw groqLastErr;
    }

    else if (provider === 'claude') {
      const anthropic = new Anthropic({ apiKey });
      const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        messages: [{ role: "user", content: objectPrompt }],
      });
      resultText = msg.content[0].type === 'text' ? msg.content[0].text : "[]";
    }

    else if (provider === 'grok') {
      const grok = new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" });
      const completion = await grok.chat.completions.create({
        model: "grok-3",
        messages: [{ role: "user", content: objectPrompt }],
      });
      resultText = completion.choices[0]?.message?.content || "[]";
    }

    else if (provider === 'deepseek') {
      const deepseek = new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" });
      const completion = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "user", content: objectPrompt }],
        response_format: { type: "json_object" }
      });
      resultText = completion.choices[0]?.message?.content || '{"questions":[]}';
    }

    else {
      // Default: Gemini
      const genAI = new GoogleGenerativeAI(apiKey);
      const candidateModels = [
        'gemini-3.5-flash',
        'gemini-3.5-flash-latest',
        'gemini-2.5-flash',
        'gemini-flash-latest',
        'gemini-2.0-flash',
      ];

      let lastErr: unknown = null;
      resultText = '';
      for (const modelName of candidateModels) {
        try {
          const modelJson = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: 'application/json' },
          });
          let result = await modelJson.generateContent(objectPrompt);
          resultText = geminiResponseText(result);

          if (!resultText.trim()) {
            const modelPlain = genAI.getGenerativeModel({ model: modelName });
            result = await modelPlain.generateContent(
              `${objectPrompt}\n\nOutput ONLY one JSON object. No markdown, no commentary.`
            );
            resultText = geminiResponseText(result);
          }

          if (resultText.trim()) {
            lastErr = null;
            break;
          }
        } catch (e) {
          lastErr = e;
        }
      }

      if (!resultText.trim() && lastErr) throw lastErr;
    }

    const dm = Number(defaultMarks) || 1;
    let normalized: ReturnType<typeof normalizeItems> = [];
    try {
      if (resultText.trim()) {
        const parsed = extractJson(resultText);
        const rawList = coerceQuestionsArray(parsed);
        normalized = normalizeQuestionMath(normalizeItems(rawList, dm, defaultType));
      }
    } catch {
      normalized = [];
    }

    if (normalized.length === 0) {
      const fb = normalizeQuestionMath(fallbackFromPlaintext(rawText, dm, defaultType));
      if (fb.length === 0) {
        return NextResponse.json(
          {
            error:
              'Could not extract questions. Paste numbered questions (1. â€¦ 2. â€¦) or fix your AI keys/models.',
            debug: { provider, snippet: (resultText || '').slice(0, 700) },
          },
          { status: 422 }
        );
      }
      return NextResponse.json({
        questions: fb,
        usedFallback: true,
        notice:
          'AI JSON was empty or invalid â€” questions were split from your text locally. Review formatting (especially MCQ options).',
      });
    }

    return NextResponse.json({ questions: normalized });

  } catch (err: any) {
    console.error('AI generation error:', err);

    const message = (err?.message || err?.toString?.() || 'Generation failed') as string;
    const status =
      (typeof err?.status === 'number' ? err.status : undefined) ||
      (typeof err?.response?.status === 'number' ? err.response.status : undefined);

    if (status === 429 || message.includes('429')) {
      return NextResponse.json({
        error: 'Quota exceeded. Please wait a minute or switch AI providers.'
      }, { status: 429 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}