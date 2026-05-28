import { GoogleGenerativeAI } from '@google/generative-ai';
import { Anthropic } from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { 
      transcript, 
      sectionLabel, 
      defaultMarks, 
      subject, 
      provider = 'gemini'
    } = await req.json();

    if (!transcript?.trim()) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
    }

    const prompt = `You are an Indian school exam assistant. A teacher spoke the following text aloud using voice input.

Spoken transcript: "${transcript}"

Subject: ${subject || 'General'}
Section: ${sectionLabel}
Default marks: ${defaultMarks}

Your job:
1. Remove all filler words (um, uh, like, basically, etc.)
2. Fix grammar and spelling
3. Detect if it is MCQ (has options mentioned) or Short/Long Answer
4. If MCQ: extract the question text and exactly 4 options
5. Return ONE question as a JSON object with these exact keys: text, type, options, marks, hasOr, orText

Return the data as a single JSON object.`;

    let resultText = "";

    // --- PROVIDER LOGIC (clients created lazily to avoid module-load crashes) ---

    if (provider === 'grok') {
      const grok = new OpenAI({ apiKey: process.env.GROK_API_KEY!, baseURL: "https://api.x.ai/v1" });
      const completion = await grok.chat.completions.create({
        model: "grok-3",
        messages: [{ role: "user", content: prompt }],
      });
      resultText = completion.choices[0]?.message?.content || "{}";
    } 
    
    else if (provider === 'deepseek') {
      const deepseek = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY!, baseURL: "https://api.deepseek.com" });
      const completion = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      resultText = completion.choices[0]?.message?.content || "{}";
    }

    else if (provider === 'groq') {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });
      resultText = completion.choices[0]?.message?.content || "{}";
    }

    else if (provider === 'claude') {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
      const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });
      resultText = msg.content[0].type === 'text' ? msg.content[0].text : "{}";
    }

    else {
      // Default: Gemini
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-3.5-flash',
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent(prompt);
      resultText = result.response.text();
    }

    // Clean up potential markdown fences
    const cleanJson = resultText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return NextResponse.json({ question: parsed });

  } catch (err: any) {
    console.error('Voice format error:', err);
    return NextResponse.json({ error: err.message || 'Failed to process voice input' }, { status: 500 });
  }
}