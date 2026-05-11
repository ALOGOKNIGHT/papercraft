import { GoogleGenerativeAI } from '@google/generative-ai';
import { Anthropic } from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const {
      rawText,
      sectionLabel,
      sectionDescription,
      defaultMarks,
      subject,
      provider = 'gemini'
    } = await req.json();

    if (!rawText?.trim()) {
      return NextResponse.json({ error: 'No input text provided' }, { status: 400 });
    }

    const prompt = `You are an expert Indian school exam paper formatter. 
    Convert this text into structured JSON for ${sectionLabel} (${sectionDescription}) for ${subject}.

    Rules:
    - Return ONLY a JSON array of objects.
    - Each object: {"text": string, "type": string, "options": string[], "marks": number, "hasOr": boolean, "orText": string}
    - Math Rule: Use LaTeX wrapped in $...$. Example: $\\frac{7}{19}$.
    - Numbering: Remove question numbers from the "text" field.

    Input Text:
    "${rawText}"`;

    let resultText = "";

    // --- PROVIDER LOGIC (clients created lazily to avoid module-load crashes) ---

    if (provider === 'groq') {
      // Groq's json_object mode requires an object (not a bare array).
      // Use a wrapper prompt so there's no conflict with response_format.
      const groqPrompt = `You are an expert Indian school exam paper formatter.
    Convert this text into structured JSON for ${sectionLabel} (${sectionDescription}) for ${subject}.

    Rules:
    - Return a JSON object with a single key "questions" whose value is an array of objects.
    - Each object: {"text": string, "type": string, "options": string[], "marks": number, "hasOr": boolean, "orText": string}
    - "type" must be one of: "MCQ", "Short Answer", "Long Answer"
    - "options" is an array of 4 strings for MCQ, empty array otherwise
    - "marks" should be a number (default ${defaultMarks} if not mentioned)
    - "hasOr" is true only if there is an alternate OR question
    - "orText" is the alternate question text, or empty string
    - Math: Use LaTeX wrapped in $...$. Example: $\\frac{7}{19}$
    - Remove question numbers from the "text" field

    Input Text:
    "${rawText}"`;

      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: groqPrompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: "json_object" }
      });
      resultText = completion.choices[0]?.message?.content || '{"questions":[]}';
    }

    else if (provider === 'claude') {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
      const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      });
      resultText = msg.content[0].type === 'text' ? msg.content[0].text : "[]";
    }

    else if (provider === 'grok') {
      const grok = new OpenAI({ apiKey: process.env.GROK_API_KEY!, baseURL: "https://api.x.ai/v1" });
      const completion = await grok.chat.completions.create({
        model: "grok-3",
        messages: [{ role: "user", content: prompt }],
      });
      resultText = completion.choices[0]?.message?.content || "[]";
    }

    else if (provider === 'deepseek') {
      const deepseekPrompt = `You are an expert Indian school exam paper formatter.
    Convert this text into structured JSON for ${sectionLabel} (${sectionDescription}) for ${subject}.

    Rules:
    - Return a JSON object with a single key "questions" whose value is an array of objects.
    - Each object: {"text": string, "type": string, "options": string[], "marks": number, "hasOr": boolean, "orText": string}
    - "type" must be one of: "MCQ", "Short Answer", "Long Answer"
    - "options" is an array of 4 strings for MCQ, empty array otherwise
    - "marks" should be a number (default ${defaultMarks} if not mentioned)
    - "hasOr" is true only if there is an alternate OR question
    - "orText" is the alternate question text, or empty string
    - Math: Use LaTeX wrapped in $...$. Example: $\\frac{7}{19}$
    - Remove question numbers from the "text" field

    Input Text:
    "${rawText}"`;

      const deepseek = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY!, baseURL: "https://api.deepseek.com" });
      const completion = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "user", content: deepseekPrompt }],
        response_format: { type: "json_object" }
      });
      resultText = completion.choices[0]?.message?.content || '{"questions":[]}';
    }

    else {
      // Default: Gemini
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent(prompt);
      resultText = result.response.text();
    }

    // Clean up response
    const cleanJson = resultText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    const finalQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || [parsed]);

    return NextResponse.json({ questions: finalQuestions });

  } catch (err: any) {
    console.error('AI generation error:', err);

    if (err.status === 429 || err.message.includes('429')) {
      return NextResponse.json({
        error: 'Quota exceeded. Please wait a minute or switch AI providers.'
      }, { status: 429 });
    }

    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 });
  }
}