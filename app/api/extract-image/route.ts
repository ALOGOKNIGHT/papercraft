import { GoogleGenerativeAI } from '@google/generative-ai'
import { Anthropic } from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { 
      imageBase64, 
      mimeType, 
      mode, 
      provider = 'gemini', // New: Default to Gemini
      modelName = 'gemini-3.5-flash-lite' // New: Use high-limit model by default
    } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const promptText = mode === 'text' 
      ? `You are an OCR assistant. Extract ALL text exactly as written. 
         Preserve questions, options, marks. For Hindi, use Devanagari script. 
         No explanation, just text.`
      : `You are an expert exam paper analyzer. Look carefully at the image and extract ALL questions.

         Return ONLY a JSON array of objects with this exact shape:
         {"text": string, "type": string, "options": string[], "marks": number, "hasOr": boolean, "orText": string}

         Field rules:
         - "text": The question text only. No question number prefix.
         - "type": Must be exactly one of "MCQ", "Short Answer", or "Long Answer".
           * Use "MCQ" if the question has lettered/numbered answer choices (a/b/c/d or i/ii/iii/iv).
         - "options": IMPORTANT - For MCQ questions, you MUST extract ALL answer choices as an array of 4 strings.
           * Include the full text of each option (e.g. ["Paris", "London", "Berlin", "Rome"]).
           * Do NOT include the option label (a), (b) etc. in the option text itself.
           * For non-MCQ questions, use an empty array [].
         - "marks": Number of marks. Look for patterns like [2], (3 marks), or similar. Default to 1 if not found.
         - "hasOr": true only if there is an explicit "OR" alternative question.
         - "orText": The text of the alternate OR question if hasOr is true, else empty string "".

         Use the original language of the image. Extract every question you can see.`;

    let finalResult = "";

    // --- PROVIDER LOGIC: FREEDOM TO SELECT ENGINE ---

    // 1. GROQ VISION (Highest Speed & Different Quota Pool)
    if (provider === 'groq') {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: promptText },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}` },
              },
            ],
          },
        ],
        model: "llama-3.2-11b-vision-preview", // Reliable vision model on Groq
        response_format: mode === 'structured' ? { type: "json_object" } : undefined,
      });
      finalResult = completion.choices[0]?.message?.content || "";
    } 

    // 2. CLAUDE VISION (Highest Accuracy)
    else if (provider === 'claude') {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
      const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mimeType as any || "image/jpeg", data: imageBase64 } },
              { type: "text", text: promptText }
            ],
          }
        ],
      });
      finalResult = msg.content[0].type === 'text' ? msg.content[0].text : "";
    }

    // 3. GEMINI VISION (Default - Using 2.5 Flash-Lite for 1000 RPD Limit)
    else {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ 
        model: modelName, // Can be overridden by frontend
        generationConfig: mode === 'structured' ? { responseMimeType: "application/json" } : undefined
      });

      const result = await model.generateContent([
        { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } },
        { text: promptText },
      ]);
      finalResult = result.response.text();
    }

    // Process output based on mode
    if (mode === 'text') {
      return NextResponse.json({ text: finalResult.trim(), mode: 'text' });
    } else {
      // Clean up markdown code blocks if the AI included them
      const cleanJson = finalResult.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      const questions = Array.isArray(parsed) ? parsed : (parsed.questions || [parsed]);
      return NextResponse.json({ questions, mode: 'structured' });
    }

  } catch (err: any) {
    console.error('Image extraction error:', err);
    
    // Custom error for Gemini Quota
    if (err.message.includes('429')) {
      return NextResponse.json({ 
        error: 'Gemini Quota Exceeded. Please switch the AI Engine to "Groq" in the settings.' 
      }, { status: 429 });
    }

    return NextResponse.json({ error: err.message || 'Image extraction failed' }, { status: 500 });
  }
}