/**
 * aiService.js — Speech generation service with Gemini primary + Groq fallback.
 */

const SYSTEM_PROMPT = `You are a professional Speech Writing Assistant for the "Bigkas" platform.
Your goal is to generate high-quality, structured speech scripts based on user duration requirements.

PARAMETERS:
- Topic: {prompt}
- Vibe: {vibe} (Professional, Casual, Humorous, Inspirational)
- Duration: {duration} minutes
- Word Count Target: {targetWordCount} (Strictly calculated at 150 words per minute)

CONSTRAINTS:
1. WORD COUNT: The content must be within +/- 10% of the target word count to ensure it fits the requested time.
2. STRUCTURE: Include a clear introduction, body points, and a concluding call to action.
3. OUTPUT FORMAT: Return ONLY a valid JSON object:
{
  "title": "A compelling title for the speech",
  "content": "The full script text"
}`;

/**
 * Generate a speech script using AI (Gemini → Groq fallback).
 * @param {{ prompt: string, vibe: string, wordCount?: number, targetWordCount?: number, durationMinutes?: number }} userData
 * @returns {Promise<{ title: string, content: string }>}
 */
export const generateSpeech = async (userData) => {
  const { prompt, vibe, durationMinutes } = userData;
  const targetWordCount = Math.round(userData.wordCount ?? userData.targetWordCount ?? 450);
  const minutes = durationMinutes ?? Math.max(1, Math.round((targetWordCount / 150) * 10) / 10);

  // Primary: Gemini
  try {
    return await callGemini(prompt, vibe, targetWordCount, minutes);
  } catch (error) {
    console.error('Gemini failed, falling back to Groq:', error);

    // Fallback: Groq
    try {
      return await callGroq(prompt, vibe, targetWordCount, minutes);
    } catch (fallbackError) {
      console.error('Groq also failed:', fallbackError);
      throw new Error('All AI services failed. Please try again later.');
    }
  }
};

// --------------- Gemini ---------------
async function callGemini(prompt, vibe, targetWordCount, durationMinutes) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key is not configured.');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            parts: [
              {
                text: `TOPIC: ${prompt}\nVIBE: ${vibe}\nTARGET DURATION: ${durationMinutes} minutes\nESTIMATED WORD COUNT: ${targetWordCount} words`,
              },
            ],
          },
        ],
        generationConfig: { response_mime_type: 'application/json' },
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini HTTP ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

// --------------- Groq ---------------
async function callGroq(prompt, vibe, targetWordCount, durationMinutes) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('Groq API key is not configured.');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `TOPIC: ${prompt}\nVIBE: ${vibe}\nTARGET DURATION: ${durationMinutes} minutes\nESTIMATED WORD COUNT: ${targetWordCount} words`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Groq HTTP ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

export default generateSpeech;
