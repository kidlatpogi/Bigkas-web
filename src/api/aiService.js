/**
 * aiService.js — Speech generation service with Gemini primary + Groq fallback.
 */

const SYSTEM_PROMPT = `You are a professional Speech Writing Assistant for the "Bigkas" platform.
Your goal is to generate high-quality, structured speech scripts based on user inputs.

CONSTRAINTS:
1. WORD COUNT: Strictly adhere to the requested length:
   - Short: ~60 words
   - Medium: ~120 words
   - Long: ~220 words
2. VIBE: Adjust your vocabulary, tone, and sentence structure based on:
   - Professional: Formal, authoritative, clear, and structured.
   - Casual: Relatable, friendly, using conversational contractions.
   - Humorous: Witty, includes light-hearted observations or jokes.
   - Inspirational: Emotive, rhythmic, and focuses on "why" and "possibility."
3. FORMAT: Return the response in a valid JSON format with two keys:
   - "title": A concise, catchy title for the speech.
   - "content": The full text of the speech.`;

/**
 * Generate a speech script using AI (Gemini → Groq fallback).
 * @param {{ prompt: string, vibe: string, duration: string }} userData
 * @returns {Promise<{ title: string, content: string }>}
 */
export const generateSpeech = async (userData) => {
  const { prompt, vibe, duration } = userData;
  const wordCount = duration === 'Short' ? 60 : duration === 'Medium' ? 120 : 220;

  // Primary: Gemini
  try {
    return await callGemini(prompt, vibe, wordCount);
  } catch (error) {
    console.error('Gemini failed, falling back to Groq:', error);

    // Fallback: Groq
    try {
      return await callGroq(prompt, vibe, wordCount);
    } catch (fallbackError) {
      console.error('Groq also failed:', fallbackError);
      throw new Error('All AI services failed. Please try again later.');
    }
  }
};

// --------------- Gemini ---------------
async function callGemini(prompt, vibe, wordCount) {
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
                text: `Topic: ${prompt}\nVibe: ${vibe}\nDuration target word count: ${wordCount}`,
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
async function callGroq(prompt, vibe, wordCount) {
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
          content: `Topic: ${prompt}\nVibe: ${vibe}\nDuration target word count: ${wordCount}`,
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
